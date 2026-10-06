import { Response } from 'express';

export interface AgentEventPayload {
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

class EventStreamManager {
  private clients: Map<string, Set<Response>> = new Map();

  public addClient(claimId: string, res: Response): void {
    if (!this.clients.has(claimId)) {
      this.clients.set(claimId, new Set());
    }
    this.clients.get(claimId)!.add(res);

    // Remove client upon connection close
    res.on('close', () => {
      this.removeClient(claimId, res);
    });
  }

  public removeClient(claimId: string, res: Response): void {
    const claimClients = this.clients.get(claimId);
    if (claimClients) {
      claimClients.delete(res);
      if (claimClients.size === 0) {
        this.clients.delete(claimId);
      }
    }
  }

  public emitAgentUpdate(claimId: string, payload: AgentEventPayload): void {
    const claimClients = this.clients.get(claimId);
    if (!claimClients || claimClients.size === 0) return;

    const data = `data: ${JSON.stringify(payload)}\n\n`;
    for (const client of claimClients) {
      try {
        client.write(data);
      } catch (err) {
        console.warn(`[EventStream] Error sending to client for claim ${claimId}:`, err);
      }
    }
  }
}

export const eventStreamManager = new EventStreamManager();
