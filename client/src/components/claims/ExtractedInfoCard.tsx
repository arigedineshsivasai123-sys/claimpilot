import React from 'react';
import { Card } from '../common/Card';
import { User, Building2, Calendar, Stethoscope, Receipt, FileCheck } from 'lucide-react';
import { AgentExecution } from '../../types';

interface ExtractedInfoCardProps {
  intakeExecution?: AgentExecution;
  claimFallback: {
    patientName: string;
    hospital: string;
    diagnosis: string;
    treatment: string;
    claimAmount: number;
  };
}

export const ExtractedInfoCard: React.FC<ExtractedInfoCardProps> = ({
  intakeExecution,
  claimFallback,
}) => {
  const data = intakeExecution?.output || {};

  const patientName = data.patientName || claimFallback.patientName;
  const hospital = data.hospital || claimFallback.hospital;
  const diagnosis = data.diagnosis || claimFallback.diagnosis;
  const treatment = data.treatment || claimFallback.treatment;
  const totalAmount = data.totalAmount || claimFallback.claimAmount;
  const admissionDate = data.admissionDate || 'N/A';
  const dischargeDate = data.dischargeDate || 'N/A';
  const lineItems: any[] = data.lineItems || [];
  const sources: string[] = data.sourceReferences || [];

  return (
    <Card className="space-y-5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
            <FileCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Extracted Claim Entity Record</h4>
            <p className="text-xs text-slate-400">Intake Agent structured document extraction</p>
          </div>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Sources: {sources.length > 0 ? sources.join(', ') : 'Direct upload'}
        </span>
      </div>

      {/* Grid of entities */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-3 bg-slate-850 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <User className="w-3.5 h-3.5 text-blue-400" />
            <span>Patient Name</span>
          </div>
          <p className="text-sm font-semibold text-white">{patientName}</p>
        </div>

        <div className="p-3 bg-slate-850 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Hospital / Provider</span>
          </div>
          <p className="text-sm font-semibold text-white truncate">{hospital}</p>
        </div>

        <div className="p-3 bg-slate-850 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>Stay Duration</span>
          </div>
          <p className="text-sm font-semibold text-white">
            {admissionDate} <span className="text-slate-500">to</span> {dischargeDate}
          </p>
        </div>

        <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 sm:col-span-2">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Stethoscope className="w-3.5 h-3.5 text-blue-400" />
            <span>Clinical Diagnosis & Procedure</span>
          </div>
          <p className="text-sm font-semibold text-white">{diagnosis}</p>
          <p className="text-xs text-slate-400 mt-0.5">Procedure: {treatment}</p>
        </div>

        <div className="p-3 bg-slate-850 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Receipt className="w-3.5 h-3.5 text-emerald-400" />
            <span>Total Claimed Amount</span>
          </div>
          <p className="text-base font-bold text-emerald-400">
            ₹{totalAmount?.toLocaleString() || '0'}
          </p>
        </div>
      </div>

      {/* Line Items Table */}
      {lineItems.length > 0 && (
        <div className="space-y-2 pt-2">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Itemized Hospital Invoices ({lineItems.length} lines)
          </h5>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-850 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-3.5 py-2.5 font-medium">Category</th>
                  <th className="px-3.5 py-2.5 font-medium">Description</th>
                  <th className="px-3.5 py-2.5 font-medium">Source Document</th>
                  <th className="px-3.5 py-2.5 font-medium text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/60 font-mono">
                {lineItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="px-3.5 py-2 text-brand-300">{item.category}</td>
                    <td className="px-3.5 py-2 font-sans font-medium text-slate-200">
                      {item.description}
                    </td>
                    <td className="px-3.5 py-2 text-slate-400 truncate max-w-[140px]">
                      {item.source || 'hospital_bill.pdf'}
                    </td>
                    <td className="px-3.5 py-2 text-right font-semibold text-white">
                      ₹{item.amount?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
};
