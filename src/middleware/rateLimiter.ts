import { Request } from 'express';
import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter - 100 requests per 15 minutes
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    return req.path === '/health';
  },
});

/**
 * Strict rate limiter for transfers - 20 requests per 15 minutes
 */
export const transferLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many transfer requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth rate limiter - 5 attempts per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
