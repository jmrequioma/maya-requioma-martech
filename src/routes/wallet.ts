import { Router, Response } from 'express';
import { getUserWallet, getAdminWallet, createWallet } from '../services/transferService.js';
import { AuthRequest } from '../middleware/auth.js';
import { validateWalletCreation } from '../middleware/validation.js';

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
 */
router.get('/wallet', getUserWallet);

/**
 * @swagger
 * /api/v1/wallet/{userId}:
 *   get:
 *     summary: Get any user's wallet (ADMIN)
 *     description: Retrieve wallet information for a specified user
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
 *                 userId:
 *                   type: string
 *                 balance:
 *                   type: number
 *                 totalSent:
 *                   type: number
 *                 totalReceived:
 *                   type: number
 *       400:
 *         description: Missing userId parameter
 *       404:
 *         description: Wallet not found
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create wallet for a user
 *     description: Create a new wallet for a specified user
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
router.get('/wallet/:userId', getAdminWallet);

router.post('/wallet/:userId', validateWalletCreation, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const { initialBalance } = req.body;

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

export default router;
