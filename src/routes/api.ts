import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import authRoutes from './auth.js';
import transferRoutes from './transfers.js';

const apiRouter = Router();

// Public auth routes
apiRouter.use('/auth', authRoutes);

// Protected API v1 routes
apiRouter.use('/v1', authenticateToken, transferRoutes);

export default apiRouter;
