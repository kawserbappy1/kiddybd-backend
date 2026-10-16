"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promotionService = exports.PromotionService = void 0;
const prisma_service_1 = require("../../database/prisma.service");
class PromotionService {
    async getActivePromotions() {
        const now = new Date();
        // Cache logic should be implemented via Redis ideally
        return prisma_service_1.prisma.promotion.findMany({
            where: {
                isActive: true,
                startDate: { lte: now },
                endDate: { gte: now }
            },
            orderBy: { priority: 'desc' }
        });
    }
    async createPromotion(dto) {
        return prisma_service_1.prisma.promotion.create({ data: dto });
    }
    async updatePromotion(id, dto) {
        return prisma_service_1.prisma.promotion.update({ where: { id }, data: dto });
    }
}
exports.PromotionService = PromotionService;
exports.promotionService = new PromotionService();
