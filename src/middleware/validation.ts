import { Request, Response, NextFunction } from 'express';

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate transfer request body
 */
export const validateTransfer = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { senderId, recipientId, amount } = req.body;
  const errors: ValidationError[] = [];

  if (!senderId || typeof senderId !== 'string') {
    errors.push({ field: 'senderId', message: 'senderId is required and must be a string' });
  }

  if (!recipientId || typeof recipientId !== 'string') {
    errors.push({ field: 'recipientId', message: 'recipientId is required and must be a string' });
  }

  if (amount === undefined || amount === null) {
    errors.push({ field: 'amount', message: 'amount is required' });
  } else if (typeof amount !== 'number' || amount <= 0) {
    errors.push({ field: 'amount', message: 'amount must be a positive number' });
  }

  if (errors.length > 0) {
    res.status(400).json({
      error: 'Validation failed',
      details: errors,
    });
    return;
  }

  next();
};

/**
 * Validate wallet creation request
 */
export const validateWalletCreation = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { userId, initialBalance } = req.body;
  const errors: ValidationError[] = [];

  if (!userId || typeof userId !== 'string') {
    errors.push({ field: 'userId', message: 'userId is required and must be a string' });
  }

  if (initialBalance !== undefined && initialBalance !== null) {
    if (typeof initialBalance !== 'number' || initialBalance < 0) {
      errors.push({ field: 'initialBalance', message: 'initialBalance must be a non-negative number' });
    }
  }

  if (errors.length > 0) {
    res.status(400).json({
      error: 'Validation failed',
      details: errors,
    });
    return;
  }

  next();
};

/**
 * Validate query parameters for pagination
 */
export const validatePagination = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { limit, offset } = req.query;
  const errors: ValidationError[] = [];

  if (limit !== undefined && (typeof limit !== 'string' || isNaN(parseInt(limit)))) {
    errors.push({ field: 'limit', message: 'limit must be a valid number' });
  }

  if (offset !== undefined && (typeof offset !== 'string' || isNaN(parseInt(offset)))) {
    errors.push({ field: 'offset', message: 'offset must be a valid number' });
  }

  if (errors.length > 0) {
    res.status(400).json({
      error: 'Validation failed',
      details: errors,
    });
    return;
  }

  next();
};
