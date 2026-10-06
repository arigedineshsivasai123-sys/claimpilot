import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { claimService } from '../../services/claim.service';

interface HumanReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimId: string;
  claimNumber: string;
  onReviewed: () => void;
}

export const HumanReviewModal: React.FC<HumanReviewModalProps> = ({
  isOpen,
  onClose,
  claimId,
  claimNumber,
  onReviewed,
}) => {
  const [action, setAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await claimService.submitReview(claimId, {
        action,
        comment: comment.trim() || undefined,
      });
      onReviewed();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Human Review Adjudication — ${claimNumber}`}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200">
          <p className="font-semibold">Authoritative Human Review Escalation</p>
          <p className="mt-0.5 text-slate-300">
            As an authorized reviewer, you are certifying the final disposition of this claim. Your decision and comments will be permanently logged in the audit trail.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Action Choice */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Adjudication Decision
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAction('APPROVE')}
              className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition ${
                action === 'APPROVE'
                  ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 font-bold shadow-lg shadow-emerald-500/10'
                  : 'border-slate-800 bg-slate-850 text-slate-400 hover:border-slate-700'
              }`}
            >
              <CheckCircle2 className="w-6 h-6" />
              <span className="text-sm">Approve Claim</span>
            </button>

            <button
              type="button"
              onClick={() => setAction('REJECT')}
              className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition ${
                action === 'REJECT'
                  ? 'border-rose-500 bg-rose-500/15 text-rose-400 font-bold shadow-lg shadow-rose-500/10'
                  : 'border-slate-800 bg-slate-850 text-slate-400 hover:border-slate-700'
              }`}
            >
              <XCircle className="w-6 h-6" />
              <span className="text-sm">Reject Claim</span>
            </button>
          </div>
        </div>

        {/* Audit Comment */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Adjudicator Rationale / Auditor Notes (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="e.g. Cross-verified with treating surgeon, verified that procedure was medically necessary emergency repair..."
            rows={4}
            className="w-full bg-slate-850 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={action === 'APPROVE' ? 'success' : 'danger'}
            loading={loading}
          >
            Confirm & Save Adjudication
          </Button>
        </div>
      </form>
    </Modal>
  );
};
