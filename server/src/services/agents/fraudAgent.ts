import { geminiService } from '../gemini/gemini.service';
import { fraudResultSchema, FraudResult, IntakeResult } from '../../validators/agent.validator';

export interface FraudAgentInput {
  claimNumber: string;
  intakeResult: IntakeResult;
  documentTexts?: Record<string, string>;
}

export class FraudAgent {
  public readonly name = 'Fraud Agent' as const;
  public readonly sequence = 3;

  public async execute(input: FraudAgentInput): Promise<{
    result: FraudResult;
    summary: string;
    evidence: any[];
    durationMs: number;
  }> {
    const startTime = Date.now();

    const systemPrompt = `You are the Fraud & Consistency Agent of ClaimPilot, an autonomous Health Insurance Claim Review system.
Your mission is to perform deep cross-document verification, detecting date anomalies, billing discrepancies, duplicate line items, and medical mismatches.

CRITICAL ETHICAL CONSTRAINT:
- NEVER accuse the patient or provider of intentional fraud.
- ALWAYS use neutral terminology: "Suspicious inconsistency", "Potential fraud indicator", "Requires human review", "Billing discrepancy".

INSPECTION RULES:
1. Cross-check admission and discharge dates (e.g. discharge date occurring before admission date, or bill dates outside hospital stay).
2. Cross-check diagnosis vs treatment (e.g., knee surgery billed for a respiratory infection).
3. Detect duplicate line items (same test, procedure, or room charge billed multiple times on identical dates).
4. Detect arithmetic inconsistencies (sum of line items differing by >5% from the total billed amount).
5. Detect inflated or unsupported ancillary charges.
6. Return STRICT JSON matching this schema:
{
  "riskScore": number (0 to 100),
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "cleanBillOfHealth": boolean,
  "summary": string,
  "flags": [
    {
      "type": "DATE_MISMATCH" | "BILLING_INCONSISTENCY" | "DUPLICATE_CHARGE" | "DIAGNOSIS_TREATMENT_MISMATCH" | "UNSUPPORTED_CHARGE" | "ANOMALY",
      "severity": "LOW" | "MEDIUM" | "HIGH",
      "description": string,
      "sources": string[],
      "potentialImpact": string
    }
  ]
}`;

    const userPrompt = `Review the extracted claim data for anomalies:

CLAIM NUMBER: ${input.claimNumber}
PATIENT: ${input.intakeResult.patientName}
HOSPITAL: ${input.intakeResult.hospital}
ADMISSION DATE: ${input.intakeResult.admissionDate}
DISCHARGE DATE: ${input.intakeResult.dischargeDate}
DIAGNOSIS: ${input.intakeResult.diagnosis}
TREATMENT: ${input.intakeResult.treatment}
TOTAL BILLED: ₹${input.intakeResult.totalAmount}
LINE ITEMS: ${JSON.stringify(input.intakeResult.lineItems, null, 2)}
SOURCE DOCUMENTS: ${JSON.stringify(input.intakeResult.sourceReferences)}

Perform full consistency and anomaly inspection now.`;

    // Resilient fallback rule engine
    const fallbackResult = this.evaluateConsistencyRules(input);

    const rawJson = await geminiService.generateStructuredJson<FraudResult>(
      systemPrompt,
      userPrompt,
      fallbackResult
    );

    const parsed = fraudResultSchema.safeParse(rawJson);
    const finalResult = parsed.success ? parsed.data : fallbackResult;
    const durationMs = Date.now() - startTime;

    const summary = finalResult.flags.length === 0
      ? 'Clean cross-document verification. No date, billing, or diagnostic anomalies detected.'
      : `Identified ${finalResult.flags.length} potential consistency flags (Overall Risk: ${finalResult.riskLevel}, Score: ${finalResult.riskScore}/100).`;

    return {
      result: finalResult,
      summary,
      evidence: finalResult.flags,
      durationMs,
    };
  }

  /**
   * Deterministic rule-based anomaly detector
   */
  private evaluateConsistencyRules(input: { intakeResult: IntakeResult }): FraudResult {
    const flags: FraudResult['flags'] = [];
    const { intakeResult } = input;

    // 1. Check Date Mismatch: discharge date before admission date
    if (intakeResult.admissionDate && intakeResult.dischargeDate) {
      const adm = new Date(intakeResult.admissionDate);
      const dis = new Date(intakeResult.dischargeDate);
      if (dis < adm) {
        flags.push({
          type: 'DATE_MISMATCH',
          severity: 'HIGH',
          description: `Discharge date (${intakeResult.dischargeDate}) is recorded chronologically before admission date (${intakeResult.admissionDate}). Requires review.`,
          sources: intakeResult.sourceReferences.slice(0, 2),
          potentialImpact: 'Invalid hospital stay duration calculation',
        });
      }
    }

    // 2. Check Line Items Sum vs Total
    if (intakeResult.lineItems.length > 0 && intakeResult.totalAmount) {
      const sumItems = intakeResult.lineItems.reduce((acc, item) => acc + (item.amount || 0), 0);
      const diff = Math.abs(sumItems - intakeResult.totalAmount);
      if (diff > 500 && diff / intakeResult.totalAmount > 0.1) {
        flags.push({
          type: 'BILLING_INCONSISTENCY',
          severity: 'MEDIUM',
          description: `Line item sum (₹${sumItems.toLocaleString()}) does not reconcile with total billed amount (₹${intakeResult.totalAmount.toLocaleString()}). Discrepancy of ₹${diff.toLocaleString()}.`,
          sources: ['hospital_bill.pdf'],
          potentialImpact: 'Overbilling or unitemized charges',
        });
      }
    }

    // 3. Check for Duplicate Line Items
    const seenDesc = new Set<string>();
    for (const item of intakeResult.lineItems) {
      const key = `${item.description.toLowerCase().trim()}-${item.amount}`;
      if (seenDesc.has(key)) {
        flags.push({
          type: 'DUPLICATE_CHARGE',
          severity: 'MEDIUM',
          description: `Potential duplicate charge identified: "${item.description}" billed multiple times for ₹${item.amount}.`,
          sources: ['hospital_bill.pdf'],
          potentialImpact: 'Redundant line item charge',
        });
        break;
      }
      seenDesc.add(key);
    }

    // 4. Check Diagnosis vs Treatment mismatch
    const diag = (intakeResult.diagnosis || '').toLowerCase();
    const treat = (intakeResult.treatment || '').toLowerCase();
    if (
      (diag.includes('cardiac') && treat.includes('knee')) ||
      (diag.includes('respiratory') && treat.includes('orthopedic'))
    ) {
      flags.push({
        type: 'DIAGNOSIS_TREATMENT_MISMATCH',
        severity: 'HIGH',
        description: `Potential diagnostic inconsistency: Clinical diagnosis (${intakeResult.diagnosis}) does not align with billed surgical procedure (${intakeResult.treatment}).`,
        sources: ['discharge_summary.pdf', 'hospital_bill.pdf'],
        potentialImpact: 'Incompatible treatment protocol',
      });
    }

    const highFlags = flags.filter((f) => f.severity === 'HIGH').length;
    const medFlags = flags.filter((f) => f.severity === 'MEDIUM').length;

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    let riskScore = 10;

    if (highFlags > 0) {
      riskLevel = 'HIGH';
      riskScore = Math.min(95, 60 + highFlags * 20);
    } else if (medFlags > 0) {
      riskLevel = 'MEDIUM';
      riskScore = Math.min(55, 30 + medFlags * 15);
    }

    return {
      riskScore,
      riskLevel,
      cleanBillOfHealth: flags.length === 0,
      summary:
        flags.length === 0
          ? 'Cross-document verification clean. All dates and bill sums reconcile.'
          : `Detected ${flags.length} suspicious inconsistency indicator(s) requiring human verification.`,
      flags,
    };
  }
}

export const fraudAgent = new FraudAgent();
