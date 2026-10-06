import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { claimService } from '../services/claim.service';
import { Claim, ClaimDocument, Decision, AgentExecution } from '../types';
import { useAgentStream } from '../hooks/useAgentStream';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ClaimStatusBadge } from '../components/claims/ClaimStatusBadge';
import { AgentTimeline } from '../components/claims/AgentTimeline';
import { ExtractedInfoCard } from '../components/claims/ExtractedInfoCard';
import { PolicyFindingsCard } from '../components/claims/PolicyFindingsCard';
import { FraudFlagsCard } from '../components/claims/FraudFlagsCard';
import { DecisionCard } from '../components/claims/DecisionCard';
import { HumanReviewModal } from '../components/claims/HumanReviewModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  ArrowLeft,
  Play,
  FileText,
  User,
  Building2,
  Receipt,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export const ClaimDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [documents, setDocuments] = useState<ClaimDocument[]>([]);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [executions, setExecutions] = useState<AgentExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const isProcessing = Boolean(analyzing || claim?.status === 'PROCESSING');

  // SSE Stream hook for live real-time trace events (stays active while processing)
  const { streamEvents } = useAgentStream(id, isProcessing);

  const fetchClaimData = useCallback(async () => {
    if (!id) return;
    try {
      const data = await claimService.getClaimById(id);
      setClaim(data.claim);
      setDocuments(data.documents);
      setDecision(data.decision);
      setExecutions(data.executions);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load claim');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchClaimData();
  }, [fetchClaimData]);

  // Polling fallback: sync every 2.5s while processing so UI stays updated even if SSE disconnects
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isProcessing) {
      interval = setInterval(() => {
        fetchClaimData();
      }, 2500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isProcessing, fetchClaimData]);

  // Merge live streaming SSE events into executions
  useEffect(() => {
    if (streamEvents.length > 0) {
      setExecutions((prev) => {
        const map = new Map<number, AgentExecution>();
        prev.forEach((e) => map.set(e.sequence, e));
        streamEvents.forEach((e) => map.set(e.sequence, e));
        return Array.from(map.values()).sort((a, b) => a.sequence - b.sequence);
      });
    }
  }, [streamEvents]);

  const handleAnalyzeClaim = async () => {
    if (!id) return;
    setAnalyzing(true);
    setError(null);

    try {
      const result = await claimService.analyzeClaim(id);
      setClaim(result.claim);
      setDecision(result.decision);
      setExecutions(result.executions);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.errors?.[0] ||
        err.response?.data?.message ||
        err.message ||
        'Agent pipeline encountered an error';
      setError(errorMsg);
    } finally {
      setAnalyzing(false);
      // Refresh to ensure full sync
      fetchClaimData();
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading claim dossier..." />;
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

  const intakeExec = executions.find((e) => e.agentName === 'Intake Agent');
  const policyExec = executions.find((e) => e.agentName === 'Policy Agent');
  const fraudExec = executions.find((e) => e.agentName === 'Fraud Agent');
  const verifierExec = executions.find((e) => e.agentName === 'Verifier Agent');

  const isAnalyzed = Boolean(decision || claim.status === 'APPROVED' || claim.status === 'REJECTED' || claim.status === 'ESCALATED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Navigation & Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Link
            to="/claims"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Claims Portfolio
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchClaimData}
              title="Refresh Dossier"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Claim Dossier Header Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                  {claim.claimNumber}
                </span>
                <ClaimStatusBadge
                  status={claim.status}
                  recommendation={claim.finalRecommendation}
                />
                {claim.isDemo && (
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-brand-500/15 text-brand-300 border border-brand-500/30">
                    SYNTHETIC DEMO CLAIM
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Created on {new Date(claim.createdAt).toLocaleDateString()} at{' '}
                {new Date(claim.createdAt).toLocaleTimeString()}
              </p>
            </div>

            {/* Primary Action Button */}
            <div className="flex flex-wrap items-center gap-3">
              {claim.requiresHumanReview && (
                <Button
                  variant="warning"
                  size="md"
                  onClick={() => setShowReviewModal(true)}
                  className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold border-amber-400/40"
                >
                  <ShieldCheck className="w-4 h-4 mr-1.5" />
                  Review Claim
                </Button>
              )}

              <Button
                variant="primary"
                size="md"
                loading={analyzing}
                disabled={analyzing || documents.length === 0}
                onClick={handleAnalyzeClaim}
                className="bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-500/25"
              >
                <Play className="w-4 h-4 mr-2 fill-current" />
                {isAnalyzed ? 'Re-Analyze with Multi-Agent Pipeline' : 'Analyze Claim with Multi-Agent Pipeline'}
              </Button>
            </div>
          </div>

          {/* Key Facts Summary Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-850/60 rounded-xl border border-slate-800/60 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400">
                <User className="w-3.5 h-3.5 text-brand-400" />
                <span>Patient</span>
              </div>
              <p className="font-semibold text-white truncate">{claim.patientName}</p>
            </div>

            <div className="p-3 bg-slate-850/60 rounded-xl border border-slate-800/60 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Building2 className="w-3.5 h-3.5 text-brand-400" />
                <span>Hospital</span>
              </div>
              <p className="font-semibold text-white truncate">{claim.hospital}</p>
            </div>

            <div className="p-3 bg-slate-850/60 rounded-xl border border-slate-800/60 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                <span>Billed Amount</span>
              </div>
              <p className="font-bold text-emerald-400 font-mono">
                ₹{claim.claimAmount?.toLocaleString()}
              </p>
            </div>

            <div className="p-3 bg-slate-850/60 rounded-xl border border-slate-800/60 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>AI Confidence</span>
              </div>
              <p className="font-semibold text-white font-mono">
                {claim.confidence ? `${Math.round(claim.confidence * 100)}%` : 'Pending'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Uploaded Documents Strip */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Attached Claim Artifacts ({documents.length})
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {documents.map((doc) => (
            <div
              key={doc._id}
              className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-brand-400 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-medium text-slate-200 truncate">
                    {doc.originalName}
                  </p>
                  <p className="text-[10px] text-brand-400 font-mono font-medium">
                    {doc.category}
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-mono shrink-0">
                {(doc.size / 1024).toFixed(0)} KB
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Primary Section: Agent Trace Timeline */}
      <div className="pt-2">
        <AgentTimeline
          executions={executions}
          isProcessing={analyzing || claim.status === 'PROCESSING'}
        />
      </div>

      {/* Primary Section: Final Decision Card */}
      <div className="pt-2">
        <DecisionCard
          decision={decision}
          status={claim.status}
          onOpenReview={() => setShowReviewModal(true)}
        />
      </div>

      {/* Grid of Agent Output Deep-Dives */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Left Column: Extracted Entities */}
        <ExtractedInfoCard
          intakeExecution={intakeExec}
          claimFallback={{
            patientName: claim.patientName,
            hospital: claim.hospital,
            diagnosis: claim.diagnosis,
            treatment: claim.treatment,
            claimAmount: claim.claimAmount,
          }}
        />

        {/* Right Column: Policy RAG Evidence */}
        <PolicyFindingsCard policyExecution={policyExec} />

        {/* Bottom Wide Column: Fraud & Consistency Flags */}
        <div className="lg:col-span-2">
          <FraudFlagsCard fraudExecution={fraudExec} />
        </div>
      </div>

      {/* Human Review Modal */}
      <HumanReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        claimId={claim._id}
        claimNumber={claim.claimNumber}
        onReviewed={fetchClaimData}
      />
    </div>
  );
};
