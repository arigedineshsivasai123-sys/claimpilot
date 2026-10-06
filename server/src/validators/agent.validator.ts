import { z } from 'zod';

// ------------------------------------------------------------
// AGENT 1 — INTAKE AGENT SCHEMA
// ------------------------------------------------------------
export const lineItemSchema = z.object({
  category: z.string().default('General'),
  description: z.string(),
  amount: z.number().nonnegative(),
  source: z.string().optional(),
});

export const intakeResultSchema = z.object({
  claimId: z.string().nullable().optional(),
  patientName: z.string().nullable().optional(),
  hospital: z.string().nullable().optional(),
  admissionDate: z.string().nullable().optional(),
  dischargeDate: z.string().nullable().optional(),
  diagnosis: z.string().nullable().optional(),
  treatment: z.string().nullable().optional(),
  procedures: z.array(z.string()).default([]),
  medicines: z.array(z.string()).default([]),
  tests: z.array(z.string()).default([]),
  roomCharges: z.number().nullable().optional().default(0),
  doctorCharges: z.number().nullable().optional().default(0),
  otherCharges: z.number().nullable().optional().default(0),
  totalAmount: z.number().nonnegative().nullable().optional().default(0),
  lineItems: z.array(lineItemSchema).default([]),
  sourceReferences: z.array(z.string()).default([]),
});

export type IntakeResult = z.infer<typeof intakeResultSchema>;

// ------------------------------------------------------------
// AGENT 2 — POLICY AGENT SCHEMA
// ------------------------------------------------------------
export const policyEvidenceItemSchema = z.object({
  clause: z.string(),
  page: z.number().or(z.string()),
  text: z.string(),
});

export const policyResultSchema = z.object({
  coverage: z.enum(['COVERED', 'NOT_COVERED', 'PARTIALLY_COVERED', 'INSUFFICIENT_EVIDENCE']),
  reason: z.string(),
  confidence: z.number().min(0).max(1),
  waitingPeriodMet: z.boolean().nullable().optional(),
  subLimitApplied: z.boolean().nullable().optional(),
  estimatedDeductible: z.number().nullable().optional().default(0),
  eligibleAmount: z.number().nullable().optional().default(0),
  evidence: z.array(policyEvidenceItemSchema).default([]),
});

export type PolicyResult = z.infer<typeof policyResultSchema>;

// ------------------------------------------------------------
// AGENT 3 — FRAUD / CONSISTENCY AGENT SCHEMA
// ------------------------------------------------------------
export const fraudFlagSchema = z.object({
  type: z.string(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  description: z.string(),
  sources: z.array(z.string()).default([]),
  potentialImpact: z.string().optional(),
});

export const fraudResultSchema = z.object({
  riskScore: z.number().min(0).max(100).default(0),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('LOW'),
  flags: z.array(fraudFlagSchema).default([]),
  summary: z.string(),
  cleanBillOfHealth: z.boolean().default(true),
});

export type FraudResult = z.infer<typeof fraudResultSchema>;

// ------------------------------------------------------------
// AGENT 4 — VERIFIER / DECISION AGENT SCHEMA
// ------------------------------------------------------------
export const verifierResultSchema = z.object({
  recommendation: z.enum(['APPROVE', 'REJECT', 'ESCALATE']),
  confidence: z.number().min(0).max(1),
  reasons: z.array(z.string()),
  evidence: z.array(z.any()).default([]),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  requiresHumanReview: z.boolean(),
  summary: z.string().optional(),
});

export type VerifierResult = z.infer<typeof verifierResultSchema>;
