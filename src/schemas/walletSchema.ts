import { z } from 'zod';

export const walletCreationSchema = z.object({
  initialBalance: z.number().nonnegative('initialBalance must be non-negative').optional(),
});

export type WalletCreationInput = z.infer<typeof walletCreationSchema>;
