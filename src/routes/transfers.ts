import { Router, Response } from 'express';
import {
  transferMoney,
  getLimitUsage,
  getTransactionHistory,
  getWallet,
  createWallet,
  updateUserLimits,
} from '../services/transferService.js';
import { AuthRequest } from '../middleware/auth.js';
import {
  validateTransfer,
  validateWalletCreation,
  validatePagination,
} from '../middleware/validation.js';
import { transferLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post(
  '/transfers',
  validateTransfer,
  transferLimiter,
  async (req: AuthRequest, res: Response) => {
    try {
      const { senderId, recipientId, amount } = req.body;

      const result = await transferMoney({
        senderId,
        recipientId,
        amount: parseFloat(amount),
      });

      if (result.success) {
        return res.status(201).json({
          success: true,
          transaction: result.transaction,
        });
      } else {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error('Transfer error:', error);
      return res.status(500).json({
        error: 'Internal server error',
      });
    }
  }
);

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
