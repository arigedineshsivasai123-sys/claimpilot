import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { ShieldCheck, BookOpen, Quote, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { AgentExecution } from '../../types';

interface PolicyFindingsCardProps {
  policyExecution?: AgentExecution;
}

export const PolicyFindingsCard: React.FC<PolicyFindingsCardProps> = ({
  policyExecution,
}) => {
  const data = policyExecution?.output || {};
  const coverage = data.coverage || 'PENDING';
  const reason = data.reason || 'Policy adjudication in progress.';
  const confidence = data.confidence ? Math.round(data.confidence * 100) : 0;
  const evidence: any[] = data.evidence || [];
  const waitingPeriodMet = data.waitingPeriodMet;
  const eligibleAmount = data.eligibleAmount;

  const coverageBadge = () => {
    switch (coverage) {
      case 'COVERED':
        return <Badge variant="success" dot>COVERED UNDER POLICY</Badge>;
      case 'NOT_COVERED':
        return <Badge variant="danger" dot>POLICY EXCLUSION APPLIES</Badge>;
      case 'PARTIALLY_COVERED':
        return <Badge variant="warning" dot>PARTIALLY COVERED (SUB-LIMITS)</Badge>;
      default:
        return <Badge variant="neutral">INSUFFICIENT EVIDENCE</Badge>;
    }
  };

  return (
    <Card className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Policy Adjudication & RAG Evidence</h4>
            <p className="text-xs text-slate-400">
              Retrieved and verified against active insurance terms
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {coverageBadge()}
          {confidence > 0 && (
            <span className="text-xs text-slate-400 font-mono">
              Confidence: {confidence}%
            </span>
          )}
        </div>
      </div>

      {/* Adjudication Reason */}
      <div className="p-3.5 bg-slate-850 rounded-xl border border-slate-800 space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Adjudication Summary
        </span>
        <p className="text-sm text-slate-200 leading-relaxed">{reason}</p>

        <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-300 border-t border-slate-800 mt-2">
          {waitingPeriodMet !== undefined && (
            <span className="flex items-center gap-1.5">
              {waitingPeriodMet ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
              )}
              Waiting Period: {waitingPeriodMet ? 'Satisfied' : 'Not Completed'}
            </span>
          )}
          {eligibleAmount !== undefined && (
            <span className="flex items-center gap-1.5">
              <span className="font-semibold text-emerald-400">
                Eligible Sum: ₹{eligibleAmount.toLocaleString()}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Retrieved Clauses Evidence */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-teal-400" />
            Cited Policy Clauses ({evidence.length})
          </h5>
          <span className="text-[11px] text-slate-500">Vector Search Top-K Matches</span>
        </div>

        {evidence.length === 0 ? (
          <p className="text-xs text-slate-500 italic p-3 bg-slate-900 rounded-xl border border-slate-800">
            No specific policy clauses cited yet.
          </p>
        ) : (
          <div className="space-y-2">
            {evidence.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-teal-500/15 text-teal-300 font-mono text-[11px] font-semibold border border-teal-500/30">
                      Clause {item.clause}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Page {item.page}
                    </span>
                  </div>
                  <Quote className="w-3.5 h-3.5 text-slate-600" />
                </div>
                <p className="text-xs text-slate-300 italic pl-2 border-l-2 border-teal-500/40 leading-relaxed">
                  "{item.text}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
