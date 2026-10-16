import { TokenPayload } from '../../src/modules/auth/auth.types';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
