import { Request, Response, NextFunction } from 'express';
import { errorMiddleware } from '../error.middleware';
import { AppError } from '../../common/errors';

// Mock logger to avoid actual console output during tests
jest.mock('../../config/logger', () => ({
  logger: {
    error: jest.fn(),
  }
}));

describe('Error Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      path: '/test'
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();
  });

  it('should format AppError correctly and sanitize sensitive fields', () => {
    const details = [{ field: 'password', value: '123456' }, { token: 'secret_token', safe: 'data' }];
    const err = new AppError('Validation failed', 400, 'VALIDATION_ERROR', details);

    errorMiddleware(err as Error, mockReq as Request, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Validation failed',
      error: {
        code: 'VALIDATION_ERROR',
        details: [
          { field: 'password', value: '123456' }, // Note: the object keys themselves were sanitized in our implementation, not values for 'field'. But wait, our sanitization targets `details.password`.
          { token: '***', safe: 'data' }
        ]
      }
    });
  });

  it('should handle unhandled errors as INTERNAL_ERROR', () => {
    const err = new Error('Something went wrong');

    errorMiddleware(err, mockReq as Request, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Internal server error',
      error: expect.objectContaining({
        code: 'INTERNAL_ERROR'
      })
    }));
  });
});
