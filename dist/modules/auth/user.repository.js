"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const prisma_service_1 = require("../../database/prisma.service");
class UserRepository {
    async findByPhone(phone) {
        return prisma_service_1.prisma.user.findUnique({ where: { phone } });
    }
    async findByEmail(email) {
        return prisma_service_1.prisma.user.findUnique({ where: { email } });
    }
    async findByGoogleId(googleId) {
        return prisma_service_1.prisma.user.findUnique({ where: { googleId } });
    }
    async findById(id) {
        return prisma_service_1.prisma.user.findUnique({ where: { id } });
    }
    async findByIdentifier(identifier) {
        return prisma_service_1.prisma.user.findFirst({
            where: {
                OR: [
                    { email: { equals: identifier, mode: 'insensitive' } },
                    { phone: identifier }
                ]
            }
        });
    }
    async upsertByPhone(phone) {
        let user = await this.findByPhone(phone);
        if (!user) {
            user = await prisma_service_1.prisma.user.create({
                data: {
                    phone,
                    name: 'New User',
                    phoneVerifiedAt: new Date()
                }
            });
        }
        else {
            user = await prisma_service_1.prisma.user.update({
                where: { id: user.id },
                data: { phoneVerifiedAt: new Date() }
            });
        }
        return user;
    }
    async upsertByEmail(email) {
        let user = await this.findByEmail(email);
        if (!user) {
            user = await prisma_service_1.prisma.user.create({
                data: {
                    email,
                    name: 'New User',
                    emailVerifiedAt: new Date()
                }
            });
        }
        else {
            user = await prisma_service_1.prisma.user.update({
                where: { id: user.id },
                data: { emailVerifiedAt: new Date() }
            });
        }
        return user;
    }
    async linkGoogleToUser(userId, googleId) {
        return prisma_service_1.prisma.user.update({
            where: { id: userId },
            data: { googleId, googleLinkedAt: new Date() }
        });
    }
    async createWithGoogle(googleId, email, name) {
        return prisma_service_1.prisma.user.create({
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
exports.UserRepository = UserRepository;
