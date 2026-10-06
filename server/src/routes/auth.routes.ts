import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticateJwt } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { registerSchema, loginSchema } from '../validators/auth.validator';

const router = Router();

router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', validateBody(loginSchema), authController.login);
router.get('/me', authenticateJwt, authController.getMe);

export default router;
