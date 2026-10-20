import { Router } from 'express';
import {
  getLimitUsage,
  getUserTransactionHistory,
  updateUserLimits,
  updateAdminLimits,
  getUserLimits,
  getAdminLimits,
  userTransferMoney,
} from '../services/transferService.js';
import { AuthRequest } from '../middleware/auth.js';
import { validateTransfer, validatePagination } from '../middleware/validation.js';
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
 * /api/v1/limits:
 *   get:
 *     summary: Get authenticated user's transfer limits and usage
 *     description: Retrieve the current transfer limits and usage for the authenticated user
 *     tags:
 *       - Limits
 *     security:
 *       - bearerAuth: []
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
 *                 daily:
 *                   type: object
 *                   properties:
 *                     used:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     remaining:
 *                       type: number
 *                     percentage:
 *                       type: number
 *                 monthly:
 *                   type: object
 *                   properties:
 *                     used:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     remaining:
 *                       type: number
 *                     percentage:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update authenticated user's transfer limits
 *     description: Update the daily and/or monthly transfer limits for the authenticated user
 *     tags:
 *       - Limits
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/limits', getUserLimits);
router.put('/limits', updateUserLimits);

/**
 * @swagger
 * /api/v1/transfers/history:
 *   get:
 *     summary: Get authenticated user's transaction history
 *     description: Retrieve paginated transaction history for the authenticated user
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *                 total:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *                 transactions:
 *                   type: array
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/history', validatePagination, getUserTransactionHistory);

export default router;
