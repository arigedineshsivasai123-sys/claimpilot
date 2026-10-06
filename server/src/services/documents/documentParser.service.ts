import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

export interface ParsedDocument {
  text: string;
  pageCount: number;
  wordCount: number;
  mimeType: string;
  sourceFilename: string;
}

export class DocumentParserService {
  /**
   * Extracts text from uploaded files (PDF, image, text)
   */
  public async parseFile(filePath: string, mimeType: string, originalName: string): Promise<ParsedDocument> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found on server: ${filePath}`);
    }

    const ext = path.extname(filePath).toLowerCase();

    // 1. Text / Markdown / JSON
    if (mimeType.includes('text') || ext === '.txt' || ext === '.md' || ext === '.json') {
      const content = fs.readFileSync(filePath, 'utf-8');
      return {
        text: content,
        pageCount: 1,
        wordCount: content.split(/\s+/).length,
        mimeType,
        sourceFilename: originalName,
      };
    }

    // 2. PDF Documents
    if (mimeType === 'application/pdf' || ext === '.pdf') {
      try {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);
        return {
          text: pdfData.text || '',
          pageCount: pdfData.numpages || 1,
          wordCount: (pdfData.text || '').split(/\s+/).length,
          mimeType: 'application/pdf',
          sourceFilename: originalName,
        };
      } catch (err: any) {
        console.warn(`[DocumentParser] pdf-parse failed for ${originalName} (${err.message}). Reading as text fallback.`);
        const fallback = fs.readFileSync(filePath, 'utf-8');
        return {
          text: fallback,
          pageCount: 1,
          wordCount: fallback.split(/\s+/).length,
          mimeType: 'application/pdf',
          sourceFilename: originalName,
        };
      }
    }

    // 3. Images (JPEG, PNG)
    if (mimeType.startsWith('image/')) {
      const buffer = fs.readFileSync(filePath);
      const base64 = buffer.toString('base64');
      return {
        text: `[Image Document: ${originalName} - Base64 Length: ${base64.length}]`,
        pageCount: 1,
        wordCount: 10,
        mimeType,
        sourceFilename: originalName,
      };
    }

    // Default raw read
    const raw = fs.readFileSync(filePath, 'utf-8');
    return {
      text: raw,
      pageCount: 1,
      wordCount: raw.split(/\s+/).length,
      mimeType,
      sourceFilename: originalName,
    };
  }
}

export const documentParserService = new DocumentParserService();
