import { z } from 'zod';

export const loginSchema = z.object({
  handleId: z.string().min(1, 'handleId is required'),
  password: z.string().min(1, 'password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
