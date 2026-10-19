import { Op } from 'sequelize';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import UserTransferLimit from '../models/UserTransferLimit.js';
import {
  getStartOfDayManila,
  getEndOfDayManila,
  getStartOfMonthManila,
  getEndOfMonthManila,
} from '../utils/timezone.js';

// Default limits (can be overridden per user)
const DEFAULT_DAILY_LIMIT = 50000; // ₱50,000
const DEFAULT_MONTHLY_LIMIT = 500000; // ₱500,000

interface TransferRequest {
  senderId: string;
  recipientId: string;
  amount: number;
}

interface TransferResponse {
  success: boolean;
  transaction?: {
    id: string;
    senderId: string;
    recipientId: string;
    amount: number;
    status: string;
  };
  error?: string;
}

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

  const result = await Transaction.findOne({
    attributes: [['SUM(amount)', 'total']],
    where: {
      senderId: userId,
      status: 'completed',
      createdAt: {
        [Op.between]: [startOfDay, endOfDay],
      },
    },
    raw: true,
  }) as any;

  return parseFloat(result?.total) || 0;
}

/**
 * Get total amount transferred by user in current month
 */
async function getMonthlySpent(userId: string): Promise<number> {
  const startOfMonth = getStartOfMonthManila();
  const endOfMonth = getEndOfMonthManila();

  const result = await Transaction.findOne({
    attributes: [['SUM(amount)', 'total']],
    where: {
      senderId: userId,
      status: 'completed',
      createdAt: {
        [Op.between]: [startOfMonth, endOfMonth],
      },
    },
    raw: true,
  }) as any;

  return parseFloat(result?.total) || 0;
}

/**
 * Get user's transfer limits (daily and monthly)
 */
async function getUserLimits(userId: string) {
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
  const { dailyLimit, monthlyLimit } = await getUserLimits(userId);
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
 * Transfer money from sender to recipient
 */
export async function transferMoney(
  request: TransferRequest
): Promise<TransferResponse> {
  const { senderId, recipientId, amount } = request;

  // Validate amount
  if (amount <= 0) {
    return {
      success: false,
      error: 'Amount must be greater than 0',
    };
  }

  // Check if sender exists
  const sender = await User.findByPk(senderId);
  if (!sender) {
    return {
      success: false,
      error: 'Sender not found',
    };
  }

  // Check if recipient exists
  const recipient = await User.findByPk(recipientId);
  if (!recipient) {
    return {
      success: false,
      error: 'Recipient not found',
    };
  }

  // Prevent self-transfer
  if (senderId === recipientId) {
    return {
      success: false,
      error: 'Cannot transfer to yourself',
    };
  }

  // Get sender's wallet
  let senderWallet = await Wallet.findOne({ where: { userId: senderId } });
  if (!senderWallet) {
    return {
      success: false,
      error: 'Sender wallet not found',
    };
  }

  // Check balance
  if (parseFloat(senderWallet.balance.toString()) < amount) {
    return {
      success: false,
      error: `Insufficient balance. Current balance: ₱${parseFloat(senderWallet.balance.toString()).toFixed(2)}`,
    };
  }

  // Get user's limits
  const { dailyLimit, monthlyLimit } = await getUserLimits(senderId);

  // Get current spending
  const dailySpent = await getDailySpent(senderId);
  const monthlySpent = await getMonthlySpent(senderId);

  // Check daily limit
  if (dailySpent + amount > dailyLimit) {
    const remaining = dailyLimit - dailySpent;
    return {
      success: false,
      error: `Daily limit exceeded. Remaining today: ₱${remaining.toFixed(2)}`,
    };
  }

  // Check monthly limit
  if (monthlySpent + amount > monthlyLimit) {
    const remaining = monthlyLimit - monthlySpent;
    return {
      success: false,
      error: `Monthly limit exceeded. Remaining this month: ₱${remaining.toFixed(2)}`,
    };
  }

  // Create transaction
  try {
    const transaction = await Transaction.create({
      senderId,
      recipientId,
      amount,
      status: 'completed',
    });

    // Update sender's wallet
    senderWallet.balance = parseFloat(senderWallet.balance.toString()) - amount;
    senderWallet.totalSent = parseFloat(senderWallet.totalSent.toString()) + amount;
    await senderWallet.save();

    // Update recipient's wallet
    let recipientWallet = await Wallet.findOne({ where: { userId: recipientId } });
    if (recipientWallet) {
      recipientWallet.balance = parseFloat(recipientWallet.balance.toString()) + amount;
      recipientWallet.totalReceived = parseFloat(recipientWallet.totalReceived.toString()) + amount;
      await recipientWallet.save();
    }

    return {
      success: true,
      transaction: {
        id: transaction.id,
        senderId: transaction.senderId,
        recipientId: transaction.recipientId,
        amount: parseFloat(transaction.amount.toString()),
        status: transaction.status,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to create transaction',
    };
  }
}

/**
 * Get wallet for a user
 */
export async function getWallet(userId: string) {
  const wallet = await Wallet.findOne({ where: { userId } });

  if (!wallet) {
    return {
      error: 'Wallet not found',
    };
  }

  return {
    userId,
    balance: parseFloat(wallet.balance.toString()),
    totalSent: parseFloat(wallet.totalSent.toString()),
    totalReceived: parseFloat(wallet.totalReceived.toString()),
  };
}

/**
 * Create a wallet for a new user
 */
export async function createWallet(userId: string, initialBalance: number = 0) {
  try {
    const wallet = await Wallet.create({
      userId,
      balance: initialBalance,
      totalSent: 0,
      totalReceived: 0,
    });

    // Create default transfer limits for the user
    await UserTransferLimit.create({
      userId,
      dailyLimit: DEFAULT_DAILY_LIMIT,
      monthlyLimit: DEFAULT_MONTHLY_LIMIT,
    });

    return {
      success: true,
      wallet: {
        id: wallet.id,
        userId: wallet.userId,
        balance: parseFloat(wallet.balance.toString()),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to create wallet',
    };
  }
}

/**
 * Get transaction history for a user
 */
export async function getTransactionHistory(
  userId: string,
  limit: number = 50,
  offset: number = 0
) {
  const transactions = await Transaction.findAndCountAll({
    where: {
      [Op.or]: [{ senderId: userId }, { recipientId: userId }],
    },
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return {
    total: transactions.count,
    limit,
    offset,
    transactions: transactions.rows.map((t) => ({
      id: t.id,
      senderId: t.senderId,
      recipientId: t.recipientId,
      amount: parseFloat(t.amount.toString()),
      status: t.status,
      failureReason: t.failureReason,
      createdAt: t.createdAt,
    })),
  };
}

/**
 * Update transfer limits for a user
 */
export async function updateUserLimits(
  userId: string,
  dailyLimit?: number,
  monthlyLimit?: number
) {
  try {
    let limits = await UserTransferLimit.findOne({ where: { userId } });

    if (!limits) {
      limits = await UserTransferLimit.create({
        userId,
        dailyLimit: dailyLimit || DEFAULT_DAILY_LIMIT,
        monthlyLimit: monthlyLimit || DEFAULT_MONTHLY_LIMIT,
      });
    } else {
      if (dailyLimit !== undefined) limits.dailyLimit = dailyLimit;
      if (monthlyLimit !== undefined) limits.monthlyLimit = monthlyLimit;
      await limits.save();
    }

    return {
      success: true,
      limits: {
        userId,
        dailyLimit: parseFloat(limits.dailyLimit.toString()),
        monthlyLimit: parseFloat(limits.monthlyLimit.toString()),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to update limits',
    };
  }
}
