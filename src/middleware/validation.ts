import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { loginSchema } from '../schemas/loginSchema.js';
import { transferSchema, adminTransferSchema } from '../schemas/transferSchema.js';
import { walletCreationSchema } from '../schemas/walletSchema.js';
import { paginationSchema } from '../schemas/paginationSchema.js';

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Generic validation middleware factory
 */
const createValidationMiddleware = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate body for POST/PUT requests, query for GET requests
      const data = ['POST', 'PUT'].includes(req.method) ? req.body : req.query;
      schema.parse(data);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: ValidationError[] = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          error: 'Validation failed',
          details: errors,
        });
        return;
      }

      res.status(500).json({
        error: 'Internal validation error',
      });
    }
  };
};

/**
 * Validate login request
 */
export const validateLogin = createValidationMiddleware(loginSchema);

/**
 * Validate transfer request body
 */
export const validateTransfer = createValidationMiddleware(transferSchema);

/**
 * Validate admin transfer request body
 */
export const validateAdminTransfer = createValidationMiddleware(adminTransferSchema);

/**
 * Validate wallet creation request
 */
export const validateWalletCreation = createValidationMiddleware(walletCreationSchema);

/**
 * Validate query parameters for pagination
 */
export const validatePagination = createValidationMiddleware(paginationSchema);

export const validateCreateWallet = createValidationMiddleware(walletCreationSchema);
