import { z } from 'zod';

export const updateLimitsSchema = z
  .object({
    dailyLimit: z.number().positive('Daily limit must be a positive number').optional(),
    monthlyLimit: z.number().positive('Monthly limit must be a positive number').optional(),
  })
  .refine((data) => data.dailyLimit || data.monthlyLimit, {
    message: 'At least one limit must be provided',
  });

export type UpdateLimitsInput = z.infer<typeof updateLimitsSchema>;
