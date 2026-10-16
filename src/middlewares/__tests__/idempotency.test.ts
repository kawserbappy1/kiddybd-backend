import { Request, Response, NextFunction } from 'express';
import { idempotencyMiddleware } from '../idempotency.middleware';
import { prisma } from '../../database/prisma.service';
import crypto from 'crypto';

jest.mock('../../database/prisma.service', () => ({
  prisma: {
    idempotencyKey: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  }
}));

describe('IdempotencyMiddleware', () => {
  let req: Partial<Request> & { user?: any };
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      header: jest.fn().mockReturnValue('test-key'),
      user: { id: 'user-1' } as any,
      originalUrl: '/test',
      body: { amount: 100 }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  const getHash = (body: any) => crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');

  it('should proceed and create idempotency key if not exists', async () => {
    (prisma.idempotencyKey.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.idempotencyKey.create as jest.Mock).mockResolvedValue({ key: 'test-key' });

    await idempotencyMiddleware(req as Request, res as Response, next);

    expect(prisma.idempotencyKey.findUnique).toHaveBeenCalledWith({ where: { key: 'test-key' } });
    expect(prisma.idempotencyKey.create).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('should return stored response if key exists and has responseStatus', async () => {
    (prisma.idempotencyKey.findUnique as jest.Mock).mockResolvedValue({
      key: 'test-key',
      userId: 'user-1',
      requestHash: getHash(req.body),
      responseStatus: 200,
      responseBody: { success: true }
    });

    await idempotencyMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 409 CONFLICT if key exists but no responseStatus (in-flight)', async () => {
    (prisma.idempotencyKey.findUnique as jest.Mock).mockResolvedValue({
      key: 'test-key',
      userId: 'user-1',
      requestHash: getHash(req.body),
      responseStatus: null, // in-flight
    });

    await idempotencyMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('in-flight') }));
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 422 UNPROCESSABLE_ENTITY if key exists but requestHash differs', async () => {
    (prisma.idempotencyKey.findUnique as jest.Mock).mockResolvedValue({
      key: 'test-key',
      userId: 'user-1',
      requestHash: 'different-hash',
    });

    await idempotencyMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('payload is different') }));
    expect(next).not.toHaveBeenCalled();
  });
});
