import mongoose, { Document, Schema } from 'mongoose';

export interface IPolicyChunk extends Document {
  policyId?: string;
  claimId?: mongoose.Types.ObjectId;
  text: string;
  pageNumber: number;
  clauseNumber: string;
  embedding: number[];
  metadata: Record<string, any>;
  createdAt: Date;
}

const PolicyChunkSchema = new Schema<IPolicyChunk>(
  {
    policyId: { type: String, default: 'standard-health-policy-2026', index: true },
    claimId: { type: Schema.Types.ObjectId, ref: 'Claim', index: true },
    text: { type: String, required: true },
    pageNumber: { type: Number, default: 1 },
    clauseNumber: { type: String, default: 'General' },
    embedding: { type: [Number], default: [] },
    metadata: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
  }
);

// Index for text searches and metadata lookups
PolicyChunkSchema.index({ policyId: 1, clauseNumber: 1 });

export const PolicyChunk = mongoose.model<IPolicyChunk>('PolicyChunk', PolicyChunkSchema);
