import { describe, it, expect, beforeEach, vi } from 'vitest';
import { faker } from '@faker-js/faker';
import * as walletModule from '../walletService.js';
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

describe('WalletService', () => {
  const testUserId = faker.string.uuid();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when user has wallet', () => {
    it('should fetch the wallet for the user', async () => {
      const mockWallet = {
        id: faker.string.uuid(),
        userId: testUserId,
        balance: 1000,
        totalSent: 0,
        totalReceived: 0,
      };

      vi.mocked(Wallet.findOne).mockResolvedValue(
        mockWallet as unknown as Awaited<ReturnType<typeof Wallet.findOne>>
      );

      const result = await walletModule.fetchWallet(testUserId);

      expect(result).toBeDefined();
      expect(result).toEqual({
        userId: testUserId,
        balance: 1000,
        totalSent: 0,
        totalReceived: 0,
      });
    });

    it('should not fetch a wallet that does not exist', async () => {
      vi.mocked(Wallet.findOne).mockResolvedValue(null);

      await expect(walletModule.fetchWallet(testUserId)).rejects.toThrow('Wallet not found');
    });

    it('should throw an error if user already has a wallet', async () => {
      vi.mocked(Wallet.findOne).mockResolvedValue({
        id: faker.string.uuid(),
        userId: testUserId,
        balance: 1000,
        totalSent: 0,
        totalReceived: 0,
      } as unknown as Awaited<ReturnType<typeof Wallet.findOne>>);

      await expect(walletModule.performWalletCreation(testUserId)).resolves.toEqual({
        success: false,
        error: 'Wallet already exists for this user',
      });
    });
  });
});
