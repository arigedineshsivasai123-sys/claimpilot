import { geminiService } from '../gemini/gemini.service';
import { config } from '../../config/env.config';
import {
  verifierResultSchema,
  VerifierResult,
  IntakeResult,
  PolicyResult,
  FraudResult,
} from '../../validators/agent.validator';

export interface VerifierAgentInput {
  claimNumber: string;
  claimAmount: number;
  intakeResult: IntakeResult;
  policyResult: PolicyResult;
  fraudResult: FraudResult;
}

export class VerifierAgent {
  public readonly name = 'Verifier Agent' as const;
  public readonly sequence = 4;

  public async execute(input: VerifierAgentInput): Promise<{
    result: VerifierResult;
    summary: string;
    evidence: any[];
    durationMs: number;
  }> {
    const startTime = Date.now();

    const systemPrompt = `You are the Verifier & Chief Adjudication Agent of ClaimPilot.
Your mission is to synthesize the findings of the Intake Agent, Policy Agent, and Fraud/Consistency Agent to formulate an authoritative, evidence-backed final recommendation.

ALLOWED DECISIONS:
1. APPROVE:
   - Treatment is medically indicated and covered under policy.
   - All waiting periods satisfied and exclusions ruled out.
   - Cross-document consistency verified with no high-risk flags.
   - AI confidence meets or exceeds ${config.aiConfidenceThreshold}.
   - Claim amount is under high-value threshold (₹${config.highValueClaimThreshold}).

2. REJECT:
   - Clear and unambiguous policy exclusion cited with verified clause evidence.
   - Explicit waiting period non-compliance or non-covered aesthetic/experimental procedure.

3. ESCALATE:
   - Claim amount exceeds high-value threshold (₹${config.highValueClaimThreshold}) requiring authorized supervisor sign-off.
   - Suspicious inconsistencies or date/billing anomalies identified (risk score > 40 or high severity flags).
   - Insufficient policy or clinical documentation to prove coverage.
   - Overall confidence falls below ${config.aiConfidenceThreshold}.
   - Significant discrepancy between provider charges and itemized invoices.

SCHEMA REQUIREMENTS:
Return STRICT JSON:
{
  "recommendation": "APPROVE" | "REJECT" | "ESCALATE",
  "confidence": number (between 0.0 and 1.0),
  "reasons": string[],
  "evidence": [
    { "type": string, "source": string, "detail": string }
  ],
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "requiresHumanReview": boolean,
  "summary": string
}`;

    const userPrompt = `Synthesize the findings for Claim: ${input.claimNumber}

1. INTAKE SUMMARY:
- Patient: ${input.intakeResult.patientName}
- Hospital: ${input.intakeResult.hospital}
- Diagnosis: ${input.intakeResult.diagnosis}
- Treatment: ${input.intakeResult.treatment}
- Total Amount: ₹${input.claimAmount}
- Dates: ${input.intakeResult.admissionDate} to ${input.intakeResult.dischargeDate}

2. POLICY AGENT FINDINGS:
- Coverage: ${input.policyResult.coverage}
- Reason: ${input.policyResult.reason}
- Confidence: ${input.policyResult.confidence}
- Evidence Cited: ${JSON.stringify(input.policyResult.evidence)}

3. FRAUD / CONSISTENCY AGENT FINDINGS:
- Risk Score: ${input.fraudResult.riskScore}/100 (${input.fraudResult.riskLevel})
- Clean: ${input.fraudResult.cleanBillOfHealth}
- Flags: ${JSON.stringify(input.fraudResult.flags)}

CONFIGURED RULES:
- AI Confidence Threshold: ${config.aiConfidenceThreshold}
- High Value Claim Threshold: ₹${config.highValueClaimThreshold}

Synthesize and produce the final decision now.`;

    // Resilient rule-based synthesis
    const fallbackResult = this.synthesizeDecisionRules(input);

    const rawJson = await geminiService.generateStructuredJson<VerifierResult>(
      systemPrompt,
      userPrompt,
      fallbackResult
    );

    const parsed = verifierResultSchema.safeParse(rawJson);
    const finalResult = parsed.success ? parsed.data : fallbackResult;

    // Strict safety check: If claim amount > HIGH_VALUE_CLAIM_THRESHOLD, enforce ESCALATE
    if (input.claimAmount > config.highValueClaimThreshold && finalResult.recommendation === 'APPROVE') {
      finalResult.recommendation = 'ESCALATE';
      finalResult.requiresHumanReview = true;
      finalResult.reasons.unshift(
        `High-value claim threshold (₹${config.highValueClaimThreshold.toLocaleString()}) exceeded. Mandatory executive human review required.`
      );
    }

    // Strict safety check: If high severity fraud flags exist, enforce ESCALATE
    const hasHighFlag = input.fraudResult.flags.some((f) => f.severity === 'HIGH');
    if (hasHighFlag && finalResult.recommendation === 'APPROVE') {
      finalResult.recommendation = 'ESCALATE';
      finalResult.requiresHumanReview = true;
      finalResult.reasons.unshift(
        'Critical cross-document inconsistencies detected. Escalated for human investigator audit.'
      );
    }

    const durationMs = Date.now() - startTime;
    const summary = `Final Decision: ${finalResult.recommendation} (Confidence: ${(
      finalResult.confidence * 100
    ).toFixed(0)}%, Risk: ${finalResult.riskLevel}). ${
      finalResult.requiresHumanReview ? 'Requires human reviewer intervention.' : 'Eligible for autonomous dispatch.'
    }`;

    return {
      result: finalResult,
      summary,
      evidence: finalResult.evidence,
      durationMs,
    };
  }

  /**
   * Deterministic decision engine enforcing corporate governance thresholds
   */
  private synthesizeDecisionRules(input: VerifierAgentInput): VerifierResult {
    const reasons: string[] = [];
    const evidenceList: any[] = [];
    let recommendation: 'APPROVE' | 'REJECT' | 'ESCALATE' = 'APPROVE';
    let requiresHumanReview = false;
    let confidence = input.policyResult.confidence || 0.85;
    let riskLevel = input.fraudResult.riskLevel || 'LOW';

    // 1. High-Value Claim Rule
    if (input.claimAmount > config.highValueClaimThreshold) {
      recommendation = 'ESCALATE';
      requiresHumanReview = true;
      riskLevel = 'HIGH';
      reasons.push(
        `Claim amount (₹${input.claimAmount.toLocaleString()}) exceeds high-value threshold (₹${config.highValueClaimThreshold.toLocaleString()}). Mandatory human review.`
      );
    }

    // 2. High or Medium Fraud / Consistency Flags
    const highFlags = input.fraudResult.flags.filter((f) => f.severity === 'HIGH');
    if (highFlags.length > 0) {
      recommendation = 'ESCALATE';
      requiresHumanReview = true;
      riskLevel = 'HIGH';
      confidence = Math.min(confidence, 0.72);
      highFlags.forEach((f) => {
        reasons.push(`Inconsistency Flag: ${f.description}`);
        evidenceList.push({ type: f.type, source: f.sources.join(', '), detail: f.description });
      });
    }

    // 3. Clear Policy Exclusion
    if (input.policyResult.coverage === 'NOT_COVERED') {
      recommendation = 'REJECT';
      confidence = Math.max(confidence, input.policyResult.confidence);
      reasons.push(`Policy Exclusion: ${input.policyResult.reason}`);
      input.policyResult.evidence.forEach((ev) => {
        evidenceList.push({ type: 'POLICY_EXCLUSION', source: `Clause ${ev.clause}`, detail: ev.text });
      });
      return {
        recommendation: 'REJECT',
        confidence,
        reasons,
        evidence: evidenceList,
        riskLevel: 'LOW',
        requiresHumanReview: false,
        summary: `Claim rejected based on explicit policy exclusion (${input.policyResult.reason}).`,
      };
    }

    // 4. Insufficient Policy Evidence or Low Confidence
    if (input.policyResult.coverage === 'INSUFFICIENT_EVIDENCE' || confidence < config.aiConfidenceThreshold) {
      recommendation = 'ESCALATE';
      requiresHumanReview = true;
      reasons.push(
        `Confidence score (${(confidence * 100).toFixed(0)}%) is below system threshold (${(
          config.aiConfidenceThreshold * 100
        ).toFixed(0)}%). Escalated for human adjudication.`
      );
    }

    // 5. Normal Clean Approval
    if (recommendation === 'APPROVE') {
      reasons.push('Medical treatment is covered under active policy guidelines.');
      reasons.push('All diagnostic and billing records are consistent across documents.');
      reasons.push('Confidence score satisfies autonomous decision threshold.');
      input.policyResult.evidence.forEach((ev) => {
        evidenceList.push({ type: 'POLICY_COVERAGE', source: `Clause ${ev.clause}`, detail: ev.text });
      });
    }

    return {
      recommendation,
      confidence,
      reasons,
      evidence: evidenceList,
      riskLevel,
      requiresHumanReview,
      summary: `Claim ${recommendation.toLowerCase()} with ${(confidence * 100).toFixed(0)}% confidence.`,
    };
  }
}

export const verifierAgent = new VerifierAgent();
