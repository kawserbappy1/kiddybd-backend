import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError, ZodIssue } from 'zod';
import { AppError } from '../common/errors';

export const validateRequest = (schema: ZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((e: ZodIssue) => ({
          path: e.path.join('.'),
          message: e.message
        }));
        next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', details));
      } else {
        next(error);
      }
    }
  };
};
