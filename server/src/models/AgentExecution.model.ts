import mongoose, { Document, Schema } from 'mongoose';

export type AgentStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'WARNING' | 'FAILED';

export interface IAgentExecution extends Document {
  claimId: mongoose.Types.ObjectId;
  agentName: 'Intake Agent' | 'Policy Agent' | 'Fraud Agent' | 'Verifier Agent';
  status: AgentStatus;
  sequence: number;
  summary: string;
  output: any;
  evidence: any[];
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AgentExecutionSchema = new Schema<IAgentExecution>(
  {
    claimId: { type: Schema.Types.ObjectId, ref: 'Claim', required: true, index: true },
    agentName: {
      type: String,
      required: true,
      enum: ['Intake Agent', 'Policy Agent', 'Fraud Agent', 'Verifier Agent'],
    },
    status: {
      type: String,
      enum: ['PENDING', 'RUNNING', 'COMPLETED', 'WARNING', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    sequence: { type: Number, required: true },
    summary: { type: String, default: '' },
    output: { type: Schema.Types.Mixed, default: {} },
    evidence: [Schema.Types.Mixed],
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    durationMs: { type: Number, default: 0 },
    error: { type: String },
  },
  { timestamps: true }
);

export const AgentExecution = mongoose.model<IAgentExecution>('AgentExecution', AgentExecutionSchema);
