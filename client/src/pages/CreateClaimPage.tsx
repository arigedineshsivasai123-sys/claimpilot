import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { claimService } from '../services/claim.service';
import { FileUploader, FileWithCategory } from '../components/claims/FileUploader';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { ArrowLeft, Sparkles, UploadCloud, Play, CheckCircle2 } from 'lucide-react';

export const CreateClaimPage: React.FC = () => {
  const [claimNumber, setClaimNumber] = useState(
    `CLM-${Math.floor(10000 + Math.random() * 90000)}`
  );
  const [patientName, setPatientName] = useState('');
  const [hospital, setHospital] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [claimAmount, setClaimAmount] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileWithCategory[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const hasHospitalBill = selectedFiles.some((f) => f.category === 'HOSPITAL_BILL');
  const hasPolicy = selectedFiles.some((f) => f.category === 'INSURANCE_POLICY');
  const canProceed = selectedFiles.length > 0 && hasHospitalBill && hasPolicy;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canProceed) {
      setError(
        'Both a Hospital Bill and an Insurance Policy document are required to begin multi-agent analysis.'
      );
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // 1. Create Claim Record
      const createdClaim = await claimService.createClaim({
        claimNumber,
        patientName: patientName.trim() || undefined,
        hospital: hospital.trim() || undefined,
        diagnosis: diagnosis.trim() || undefined,
        treatment: treatment.trim() || undefined,
        claimAmount: claimAmount !== '' ? Number(claimAmount) : undefined,
        notes: notes.trim() || undefined,
      });

      // 2. Upload Files via FormData
      const formData = new FormData();
      const categoryMap: Record<string, string> = {};

      selectedFiles.forEach((item) => {
        formData.append('files', item.file);
        categoryMap[item.file.name] = item.category;
      });
      formData.append('categories', JSON.stringify(categoryMap));

      await claimService.uploadDocuments(createdClaim._id, formData);

      // 3. Navigate directly to the Claim Details / Agent Trace view
      navigate(`/claims/${createdClaim._id}`);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to initialize claim and upload documents'
      );
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Create & Upload New Health Claim
        </h2>
        <p className="text-xs text-slate-400">
          Provide preliminary metadata and attach hospital billing and policy documents
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Preliminary Metadata Card */}
        <Card className="space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h4 className="text-sm font-bold text-white">1. Claim Information (Optional)</h4>
            <p className="text-xs text-slate-400">
              You can leave these blank; the Intake Agent will extract them automatically from your documents.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Claim Identifier</label>
              <input
                type="text"
                value={claimNumber}
                onChange={(e) => setClaimNumber(e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Total Billed Amount (₹)</label>
              <input
                type="number"
                value={claimAmount}
                onChange={(e) =>
                  setClaimAmount(e.target.value ? parseFloat(e.target.value) : '')
                }
                placeholder="e.g. 118000"
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Patient Name</label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Optional (Intake Agent auto-detects)"
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Hospital / Provider</label>
              <input
                type="text"
                value={hospital}
                onChange={(e) => setHospital(e.target.value)}
                placeholder="Optional (Intake Agent auto-detects)"
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-slate-300">Auditor Notes / Context</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special handling instructions or reviewer remarks..."
                rows={2}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </Card>

        {/* Document Upload Card */}
        <Card className="space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h4 className="text-sm font-bold text-white">2. Upload Claim Documents</h4>
            <p className="text-xs text-slate-400">
              Attach medical bills, discharge notes, and policy document.
            </p>
          </div>

          <FileUploader
            onFilesSelected={(files) => setSelectedFiles(files)}
            disabled={uploading}
          />
        </Card>

        {/* Validation Banner & CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="text-xs text-slate-400">
            {!hasHospitalBill || !hasPolicy ? (
              <span className="text-amber-400 font-medium">
                ⚠️ Upload at least 1 Hospital Bill and 1 Insurance Policy to proceed.
              </span>
            ) : (
              <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Required documents verified. Ready for multi-agent ingestion.
              </span>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={uploading}
            disabled={!canProceed || uploading}
          >
            Create Claim & Enter Trace
            <Play className="w-4 h-4 ml-2 fill-current" />
          </Button>
        </div>
      </form>
    </div>
  );
};
