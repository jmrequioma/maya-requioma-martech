import { Router } from 'express';
import { getUserWallet, createUserWallet } from '../services/walletService.js';
import { validateCreateWallet } from '../middleware/validation.js';

const router = Router();

/**
 * @swagger
 * /api/v1/wallet:
 *   get:
 *     summary: Get authenticated user's wallet
 *     description: Retrieve wallet information for the authenticated user
 *     tags:
 *       - Wallet
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                 balance:
 *                   type: number
 *                 totalSent:
 *                   type: number
 *                 totalReceived:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Wallet not found
 *       500:
 *         description: Internal server error
 *
 *   post:
 *     summary: Create a new wallet for the authenticated user
 *     description: Create a wallet with an optional initial balance for the authenticated user
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
 *             properties:
 *               initialBalance:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       201:
 *         description: Wallet created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                 balance:
 *                   type: number
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/wallet', getUserWallet);
router.post('/wallet', validateCreateWallet, createUserWallet);

export default router;
