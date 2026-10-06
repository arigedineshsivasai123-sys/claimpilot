import { Request, Response } from 'express';
import { Claim } from '../models/Claim.model';
import { ClaimDocument } from '../models/Document.model';
import { AgentExecution } from '../models/AgentExecution.model';
import { Decision } from '../models/Decision.model';
import { claimOrchestrator } from '../orchestrator/claimOrchestrator';
import { eventStreamManager } from '../orchestrator/eventStream';

export class AnalysisController {
  public async analyzeClaim(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const claim = await Claim.findById(id);
      if (!claim) {
        res.status(404).json({
          success: false,
          message: 'Claim not found',
        });
        return;
      }

      const docsCount = await ClaimDocument.countDocuments({ claimId: id });
      if (docsCount === 0) {
        res.status(400).json({
          success: false,
          message: 'Cannot start analysis without uploaded documents',
          errors: ['Please upload at least a Hospital Bill and Insurance Policy.'],
        });
        return;
      }

      // Execute pipeline
      const pipelineResult = await claimOrchestrator.executePipeline(id);

      res.status(200).json({
        success: true,
        message: 'Claim analysis completed successfully',
        data: pipelineResult,
      });
    } catch (error: any) {
      console.error(`[AnalysisController] Error analyzing claim ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Claim analysis workflow failed',
        errors: [error.message],
      });
    }
  }

  public async getAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const [claim, decision, executions] = await Promise.all([
        Claim.findById(id),
        Decision.findOne({ claimId: id }),
        AgentExecution.find({ claimId: id }).sort({ sequence: 1 }),
      ]);

      if (!claim) {
        res.status(404).json({
          success: false,
          message: 'Claim not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          claim,
          decision,
          executions,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve claim analysis',
        errors: [error.message],
      });
    }
  }

  public async getAgentExecutions(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const executions = await AgentExecution.find({ claimId: id }).sort({ sequence: 1 });

      res.status(200).json({
        success: true,
        data: executions,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve agent executions',
        errors: [error.message],
      });
    }
  }

  public streamAgentTrace(req: Request, res: Response): void {
    const { id } = req.params;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Initial greeting ping
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', claimId: id, timestamp: new Date().toISOString() })}\n\n`);

    eventStreamManager.addClient(id, res);
  }
}

export const analysisController = new AnalysisController();
