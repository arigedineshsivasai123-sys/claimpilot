import { Request, Response } from 'express';
import { PolicyChunk } from '../models/PolicyChunk.model';
import { AgentExecution } from '../models/AgentExecution.model';

export class PolicyController {
  public async getPolicyEvidence(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check Policy Agent execution output
      const policyExec = await AgentExecution.findOne({
        claimId: id,
        agentName: 'Policy Agent',
      });

      if (policyExec && policyExec.output && policyExec.output.evidence) {
        res.status(200).json({
          success: true,
          data: {
            coverage: policyExec.output.coverage,
            reason: policyExec.output.reason,
            confidence: policyExec.output.confidence,
            evidence: policyExec.output.evidence,
          },
        });
        return;
      }

      // Fallback to chunks
      const chunks = await PolicyChunk.find({ claimId: id }).limit(10);
      res.status(200).json({
        success: true,
        data: {
          evidence: chunks.map((c) => ({
            clause: c.clauseNumber,
            page: c.pageNumber,
            text: c.text,
          })),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Could not fetch policy evidence',
        errors: [error.message],
      });
    }
  }
}

export const policyController = new PolicyController();
