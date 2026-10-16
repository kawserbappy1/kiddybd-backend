import { Role } from '@prisma/client';

export interface TokenPayload {
  userId: string;
  role: Role;
}

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
}
