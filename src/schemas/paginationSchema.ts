import { z } from 'zod';

export const paginationSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
