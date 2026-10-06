import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Claim } from '../models/Claim.model';
import { ClaimDocument } from '../models/Document.model';
import { AgentExecution } from '../models/AgentExecution.model';
import { Decision } from '../models/Decision.model';

export class ClaimController {
  public async createClaim(req: Request, res: Response): Promise<void> {
    try {
      const {
        claimNumber,
        patientName,
        hospital,
        diagnosis,
        treatment,
        claimAmount,
        notes,
        isDemo,
        demoType,
      } = req.body;

      const generatedClaimNumber =
        claimNumber || `CLM-${Math.floor(10000 + Math.random() * 90000)}`;

      const claim = new Claim({
        claimNumber: generatedClaimNumber,
        userId: req.user?.userId ? new mongoose.Types.ObjectId(req.user.userId) : undefined,
        patientName: patientName || 'Pending Extraction',
        hospital: hospital || 'Pending Extraction',
        diagnosis: diagnosis || 'Pending Extraction',
        treatment: treatment || 'Pending Extraction',
        claimAmount: claimAmount || 0,
        status: 'DRAFT',
        notes,
        isDemo: Boolean(isDemo),
        demoType,
      });

      await claim.save();

      res.status(201).json({
        success: true,
        message: 'Claim created successfully',
        data: claim,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to create claim record',
        errors: [error.message],
      });
    }
  }

  public async getClaims(req: Request, res: Response): Promise<void> {
    try {
      const { status, search, limit = '50', page = '1' } = req.query;

      const filter: Record<string, any> = {};

      if (status && typeof status === 'string' && status !== 'ALL') {
        filter.status = status;
      }

      if (search && typeof search === 'string') {
        const regex = new RegExp(search, 'i');
        filter.$or = [
          { claimNumber: regex },
          { patientName: regex },
          { hospital: regex },
          { diagnosis: regex },
        ];
      }

      const parsedLimit = parseInt(limit as string, 10);
      const parsedPage = parseInt(page as string, 10);
      const skip = (parsedPage - 1) * parsedLimit;

      const [claims, total] = await Promise.all([
        Claim.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parsedLimit)
          .lean(),
        Claim.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        data: {
          claims,
          total,
          page: parsedPage,
          totalPages: Math.ceil(total / parsedLimit) || 1,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve claims',
        errors: [error.message],
      });
    }
  }

  public async getClaimById(req: Request, res: Response): Promise<void> {
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

      const [documents, decision, executions] = await Promise.all([
        ClaimDocument.find({ claimId: claim._id }).sort({ createdAt: 1 }),
        Decision.findOne({ claimId: claim._id }),
        AgentExecution.find({ claimId: claim._id }).sort({ sequence: 1 }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          claim,
          documents,
          decision,
          executions,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error fetching claim details',
        errors: [error.message],
      });
    }
  }

  public async deleteClaim(req: Request, res: Response): Promise<void> {
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

      await Promise.all([
        Claim.findByIdAndDelete(id),
        ClaimDocument.deleteMany({ claimId: id }),
        AgentExecution.deleteMany({ claimId: id }),
        Decision.deleteMany({ claimId: id }),
      ]);

      res.status(200).json({
        success: true,
        message: 'Claim and associated records deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete claim',
        errors: [error.message],
      });
    }
  }

  public async getAnalyticsStats(_req: Request, res: Response): Promise<void> {
    try {
      const allClaims = await Claim.find().lean();

      const totalClaims = allClaims.length;
      const approvedCount = allClaims.filter((c) => c.status === 'APPROVED').length;
      const rejectedCount = allClaims.filter((c) => c.status === 'REJECTED').length;
      const escalatedCount = allClaims.filter((c) => c.status === 'ESCALATED').length;
      const processingCount = allClaims.filter((c) => c.status === 'PROCESSING').length;
      const draftCount = allClaims.filter((c) => c.status === 'DRAFT' || c.status === 'UPLOADED').length;

      const claimsWithConfidence = allClaims.filter((c) => c.confidence > 0);
      const avgConfidence = claimsWithConfidence.length
        ? Math.round(
            (claimsWithConfidence.reduce((sum, c) => sum + c.confidence, 0) /
              claimsWithConfidence.length) *
              100
          )
        : 88;

      const humanReviewRate = totalClaims > 0
        ? Math.round((escalatedCount / totalClaims) * 100)
        : 0;

      const totalAmount = allClaims.reduce((sum, c) => sum + (c.claimAmount || 0), 0);

      // Average processing time from AgentExecutions
      const executions = await AgentExecution.find({ durationMs: { $gt: 0 } }).lean();
      const avgDurationSec = executions.length
        ? Math.round(
            executions.reduce((sum, e) => sum + (e.durationMs || 0), 0) /
              executions.length /
              1000
          )
        : 3.8;

      res.status(200).json({
        success: true,
        data: {
          totalClaims,
          approvedCount,
          rejectedCount,
          escalatedCount,
          processingCount,
          draftCount,
          avgConfidence,
          humanReviewRate,
          totalAmount,
          avgDurationSec,
          recentClaims: allClaims.slice(0, 5),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Could not calculate analytics statistics',
        errors: [error.message],
      });
    }
  }
}

export const claimController = new ClaimController();
