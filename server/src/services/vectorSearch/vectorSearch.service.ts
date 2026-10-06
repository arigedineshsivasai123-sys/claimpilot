import mongoose from 'mongoose';
import { PolicyChunk, IPolicyChunk } from '../../models/PolicyChunk.model';
import { geminiService } from '../gemini/gemini.service';

export interface VectorSearchResult {
  chunk: IPolicyChunk;
  score: number;
  clauseNumber: string;
  pageNumber: number;
  text: string;
}

export class VectorSearchService {
  /**
   * Computes cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA.length || !vecB.length) return 0;
    const len = Math.min(vecA.length, vecB.length);
    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < len; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Searches policy chunks using vector similarity
   */
  public async searchPolicyChunks(
    query: string,
    policyId?: string,
    topK = 4
  ): Promise<VectorSearchResult[]> {
    // If MongoDB is not connected, immediately skip database queries to prevent Mongoose buffering timeouts
    if (mongoose.connection.readyState !== 1) {
      return [];
    }

    const queryEmbedding = await geminiService.getEmbedding(query);

    // 1. Attempt MongoDB Atlas $vectorSearch pipeline first
    // In Atlas, $vectorSearch MUST be the very first stage in the aggregation pipeline.
    try {
      const atlasPipeline: any[] = [
        {
          $vectorSearch: {
            index: 'vector_index',
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: Math.max(topK * 10, 20),
            limit: topK * 2, // Fetch slightly more to allow post-stage matching if needed
          },
        },
      ];

      if (policyId) {
        atlasPipeline.push({
          $match: {
            policyId: { $in: [policyId, 'standard-health-policy-2026'] },
          },
        });
      }

      atlasPipeline.push({ $limit: topK });

      const atlasResults = await PolicyChunk.aggregate(atlasPipeline);
      if (atlasResults && atlasResults.length > 0) {
        return atlasResults.map((doc: any) => ({
          chunk: doc,
          score: doc.score || 0.85,
          clauseNumber: doc.clauseNumber,
          pageNumber: doc.pageNumber,
          text: doc.text,
        }));
      }
    } catch (err: any) {
      // Atlas Vector Search not active or local MongoDB instance; seamlessly fall back to cosine search
      console.log('[VectorSearch] Atlas $vectorSearch query fallback to cosine search:', err?.message || err);
    }

    // 2. Resilient In-Memory Cosine Similarity retrieval across stored policy chunks
    const filter: Record<string, any> = {};
    if (policyId) {
      filter.policyId = { $in: [policyId, 'standard-health-policy-2026'] };
    }

    let allChunks = await PolicyChunk.find(filter).lean();
    if (!allChunks.length) {
      // If no chunks match the specific filter, fallback to any available policy chunks in database
      allChunks = await PolicyChunk.find().lean();
    }

    if (!allChunks.length) {
      return [];
    }

    const scored = allChunks.map((chunk) => {
      const score = this.cosineSimilarity(queryEmbedding, chunk.embedding || []);
      return {
        chunk: chunk as unknown as IPolicyChunk,
        score,
        clauseNumber: chunk.clauseNumber,
        pageNumber: chunk.pageNumber,
        text: chunk.text,
      };
    });

    // Sort descending by similarity score
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }
}

export const vectorSearchService = new VectorSearchService();
