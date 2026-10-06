import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { claimService } from '../services/claim.service';
import { Claim, ClaimStatus } from '../types';
import { ClaimStatusBadge } from '../components/claims/ClaimStatusBadge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Card } from '../components/common/Card';
import { PlusCircle, Search, Filter, Trash2, ArrowUpRight } from 'lucide-react';

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Escalated', value: 'ESCALATED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Uploaded', value: 'UPLOADED' },
  { label: 'Draft', value: 'DRAFT' },
];

export const ClaimsListPage: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const data = await claimService.getClaims({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: search.trim() || undefined,
      });
      setClaims(data.claims);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to load claims list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchClaims();
  };

  const handleDeleteClaim = async (id: string, claimNumber: string) => {
    if (!window.confirm(`Are you sure you want to delete claim ${claimNumber}?`)) {
      return;
    }
    try {
      await claimService.deleteClaim(id);
      fetchClaims();
    } catch (err) {
      alert('Failed to delete claim');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Health Insurance Claims Portfolio
          </h2>
          <p className="text-xs text-slate-400">
            Audit, track, and adjudicate incoming provider claim bundles ({total} total)
          </p>
        </div>
        <Link to="/claims/new">
          <Button variant="primary" size="md">
            <PlusCircle className="w-4 h-4 mr-2" />
            Create Claim
          </Button>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-2xl">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search claim ID, patient, hospital..."
            className="w-full bg-slate-850 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                statusFilter === f.value
                  ? 'bg-brand-500 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Claims Table */}
      {loading ? (
        <LoadingSpinner text="Retrieving claims..." />
      ) : claims.length === 0 ? (
        <Card className="text-center py-12 space-y-3">
          <p className="text-sm text-slate-400">No claims match the specified criteria.</p>
          <Link to="/claims/new">
            <Button variant="outline" size="sm">
              Create a new claim
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-850 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5 font-semibold">Claim ID</th>
                <th className="px-4 py-3.5 font-semibold">Patient Name</th>
                <th className="px-4 py-3.5 font-semibold">Hospital</th>
                <th className="px-4 py-3.5 font-semibold">Diagnosis & Treatment</th>
                <th className="px-4 py-3.5 font-semibold text-right">Amount (₹)</th>
                <th className="px-4 py-3.5 font-semibold text-center">Status</th>
                <th className="px-4 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {claims.map((claim) => (
                <tr key={claim._id} className="hover:bg-slate-800/30 transition">
                  <td className="px-4 py-3.5 font-bold text-brand-400">
                    <Link
                      to={`/claims/${claim._id}`}
                      className="hover:underline flex items-center gap-1"
                    >
                      {claim.claimNumber}
                      <ArrowUpRight className="w-3 h-3 text-slate-500" />
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 font-sans font-medium text-white">
                    {claim.patientName}
                  </td>
                  <td className="px-4 py-3.5 font-sans text-slate-300 truncate max-w-[150px]">
                    {claim.hospital}
                  </td>
                  <td className="px-4 py-3.5 font-sans text-slate-300 truncate max-w-[200px]">
                    <div className="font-medium text-slate-200">{claim.diagnosis}</div>
                    <div className="text-[11px] text-slate-500">{claim.treatment}</div>
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-white">
                    ₹{claim.claimAmount?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <ClaimStatusBadge
                      status={claim.status}
                      recommendation={claim.finalRecommendation}
                      size="sm"
                    />
                  </td>
                  <td className="px-4 py-3.5 text-right font-sans">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/claims/${claim._id}`}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-brand-400 font-semibold text-xs transition"
                      >
                        Inspect
                      </Link>
                      <button
                        onClick={() => handleDeleteClaim(claim._id, claim.claimNumber)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition"
                        title="Delete Claim"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
