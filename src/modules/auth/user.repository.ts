import { prisma } from '../../database/prisma.service';
import { User, Prisma } from '@prisma/client';

export class UserRepository {
  async findByPhone(phone: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { phone } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { googleId } });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: 'insensitive' } },
          { phone: identifier }
        ]
      }
    });
  }

  async upsertByPhone(phone: string): Promise<User> {
    let user = await this.findByPhone(phone);
    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          name: 'New User',
          phoneVerifiedAt: new Date()
        }
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { phoneVerifiedAt: new Date() }
      });
    }
    return user;
  }

  async upsertByEmail(email: string): Promise<User> {
    let user = await this.findByEmail(email);
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: 'New User',
          emailVerifiedAt: new Date()
        }
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() }
      });
    }
    return user;
  }

  async linkGoogleToUser(userId: string, googleId: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { googleId, googleLinkedAt: new Date() }
    });
  }

  async createWithGoogle(googleId: string, email: string, name: string): Promise<User> {
    return prisma.user.create({
      data: {
        googleId,
        email,
        name,
        googleLinkedAt: new Date(),
        emailVerifiedAt: new Date() // Since it's from Google
      }
    });
  }
}
