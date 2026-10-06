import mongoose, { Document, Schema } from 'mongoose';

export interface IDecision extends Document {
  claimId: mongoose.Types.ObjectId;
  recommendation: 'APPROVE' | 'REJECT' | 'ESCALATE';
  confidence: number;
  reasons: string[];
  evidence: any[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  requiresHumanReview: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewAction?: 'APPROVED' | 'REJECTED';
  reviewComment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DecisionSchema = new Schema<IDecision>(
  {
    claimId: { type: Schema.Types.ObjectId, ref: 'Claim', required: true, unique: true, index: true },
    recommendation: {
      type: String,
      enum: ['APPROVE', 'REJECT', 'ESCALATE'],
      required: true,
    },
    confidence: { type: Number, required: true },
    reasons: { type: [String], default: [] },
    evidence: [Schema.Types.Mixed],
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'LOW',
    },
    requiresHumanReview: { type: Boolean, default: false },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
    reviewAction: { type: String, enum: ['APPROVED', 'REJECTED', null], default: null },
    reviewComment: { type: String },
  },
  { timestamps: true }
);

export const Decision = mongoose.model<IDecision>('Decision', DecisionSchema);
