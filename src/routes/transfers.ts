import { Router, Response } from 'express';
import {
  getLimitUsage,
  getTransactionHistory,
  getWallet,
  createWallet,
  updateUserLimits,
  userTransferMoney,
} from '../services/transferService.js';
import { AuthRequest } from '../middleware/auth.js';
import {
  validateTransfer,
  validateWalletCreation,
  validatePagination,
} from '../middleware/validation.js';
import { transferLimiter } from '../middleware/rateLimiter.js';

const router = Router();

/**
 * @swagger
 * /api/v1/transfers:
 *   post:
 *     summary: Transfer money between users
 *     description: Transfer money from sender to recipient with idempotency support. The sender is determined from the authenticated user's JWT token.
 *     tags:
 *       - Transfers
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientId
 *               - amount
 *             properties:
 *               recipientId:
 *                 type: string
 *                 format: uuid
 *                 example: 550e8400-e29b-41d4-a716-446655440000
 *               amount:
 *                 type: number
 *                 example: 100.50
 *     parameters:
 *       - in: header
 *         name: idempotency-key
 *         schema:
 *           type: string
 *         description: Unique identifier for idempotent requests
 *     responses:
 *       201:
 *         description: Transfer successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 transaction:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     senderId:
 *                       type: string
 *                     recipientId:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     status:
 *                       type: string
 *       400:
 *         description: Invalid transfer data or limit exceeded
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.post('/transfers', validateTransfer, transferLimiter, userTransferMoney);

/**
 * @swagger
 * /api/v1/limits/{userId}:
 *   get:
 *     summary: Get user transfer limits and usage
 *     description: Retrieve the current transfer limits and usage for a user
 *     tags:
 *       - Limits
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: Limits retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                 dailyLimit:
 *                   type: number
 *                 dailyUsed:
 *                   type: number
 *                 monthlyLimit:
 *                   type: number
 *                 monthlyUsed:
 *                   type: number
 *       400:
 *         description: Missing userId parameter
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update user transfer limits
 *     description: Update the daily and/or monthly transfer limits for a user
 *     tags:
 *       - Limits
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dailyLimit:
 *                 type: number
 *                 example: 5000
 *               monthlyLimit:
 *                 type: number
 *                 example: 50000
 *     responses:
 *       200:
 *         description: Limits updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                 dailyLimit:
 *                   type: number
 *                 monthlyLimit:
 *                   type: number
 *       400:
 *         description: Invalid limit values
 *       500:
 *         description: Internal server error
 */
router.get('/limits/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.userId as string;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing userId parameter',
      });
    }

    const limitUsage = await getLimitUsage(userId);

    return res.status(200).json({
      userId,
      ...limitUsage,
    });
  } catch (error) {
    console.error('Limit usage error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * @swagger
 * /api/v1/history/{userId}:
 *   get:
 *     summary: Get transaction history
 *     description: Retrieve paginated transaction history for a user
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Number of records to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of records to skip
 *     responses:
 *       200:
 *         description: Transaction history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Missing userId parameter or invalid pagination
 *       500:
 *         description: Internal server error
 */
router.get('/history/:userId', validatePagination, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing userId parameter',
      });
    }

    const history = await getTransactionHistory(userId, limit, offset);

    return res.status(200).json({
      userId,
      ...history,
    });
  } catch (error) {
    console.error('History error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * @swagger
 * /api/v1/wallet/{userId}:
 *   get:
 *     summary: Get user wallet
 *     description: Retrieve wallet information for a user
 *     tags:
 *       - Wallet
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: Wallet retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 balance:
 *                   type: number
 *       404:
 *         description: Wallet not found
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create wallet
 *     description: Create a new wallet for a user
 *     tags:
 *       - Wallet
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *               initialBalance:
 *                 type: number
 *                 default: 0
 *     responses:
 *       201:
 *         description: Wallet created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 balance:
 *                   type: number
 *       400:
 *         description: Invalid wallet data
 *       500:
 *         description: Internal server error
 */
router.get('/wallet/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.userId as string;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing userId parameter',
      });
    }

    const wallet = await getWallet(userId);

    if (wallet.error) {
      return res.status(404).json({
        error: wallet.error,
      });
    }

    return res.status(200).json(wallet);
  } catch (error) {
    console.error('Wallet error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
});

router.post('/wallet', validateWalletCreation, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, initialBalance } = req.body;

    const result = await createWallet(userId, initialBalance || 0);

    if (result.success) {
      return res.status(201).json(result.wallet);
    } else {
      return res.status(400).json({
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Create wallet error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
});

router.put('/limits/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const { dailyLimit, monthlyLimit } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing userId parameter',
      });
    }

    // Validate limit values if provided
    if (dailyLimit !== undefined && (typeof dailyLimit !== 'number' || dailyLimit <= 0)) {
      return res.status(400).json({
        error: 'dailyLimit must be a positive number',
      });
    }

    if (monthlyLimit !== undefined && (typeof monthlyLimit !== 'number' || monthlyLimit <= 0)) {
      return res.status(400).json({
        error: 'monthlyLimit must be a positive number',
      });
    }

    const result = await updateUserLimits(userId, dailyLimit, monthlyLimit);

    if (result.success) {
      return res.status(200).json(result.limits);
    } else {
      return res.status(400).json({
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Update limits error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
});

export default router;
