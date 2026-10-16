import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { TokenPayload } from './auth.types';

export class TokenService {
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  }

  generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  }

  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
  }

  verifyRefreshToken(token: string): { userId: string } {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string };
  }
}
