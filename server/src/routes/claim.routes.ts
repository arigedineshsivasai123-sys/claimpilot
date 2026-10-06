import { Router } from 'express';
import { claimController } from '../controllers/claim.controller';
import { documentController } from '../controllers/document.controller';
import { analysisController } from '../controllers/analysis.controller';
import { policyController } from '../controllers/policy.controller';
import { decisionController } from '../controllers/decision.controller';
import { reviewController } from '../controllers/review.controller';
import { demoController } from '../controllers/demo.controller';
import { authenticateJwt } from '../middleware/auth.middleware';
import { uploadClaimDocuments } from '../middleware/upload.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { createClaimSchema } from '../validators/claim.validator';
import { reviewClaimSchema } from '../validators/review.validator';

const router = Router();

// Demo presets (accessible for quick hackathon loading)
router.get('/demo/presets', demoController.getPresets);
router.post('/demo/seed', authenticateJwt, demoController.seedPresetClaim);

// Analytics
router.get('/analytics/stats', authenticateJwt, claimController.getAnalyticsStats);

// SSE Stream for Real-time Agent Trace (Token can be passed in query or bearer header)
router.get('/:id/trace/stream', analysisController.streamAgentTrace);

// Claims CRUD
router.post('/', authenticateJwt, validateBody(createClaimSchema), claimController.createClaim);
router.get('/', authenticateJwt, claimController.getClaims);
router.get('/:id', authenticateJwt, claimController.getClaimById);
router.delete('/:id', authenticateJwt, claimController.deleteClaim);

// Documents
router.post(
  '/:id/documents',
  authenticateJwt,
  uploadClaimDocuments.array('files', 10),
  documentController.uploadDocuments
);
router.get('/:id/documents', authenticateJwt, documentController.getDocuments);

// Agent Orchestration & Analysis
router.post('/:id/analyze', authenticateJwt, analysisController.analyzeClaim);
router.get('/:id/analysis', authenticateJwt, analysisController.getAnalysis);
router.get('/:id/agent-executions', authenticateJwt, analysisController.getAgentExecutions);

// Policy & Decision
router.get('/:id/policy-evidence', authenticateJwt, policyController.getPolicyEvidence);
router.get('/:id/decision', authenticateJwt, decisionController.getDecision);

// Human Adjudication Review
router.post(
  '/:id/review',
  authenticateJwt,
  validateBody(reviewClaimSchema),
  reviewController.reviewClaim
);

export default router;
