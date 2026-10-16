import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AppError } from '../common/errors';

export const authorize = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'));
    }

    next();
  };
};
