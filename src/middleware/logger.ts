import { Request, Response, NextFunction } from 'express';

export interface LogEntry {
  timestamp: string;
  method: string;
  path: string;
  statusCode?: number;
  userId?: string;
  message?: string;
  error?: string;
  duration?: number;
}

/**
 * Logger middleware - logs all requests
 */
export const logger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const startDate = new Date().toISOString();

  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - startTime;
    const logEntry: LogEntry = {
      timestamp: startDate,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
    };

    if (process.env.LOG_LEVEL === 'debug') {
      console.log('[LOG]', JSON.stringify(logEntry));
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Error logger - logs errors with context
 */
export const logError = (
  error: Error,
  req: Request,
  context: string
): void => {
  console.error(`[ERROR] ${context}`, {
    message: error.message,
    stack: error.stack,
    method: req.method,
    path: req.path,
  });
};
