import { Router } from 'express';
import { authLimiter } from '../middleware/rateLimiter.js';
import { login } from '../services/authService.js';

const router = Router();

router.post('/login', authLimiter, login);

export default router;
