import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { AlertTriangle, CheckCircle2, FileSearch, ShieldAlert } from 'lucide-react';
import { AgentExecution } from '../../types';

interface FraudFlagsCardProps {
  fraudExecution?: AgentExecution;
}

export const FraudFlagsCard: React.FC<FraudFlagsCardProps> = ({
  fraudExecution,
}) => {
  const data = fraudExecution?.output || {};
  const flags: any[] = data.flags || [];
  const riskScore = data.riskScore ?? 0;
  const riskLevel = data.riskLevel || 'LOW';
  const summary = data.summary || 'Consistency audit in progress.';

  const severityBadge = (sev: string) => {
    switch (sev) {
      case 'HIGH':
        return <Badge variant="danger" size="sm">HIGH SEVERITY</Badge>;
      case 'MEDIUM':
        return <Badge variant="warning" size="sm">MEDIUM</Badge>;
      default:
        return <Badge variant="neutral" size="sm">LOW</Badge>;
    }
  };

  const riskLevelBadge = () => {
    switch (riskLevel) {
      case 'HIGH':
        return <Badge variant="danger" dot>HIGH ANOMALY RISK</Badge>;
      case 'MEDIUM':
        return <Badge variant="warning" dot>MODERATE ANOMALIES</Badge>;
      default:
        return <Badge variant="success" dot>LOW RISK / CONSISTENT</Badge>;
    }
  };

  return (
    <Card className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Cross-Document Consistency & Anomaly Flags</h4>
            <p className="text-xs text-slate-400">
              Audit for date discrepancies, duplicate charges, and diagnostic alignment
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {riskLevelBadge()}
          <span className="text-xs text-slate-400 font-mono">
            Risk Index: {riskScore}/100
          </span>
        </div>
      </div>

      {/* Summary */}
      <div className="p-3.5 bg-slate-850 rounded-xl border border-slate-800">
        <p className="text-xs text-slate-300 leading-relaxed">{summary}</p>
      </div>

      {/* Flags List or Clean state */}
      <div className="space-y-2">
        {flags.length === 0 ? (
          <div className="p-4 bg-emerald-500/[0.04] border border-emerald-500/20 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-emerald-300">
                All Documents Internally Consistent
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                No admission date mismatches, arithmetic variances, or duplicate billing items detected.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {flags.map((flag, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-slate-850 border border-slate-800 rounded-xl space-y-2 hover:border-slate-700 transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle
                      className={`w-4 h-4 ${
                        flag.severity === 'HIGH' ? 'text-rose-400' : 'text-amber-400'
                      }`}
                    />
                    <span className="text-xs font-bold text-white font-mono">
                      {flag.type}
                    </span>
                  </div>
                  {severityBadge(flag.severity)}
                </div>

                <p className="text-xs text-slate-200 leading-relaxed">
                  {flag.description}
                </p>

                {flag.sources && flag.sources.length > 0 && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <FileSearch className="w-3.5 h-3.5 text-slate-500" />
                    <span>Conflicting Sources:</span>
                    <span className="font-mono text-slate-300">
                      {flag.sources.join(' vs ')}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-[11px] text-slate-500 italic pt-1">
        * Notice: Anomaly flags indicate cross-document discrepancies requiring reviewer verification; they do not constitute accusations of intentional fraud.
      </div>
    </Card>
  );
};
