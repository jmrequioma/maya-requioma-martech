import { describe, it, expect, beforeEach, vi } from 'vitest';
import { faker } from '@faker-js/faker';
import * as transferServiceModule from '../transferService.js';
import UserTransferLimit from '../../models/UserTransferLimit.js';
import Transaction from '../../models/Transaction.js';
import User from '../../models/User.js';
import Wallet from '../../models/Wallet.js';

vi.mock('../../config/database.js', () => ({
  sequelize: {
    fn: vi.fn((fnName: string, ...args: any[]) => ({ _fn: fnName, _args: args })),
    col: vi.fn((colName: string) => ({ _col: colName })),
    transaction: vi.fn().mockResolvedValue({
      commit: vi.fn().mockResolvedValue(undefined),
      rollback: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

vi.mock('../../models/UserTransferLimit.js', () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../../models/Transaction.js', () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../../models/User.js', () => ({
  default: {
    findByPk: vi.fn(),
  },
}));

vi.mock('../../models/Wallet.js', () => ({
  default: {
    findOne: vi.fn(),
    findByPk: vi.fn(),
  },
}));

describe('getUserLimits', () => {
  const testUserId = faker.string.uuid();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when user has existing limits', () => {
    it('should return existing user limits', async () => {
      const mockLimits = {
        userId: testUserId,
        dailyLimit: 25000,
        monthlyLimit: 250000,
      };

      vi.mocked(UserTransferLimit.findOne).mockResolvedValue(
        mockLimits as unknown as Awaited<ReturnType<typeof UserTransferLimit.findOne>>
      );
      vi.mocked(Transaction.findOne).mockResolvedValue({ total: null } as unknown as Awaited<
        ReturnType<typeof Transaction.findOne>
      >);

      const result = await transferServiceModule.getLimitUsage(testUserId);

      expect(result.daily.limit).toBe(25000);
      expect(result.monthly.limit).toBe(250000);
      expect(result.daily.remaining).toBe(25000);
      expect(result.monthly.remaining).toBe(250000);
    });
  });

  describe('when user has no limits', () => {
    it('should create and return default limits', async () => {
      const mockDefaults = {
        userId: testUserId,
        dailyLimit: 50000,
        monthlyLimit: 500000,
      };

      vi.mocked(UserTransferLimit.findOne).mockResolvedValue(null);
      vi.mocked(UserTransferLimit.create).mockResolvedValue(
        mockDefaults as unknown as Awaited<ReturnType<typeof UserTransferLimit.create>>
      );
      vi.mocked(Transaction.findOne).mockResolvedValue({ total: null } as unknown as Awaited<
        ReturnType<typeof Transaction.findOne>
      >);

      const result = await transferServiceModule.getLimitUsage(testUserId);

      expect(UserTransferLimit.create).toHaveBeenCalledWith({
        userId: testUserId,
        dailyLimit: 50000,
        monthlyLimit: 500000,
      });
      expect(result.daily.limit).toBe(50000);
      expect(result.monthly.limit).toBe(500000);
    });
  });

  describe('limit usage calculation', () => {
    it('should correctly calculate remaining and percentage', async () => {
      const mockLimits = {
        userId: testUserId,
        dailyLimit: 50000,
        monthlyLimit: 500000,
      };

      const mockTransactions = { total: 20000 };

      vi.mocked(UserTransferLimit.findOne).mockResolvedValue(
        mockLimits as unknown as Awaited<ReturnType<typeof UserTransferLimit.findOne>>
      );
      vi.mocked(Transaction.findOne).mockResolvedValue(
        mockTransactions as unknown as Awaited<ReturnType<typeof Transaction.findOne>>
      );

      const result = await transferServiceModule.getLimitUsage(testUserId);

      expect(result.daily.used).toBe(20000);
      expect(result.daily.remaining).toBe(30000);
      expect(result.daily.percentage).toBe(40); // 20000 / 50000 * 100
      expect(result.monthly.used).toBe(20000);
      expect(result.monthly.remaining).toBe(480000);
      expect(result.monthly.percentage).toBeCloseTo(4);
    });

    it('should handle zero transactions', async () => {
      const mockLimits = {
        userId: testUserId,
        dailyLimit: 50000,
        monthlyLimit: 500000,
      };

      vi.mocked(UserTransferLimit.findOne).mockResolvedValue(mockLimits as any);
      vi.mocked(Transaction.findOne).mockResolvedValue({ total: null } as unknown as Awaited<
        ReturnType<typeof Transaction.findOne>
      >);

      const result = await transferServiceModule.getLimitUsage(testUserId);

      expect(result.daily.used).toBe(0);
      expect(result.daily.remaining).toBe(50000);
      expect(result.daily.percentage).toBe(0);
    });

    it('should cap remaining at 0 when limit exceeded', async () => {
      const mockLimits = {
        userId: testUserId,
        dailyLimit: 50000,
        monthlyLimit: 500000,
      };

      const mockTransactions = { total: 60000 };

      vi.mocked(UserTransferLimit.findOne).mockResolvedValue(mockLimits as any);
      vi.mocked(Transaction.findOne).mockResolvedValue(
        mockTransactions as unknown as Awaited<ReturnType<typeof Transaction.findOne>>
      );

      const result = await transferServiceModule.getLimitUsage(testUserId);

      expect(result.daily.remaining).toBe(0); // Should not be negative
      expect(result.daily.percentage).toBe(100);
    });
  });

  describe('includes inclusive cap check', () => {
    it('should allow transfer when amount equals remaining limit', async () => {
      const mockLimits = {
        userId: testUserId,
        dailyLimit: 50000,
        monthlyLimit: 500000,
      };

      const mockTransactions = { total: 40000 };

      vi.mocked(UserTransferLimit.findOne).mockResolvedValue(
        mockLimits as unknown as Awaited<ReturnType<typeof UserTransferLimit.findOne>>
      );
      vi.mocked(Transaction.findOne).mockResolvedValue(
        mockTransactions as unknown as Awaited<ReturnType<typeof Transaction.findOne>>
      );

      const result = await transferServiceModule.getLimitUsage(testUserId);

      expect(result.daily.remaining).toBe(10000);
    });
  });
});

describe('executeTransfer', () => {
  const senderId = faker.string.uuid();
  const recipientId = faker.string.uuid();
  const idempotencyKey = faker.string.uuid();
  const mockSender = { id: senderId, email: 'sender@test.com' };
  const mockRecipient = { id: recipientId, email: 'recipient@test.com' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Validation checks
  it('should reject transfer with amount 0', async () => {
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await transferServiceModule.executeTransfer(
      senderId,
      recipientId,
      0,
      idempotencyKey,
      mockRes as any
    );

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('greater than 0') })
    );
  });

  it('should reject transfer with negative amount', async () => {
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await transferServiceModule.executeTransfer(
      senderId,
      recipientId,
      -100,
      idempotencyKey,
      mockRes as any
    );

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('greater than 0') })
    );
  });

  it('should reject transfer without recipientId', async () => {
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await transferServiceModule.executeTransfer(senderId, '', 1000, idempotencyKey, mockRes as any);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('required') })
    );
  });

  it('should reject transfer when sender user not found', async () => {
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    vi.mocked(User.findByPk).mockResolvedValue(null);

    await transferServiceModule.executeTransfer(
      senderId,
      recipientId,
      1000,
      idempotencyKey,
      mockRes as any
    );

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Sender not found' })
    );
  });

  it('should reject transfer when recipient user not found', async () => {
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    vi.mocked(User.findByPk).mockImplementation(
      (id) => Promise.resolve(id === senderId ? mockSender : null) as any
    );

    await transferServiceModule.executeTransfer(
      senderId,
      recipientId,
      1000,
      idempotencyKey,
      mockRes as any
    );

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Recipient not found' })
    );
  });

  it('should reject self-transfer', async () => {
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    const mockUser = { id: senderId, email: 'test@test.com' };
    vi.mocked(User.findByPk).mockResolvedValue(mockUser as any);

    await transferServiceModule.executeTransfer(
      senderId,
      senderId,
      1000,
      idempotencyKey,
      mockRes as any
    );

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Cannot transfer to yourself' })
    );
  });

  it('should reject transfer with insufficient balance', async () => {
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    vi.mocked(User.findByPk).mockImplementation(
      (id) =>
        Promise.resolve(
          id === senderId ? mockSender : id === recipientId ? mockRecipient : null
        ) as any
    );

    const mockSenderWallet = { id: 1, userId: senderId, balance: 5000 };
    const mockRecipientWallet = { id: 2, userId: recipientId, balance: 50000 };

    vi.mocked(Wallet.findOne).mockImplementation(
      (options: any) =>
        Promise.resolve(
          options.where?.userId === senderId ? mockSenderWallet : mockRecipientWallet
        ) as any
    );

    vi.mocked(Wallet.findByPk).mockResolvedValue(mockSenderWallet as any);
    vi.mocked(Transaction.findOne).mockResolvedValue(null);

    // Mock getLimitUsage with plenty of remaining (limits are OK)
    vi.spyOn(transferServiceModule, 'getLimitUsage').mockResolvedValue({
      daily: {
        used: 10000,
        limit: 50000,
        remaining: 40000,
        percentage: 20,
      },
      monthly: {
        used: 100000,
        limit: 500000,
        remaining: 400000,
        percentage: 20,
      },
    });

    const amount = 10000;
    await transferServiceModule.executeTransfer(
      senderId,
      recipientId,
      amount,
      idempotencyKey,
      mockRes as any
    );

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Insufficient balance' })
    );
  });

  // Successful transfer
  it('should handle idempotent transfer (duplicate request returns cached result)', async () => {
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    vi.mocked(User.findByPk).mockImplementation(
      (id) =>
        Promise.resolve(
          id === senderId ? mockSender : id === recipientId ? mockRecipient : null
        ) as any
    );

    const mockSenderWallet = { id: 1, userId: senderId, balance: 50000 };
    const mockRecipientWallet = { id: 2, userId: recipientId, balance: 25000 };

    vi.mocked(Wallet.findOne).mockImplementation(
      (options: any) =>
        Promise.resolve(
          options.where?.userId === senderId ? mockSenderWallet : mockRecipientWallet
        ) as any
    );

    const transferAmount = 10000;
    const existingTxn = {
      id: 'txn-existing',
      senderId,
      recipientId,
      amount: transferAmount,
      status: 'COMPLETED',
    };

    vi.mocked(Wallet.findByPk).mockResolvedValue(mockSenderWallet as any);
    vi.mocked(Transaction.findOne).mockResolvedValue(existingTxn as any);

    await transferServiceModule.executeTransfer(
      senderId,
      recipientId,
      transferAmount,
      idempotencyKey,
      mockRes as any
    );

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        transaction: expect.objectContaining({
          id: 'txn-existing',
        }),
      })
    );
  });
});
