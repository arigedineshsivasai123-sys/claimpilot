import mongoose from 'mongoose';
import { Claim } from '../models/Claim.model';
import { ClaimDocument } from '../models/Document.model';
import { AgentExecution } from '../models/AgentExecution.model';
import { Decision } from '../models/Decision.model';
import { documentParserService } from '../services/documents/documentParser.service';
import { embeddingService } from '../services/embeddings/embedding.service';
import { intakeAgent } from '../services/agents/intakeAgent';
import { policyAgent } from '../services/agents/policyAgent';
import { fraudAgent } from '../services/agents/fraudAgent';
import { verifierAgent } from '../services/agents/verifierAgent';
import { eventStreamManager } from './eventStream';

const AGENT_TIMEOUT_MS = 45000; // 45 seconds per agent timeout

async function withAgentTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  agentName: string
): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${agentName} timed out after ${timeoutMs / 1000} seconds`));
    }, timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}

export class ClaimOrchestrator {
  public async executePipeline(claimId: string): Promise<any> {
    const claim = await Claim.findById(claimId);
    if (!claim) {
      throw new Error(`Claim not found with ID: ${claimId}`);
    }

    try {
      // 1. Fetch uploaded documents
      const documents = await ClaimDocument.find({ claimId });
      if (documents.length === 0) {
        throw new Error('Cannot analyze claim: No documents have been uploaded yet.');
      }

      // Update claim status to PROCESSING
      claim.status = 'PROCESSING';
      await claim.save();

      // Clear any previous executions for this claim
      await AgentExecution.deleteMany({ claimId });

      // 2. Parse all documents and extract text
      const parsedDocs: Array<{
        filename: string;
        originalName: string;
        category: string;
        text: string;
      }> = [];

      let policyDocText = '';

      for (const doc of documents) {
        try {
          const parsed = await documentParserService.parseFile(
            doc.path,
            doc.mimeType,
            doc.originalName
          );
          doc.extractedText = parsed.text;
          doc.processingStatus = 'PROCESSED';
          await doc.save();

          parsedDocs.push({
            filename: doc.filename,
            originalName: doc.originalName,
            category: doc.category,
            text: parsed.text,
          });

          if (doc.category === 'INSURANCE_POLICY') {
            policyDocText += '\n' + parsed.text;
          }
        } catch (err: any) {
          console.warn(`[Orchestrator] Warning parsing document ${doc.originalName}:`, err.message);
          doc.processingStatus = 'FAILED';
          await doc.save();
        }
      }

      // 3. If an insurance policy document was uploaded, index it into PolicyChunk vector collection
      if (policyDocText.trim().length > 50) {
        try {
          await embeddingService.indexPolicyDocument(
            policyDocText,
            `policy-${claim.claimNumber}`,
            claim._id.toString()
          );
        } catch (err: any) {
          console.warn('[Orchestrator] Failed to index uploaded policy chunks:', err.message);
        }
      }

      // ============================================================
      // AGENT 1: INTAKE AGENT
      // ============================================================
      eventStreamManager.emitAgentUpdate(claimId, {
        claimId,
        agentName: 'Intake Agent',
        sequence: 1,
        status: 'RUNNING',
        summary: 'Reading uploaded documents and extracting structured claim entities...',
        timestamp: new Date().toISOString(),
      });

      const intakeExecution = new AgentExecution({
        claimId: claim._id,
        agentName: 'Intake Agent',
        sequence: 1,
        status: 'RUNNING',
        summary: 'Extracting patient, hospital, and billing fields',
        startedAt: new Date(),
      });
      await intakeExecution.save();

      let intakeOutput;
      try {
        const intakeRes = await withAgentTimeout(
          intakeAgent.execute({
            claimNumber: claim.claimNumber,
            documents: parsedDocs,
            existingClaimData: {
              patientName: claim.patientName,
              hospital: claim.hospital,
              claimAmount: claim.claimAmount,
            },
          }),
          AGENT_TIMEOUT_MS,
          'Intake Agent'
        );

        intakeOutput = intakeRes.result;
        intakeExecution.status = 'COMPLETED';
        intakeExecution.summary = intakeRes.summary;
        intakeExecution.output = intakeOutput;
        intakeExecution.evidence = intakeOutput.sourceReferences;
        intakeExecution.completedAt = new Date();
        intakeExecution.durationMs = intakeRes.durationMs;
        await intakeExecution.save();

        // Synchronize extracted entities back into the Claim record
        if (intakeOutput.patientName && claim.patientName === 'Pending Extraction') {
          claim.patientName = intakeOutput.patientName;
        }
        if (intakeOutput.hospital && claim.hospital === 'Pending Extraction') {
          claim.hospital = intakeOutput.hospital;
        }
        if (intakeOutput.diagnosis && claim.diagnosis === 'Pending Extraction') {
          claim.diagnosis = intakeOutput.diagnosis;
        }
        if (intakeOutput.treatment && claim.treatment === 'Pending Extraction') {
          claim.treatment = intakeOutput.treatment;
        }
        if (intakeOutput.totalAmount && claim.claimAmount === 0) {
          claim.claimAmount = intakeOutput.totalAmount;
        }
        await claim.save();

        eventStreamManager.emitAgentUpdate(claimId, {
          claimId,
          agentName: 'Intake Agent',
          sequence: 1,
          status: 'COMPLETED',
          summary: intakeRes.summary,
          durationMs: intakeRes.durationMs,
          output: intakeOutput,
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        intakeExecution.status = 'FAILED';
        intakeExecution.error = err.message;
        intakeExecution.completedAt = new Date();
        await intakeExecution.save();

        eventStreamManager.emitAgentUpdate(claimId, {
          claimId,
          agentName: 'Intake Agent',
          sequence: 1,
          status: 'FAILED',
          summary: `Intake Agent failed: ${err.message}`,
          output: { error: err.message },
          timestamp: new Date().toISOString(),
        });

        claim.status = 'FAILED';
        await claim.save();
        throw new Error(`Intake Agent failed: ${err.message}`);
      }

      // ============================================================
      // AGENT 2: POLICY AGENT
      // ============================================================
      eventStreamManager.emitAgentUpdate(claimId, {
        claimId,
        agentName: 'Policy Agent',
        sequence: 2,
        status: 'RUNNING',
        summary: 'Retrieving policy clauses via vector search and assessing coverage eligibility...',
        timestamp: new Date().toISOString(),
      });

      const policyExecution = new AgentExecution({
        claimId: claim._id,
        agentName: 'Policy Agent',
        sequence: 2,
        status: 'RUNNING',
        summary: 'Searching relevant policy clauses',
        startedAt: new Date(),
      });
      await policyExecution.save();

      let policyOutput;
      try {
        const policyRes = await withAgentTimeout(
          policyAgent.execute({
            claimNumber: claim.claimNumber,
            intakeResult: intakeOutput,
            policyId: policyDocText.trim().length > 50 ? `policy-${claim.claimNumber}` : undefined,
          }),
          AGENT_TIMEOUT_MS,
          'Policy Agent'
        );

        policyOutput = policyRes.result;
        policyExecution.status = policyOutput.coverage === 'NOT_COVERED' ? 'WARNING' : 'COMPLETED';
        policyExecution.summary = policyRes.summary;
        policyExecution.output = policyOutput;
        policyExecution.evidence = policyRes.evidence;
        policyExecution.completedAt = new Date();
        policyExecution.durationMs = policyRes.durationMs;
        await policyExecution.save();

        eventStreamManager.emitAgentUpdate(claimId, {
          claimId,
          agentName: 'Policy Agent',
          sequence: 2,
          status: policyExecution.status,
          summary: policyRes.summary,
          durationMs: policyRes.durationMs,
          output: policyOutput,
          evidence: policyRes.evidence,
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        policyExecution.status = 'FAILED';
        policyExecution.error = err.message;
        policyExecution.completedAt = new Date();
        await policyExecution.save();

        eventStreamManager.emitAgentUpdate(claimId, {
          claimId,
          agentName: 'Policy Agent',
          sequence: 2,
          status: 'FAILED',
          summary: `Policy Agent failed: ${err.message}`,
          output: { error: err.message },
          timestamp: new Date().toISOString(),
        });

        claim.status = 'FAILED';
        await claim.save();
        throw new Error(`Policy Agent failed: ${err.message}`);
      }

      // ============================================================
      // AGENT 3: FRAUD / CONSISTENCY AGENT
      // ============================================================
      eventStreamManager.emitAgentUpdate(claimId, {
        claimId,
        agentName: 'Fraud Agent',
        sequence: 3,
        status: 'RUNNING',
        summary: 'Conducting cross-document anomaly and billing reconciliation analysis...',
        timestamp: new Date().toISOString(),
      });

      const fraudExecution = new AgentExecution({
        claimId: claim._id,
        agentName: 'Fraud Agent',
        sequence: 3,
        status: 'RUNNING',
        summary: 'Cross-checking dates, duplicates, and billing consistency',
        startedAt: new Date(),
      });
      await fraudExecution.save();

      let fraudOutput;
      try {
        const fraudRes = await withAgentTimeout(
          fraudAgent.execute({
            claimNumber: claim.claimNumber,
            intakeResult: intakeOutput,
          }),
          AGENT_TIMEOUT_MS,
          'Fraud Agent'
        );

        fraudOutput = fraudRes.result;
        const hasFlags = fraudOutput.flags.length > 0;
        fraudExecution.status = hasFlags ? 'WARNING' : 'COMPLETED';
        fraudExecution.summary = fraudRes.summary;
        fraudExecution.output = fraudOutput;
        fraudExecution.evidence = fraudRes.evidence;
        fraudExecution.completedAt = new Date();
        fraudExecution.durationMs = fraudRes.durationMs;
        await fraudExecution.save();

        eventStreamManager.emitAgentUpdate(claimId, {
          claimId,
          agentName: 'Fraud Agent',
          sequence: 3,
          status: fraudExecution.status,
          summary: fraudRes.summary,
          durationMs: fraudRes.durationMs,
          output: fraudOutput,
          evidence: fraudRes.evidence,
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        fraudExecution.status = 'FAILED';
        fraudExecution.error = err.message;
        fraudExecution.completedAt = new Date();
        await fraudExecution.save();

        eventStreamManager.emitAgentUpdate(claimId, {
          claimId,
          agentName: 'Fraud Agent',
          sequence: 3,
          status: 'FAILED',
          summary: `Fraud Agent failed: ${err.message}`,
          output: { error: err.message },
          timestamp: new Date().toISOString(),
        });

        claim.status = 'FAILED';
        await claim.save();
        throw new Error(`Fraud Agent failed: ${err.message}`);
      }

      // ============================================================
      // AGENT 4: VERIFIER / DECISION AGENT
      // ============================================================
      eventStreamManager.emitAgentUpdate(claimId, {
        claimId,
        agentName: 'Verifier Agent',
        sequence: 4,
        status: 'RUNNING',
        summary: 'Synthesizing all agent outputs, verifying governance rules, and calculating recommendation...',
        timestamp: new Date().toISOString(),
      });

      const verifierExecution = new AgentExecution({
        claimId: claim._id,
        agentName: 'Verifier Agent',
        sequence: 4,
        status: 'RUNNING',
        summary: 'Synthesizing evidence and computing confidence score',
        startedAt: new Date(),
      });
      await verifierExecution.save();

      let verifierOutput;
      try {
        const verifierRes = await withAgentTimeout(
          verifierAgent.execute({
            claimNumber: claim.claimNumber,
            claimAmount: claim.claimAmount || intakeOutput.totalAmount || 0,
            intakeResult: intakeOutput,
            policyResult: policyOutput,
            fraudResult: fraudOutput,
          }),
          AGENT_TIMEOUT_MS,
          'Verifier Agent'
        );

        verifierOutput = verifierRes.result;
        verifierExecution.status = 'COMPLETED';
        verifierExecution.summary = verifierRes.summary;
        verifierExecution.output = verifierOutput;
        verifierExecution.evidence = verifierRes.evidence;
        verifierExecution.completedAt = new Date();
        verifierExecution.durationMs = verifierRes.durationMs;
        await verifierExecution.save();

        eventStreamManager.emitAgentUpdate(claimId, {
          claimId,
          agentName: 'Verifier Agent',
          sequence: 4,
          status: 'COMPLETED',
          summary: verifierRes.summary,
          durationMs: verifierRes.durationMs,
          output: verifierOutput,
          evidence: verifierRes.evidence,
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        verifierExecution.status = 'FAILED';
        verifierExecution.error = err.message;
        verifierExecution.completedAt = new Date();
        await verifierExecution.save();

        eventStreamManager.emitAgentUpdate(claimId, {
          claimId,
          agentName: 'Verifier Agent',
          sequence: 4,
          status: 'FAILED',
          summary: `Verifier Agent failed: ${err.message}`,
          output: { error: err.message },
          timestamp: new Date().toISOString(),
        });

        claim.status = 'FAILED';
        await claim.save();
        throw new Error(`Verifier Agent failed: ${err.message}`);
      }

      // ============================================================
      // STEP 7: PERSIST FINAL DECISION & UPDATE CLAIM
      // ============================================================
      const decisionDoc = await Decision.findOneAndUpdate(
        { claimId: claim._id },
        {
          claimId: claim._id,
          recommendation: verifierOutput.recommendation,
          confidence: verifierOutput.confidence,
          reasons: verifierOutput.reasons,
          evidence: verifierOutput.evidence,
          riskLevel: verifierOutput.riskLevel,
          requiresHumanReview: verifierOutput.requiresHumanReview,
        },
        { upsert: true, new: true }
      );

      // Update claim status
      let finalStatus: any = 'APPROVED';
      if (verifierOutput.recommendation === 'REJECT') {
        finalStatus = 'REJECTED';
      } else if (verifierOutput.recommendation === 'ESCALATE') {
        finalStatus = 'ESCALATED';
      }

      claim.status = finalStatus;
      claim.confidence = verifierOutput.confidence;
      claim.finalRecommendation = verifierOutput.recommendation;
      claim.requiresHumanReview = verifierOutput.requiresHumanReview;
      await claim.save();

      return {
        claim,
        decision: decisionDoc,
        executions: [intakeExecution, policyExecution, fraudExecution, verifierExecution],
      };
    } catch (outerErr: any) {
      if (claim.status === 'PROCESSING') {
        claim.status = 'FAILED';
        await claim.save().catch(() => {});
      }
      throw outerErr;
    }
  }
}

export const claimOrchestrator = new ClaimOrchestrator();
