import { Request, Response, NextFunction } from 'express';
import { AppError } from '../common/errors';
import { env } from '../config/env';
import { logger } from '../config/logger';

// Remove sensitive data from log details
const sanitizeDetails = (details: any[]): any[] => {
  return details.map(detail => {
    if (typeof detail === 'object' && detail !== null) {
      const sanitized = { ...detail };
      ['password', 'token', 'otp'].forEach(key => {
        if (key in sanitized) sanitized[key] = '***';
      });
      return sanitized;
    }
    return detail;
  });
};

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    logger.error(`[${err.errorCode}] ${err.message}`, {
      method: req.method,
      path: req.path,
      statusCode: err.statusCode,
      details: sanitizeDetails(err.details)
    });

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: {
        code: err.errorCode,
        details: sanitizeDetails(err.details)
      }
    });
    return;
  }

  // Unhandled errors
  logger.error(`[INTERNAL_ERROR] ${err.message}`, {
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
    method: req.method,
    path: req.path,
  });

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: {
      code: 'INTERNAL_ERROR',
      details: env.NODE_ENV === 'development' ? [err.message] : []
    }
  });
};
