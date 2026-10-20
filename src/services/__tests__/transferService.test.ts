import { describe, it, expect, beforeEach, vi } from 'vitest';
import { faker } from '@faker-js/faker';
import { getLimitUsage } from '../transferService.js';
import UserTransferLimit from '../../models/UserTransferLimit.js';
import Transaction from '../../models/Transaction.js';

vi.mock('../../models/UserTransferLimit.js', () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../../models/Transaction.js', () => ({
  default: {
    findOne: vi.fn(),
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

      const result = await getLimitUsage(testUserId);

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

      const result = await getLimitUsage(testUserId);

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

      const result = await getLimitUsage(testUserId);

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

      const result = await getLimitUsage(testUserId);

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

      const result = await getLimitUsage(testUserId);

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

      const result = await getLimitUsage(testUserId);

      expect(result.daily.remaining).toBe(10000);
    });
  });
});
