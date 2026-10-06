import React from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import {
  CheckCircle2,
  XCircle,
  AlertOctagon,
  UserCheck,
  Award,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Decision } from '../../types';

interface DecisionCardProps {
  decision: Decision | null;
  onOpenReview: () => void;
  status: string;
}

export const DecisionCard: React.FC<DecisionCardProps> = ({
  decision,
  onOpenReview,
  status,
}) => {
  if (!decision) {
    return (
      <Card className="text-center py-8">
        <Award className="w-10 h-10 text-slate-600 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-slate-300">Final Decision Pending</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Click "Analyze Claim" above to execute the multi-agent investigation pipeline.
        </p>
      </Card>
    );
  }

  const rec = decision.recommendation;
  const confidencePct = Math.round(decision.confidence * 100);

  const isApproved = rec === 'APPROVE' || status === 'APPROVED';
  const isRejected = rec === 'REJECT' || status === 'REJECTED';
  const isEscalated = rec === 'ESCALATE' || status === 'ESCALATED';

  return (
    <Card
      className={`space-y-5 border-2 ${
        isApproved
          ? 'border-emerald-500/50 bg-gradient-to-b from-emerald-950/20 to-slate-900'
          : isRejected
          ? 'border-rose-500/50 bg-gradient-to-b from-rose-950/20 to-slate-900'
          : 'border-amber-500/50 bg-gradient-to-b from-amber-950/20 to-slate-900'
      }`}
    >
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${
              isApproved
                ? 'bg-emerald-600 shadow-emerald-600/30'
                : isRejected
                ? 'bg-rose-600 shadow-rose-600/30'
                : 'bg-amber-600 shadow-amber-600/30'
            }`}
          >
            {isApproved && <CheckCircle2 className="w-7 h-7" />}
            {isRejected && <XCircle className="w-7 h-7" />}
            {isEscalated && <AlertOctagon className="w-7 h-7" />}
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Verifier Agent Recommendation
            </span>
            <h3
              className={`text-2xl font-black tracking-tight ${
                isApproved
                  ? 'text-emerald-400'
                  : isRejected
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}
            >
              {rec}
            </h3>
          </div>
        </div>

        {/* Confidence Meter */}
        <div className="bg-slate-850/80 p-3 rounded-xl border border-slate-800 min-w-[180px]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 font-medium">Model Confidence</span>
            <span className="font-mono font-bold text-white">{confidencePct}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                confidencePct >= 80
                  ? 'bg-emerald-500'
                  : confidencePct >= 60
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${confidencePct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Decision Rationale */}
      <div className="space-y-2">
        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Executive Rationale & Evidence Grounding
        </h5>
        <div className="space-y-1.5">
          {decision.reasons.map((reason, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 text-xs text-slate-200 bg-slate-850/60 p-2.5 rounded-xl border border-slate-800"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 shrink-0" />
              <span>{reason}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Human Review Banner or Sign-Off Info */}
      {decision.reviewedBy ? (
        <div className="p-3.5 bg-brand-950/40 border border-brand-500/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-brand-400" />
            <div>
              <p className="text-xs font-semibold text-white">
                Human Review Completed by {decision.reviewedBy}
              </p>
              {decision.reviewComment && (
                <p className="text-[11px] text-slate-300 italic mt-0.5">
                  "{decision.reviewComment}"
                </p>
              )}
            </div>
          </div>
          <span className="text-[11px] font-mono text-brand-400 bg-brand-500/15 px-2.5 py-1 rounded-lg">
            Action: {decision.reviewAction}
          </span>
        </div>
      ) : decision.requiresHumanReview ? (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-sm font-bold text-white">Human Review Required</h5>
              <p className="text-xs text-amber-200/80">
                This claim triggered risk governance thresholds. An authorized reviewer must adjudicate.
              </p>
            </div>
          </div>
          <Button
            variant="warning"
            size="md"
            onClick={onOpenReview}
            className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold border-amber-400/40"
          >
            Review Claim Now
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      ) : null}
    </Card>
  );
};
