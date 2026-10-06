import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { claimService } from '../services/claim.service';
import { Claim, ClaimDocument, Decision, AgentExecution } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ClaimStatusBadge } from '../components/claims/ClaimStatusBadge';
import {
  ArrowLeft,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  Award,
  BookOpen,
} from 'lucide-react';

export const HumanReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [documents, setDocuments] = useState<ClaimDocument[]>([]);
  const [executions, setExecutions] = useState<AgentExecution[]>([]);
  const [action, setAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const data = await claimService.getClaimById(id);
        setClaim(data.claim);
        setDecision(data.decision);
        setDocuments(data.documents);
        setExecutions(data.executions);
      } catch (err: any) {
        setError('Failed to load claim for review');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    setError(null);

    try {
      await claimService.submitReview(id, {
        action,
        comment: comment.trim() || undefined,
      });
      navigate(`/claims/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit adjudication');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading human review dossier..." />;
  }

  if (!claim) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-4">
        <p className="text-sm text-slate-400">Claim not found.</p>
        <Link to="/claims">
          <Button variant="outline">Back to Claims Portfolio</Button>
        </Link>
      </div>
    );
  }

  const fraudExec = executions.find((e) => e.agentName === 'Fraud Agent');
  const policyExec = executions.find((e) => e.agentName === 'Policy Agent');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        to={`/claims/${claim._id}`}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Claim Trace
      </Link>

      {/* Header Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white">
                Human Review Workstation — {claim.claimNumber}
              </h2>
              <ClaimStatusBadge status={claim.status} recommendation={claim.finalRecommendation} />
            </div>
            <p className="text-xs text-amber-200/80 mt-1">
              Autonomous agents escalated this claim due to corporate risk thresholds. Review the evidence and make the final adjudication.
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-xs text-slate-400">Total Billed</span>
          <p className="text-xl font-black text-emerald-400 font-mono">
            ₹{claim.claimAmount?.toLocaleString()}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Two Column Adjudication Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Evidence Dossier */}
        <div className="lg:col-span-2 space-y-6">
          {/* Why it was escalated */}
          <Card className="space-y-3 border-amber-500/40">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Escalation Rationale & Model Confidence
            </h4>
            <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Model Confidence:</span>
                <span className="font-bold text-amber-400">
                  {decision?.confidence ? `${Math.round(decision.confidence * 100)}%` : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Assessed Risk Level:</span>
                <span className="font-bold text-amber-400">{decision?.riskLevel || 'MEDIUM'}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 space-y-1">
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  Documented Reasons:
                </span>
                {decision?.reasons?.map((r, i) => (
                  <p key={i} className="text-xs text-slate-200">
                    • {r}
                  </p>
                ))}
              </div>
            </div>
          </Card>

          {/* Fraud & Consistency Agent Findings */}
          <Card className="space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Cross-Document Anomaly Findings
            </h4>
            {fraudExec?.output?.flags?.length > 0 ? (
              <div className="space-y-2">
                {fraudExec.output.flags.map((f: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-850 rounded-xl border border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white font-mono">{f.type}</span>
                      <span className="text-[10px] text-rose-400 font-semibold px-2 py-0.5 rounded bg-rose-500/10">
                        {f.severity} SEVERITY
                      </span>
                    </div>
                    <p className="text-slate-300">{f.description}</p>
                    {f.sources && (
                      <p className="text-[11px] text-slate-400">
                        Sources: {f.sources.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No fraud or date flags raised.</p>
            )}
          </Card>

          {/* Policy RAG Evidence */}
          <Card className="space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-400" />
              Retrieved Policy Clauses
            </h4>
            <p className="text-xs text-slate-300">
              Coverage Determination: <strong className="text-teal-300">{policyExec?.output?.coverage}</strong> — {policyExec?.output?.reason}
            </p>
          </Card>
        </div>

        {/* Right Column: Reviewer Action Panel */}
        <div className="space-y-6">
          <Card className="space-y-5 sticky top-24 border-brand-500/40">
            <div>
              <h4 className="text-sm font-bold text-white">Adjudicator Action</h4>
              <p className="text-xs text-slate-400">
                Record your final certification as an authorized claims reviewer
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Select Disposition
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAction('APPROVE')}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition ${
                      action === 'APPROVE'
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                        : 'border-slate-800 bg-slate-850 text-slate-400'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    APPROVE
                  </button>

                  <button
                    type="button"
                    onClick={() => setAction('REJECT')}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition ${
                      action === 'REJECT'
                        ? 'border-rose-500 bg-rose-500/15 text-rose-400'
                        : 'border-slate-800 bg-slate-850 text-slate-400'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    REJECT
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Auditor Comments & Justification
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Record justification for overriding or upholding AI findings..."
                  rows={5}
                  required
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <Button
                type="submit"
                variant={action === 'APPROVE' ? 'success' : 'danger'}
                size="lg"
                loading={submitting}
                className="w-full font-bold"
              >
                Submit Final Adjudication
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};
