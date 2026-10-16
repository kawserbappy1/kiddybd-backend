import { prisma } from '../../database/prisma.service';

export class PromotionService {
  async getActivePromotions() {
    const now = new Date();
    // Cache logic should be implemented via Redis ideally
    return prisma.promotion.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now }
      },
      orderBy: { priority: 'desc' }
    });
  }

  async createPromotion(dto: any) {
    return prisma.promotion.create({ data: dto });
  }

  async updatePromotion(id: string, dto: any) {
    return prisma.promotion.update({ where: { id }, data: dto });
  }
}

export const promotionService = new PromotionService();
