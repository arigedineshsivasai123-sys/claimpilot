import mongoose from 'mongoose';
import { connectDatabase } from '../src/config/database';
import { Claim } from '../src/models/Claim.model';
import { ClaimDocument } from '../src/models/Document.model';
import { claimOrchestrator } from '../src/orchestrator/claimOrchestrator';
import { DEMO_PRESETS } from '../src/demo/sampleData';

async function runDemoE2ETest() {
  console.log('==================================================');
  console.log('🚀 TESTING END-TO-END DEMO CLAIM MULTI-AGENT PIPELINE');
  console.log('==================================================');

  const connected = await connectDatabase();
  if (!connected) {
    console.error('Database connection failed');
    process.exit(1);
  }

  // Pick the clean cataract demo preset
  const preset = DEMO_PRESETS[0]; // Clean Cataract Claim
  console.log(`[Test] Selected Preset: "${preset.name}" (${preset.patientName})`);

  // Create or reuse demo claim
  const claim = new Claim({
    claimNumber: `CLM-E2E-${Math.floor(10000 + Math.random() * 90000)}`,
    patientName: preset.patientName,
    hospital: preset.hospital,
    diagnosis: preset.diagnosis,
    treatment: preset.treatment,
    claimAmount: preset.claimAmount,
    status: 'DRAFT',
    isDemo: true,
    demoType: preset.id,
  });
  await claim.save();
  console.log(`[Test] Created Claim ${claim.claimNumber} (ID: ${claim._id})`);

  // Attach sample documents
  for (const doc of preset.documents) {
    const claimDoc = new ClaimDocument({
      claimId: claim._id,
      filename: doc.filename,
      originalName: doc.filename,
      mimeType: 'text/plain',
      category: doc.category,
      path: 'sample://text',
      extractedText: doc.text,
      processingStatus: 'PROCESSED',
      size: Buffer.byteLength(doc.text, 'utf-8'),
    });
    await claimDoc.save();
  }
  console.log(`[Test] Attached ${preset.documents.length} claim documents.`);

  console.log('[Test] Initiating Multi-Agent Pipeline (Intake -> Policy -> Fraud -> Verifier)...');
  const startTime = Date.now();
  const result = await claimOrchestrator.executePipeline(claim._id.toString());
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n==================================================`);
  console.log(`🏁 PIPELINE COMPLETED IN ${elapsed}s`);
  console.log(`==================================================`);
  console.log(`Final Claim Status: ${result.claim.status}`);
  console.log(`Final Recommendation: ${result.claim.finalRecommendation}`);
  console.log(`AI Confidence: ${Math.round(result.claim.confidence * 100)}%`);
  console.log(`Decision Reasons:`, result.decision.reasons);

  console.log(`\nAgent Execution Breakdown:`);
  for (const exec of result.executions) {
    console.log(`  [Agent ${exec.sequence}] ${exec.agentName}: ${exec.status} (${exec.durationMs}ms)`);
    console.log(`    -> Summary: ${exec.summary}`);
  }

  // Cleanup test claim
  await Claim.findByIdAndDelete(claim._id);
  await ClaimDocument.deleteMany({ claimId: claim._id });
  await mongoose.disconnect();
  console.log('\n✅ Demo claim E2E test finished and cleaned up successfully!');
}

runDemoE2ETest().catch(async (err) => {
  console.error('❌ E2E Demo Test failed:', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
