import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import xss from 'xss';

// Global Rate Limiter
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 500 : 5000, // Generous limit for dev / storefront
  message: {
    status: 'fail',
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for static asset fetches or local development if needed
    return process.env.NODE_ENV !== 'production' && req.ip === '127.0.0.1';
  },
});

// Auth Rate Limiter
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: 'Too many authentication attempts, please try again later',
});

// Input Sanitization (XSS)
export const xssSanitizer = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && Object.keys(req.query).length > 0) {
    const sanitized = sanitizeObject(req.query);
    Object.keys(req.query).forEach(key => delete req.query[key as keyof typeof req.query]);
    Object.assign(req.query, sanitized);
  }
  if (req.params && Object.keys(req.params).length > 0) {
    const sanitized = sanitizeObject(req.params);
    Object.keys(req.params).forEach(key => delete req.params[key]);
    Object.assign(req.params, sanitized);
  }
  next();
};

const sanitizeObject = (obj: Record<string, any>): Record<string, any> => {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const sanitized: Record<string, any> = Array.isArray(obj) ? [] : {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = xss(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};
