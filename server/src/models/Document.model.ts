import mongoose, { Document as MongooseDocument, Schema } from 'mongoose';

export type DocumentCategory =
  | 'HOSPITAL_BILL'
  | 'DISCHARGE_SUMMARY'
  | 'PRESCRIPTION'
  | 'MEDICAL_REPORT'
  | 'INSURANCE_POLICY'
  | 'OTHER';

export interface IDocument extends MongooseDocument {
  claimId: mongoose.Types.ObjectId;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: DocumentCategory;
  path: string;
  processingStatus: 'PENDING' | 'PROCESSED' | 'FAILED';
  extractedText?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    claimId: { type: Schema.Types.ObjectId, ref: 'Claim', required: true, index: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    category: {
      type: String,
      enum: ['HOSPITAL_BILL', 'DISCHARGE_SUMMARY', 'PRESCRIPTION', 'MEDICAL_REPORT', 'INSURANCE_POLICY', 'OTHER'],
      default: 'OTHER',
    },
    path: { type: String, required: true },
    processingStatus: {
      type: String,
      enum: ['PENDING', 'PROCESSED', 'FAILED'],
      default: 'PENDING',
    },
    extractedText: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const ClaimDocument = mongoose.model<IDocument>('Document', DocumentSchema);
