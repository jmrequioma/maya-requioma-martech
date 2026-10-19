import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'some-secret-key';

export interface AuthRequest extends Request {
  userId?: string;
  token?: string;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'No token provided',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    req.token = token;
    next();
  } catch (error) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid or expired token',
    });
  }
};

/**
 * Generate JWT token for a user. Just a simple token generation
 */
export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
};
