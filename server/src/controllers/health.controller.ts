import { Request, Response } from 'express';
import { getDbStatus } from '../config/database';
import { config, hasGeminiKey } from '../config/env.config';

export class HealthController {
  public checkHealth(_req: Request, res: Response): void {
    const dbStatus = getDbStatus();
    res.status(200).json({
      success: true,
      service: 'ClaimPilot API',
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      database: dbStatus,
      geminiConfigured: hasGeminiKey(),
      thresholds: {
        aiConfidenceThreshold: config.aiConfidenceThreshold,
        highValueClaimThreshold: config.highValueClaimThreshold,
      },
    });
  }
}

export const healthController = new HealthController();
