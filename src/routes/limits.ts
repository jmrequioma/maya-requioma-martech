import { Router } from 'express';
import { getUserLimits, updateUserLimits } from '../services/transferService.js';

const router = Router();

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
