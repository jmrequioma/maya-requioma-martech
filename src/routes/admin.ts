import { Router } from 'express';
import { validateAdminTransfer, validatePagination } from '../middleware/validation.js';
import { adminTransferMoney, getAdminTransactionHistory } from '../services/transferService.js';

const router = Router();

/**
 * @swagger
 * /api/v1/admin/transfers:
 *   post:
 *     summary: Admin transfer operation
 *     description: Administrative endpoint for transfer operations. Sender ID must be provided in request body.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - senderId
 *               - recipientId
 *               - amount
 *             properties:
 *               senderId:
 *                 type: string
 *                 format: uuid
 *                 example: 550e8400-e29b-41d4-a716-446655440000
 *               recipientId:
 *                 type: string
 *                 format: uuid
 *                 example: 550e8400-e29b-41d4-a716-446655440001
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
 *         description: Admin transfer processed successfully
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
 *                      id:
 *                        type: string
 *                      senderId:
 *                        type: string
 *                      recipientId:
 *                        type: string
 *                      amount:
 *                        type: number
 *                      status:
 *                        type: string
 *       400:
 *         description: Invalid transfer data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Sender or recipient not found
 *       500:
 *         description: Internal server error
 */
router.post('/transfers', validateAdminTransfer, adminTransferMoney);

/**
 * @swagger
 * /api/v1/admin/transfers/history/{userId}:
 *   get:
 *     summary: Get transaction history for any user (ADMIN)
 *     description: Retrieve paginated transaction history for a specified user
 *     tags:
 *       - Admin
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
 *                 total:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *                 transactions:
 *                   type: array
 *       400:
 *         description: Missing userId parameter
 *       500:
 *         description: Internal server error
 */
router.get('/transfers/history/:userId', validatePagination, getAdminTransactionHistory);

export default router;
