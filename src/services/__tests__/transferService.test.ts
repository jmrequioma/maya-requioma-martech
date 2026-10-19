import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getLimitUsage } from '../transferService.js';

describe('TransferService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export getLimitUsage function', () => {
    expect(typeof getLimitUsage).toBe('function');
  });
});
