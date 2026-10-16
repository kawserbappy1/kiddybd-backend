import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { logger } from '../config/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  req.id = req.headers['x-request-id'] as string || randomUUID();
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const userId = (req as any).user?.id || 'unauthenticated';
    
    // Check if error status code
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    
    logger.log(level, `[${req.method}] ${req.originalUrl}`, {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId,
      ip: req.ip
    });
  });

  next();
};
