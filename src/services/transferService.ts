import { Op } from 'sequelize';
import type { Response } from 'express';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import UserTransferLimit from '../models/UserTransferLimit.js';
import { sequelize } from '../config/database.js';
import type { AuthRequest } from '../middleware/auth.js';
import {
  getStartOfDayManila,
  getEndOfDayManila,
  getStartOfMonthManila,
  getEndOfMonthManila,
} from '../utils/timezone.js';

// Default limits (can be overridden per user)
const DEFAULT_DAILY_LIMIT = 50000; // ₱50,000
const DEFAULT_MONTHLY_LIMIT = 500000; // ₱500,000
interface LimitUsage {
  daily: {
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
  };
  monthly: {
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
  };
}

/**
 * Get total amount transferred by user in current day
 */
async function getDailySpent(userId: string): Promise<number> {
  const startOfDay = getStartOfDayManila();
  const endOfDay = getEndOfDayManila();

  const result = (await Transaction.findOne({
    attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'total']],
    where: {
      senderId: userId,
      status: 'COMPLETED',
      createdAt: {
        [Op.between]: [startOfDay, endOfDay],
      },
    },
    raw: true,
  })) as any;

  return parseFloat(result?.total) || 0;
}

/**
 * Get total amount transferred by user in current month
 */
async function getMonthlySpent(userId: string): Promise<number> {
  const startOfMonth = getStartOfMonthManila();
  const endOfMonth = getEndOfMonthManila();

  const result = (await Transaction.findOne({
    attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'total']],
    where: {
      senderId: userId,
      status: 'COMPLETED',
      createdAt: {
        [Op.between]: [startOfMonth, endOfMonth],
      },
    },
    raw: true,
  })) as any;

  return parseFloat(result?.total) || 0;
}

/**
 * Get user's transfer limits (daily and monthly)
 */
async function getDefaultLimits(userId: string) {
  let limits = await UserTransferLimit.findOne({ where: { userId } });

  if (!limits) {
    // Create default limits if they don't exist
    limits = await UserTransferLimit.create({
      userId,
      dailyLimit: DEFAULT_DAILY_LIMIT,
      monthlyLimit: DEFAULT_MONTHLY_LIMIT,
    });
  }

  return {
    dailyLimit: parseFloat(limits.dailyLimit.toString()),
    monthlyLimit: parseFloat(limits.monthlyLimit.toString()),
  };
}

/**
 * Get limit usage for a user
 */
export async function getLimitUsage(userId: string): Promise<LimitUsage> {
  const { dailyLimit, monthlyLimit } = await getDefaultLimits(userId);
  const dailySpent = await getDailySpent(userId);
  const monthlySpent = await getMonthlySpent(userId);

  return {
    daily: {
      used: dailySpent,
      limit: dailyLimit,
      remaining: Math.max(0, dailyLimit - dailySpent),
      percentage: Math.min(100, (dailySpent / dailyLimit) * 100),
    },
    monthly: {
      used: monthlySpent,
      limit: monthlyLimit,
      remaining: Math.max(0, monthlyLimit - monthlySpent),
      percentage: Math.min(100, (monthlySpent / monthlyLimit) * 100),
    },
  };
}

/**
 * Internal transfer execution logic with atomic transaction and locking
 */
export async function executeTransfer(
  senderId: string,
  recipientId: string,
  amount: number,
  idempotencyKey: string,
  res: Response
) {
  // Validate amount
  if (!amount || amount <= 0) {
    return res.status(400).json({
      error: 'Amount must be greater than 0',
    });
  }

  // Validate recipientId
  if (!recipientId) {
    return res.status(400).json({
      error: 'Recipient ID is required',
    });
  }

  // Check if sender exists
  const sender = await User.findByPk(senderId);
  if (!sender) {
    return res.status(404).json({
      error: 'Sender not found',
    });
  }

  // Check if recipient exists
  const recipient = await User.findByPk(recipientId);
  if (!recipient) {
    return res.status(404).json({
      error: 'Recipient not found',
    });
  }

  // Prevent self-transfer
  if (senderId === recipientId) {
    return res.status(400).json({
      error: 'Cannot transfer to yourself',
    });
  }

  // Check if sender has a wallet
  const senderWallet = await Wallet.findOne({ where: { userId: senderId } });
  if (!senderWallet) {
    return res.status(404).json({
      error: 'Sender wallet not found',
    });
  }

  // Check if recipient has a wallet
  const recipientWallet = await Wallet.findOne({ where: { userId: recipientId } });
  if (!recipientWallet) {
    return res.status(404).json({
      error: 'Recipient wallet not found',
    });
  }

  const txn = await sequelize.transaction();

  try {
    const lockedSenderWallet = await Wallet.findByPk(senderWallet.id, {
      transaction: txn,
      lock: true,
    });

    const lockedRecipientWallet = await Wallet.findByPk(recipientWallet.id, {
      transaction: txn,
      lock: true,
    });

    const existingTransaction = await Transaction.findOne({
      where: {
        senderId,
        idempotencyKey,
      },
      transaction: txn,
    });

    if (existingTransaction) {
      await txn.commit();
      return res.status(201).json({
        success: true,
        transaction: {
          id: existingTransaction.id,
          senderId: existingTransaction.senderId,
          recipientId: existingTransaction.recipientId,
          amount: parseFloat(existingTransaction.amount.toString()),
          status: existingTransaction.status,
        },
      });
    }

    if (lockedSenderWallet!.balance < amount) {
      await txn.rollback();
      return res.status(400).json({
        error: 'Insufficient balance',
      });
    }

    const limitUsage = await getLimitUsage(senderId);
    if (limitUsage.daily.remaining < amount) {
      await txn.rollback();
      return res.status(400).json({
        error: `Daily limit exceeded. Remaining: ₱${limitUsage.daily.remaining}`,
      });
    }

    if (limitUsage.monthly.remaining < amount) {
      await txn.rollback();
      return res.status(400).json({
        error: `Monthly limit exceeded. Remaining: ₱${limitUsage.monthly.remaining}`,
      });
    }

    // Create transaction record
    const createdTransaction = await Transaction.create(
      {
        senderId,
        recipientId,
        amount,
        status: 'COMPLETED',
        idempotencyKey,
        createdBy: senderId,
        updatedBy: senderId,
      },
      { transaction: txn }
    );

    // Update sender wallet
    await lockedSenderWallet!.update(
      {
        balance: parseFloat(lockedSenderWallet!.balance.toString()) - amount,
        totalSent: parseFloat(lockedSenderWallet!.totalSent.toString()) + amount,
        updatedBy: senderId,
      },
      { transaction: txn }
    );

    // Update recipient wallet
    await lockedRecipientWallet!.update(
      {
        balance: parseFloat(lockedRecipientWallet!.balance.toString()) + amount,
        totalReceived: parseFloat(lockedRecipientWallet!.totalReceived.toString()) + amount,
        updatedBy: senderId,
      },
      { transaction: txn }
    );

    // Commit transaction
    await txn.commit();

    return res.status(201).json({
      success: true,
      transaction: {
        id: createdTransaction.id,
        senderId: createdTransaction.senderId,
        recipientId: createdTransaction.recipientId,
        amount: parseFloat(createdTransaction.amount.toString()),
        status: createdTransaction.status,
      },
    });
  } catch (error) {
    await txn.rollback();
    console.error('Transfer transaction error:', error);
    return res.status(500).json({
      error: 'Failed to process transfer',
    });
  }
}

/**
 * Transfer money from authenticated sender to recipient
 */
export async function userTransferMoney(req: AuthRequest, res: Response) {
  try {
    const senderId = req.userId!;
    const { recipientId, amount } = req.body;
    const idempotencyKey = req.headers['idempotency-key'] as string;

    // Validate senderId exists
    if (!senderId) {
      return res.status(401).json({
        error: 'Unauthorized: missing user ID',
      });
    }

    return executeTransfer(senderId, recipientId, amount, idempotencyKey, res);
  } catch (error) {
    console.error('Transfer error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}

/**
 * Transfer money from sender to recipient
 */
export async function adminTransferMoney(req: AuthRequest, res: Response) {
  try {
    const { senderId, recipientId, amount } = req.body;
    const idempotencyKey = req.headers['idempotency-key'] as string;

    // Validate senderId exists
    if (!senderId) {
      return res.status(400).json({
        error: 'Sender ID is required',
      });
    }

    return executeTransfer(senderId, recipientId, amount, idempotencyKey, res);
  } catch (error) {
    console.error('Admin transfer error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}

async function fetchTransactionHistory(
  userId: string,
  limit: number,
  offset: number,
  res: Response
) {
  if (!userId) {
    return res.status(400).json({
      error: 'Missing userId parameter',
    });
  }

  try {
    const transactions = await Transaction.findAndCountAll({
      where: {
        [Op.or]: [{ senderId: userId }, { recipientId: userId }],
      },
      include: [
        { association: 'sender', attributes: ['id', 'handleId'] },
        { association: 'recipient', attributes: ['id', 'handleId'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return res.status(200).json({
      total: transactions.count,
      limit,
      offset,
      transactions: transactions.rows.map((t) => ({
        id: t.id,
        sender: {
          id: t.senderId,
          handleId: t.sender?.handleId,
        },
        recipient: {
          id: t.recipientId,
          handleId: t.recipient?.handleId,
        },
        amount: parseFloat(t.amount.toString()),
        status: t.status,
        failureReason: t.failureReason,
        createdAt: t.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get transaction history error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}

/**
 * Get transaction history for authenticated user
 */
export async function getUserTransactionHistory(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized: missing user ID',
      });
    }

    return fetchTransactionHistory(userId, limit, offset, res);
  } catch (error) {
    console.error('Get user transaction history error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}

/**
 * Get transaction history for any user
 */
export async function getAdminTransactionHistory(req: AuthRequest, res: Response) {
  try {
    const userId = req.params.userId as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    return fetchTransactionHistory(userId, limit, offset, res);
  } catch (error) {
    console.error('Get admin transaction history error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}

/**
 * Internal limits retrieval logic
 */
async function fetchLimitUsage(userId: string, res: Response) {
  if (!userId) {
    return res.status(400).json({
      error: 'Missing userId parameter',
    });
  }

  try {
    const limitUsage = await getLimitUsage(userId);

    return res.status(200).json({
      userId,
      ...limitUsage,
    });
  } catch (error) {
    console.error('Get limit usage error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}

/**
 * Get authenticated user's transfer limits and usage
 */
export async function getUserLimits(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized: missing user ID',
      });
    }

    return fetchLimitUsage(userId, res);
  } catch (error) {
    console.error('Get user limits error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}

/**
 * Get any user's transfer limits and usage
 */
export async function getAdminLimits(req: AuthRequest, res: Response) {
  try {
    const userId = req.params.userId as string;

    return fetchLimitUsage(userId, res);
  } catch (error) {
    console.error('Get admin limits error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}

/**
 * Internal limits update logic
 */
async function updateLimits(
  userId: string,
  dailyLimit: number | undefined,
  monthlyLimit: number | undefined,
  res: Response
) {
  if (!userId) {
    return res.status(400).json({
      error: 'Missing userId parameter',
    });
  }

  try {
    let limits = await UserTransferLimit.findOne({ where: { userId } });

    if (!limits) {
      limits = await UserTransferLimit.create({
        userId,
        dailyLimit: dailyLimit || DEFAULT_DAILY_LIMIT,
        monthlyLimit: monthlyLimit || DEFAULT_MONTHLY_LIMIT,
        createdBy: userId,
        updatedBy: userId,
      });
    } else {
      if (dailyLimit !== undefined) limits.dailyLimit = dailyLimit;
      if (monthlyLimit !== undefined) limits.monthlyLimit = monthlyLimit;
      limits.updatedBy = userId;
      await limits.save();
    }

    return res.status(200).json({
      userId,
      dailyLimit: parseFloat(limits.dailyLimit.toString()),
      monthlyLimit: parseFloat(limits.monthlyLimit.toString()),
    });
  } catch (error) {
    console.error('Update limits error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}

/**
 * Update authenticated user's transfer limits
 */
export async function updateUserLimits(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized: missing user ID',
      });
    }

    const { dailyLimit, monthlyLimit } = req.body;
    return updateLimits(userId, dailyLimit, monthlyLimit, res);
  } catch (error) {
    console.error('Update user limits error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}

/**
 * Update any user's transfer limits
 */
export async function updateAdminLimits(req: AuthRequest, res: Response) {
  try {
    const userId = req.params.userId as string;
    const { dailyLimit, monthlyLimit } = req.body;

    return updateLimits(userId, dailyLimit, monthlyLimit, res);
  } catch (error) {
    console.error('Update admin limits error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}
