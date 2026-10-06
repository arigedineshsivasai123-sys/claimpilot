import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { Claim } from '../models/Claim.model';
import { ClaimDocument } from '../models/Document.model';
import { DEMO_PRESETS, DemoPreset } from '../demo/sampleData';
import { config } from '../config/env.config';

export class DemoController {
  public getPresets(_req: Request, res: Response): void {
    res.status(200).json({
      success: true,
      data: DEMO_PRESETS.map((p) => ({
        id: p.id,
        name: p.name,
        expectedResult: p.expectedResult,
        description: p.description,
        patientName: p.patientName,
        hospital: p.hospital,
        diagnosis: p.diagnosis,
        treatment: p.treatment,
        claimAmount: p.claimAmount,
        documentCount: p.documents.length,
      })),
    });
  }

  public async seedPresetClaim(req: Request, res: Response): Promise<void> {
    try {
      const presetId = req.body.presetId || 'valid-claim';
      const preset: DemoPreset | undefined = DEMO_PRESETS.find((p) => p.id === presetId);

      if (!preset) {
        res.status(404).json({
          success: false,
          message: `Unknown demo preset: ${presetId}`,
        });
        return;
      }

      // Generate unique claim number
      const randomSuffix = Math.floor(10000 + Math.random() * 90000);
      const claimNumber = `CLM-DEMO-${randomSuffix}`;

      const claim = new Claim({
        claimNumber,
        userId: req.user?.userId ? new mongoose.Types.ObjectId(req.user.userId) : undefined,
        patientName: preset.patientName,
        hospital: preset.hospital,
        diagnosis: preset.diagnosis,
        treatment: preset.treatment,
        claimAmount: preset.claimAmount,
        status: 'UPLOADED',
        isDemo: true,
        notes: `Synthetic Demo Preset: ${preset.name} (${preset.expectedResult})`,
      });
      await claim.save();

      // Write synthetic files to disk and create ClaimDocument records
      if (!fs.existsSync(config.uploadDir)) {
        fs.mkdirSync(config.uploadDir, { recursive: true });
      }

      const savedDocs = [];
      for (const d of preset.documents) {
        const filePath = path.join(config.uploadDir, `${claimNumber}-${d.filename}`);
        fs.writeFileSync(filePath, d.text, 'utf-8');

        const doc = new ClaimDocument({
          claimId: claim._id,
          filename: `${claimNumber}-${d.filename}`,
          originalName: d.filename,
          mimeType: 'text/plain',
          size: Buffer.byteLength(d.text, 'utf-8'),
          category: d.category,
          path: filePath,
          extractedText: d.text,
          processingStatus: 'PROCESSED',
        });
        await doc.save();
        savedDocs.push(doc);
      }

      res.status(201).json({
        success: true,
        message: `Successfully seeded ${preset.name}`,
        data: {
          claim,
          documents: savedDocs,
          preset: {
            id: preset.id,
            name: preset.name,
            expectedResult: preset.expectedResult,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to seed synthetic demo claim',
        errors: [error.message],
      });
    }
  }
}

export const demoController = new DemoController();
