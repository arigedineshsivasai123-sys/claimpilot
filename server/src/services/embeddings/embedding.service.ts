import { PolicyChunk, IPolicyChunk } from '../../models/PolicyChunk.model';
import { geminiService } from '../gemini/gemini.service';
import mongoose from 'mongoose';

export interface ChunkDraft {
  clauseNumber: string;
  pageNumber: number;
  text: string;
  metadata?: Record<string, any>;
}

export class EmbeddingService {
  /**
   * Splits policy text into logical clauses / sections
   */
  public chunkPolicyText(text: string, defaultPolicyId = 'standard-health-policy-2026'): ChunkDraft[] {
    const chunks: ChunkDraft[] = [];
    const lines = text.split('\n');
    let currentClause = 'General Provisions';
    let currentPage = 1;
    let currentBuffer: string[] = [];

    // Regex to detect Clause / Section headings: e.g. "Clause 4.2", "Section 3", "4.1 Exclusion", "Article 2"
    const clauseRegex = /^(?:clause|section|article|part)\s*([0-9]+(?:\.[0-9]+)*)[:.-]?\s*(.*)/i;
    const numberedRegex = /^([0-9]+\.[0-9]+(?:\.[0-9]+)?)\s+([A-Z].*)/;
    const pageRegex = /page\s*([0-9]+)/i;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      const pageMatch = line.match(pageRegex);
      if (pageMatch) {
        currentPage = parseInt(pageMatch[1], 10) || currentPage;
      }

      const match = line.match(clauseRegex) || line.match(numberedRegex);
      if (match) {
        // Save current chunk if we have accumulated enough text
        if (currentBuffer.length > 0) {
          const chunkText = currentBuffer.join('\n');
          if (chunkText.length > 40) {
            chunks.push({
              clauseNumber: currentClause,
              pageNumber: currentPage,
              text: chunkText,
              metadata: { policyId: defaultPolicyId },
            });
          }
          currentBuffer = [];
        }
        currentClause = `Clause ${match[1]}: ${match[2] || ''}`.trim();
        currentBuffer.push(line);
      } else {
        currentBuffer.push(line);
        // If current buffer gets very long (> 1200 characters), flush it
        if (currentBuffer.join('\n').length > 1200) {
          chunks.push({
            clauseNumber: currentClause,
            pageNumber: currentPage,
            text: currentBuffer.join('\n'),
            metadata: { policyId: defaultPolicyId },
          });
          currentBuffer = [];
        }
      }
    }

    if (currentBuffer.length > 0) {
      chunks.push({
        clauseNumber: currentClause,
        pageNumber: currentPage,
        text: currentBuffer.join('\n'),
        metadata: { policyId: defaultPolicyId },
      });
    }

    return chunks;
  }

  /**
   * Chunks, embeds, and stores policy sections in MongoDB
   */
  public async indexPolicyDocument(
    policyText: string,
    policyId: string = 'standard-health-policy-2026',
    claimId?: string
  ): Promise<IPolicyChunk[]> {
    // 1. Check if chunks already exist for this policyId or claimId to avoid redundant re-embedding
    const existingFilter: any = claimId
      ? { $or: [{ policyId }, { claimId: new mongoose.Types.ObjectId(claimId) }] }
      : { policyId };

    const existingCount = await PolicyChunk.countDocuments(existingFilter);
    if (existingCount > 0) {
      return PolicyChunk.find(existingFilter).limit(50);
    }

    const rawChunks = this.chunkPolicyText(policyText, policyId);
    const savedChunks: IPolicyChunk[] = [];

    // 2. Embed chunks in concurrent batches of 5 for high performance
    const BATCH_SIZE = 5;
    for (let i = 0; i < rawChunks.length; i += BATCH_SIZE) {
      const batch = rawChunks.slice(i, i + BATCH_SIZE);
      const embeddings = await Promise.all(
        batch.map((draft) => geminiService.getEmbedding(draft.text))
      );

      for (let j = 0; j < batch.length; j++) {
        const draft = batch[j];
        const embedding = embeddings[j];
        const chunkDoc = new PolicyChunk({
          policyId,
          claimId: claimId ? new mongoose.Types.ObjectId(claimId) : undefined,
          text: draft.text,
          pageNumber: draft.pageNumber,
          clauseNumber: draft.clauseNumber,
          embedding,
          metadata: draft.metadata || {},
        });
        await chunkDoc.save();
        savedChunks.push(chunkDoc);
      }
    }

    return savedChunks;
  }
}

export const embeddingService = new EmbeddingService();
