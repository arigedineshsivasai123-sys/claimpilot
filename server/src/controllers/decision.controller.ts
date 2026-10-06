import { Request, Response } from 'express';
import { Decision } from '../models/Decision.model';

export class DecisionController {
  public async getDecision(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const decision = await Decision.findOne({ claimId: id });

      if (!decision) {
        res.status(404).json({
          success: false,
          message: 'Decision not yet generated for this claim',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: decision,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Could not fetch decision',
        errors: [error.message],
      });
    }
  }
}

export const decisionController = new DecisionController();
