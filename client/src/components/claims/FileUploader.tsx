import React, { useState, useRef } from 'react';
import { UploadCloud, File, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { DocumentCategory } from '../../types';
import { Button } from '../common/Button';

export interface FileWithCategory {
  file: File;
  category: DocumentCategory;
}

interface FileUploaderProps {
  onFilesSelected: (files: FileWithCategory[]) => void;
  disabled?: boolean;
}

const CATEGORY_OPTIONS: { label: string; value: DocumentCategory }[] = [
  { label: 'Hospital Bill / Tax Invoice', value: 'HOSPITAL_BILL' },
  { label: 'Discharge Summary', value: 'DISCHARGE_SUMMARY' },
  { label: 'Doctor Prescription (Rx)', value: 'PRESCRIPTION' },
  { label: 'Medical / Diagnostic Report', value: 'MEDICAL_REPORT' },
  { label: 'Insurance Policy Terms', value: 'INSURANCE_POLICY' },
  { label: 'Other Claim Document', value: 'OTHER' },
];

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesSelected,
  disabled = false,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<FileWithCategory[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inferCategory = (name: string): DocumentCategory => {
    const l = name.toLowerCase();
    if (l.includes('bill') || l.includes('invoice') || l.includes('receipt')) return 'HOSPITAL_BILL';
    if (l.includes('discharge') || l.includes('summary')) return 'DISCHARGE_SUMMARY';
    if (l.includes('rx') || l.includes('prescrip')) return 'PRESCRIPTION';
    if (l.includes('report') || l.includes('mri') || l.includes('xray') || l.includes('lab')) return 'MEDICAL_REPORT';
    if (l.includes('policy') || l.includes('insurance')) return 'INSURANCE_POLICY';
    return 'OTHER';
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles: FileWithCategory[] = [];

    Array.from(files).forEach((file) => {
      // Check 15MB limit
      if (file.size > 15 * 1024 * 1024) {
        alert(`File ${file.name} is larger than the 15MB limit.`);
        return;
      }
      newFiles.push({
        file,
        category: inferCategory(file.name),
      });
    });

    const updated = [...selectedFiles, ...newFiles];
    setSelectedFiles(updated);
    onFilesSelected(updated);
  };

  const removeFile = (index: number) => {
    const updated = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updated);
    onFilesSelected(updated);
  };

  const updateCategory = (index: number, category: DocumentCategory) => {
    const updated = [...selectedFiles];
    updated[index].category = category;
    setSelectedFiles(updated);
    onFilesSelected(updated);
  };

  const hasBill = selectedFiles.some((f) => f.category === 'HOSPITAL_BILL');
  const hasPolicy = selectedFiles.some((f) => f.category === 'INSURANCE_POLICY');

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
          isDragging
            ? 'border-brand-500 bg-brand-500/10'
            : 'border-slate-700 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-900'
        } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.txt"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/20">
          <UploadCloud className="w-7 h-7" />
        </div>

        <div>
          <p className="text-base font-semibold text-white">
            Click to upload or drag & drop claim files
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Supported formats: PDF, PNG, JPG, JPEG, TXT (Up to 15MB each)
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mt-1 text-[11px] text-slate-400">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800">
            {hasBill ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            )}
            Hospital Bill (Required)
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800">
            {hasPolicy ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            )}
            Insurance Policy (Required)
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800">Discharge Summary</span>
          <span className="px-2 py-0.5 rounded bg-slate-800">Prescription / Lab</span>
        </div>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Files to Upload ({selectedFiles.length})
          </h4>
          <div className="space-y-2">
            {selectedFiles.map((item, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-850 border border-slate-800 rounded-xl"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 text-brand-400 flex items-center justify-center shrink-0">
                    <File className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium text-slate-200 truncate">
                      {item.file.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {(item.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <select
                    value={item.category}
                    onChange={(e) =>
                      updateCategory(index, e.target.value as DocumentCategory)
                    }
                    className="text-xs bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-brand-500"
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
