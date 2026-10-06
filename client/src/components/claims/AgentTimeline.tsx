import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Sparkles,
} from 'lucide-react';
import { AgentExecution, AgentName } from '../../types';
import { Modal } from '../common/Modal';

interface AgentTimelineProps {
  executions: AgentExecution[];
  isProcessing?: boolean;
}

const AGENT_METADATA: Record<
  AgentName,
  {
    icon: any;
    subtitle: string;
    description: string;
    color: string;
  }
> = {
  'Intake Agent': {
    icon: FileText,
    subtitle: 'Multimodal Document Extraction',
    description: 'Reads uploaded bills & clinical files, extracts line items, and maps source references.',
    color: 'from-blue-600 to-cyan-500',
  },
  'Policy Agent': {
    icon: ShieldCheck,
    subtitle: 'RAG Vector Adjudication',
    description: 'Retrieves relevant policy clauses via semantic vector similarity and evaluates eligibility.',
    color: 'from-emerald-600 to-teal-500',
  },
  'Fraud Agent': {
    icon: AlertTriangle,
    subtitle: 'Cross-Document Reconciliation',
    description: 'Detects date conflicts, duplicate charges, arithmetic errors, and diagnosis mismatches.',
    color: 'from-amber-600 to-yellow-500',
  },
  'Verifier Agent': {
    icon: Award,
    subtitle: 'Autonomous Decision Engine',
    description: 'Synthesizes multi-agent evidence, validates corporate thresholds, and triggers human review.',
    color: 'from-indigo-600 to-purple-500',
  },
};

const AGENTS_ORDER: AgentName[] = [
  'Intake Agent',
  'Policy Agent',
  'Fraud Agent',
  'Verifier Agent',
];

export const AgentTimeline: React.FC<AgentTimelineProps> = ({
  executions,
  isProcessing = false,
}) => {
  const [selectedAgent, setSelectedAgent] = useState<AgentExecution | null>(null);

  const getExecutionFor = (name: AgentName) => {
    return executions.find((e) => e.agentName === name);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-400" />
            Live Agent Execution Pipeline
          </h3>
          <p className="text-xs text-slate-400">
            Deterministic 4-stage multi-agent orchestration and verification trace
          </p>
        </div>
        {isProcessing && (
          <span className="flex items-center gap-2 text-xs font-semibold text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/30 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-ping" />
            Multi-Agent Workflow Active
          </span>
        )}
      </div>

      {/* Grid of Agent Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {AGENTS_ORDER.map((name, index) => {
          const meta = AGENT_METADATA[name];
          const exec = getExecutionFor(name);
          const Icon = meta.icon;

          // Compute state
          const status = exec?.status || (isProcessing && index === 0 ? 'RUNNING' : 'PENDING');
          const isDone = status === 'COMPLETED';
          const isWarning = status === 'WARNING';
          const isRunning = status === 'RUNNING';
          const isFailed = status === 'FAILED';
          const isPending = status === 'PENDING';

          return (
            <div
              key={name}
              onClick={() => exec && setSelectedAgent(exec)}
              className={`relative bg-slate-900 border rounded-2xl p-4 flex flex-col justify-between transition-all ${
                isRunning
                  ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-lg shadow-brand-500/10 scale-[1.02]'
                  : isWarning
                  ? 'border-amber-500/60 bg-amber-500/[0.02]'
                  : isDone
                  ? 'border-emerald-500/40 bg-emerald-500/[0.01]'
                  : isFailed
                  ? 'border-rose-500/50'
                  : 'border-slate-800 opacity-70'
              } ${exec ? 'cursor-pointer hover:border-slate-600' : ''}`}
            >
              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-white bg-gradient-to-tr ${meta.color} shadow-sm`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Status Indicator */}
                  {isRunning && (
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-400 bg-sky-500/15 px-2 py-0.5 rounded-full border border-sky-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                      Running
                    </span>
                  )}
                  {isDone && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Done
                    </span>
                  )}
                  {isWarning && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Findings
                    </span>
                  )}
                  {isFailed && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded-full border border-rose-500/30">
                      <XCircle className="w-3.5 h-3.5" />
                      Failed
                    </span>
                  )}
                  {isPending && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-slate-500 font-mono">0{index + 1}</span>
                  <h4 className="text-sm font-bold text-white tracking-tight">{name}</h4>
                </div>
                <p className="text-[11px] font-medium text-brand-400/90 mt-0.5">{meta.subtitle}</p>

                {/* Summary / Result Text */}
                <div className="mt-3 min-h-[44px]">
                  {exec?.summary ? (
                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                      {exec.summary}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      {isRunning ? 'Analyzing claim artifacts...' : meta.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  {exec?.durationMs ? `${(exec.durationMs / 1000).toFixed(2)}s` : isRunning ? 'In progress...' : '—'}
                </span>
                {exec && (
                  <span className="flex items-center gap-1 text-brand-400 font-medium hover:underline">
                    <Eye className="w-3.5 h-3.5" />
                    Inspect
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Agent Inspector Modal */}
      {selectedAgent && (
        <Modal
          isOpen={Boolean(selectedAgent)}
          onClose={() => setSelectedAgent(null)}
          title={`${selectedAgent.agentName} — Execution Inspector`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-850 rounded-xl border border-slate-800">
              <div>
                <span className="text-xs text-slate-400">Execution Status</span>
                <p className="text-sm font-semibold text-white">{selectedAgent.status}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400">Processing Latency</span>
                <p className="text-sm font-semibold text-brand-400">
                  {selectedAgent.durationMs ? `${selectedAgent.durationMs} ms` : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400">Timestamp</span>
                <p className="text-xs text-slate-300">
                  {new Date(selectedAgent.startedAt).toLocaleTimeString()}
                </p>
              </div>
            </div>

            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Executive Action Summary
              </h5>
              <p className="text-sm text-slate-200 bg-slate-850 p-3 rounded-xl border border-slate-800">
                {selectedAgent.summary}
              </p>
            </div>

            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Structured Output Payload
              </h5>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 max-h-72 overflow-y-auto">
                <pre>{JSON.stringify(selectedAgent.output, null, 2)}</pre>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
