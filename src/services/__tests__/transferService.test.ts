import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    getLimitUsage,
    transferMoney,
    getWallet,
    createWallet,
    getTransactionHistory,
    updateUserLimits,
} from '../transferService.js';

describe('TransferService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should export getLimitUsage function', () => {
        expect(typeof getLimitUsage).toBe('function');
    });

    it('should export transferMoney function', () => {
        expect(typeof transferMoney).toBe('function');
    });

    it('should export getWallet function', () => {
        expect(typeof getWallet).toBe('function');
    });

    it('should export createWallet function', () => {
        expect(typeof createWallet).toBe('function');
    });

    it('should export getTransactionHistory function', () => {
        expect(typeof getTransactionHistory).toBe('function');
    });

    it('should export updateUserLimits function', () => {
        expect(typeof updateUserLimits).toBe('function');
    });
});
