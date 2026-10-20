import type { Response } from 'express';
import Wallet from '../models/Wallet.js';
import UserTransferLimit from '../models/UserTransferLimit.js';
import type { AuthRequest } from '../middleware/auth.js';
import { sequelize } from '../config/database.js';

// Default limits (can be overridden per user)
const DEFAULT_DAILY_LIMIT = 50000; // ₱50,000
const DEFAULT_MONTHLY_LIMIT = 500000; // ₱500,000

/**
 * Internal wallet retrieval logic
 */
async function fetchWallet(userId: string, res: Response) {
  if (!userId) {
    return res.status(400).json({
      error: 'Missing userId parameter',
    });
  }

  try {
    const wallet = await Wallet.findOne({ where: { userId } });

    if (!wallet) {
      return res.status(404).json({
        error: 'Wallet not found',
      });
    }

    return res.status(200).json({
      userId,
      balance: parseFloat(wallet.balance.toString()),
      totalSent: parseFloat(wallet.totalSent.toString()),
      totalReceived: parseFloat(wallet.totalReceived.toString()),
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}

/**
 * Get authenticated user's wallet
 */
export async function getUserWallet(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized: missing user ID',
      });
    }

    return fetchWallet(userId, res);
  } catch (error) {
    console.error('Get user wallet error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}

/**
 * Get any user's wallet
 */
export async function getAdminWallet(req: AuthRequest, res: Response) {
  try {
    const userId = req.params.userId as string;

    return fetchWallet(userId, res);
  } catch (error) {
    console.error('Get admin wallet error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}

/**
 * Create a wallet for a new user
 */
export async function createUserWallet(req: AuthRequest, res: Response) {
  const txn = await sequelize.transaction();
  try {
    const { initialBalance } = req.body;
    const userId = req.userId!;
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized: missing user ID',
      });
    }

    const foundWallet = await Wallet.findOne({ where: { userId } });
    console.log('Found wallet:', foundWallet);
    if (foundWallet) {
      return res.status(400).json({
        error: 'Wallet already exists',
      });
    }

    const wallet = await Wallet.create(
      {
        userId,
        balance: initialBalance,
        totalSent: 0,
        totalReceived: 0,
      },
      { transaction: txn }
    );

    // Create default transfer limits for the user
    await UserTransferLimit.create(
      {
        userId,
        dailyLimit: DEFAULT_DAILY_LIMIT,
        monthlyLimit: DEFAULT_MONTHLY_LIMIT,
      },
      { transaction: txn }
    );

    await txn.commit();
    return {
      success: true,
      wallet: {
        id: wallet.id,
        userId: wallet.userId,
        balance: parseFloat(wallet.balance.toString()),
      },
    };
  } catch (error: unknown) {
    await txn.rollback();
    console.error('Failed to create wallet:', error);
    return {
      success: false,
      error: 'Failed to create wallet',
    };
  }
}

export async function createAdminWallet(userId: string, initialBalance: number = 0) {
  const txn = await sequelize.transaction();
  try {
    const foundWallet = await Wallet.findOne({ where: { userId } });
    if (foundWallet) {
      return {
        success: false,
        error: 'Failed to create wallet',
      };
    }

    const wallet = await Wallet.create(
      {
        userId,
        balance: initialBalance,
        totalSent: 0,
        totalReceived: 0,
      },
      { transaction: txn }
    );

    // Create default transfer limits for the user
    await UserTransferLimit.create(
      {
        userId,
        dailyLimit: DEFAULT_DAILY_LIMIT,
        monthlyLimit: DEFAULT_MONTHLY_LIMIT,
      },
      { transaction: txn }
    );

    await txn.commit();
    return {
      success: true,
      wallet: {
        id: wallet.id,
        userId: wallet.userId,
        balance: parseFloat(wallet.balance.toString()),
      },
    };
  } catch (error: unknown) {
    await txn.rollback();
    console.error('Failed to create wallet:', error);
    return {
      success: false,
      error: 'Failed to create wallet',
    };
  }
}
