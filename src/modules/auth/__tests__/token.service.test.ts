import { TokenService } from '../token.service';
import { Role } from '@prisma/client';
import jwt from 'jsonwebtoken';

jest.mock('../../../config/env', () => ({
  env: {
    JWT_ACCESS_SECRET: 'test_access_secret',
    JWT_REFRESH_SECRET: 'test_refresh_secret',
  }
}));

describe('TokenService', () => {
  let tokenService: TokenService;

  beforeEach(() => {
    tokenService = new TokenService();
  });

  it('should generate valid access token', () => {
    const payload = { userId: '123', role: Role.CUSTOMER };
    const token = tokenService.generateAccessToken(payload);
    
    expect(token).toBeDefined();
    const decoded = jwt.verify(token, 'test_access_secret') as any;
    expect(decoded.userId).toBe('123');
    expect(decoded.role).toBe(Role.CUSTOMER);
  });

  it('should generate valid refresh token', () => {
    const token = tokenService.generateRefreshToken('123');
    
    expect(token).toBeDefined();
    const decoded = jwt.verify(token, 'test_refresh_secret') as any;
    expect(decoded.userId).toBe('123');
  });

  it('should verify access token correctly', () => {
    const token = jwt.sign({ userId: '123', role: Role.CUSTOMER }, 'test_access_secret');
    const result = tokenService.verifyAccessToken(token);
    expect(result.userId).toBe('123');
    expect(result.role).toBe(Role.CUSTOMER);
  });
});
