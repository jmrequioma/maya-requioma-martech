import { z } from 'zod';

export const walletCreationSchema = z.object({
  userId: z.string().uuid('userId must be a valid UUID'),
  initialBalance: z.number().nonnegative('initialBalance must be non-negative').optional(),
});

export type WalletCreationInput = z.infer<typeof walletCreationSchema>;
