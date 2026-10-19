import { Request, Response, NextFunction } from 'express';

/**
 * Global error handler middleware
 * Should be added as the last middleware in the app
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('[ERROR HANDLER]', {
    message: error.message,
    stack: error.stack,
    method: req.method,
    path: req.path,
  });

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred',
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  res.status(404).json({
    error: 'Not found',
    message: `Endpoint ${req.method} ${req.path} does not exist`,
  });
};
