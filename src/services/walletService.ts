import type { Response } from 'express';
import Wallet from '../models/Wallet.js';
import UserTransferLimit from '../models/UserTransferLimit.js';
import type { AuthRequest } from '../middleware/auth.js';
import { sequelize } from '../config/database.js';

// Default limits (can be overridden per user)
const DEFAULT_DAILY_LIMIT = 50000; // ₱50,000
const DEFAULT_MONTHLY_LIMIT = 500000; // ₱500,000

/**
 * Internal wallet retrieval logic (returns data, no HTTP handling)
 */
export async function fetchWallet(userId: string) {
  if (!userId) {
    const error = new Error('Missing userId parameter');
    (error as any).statusCode = 400;
    throw error;
  }

  try {
    const wallet = await Wallet.findOne({ where: { userId } });

    if (!wallet) {
      const error = new Error('Wallet not found');
      (error as any).statusCode = 404;
      throw error;
    }

    return {
      userId,
      balance: parseFloat(wallet.balance.toString()),
      totalSent: parseFloat(wallet.totalSent.toString()),
      totalReceived: parseFloat(wallet.totalReceived.toString()),
    };
  } catch (error) {
    if ((error as any).statusCode) {
      throw error;
    }
    console.error('Get wallet error:', error);
    const err = new Error('Internal server error');
    (err as any).statusCode = 500;
    throw err;
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

    const walletData = await fetchWallet(userId);
    return res.status(200).json(walletData);
  } catch (error) {
    const statusCode = (error as any).statusCode || 500;
    const message = (error as Error).message || 'Internal server error';
    console.error('Get user wallet error:', error);
    return res.status(statusCode).json({
      error: message,
    });
  }
}

/**
 * Get any user's wallet
 */
export async function getAdminWallet(req: AuthRequest, res: Response) {
  try {
    const userId = req.params.userId as string;
    const walletData = await fetchWallet(userId);
    return res.status(200).json(walletData);
  } catch (error) {
    const statusCode = (error as any).statusCode || 500;
    const message = (error as Error).message || 'Internal server error';
    console.error('Get admin wallet error:', error);
    return res.status(statusCode).json({
      error: message,
    });
  }
}

async function performWalletCreation(userId: string, initialBalance: number = 0) {
  const txn = await sequelize.transaction();
  try {
    const foundWallet = await Wallet.findOne({ where: { userId } });
    if (foundWallet) {
      await txn.rollback();
      return {
        success: false,
        error: 'Wallet already exists for this user',
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

    // do not create a wallet if the user does not have a user role
    const [userRoles] = await sequelize.query(
      "SELECT r.id FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = :userId AND r.name = 'User'",
      {
        replacements: { userId },
      }
    );

    if (!userRoles || userRoles.length === 0) {
      await txn.rollback();
      return {
        success: false,
        error: 'User does not have the required role',
      };
    }

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

/**
 * Create wallet for authenticated user
 */
export async function createUserWallet(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized: missing user ID',
      });
    }

    const { initialBalance } = req.body;
    const result = await performWalletCreation(userId, initialBalance || 0);

    if (result.success) {
      return res.status(201).json(result.wallet);
    } else {
      return res.status(400).json({
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Create user wallet error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}

/**
 * Create wallet for any user
 */
export async function createAdminWallet(req: AuthRequest, res: Response) {
  try {
    const userId = req.params.userId as string;
    const { initialBalance } = req.body;

    const result = await performWalletCreation(userId, initialBalance || 0);

    if (result.success) {
      return res.status(201).json(result.wallet);
    } else {
      return res.status(400).json({
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Create admin wallet error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}
