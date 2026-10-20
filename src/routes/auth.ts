import { Router } from 'express';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validateLogin, validateRegister } from '../middleware/validation.js';
import { login, register } from '../services/authService.js';

const router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticates user and returns JWT token
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - handleId
 *               - password
 *             properties:
 *               handleId:
 *                 type: string
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *       404:
 *         description: User not found
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Too many login attempts
 */
router.post('/login', validateLogin, authLimiter, login);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: User registration
 *     description: Registers a new user and creates wallet with default transfer limits
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - handleId
 *               - password
 *               - first_name
 *               - last_name
 *             properties:
 *               handleId:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *               first_name:
 *                 type: string
 *                 example: John
 *               last_name:
 *                 type: string
 *                 example: Doe
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 userId:
 *                   type: string
 *                   format: uuid
 *       400:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: User already exists
 *       429:
 *         description: Too many registration attempts
 *       500:
 *         description: Internal server error
 */
router.post('/register', validateRegister, authLimiter, register);

export default router;
