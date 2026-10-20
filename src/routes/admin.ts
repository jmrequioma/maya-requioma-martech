import { Router } from 'express';
import { validateAdminTransfer } from '../middleware/validation.js';
import { adminTransferMoney } from '../services/transferService.js';

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

export default router;
