export interface User {
  id: string;
  name: string;
  email: string;
  role: 'reviewer' | 'admin' | 'investigator';
}

export type ClaimStatus =
  | 'DRAFT'
  | 'UPLOADED'
  | 'PROCESSING'
  | 'APPROVED'
  | 'REJECTED'
  | 'ESCALATED'
  | 'UNDER_REVIEW'
  | 'FAILED';

export type Recommendation = 'APPROVE' | 'REJECT' | 'ESCALATE';

export interface Claim {
  _id: string;
  claimNumber: string;
  patientName: string;
  hospital: string;
  diagnosis: string;
  treatment: string;
  claimAmount: number;
  status: ClaimStatus;
  confidence: number;
  finalRecommendation: Recommendation | null;
  requiresHumanReview: boolean;
  notes?: string;
  isDemo?: boolean;
  demoType?: string;
  createdAt: string;
  updatedAt: string;
}

export type DocumentCategory =
  | 'HOSPITAL_BILL'
  | 'DISCHARGE_SUMMARY'
  | 'PRESCRIPTION'
  | 'MEDICAL_REPORT'
  | 'INSURANCE_POLICY'
  | 'OTHER';

export interface ClaimDocument {
  _id: string;
  claimId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: DocumentCategory;
  path: string;
  processingStatus: 'PENDING' | 'PROCESSED' | 'FAILED';
  extractedText?: string;
  createdAt: string;
}

export type AgentName =
  | 'Intake Agent'
  | 'Policy Agent'
  | 'Fraud Agent'
  | 'Verifier Agent';

export type AgentStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'WARNING'
  | 'FAILED';

export interface AgentExecution {
  _id: string;
  claimId: string;
  agentName: AgentName;
  status: AgentStatus;
  sequence: number;
  summary: string;
  output: any;
  evidence: any[];
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  error?: string;
}

export interface Decision {
  _id: string;
  claimId: string;
  recommendation: Recommendation;
  confidence: number;
  reasons: string[];
  evidence: any[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  requiresHumanReview: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewAction?: 'APPROVED' | 'REJECTED';
  reviewComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DemoPreset {
  id: string;
  name: string;
  expectedResult: Recommendation;
  description: string;
  patientName: string;
  hospital: string;
  diagnosis: string;
  treatment: string;
  claimAmount: number;
  documentCount: number;
}

export interface AnalyticsStats {
  totalClaims: number;
  approvedCount: number;
  rejectedCount: number;
  escalatedCount: number;
  processingCount: number;
  draftCount: number;
  avgConfidence: number;
  humanReviewRate: number;
  totalAmount: number;
  avgDurationSec: number;
  recentClaims: Claim[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: string[];
}
