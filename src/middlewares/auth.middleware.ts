import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../modules/auth/token.service';
import { AppError } from '../common/errors';

const tokenService = new TokenService();

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('Missing or invalid token format', 401, 'UNAUTHORIZED'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = tokenService.verifyAccessToken(token);
    (req as any).user = {
      ...payload,
      id: payload.userId,
      userId: payload.userId,
    };
    next();
  } catch (err) {
    next(new AppError('Invalid or expired token', 401, 'UNAUTHORIZED'));
  }
};
