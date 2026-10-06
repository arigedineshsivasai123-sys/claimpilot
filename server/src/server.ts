import { createApp } from './app';
import { config, hasGeminiKey } from './config/env.config';
import { connectDatabase } from './config/database';
import { embeddingService } from './services/embeddings/embedding.service';
import { SAMPLE_POLICY_TEXT } from './demo/sampleData';
import { PolicyChunk } from './models/PolicyChunk.model';

const startServer = async () => {
  console.log('----------------------------------------------------');
  console.log('🚀 Starting ClaimPilot Multi-Agent Insurance Engine');
  console.log('----------------------------------------------------');
  console.log(`[Config] Environment: ${config.nodeEnv}`);
  console.log(`[Config] Port: ${config.port}`);
  console.log(`[Config] Gemini AI: ${hasGeminiKey() ? 'Configured ✅' : 'Missing Key ⚠️ (Resilient Fallback Mode)'}`);
  console.log(`[Config] High Value Claim Threshold: ₹${config.highValueClaimThreshold.toLocaleString()}`);
  console.log(`[Config] AI Confidence Threshold: ${config.aiConfidenceThreshold * 100}%`);

  // Connect to Database
  const dbConnected = await connectDatabase();

  // If database is connected, seed standard insurance policy chunks for RAG vector search
  if (dbConnected) {
    try {
      const sampleChunk = await PolicyChunk.findOne({ policyId: 'standard-health-policy-2026' });
      const needsIndexing = !sampleChunk || sampleChunk.embedding?.length !== 768;

      if (needsIndexing) {
        if (sampleChunk) {
          console.log('[Seed] Updating policy chunks with supported Gemini embeddings (768 dimensions)...');
          await PolicyChunk.deleteMany({ policyId: 'standard-health-policy-2026' });
        } else {
          console.log('[Seed] Indexing Standard Health Insurance Policy into Vector Search Collection...');
        }
        await embeddingService.indexPolicyDocument(SAMPLE_POLICY_TEXT, 'standard-health-policy-2026');
        console.log('[Seed] Standard Policy chunks indexed successfully with 768 dimensions ✅');
      } else {
        const existingChunks = await PolicyChunk.countDocuments({ policyId: 'standard-health-policy-2026' });
        console.log(`[Vector Store] Found ${existingChunks} indexed policy chunks ready for retrieval (768 dimensions) ✅`);
      }
    } catch (err: any) {
      console.warn('[Seed Warning] Could not index policy chunks:', err.message);
    }
  }

  const app = createApp();

  app.listen(config.port, () => {
    console.log(`✅ ClaimPilot Server is active at http://localhost:${config.port}`);
    console.log(`🔍 Health Check available at http://localhost:${config.port}/api/health`);
    console.log('----------------------------------------------------');
  });
};

startServer().catch((err) => {
  console.error('[Fatal Error] Failed to start server:', err);
  process.exit(1);
});
