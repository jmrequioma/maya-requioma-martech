import { z } from 'zod';

export const transferSchema = z.object({
  recipientId: z.string().uuid('recipientId must be a valid UUID'),
  amount: z.number().positive('amount must be a positive number'),
});

export const adminTransferSchema = z.object({
  senderId: z.string().uuid('senderId must be a valid UUID'),
  recipientId: z.string().uuid('recipientId must be a valid UUID'),
  amount: z.number().positive('amount must be a positive number'),
});

export type TransferInput = z.infer<typeof transferSchema>;
export type AdminTransferInput = z.infer<typeof adminTransferSchema>;
