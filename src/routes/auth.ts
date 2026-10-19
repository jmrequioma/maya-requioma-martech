import { Router, Request, Response } from 'express';
import { generateToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

/**
 * POST /auth/token
 * Generate JWT token for API access
 * Body: { userId: string }
 */
router.post('/token', authLimiter, (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId || typeof userId !== 'string') {
      res.status(400).json({
        error: 'Validation failed',
        details: [{ field: 'userId', message: 'userId is required and must be a string' }],
      });
      return;
    }

    const token = generateToken(userId);
    res.status(200).json({
      token,
      expiresIn: '24h',
      type: 'Bearer',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

export default router;
