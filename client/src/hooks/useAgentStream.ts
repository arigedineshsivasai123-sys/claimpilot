import { useState, useEffect } from 'react';
import { AgentExecution } from '../types';

interface StreamEventPayload {
  claimId: string;
  agentName: string;
  sequence: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'WARNING' | 'FAILED';
  summary: string;
  durationMs?: number;
  output?: any;
  evidence?: any[];
  timestamp: string;
}

export const useAgentStream = (claimId?: string, isProcessing?: boolean) => {
  const [streamEvents, setStreamEvents] = useState<AgentExecution[]>([]);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);

  useEffect(() => {
    if (!claimId || !isProcessing) return;

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const eventSource = new EventSource(`${API_BASE_URL}/claims/${claimId}/trace/stream`);

    eventSource.onmessage = (event) => {
      try {
        const data: StreamEventPayload = JSON.parse(event.data);
        if (!data.agentName) return;

        setActiveAgent(data.status === 'RUNNING' ? data.agentName : null);

        setStreamEvents((prev) => {
          const existingIndex = prev.findIndex((e) => e.sequence === data.sequence);
          const updatedItem: AgentExecution = {
            _id: `temp-${data.sequence}`,
            claimId: data.claimId,
            agentName: data.agentName as any,
            status: data.status,
            sequence: data.sequence,
            summary: data.summary,
            output: data.output || {},
            evidence: data.evidence || [],
            startedAt: data.timestamp,
            durationMs: data.durationMs || 0,
          };

          if (existingIndex >= 0) {
            const next = [...prev];
            next[existingIndex] = updatedItem;
            return next;
          } else {
            return [...prev, updatedItem].sort((a, b) => a.sequence - b.sequence);
          }
        });
      } catch (err) {
        console.warn('[useAgentStream] Failed to parse SSE event:', err);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [claimId, isProcessing]);

  return { streamEvents, activeAgent, setStreamEvents };
};
