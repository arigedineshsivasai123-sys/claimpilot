import { Request, Response } from 'express';
import { Claim } from '../models/Claim.model';
import { Decision } from '../models/Decision.model';

export class ReviewController {
  public async reviewClaim(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { action, comment } = req.body;

      const claim = await Claim.findById(id);
      if (!claim) {
        res.status(404).json({
          success: false,
          message: 'Claim not found',
        });
        return;
      }

      const reviewerIdentity = req.user?.email || req.user?.userId || 'Authorized Medical Reviewer';

      // Update Decision
      const decision = await Decision.findOneAndUpdate(
        { claimId: claim._id },
        {
          reviewedBy: reviewerIdentity,
          reviewedAt: new Date(),
          reviewAction: action,
          reviewComment: comment,
          requiresHumanReview: false,
          recommendation: action,
        },
        { new: true, upsert: true }
      );

      // Update Claim
      claim.status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      claim.finalRecommendation = action;
      claim.requiresHumanReview = false;
      claim.notes = comment
        ? `${claim.notes ? claim.notes + ' | ' : ''}Reviewer Note: ${comment}`
        : claim.notes;
      await claim.save();

      res.status(200).json({
        success: true,
        message: `Claim successfully ${action.toLowerCase()}d by human reviewer`,
        data: {
          claim,
          decision,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to record human review adjudication',
        errors: [error.message],
      });
    }
  }
}

export const reviewController = new ReviewController();
