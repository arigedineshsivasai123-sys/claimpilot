import { Request, Response } from 'express';
import { Claim } from '../models/Claim.model';
import { ClaimDocument, DocumentCategory } from '../models/Document.model';

export class DocumentController {
  public async uploadDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No files uploaded',
          errors: ['At least one document file must be selected for upload'],
        });
        return;
      }

      const claim = await Claim.findById(id);
      if (!claim) {
        res.status(404).json({
          success: false,
          message: 'Claim not found',
        });
        return;
      }

      // Default category from body or fallback
      const defaultCategory = (req.body.category as DocumentCategory) || 'OTHER';
      const categoriesFromBody = req.body.categories ? JSON.parse(req.body.categories) : {};

      const savedDocs = [];

      for (const file of files) {
        const category =
          categoriesFromBody[file.originalname] ||
          this.inferCategoryFromFilename(file.originalname) ||
          defaultCategory;

        const doc = new ClaimDocument({
          claimId: claim._id,
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          category,
          path: file.path,
          processingStatus: 'PENDING',
        });

        await doc.save();
        savedDocs.push(doc);
      }

      // If claim was in DRAFT, transition to UPLOADED
      if (claim.status === 'DRAFT') {
        claim.status = 'UPLOADED';
        await claim.save();
      }

      res.status(201).json({
        success: true,
        message: `Successfully uploaded ${savedDocs.length} document(s)`,
        data: savedDocs,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to process document upload',
        errors: [error.message],
      });
    }
  }

  public async getDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const docs = await ClaimDocument.find({ claimId: id }).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: docs,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve claim documents',
        errors: [error.message],
      });
    }
  }

  private inferCategoryFromFilename(filename: string): DocumentCategory | null {
    const lower = filename.toLowerCase();
    if (lower.includes('bill') || lower.includes('invoice') || lower.includes('receipt')) {
      return 'HOSPITAL_BILL';
    }
    if (lower.includes('discharge') || lower.includes('summary')) {
      return 'DISCHARGE_SUMMARY';
    }
    if (lower.includes('rx') || lower.includes('prescription')) {
      return 'PRESCRIPTION';
    }
    if (lower.includes('mri') || lower.includes('xray') || lower.includes('lab') || lower.includes('report') || lower.includes('scan')) {
      return 'MEDICAL_REPORT';
    }
    if (lower.includes('policy') || lower.includes('insurance') || lower.includes('terms') || lower.includes('clause')) {
      return 'INSURANCE_POLICY';
    }
    return null;
  }
}

export const documentController = new DocumentController();
