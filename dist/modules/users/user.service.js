"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const prisma_service_1 = require("../../database/prisma.service");
const errors_1 = require("../../common/errors");
class UserService {
    async getProfile(userId) {
        const user = await prisma_service_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                avatarUrl: true,
                role: true,
                status: true,
                createdAt: true,
                reputation: true,
            },
        });
        if (!user) {
            throw new errors_1.NotFoundError('User not found');
        }
        return user;
    }
    async updateProfile(userId, data) {
        const updateData = {};
        if (data.name !== undefined)
            updateData.name = data.name;
        if (data.avatarUrl !== undefined)
            updateData.avatarUrl = data.avatarUrl;
        const updatedUser = await prisma_service_1.prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                avatarUrl: true,
                role: true,
                status: true,
                createdAt: true,
            }
        });
        return updatedUser;
    }
    async getAddresses(userId) {
        return prisma_service_1.prisma.address.findMany({
            where: { userId },
            orderBy: { isDefault: 'desc' },
        });
    }
    async addAddress(userId, data) {
        // If setting as default, unset others first
        if (data.isDefault) {
            await prisma_service_1.prisma.address.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false },
            });
        }
        // Check if this is the first address, make it default if so
        if (data.isDefault === undefined || data.isDefault === false) {
            const count = await prisma_service_1.prisma.address.count({ where: { userId } });
            if (count === 0) {
                data.isDefault = true;
            }
        }
        return prisma_service_1.prisma.address.create({
            data: {
                ...data,
                userId,
            },
        });
    }
    async updateAddress(userId, addressId, data) {
        const address = await prisma_service_1.prisma.address.findFirst({
            where: { id: addressId, userId },
        });
        if (!address) {
            throw new errors_1.NotFoundError('Address not found');
        }
        if (data.isDefault) {
            await prisma_service_1.prisma.address.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false },
            });
        }
        return prisma_service_1.prisma.address.update({
            where: { id: addressId },
            data,
        });
    }
    async deleteAddress(userId, addressId) {
        const address = await prisma_service_1.prisma.address.findFirst({
            where: { id: addressId, userId },
        });
        if (!address) {
            throw new errors_1.NotFoundError('Address not found');
        }
        await prisma_service_1.prisma.address.delete({
            where: { id: addressId },
        });
        // If we deleted the default address, make the newest one default
        if (address.isDefault) {
            const newestAddress = await prisma_service_1.prisma.address.findFirst({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });
            if (newestAddress) {
                await prisma_service_1.prisma.address.update({
                    where: { id: newestAddress.id },
                    data: { isDefault: true },
                });
            }
        }
    }
}
exports.UserService = UserService;
exports.userService = new UserService();
