import { AppError, ValidationError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError, InternalError } from '../index';

describe('Custom Error Classes', () => {
  it('AppError should have standard properties', () => {
    const err = new AppError('test error', 400, 'TEST_ERROR', [{ field: 'test' }]);
    expect(err.message).toBe('test error');
    expect(err.statusCode).toBe(400);
    expect(err.errorCode).toBe('TEST_ERROR');
    expect(err.details).toEqual([{ field: 'test' }]);
    expect(err).toBeInstanceOf(Error);
  });

  it('ValidationError should default to 400 and VALIDATION_ERROR', () => {
    const err = new ValidationError('Invalid input');
    expect(err.statusCode).toBe(400);
    expect(err.errorCode).toBe('VALIDATION_ERROR');
  });

  it('UnauthorizedError should default to 401', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.errorCode).toBe('UNAUTHORIZED');
  });

  it('ForbiddenError should default to 403', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
  });

  it('NotFoundError should default to 404', () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
  });

  it('ConflictError should default to 409', () => {
    const err = new ConflictError();
    expect(err.statusCode).toBe(409);
  });

  it('InternalError should default to 500', () => {
    const err = new InternalError();
    expect(err.statusCode).toBe(500);
  });
});
