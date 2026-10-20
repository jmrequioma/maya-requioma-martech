import { z } from 'zod';

export const registerSchema = z.object({
  handleId: z.string().min(1, 'handleId is required'),
  password: z.string().min(1, 'password is required'),
  firstName: z.string().min(1, 'firstName is required'),
  lastName: z.string().min(1, 'lastName is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
