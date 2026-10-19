import { z } from 'zod';

const loginSchema = z.object({
  handleId: z.string().min(1, 'Handle ID is required'),
  password: z.string().min(1, 'Password is required'),
});

export { loginSchema };
