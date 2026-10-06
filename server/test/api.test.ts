import assert from 'assert';
import mongoose from 'mongoose';
import { connectDatabase } from '../src/config/database';
import { intakeAgent } from '../src/services/agents/intakeAgent';
import { policyAgent } from '../src/services/agents/policyAgent';
import { fraudAgent } from '../src/services/agents/fraudAgent';
import { verifierAgent } from '../src/services/agents/verifierAgent';
import { registerSchema, loginSchema } from '../src/validators/auth.validator';
import { createClaimSchema } from '../src/validators/claim.validator';
import { reviewClaimSchema } from '../src/validators/review.validator';
import { config } from '../src/config/env.config';

async function runTests() {
  console.log('==================================================');
  console.log('🧪 RUNNING CLAIMPILOT SYSTEM INTEGRATION TESTS');
  console.log('==================================================');

  await connectDatabase();

  // Test 1: Validation schemas
  console.log('Test 1: Validating Auth Schemas...');
  const validRegister = registerSchema.safeParse({
    name: 'Dr. Jane Reviewer',
    email: 'reviewer@claimpilot.ai',
    password: 'password123',
  });
  assert.strictEqual(validRegister.success, true, 'Valid registration schema should pass');

  const invalidRegister = registerSchema.safeParse({
    name: 'J',
    email: 'invalid-email',
    password: '123',
  });
  assert.strictEqual(invalidRegister.success, false, 'Invalid registration should fail');

  const validLogin = loginSchema.safeParse({
    email: 'reviewer@claimpilot.ai',
    password: 'password123',
  });
  assert.strictEqual(validLogin.success, true, 'Valid login should pass');

  // Test 2: Claim & Review Schemas
  console.log('Test 2: Validating Claim & Review Schemas...');
  const validClaim = createClaimSchema.safeParse({
    patientName: 'John Doe',
    hospital: 'City Clinic',
    claimAmount: 55000,
  });
  assert.strictEqual(validClaim.success, true, 'Valid claim should pass');

  const validReview = reviewClaimSchema.safeParse({
    action: 'APPROVE',
    comment: 'Documents verified by auditor',
  });
  assert.strictEqual(validReview.success, true, 'Valid review should pass');

  // Test 3: Intake Agent Heuristics
  console.log('Test 3: Testing Intake Agent Heuristics...');
  const intakeRes = await intakeAgent.execute({
    claimNumber: 'CLM-TEST-001',
    documents: [
      {
        filename: 'bill.txt',
        originalName: 'hospital_bill.txt',
        category: 'HOSPITAL_BILL',
        text: 'Patient Name: Rajesh Patel\nHospital: Metro Hospital\nAdmission Date: 2026-08-10\nDischarge Date: 2026-08-14\nDiagnosis: Meniscus Tear\nTreatment: Knee Arthroscopy\nTotal Amount: 120,000',
      },
    ],
  });
  assert.ok(intakeRes.result.patientName, 'Patient name should be extracted');
  assert.strictEqual(intakeRes.result.admissionDate, '2026-08-10');
  console.log(`   -> Extracted: ${intakeRes.result.patientName}, Total: ₹${intakeRes.result.totalAmount}`);

  // Test 4: Fraud Agent - Date Mismatch Detection
  console.log('Test 4: Testing Fraud Agent Consistency Checks...');
  const inconsistentIntake = {
    ...intakeRes.result,
    admissionDate: '2026-08-15',
    dischargeDate: '2026-08-10', // Before admission date!
  };
  const fraudRes = await fraudAgent.execute({
    claimNumber: 'CLM-TEST-002',
    intakeResult: inconsistentIntake,
  });
  assert.strictEqual(fraudRes.result.cleanBillOfHealth, false, 'Should flag date mismatch');
  assert.ok(
    fraudRes.result.flags.some((f) => f.type === 'DATE_MISMATCH'),
    'Should contain DATE_MISMATCH flag'
  );
  console.log(`   -> Flagged: ${fraudRes.result.flags[0].description}`);

  // Test 5: Verifier Agent - High Value Escalation Rule
  console.log('Test 5: Testing Verifier Agent High-Value Escalation Rule...');
  const highValueAmount = config.highValueClaimThreshold + 50000;
  const verifierRes = await verifierAgent.execute({
    claimNumber: 'CLM-TEST-003',
    claimAmount: highValueAmount,
    intakeResult: intakeRes.result,
    policyResult: {
      coverage: 'COVERED',
      reason: 'Standard coverage',
      confidence: 0.95,
      evidence: [],
    },
    fraudResult: {
      riskScore: 5,
      riskLevel: 'LOW',
      cleanBillOfHealth: true,
      summary: 'Clean',
      flags: [],
    },
  });
  assert.strictEqual(verifierRes.result.recommendation, 'ESCALATE', 'High value claim must ESCALATE');
  assert.strictEqual(verifierRes.result.requiresHumanReview, true, 'Must require human review');
  console.log(`   -> High-value claim correctly escalated: ${verifierRes.result.reasons[0]}`);

  // Test 6: Verifier Agent - Clean Approval Rule
  console.log('Test 6: Testing Verifier Agent Clean Approval Rule...');
  const cleanVerifierRes = await verifierAgent.execute({
    claimNumber: 'CLM-TEST-004',
    claimAmount: 85000,
    intakeResult: intakeRes.result,
    policyResult: {
      coverage: 'COVERED',
      reason: 'Eligible surgery',
      confidence: 0.92,
      evidence: [{ clause: '4.1', page: 8, text: 'Covered' }],
    },
    fraudResult: {
      riskScore: 5,
      riskLevel: 'LOW',
      cleanBillOfHealth: true,
      summary: 'Clean',
      flags: [],
    },
  });
  assert.strictEqual(cleanVerifierRes.result.recommendation, 'APPROVE', 'Clean claim must APPROVE');
  console.log(`   -> Clean claim decision: ${cleanVerifierRes.result.recommendation} (${cleanVerifierRes.result.confidence * 100}%)`);

  // Test 7: Policy Agent - Adjudication against policy clauses
  console.log('Test 7: Testing Policy Agent Adjudication & Evidence Retrieval...');
  const policyRes = await policyAgent.execute({
    claimNumber: 'CLM-TEST-005',
    intakeResult: intakeRes.result,
    policyId: 'standard-health-policy-2026',
  });
  assert.ok(policyRes.result.coverage, 'Policy agent must return a coverage decision');
  assert.ok(typeof policyRes.result.confidence === 'number', 'Confidence must be a number');
  assert.ok(Array.isArray(policyRes.evidence), 'Evidence must be an array');
  console.log(`   -> Policy Decision: ${policyRes.result.coverage} (Confidence: ${Math.round(policyRes.result.confidence * 100)}%), Cited clauses: ${policyRes.evidence.length}`);

  console.log('==================================================');
  console.log('✅ ALL BACKEND LOGIC AND AGENT TESTS PASSED!');
  console.log('==================================================');

  await mongoose.disconnect();
}

runTests().catch(async (err) => {
  console.error('❌ Test failed:', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
