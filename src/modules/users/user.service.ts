import { prisma } from '../../database/prisma.service';
import { NotFoundError } from '../../common/errors';

export class UserService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        reputation: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, data: { name?: string }) {
    // Only name can be updated by the client here (phone/email/role updates are restricted)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        status: true,
      }
    });

    return updatedUser;
  }

  async getAddresses(userId: string) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    });
  }

  async addAddress(userId: string, data: any) {
    // If setting as default, unset others first
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Check if this is the first address, make it default if so
    if (data.isDefault === undefined || data.isDefault === false) {
      const count = await prisma.address.count({ where: { userId } });
      if (count === 0) {
        data.isDefault = true;
      }
    }

    return prisma.address.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async updateAddress(userId: string, addressId: string, data: any) {
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundError('Address not found');
    }

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.address.update({
      where: { id: addressId },
      data,
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundError('Address not found');
    }

    await prisma.address.delete({
      where: { id: addressId },
    });

    // If we deleted the default address, make the newest one default
    if (address.isDefault) {
      const newestAddress = await prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (newestAddress) {
        await prisma.address.update({
          where: { id: newestAddress.id },
          data: { isDefault: true },
        });
      }
    }
  }
}

export const userService = new UserService();
