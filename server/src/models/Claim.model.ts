import mongoose, { Document, Schema } from 'mongoose';

export type ClaimStatus =
  | 'DRAFT'
  | 'UPLOADED'
  | 'PROCESSING'
  | 'APPROVED'
  | 'REJECTED'
  | 'ESCALATED'
  | 'UNDER_REVIEW'
  | 'FAILED';

export interface IClaim extends Document {
  claimNumber: string;
  userId?: mongoose.Types.ObjectId;
  patientName: string;
  hospital: string;
  diagnosis: string;
  treatment: string;
  claimAmount: number;
  status: ClaimStatus;
  confidence: number;
  finalRecommendation: 'APPROVE' | 'REJECT' | 'ESCALATE' | null;
  requiresHumanReview: boolean;
  notes?: string;
  isDemo?: boolean;
  demoType?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClaimSchema = new Schema<IClaim>(
  {
    claimNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    patientName: { type: String, default: 'Pending Extraction' },
    hospital: { type: String, default: 'Pending Extraction' },
    diagnosis: { type: String, default: 'Pending Extraction' },
    treatment: { type: String, default: 'Pending Extraction' },
    claimAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['DRAFT', 'UPLOADED', 'PROCESSING', 'APPROVED', 'REJECTED', 'ESCALATED', 'UNDER_REVIEW', 'FAILED'],
      default: 'DRAFT',
      index: true,
    },
    confidence: { type: Number, default: 0 },
    finalRecommendation: {
      type: String,
      enum: ['APPROVE', 'REJECT', 'ESCALATE', null],
      default: null,
    },
    requiresHumanReview: { type: Boolean, default: false },
    notes: { type: String },
    isDemo: { type: Boolean, default: false },
    demoType: { type: String, default: null },
  },
  { timestamps: true }
);

export const Claim = mongoose.model<IClaim>('Claim', ClaimSchema);
