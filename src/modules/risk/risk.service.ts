import { prisma } from '../../database/prisma.service';
import { RiskEngine, RiskResult } from './domain/risk-engine';
import { RiskLevel } from '@prisma/client';
import Redis from 'ioredis';

const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export class RiskService {
  async assessOrder(userId: string, orderValue: number): Promise<RiskResult> {
    const reputation = await prisma.customerReputation.findUnique({ where: { userId } });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    const accountAgeDays = user 
      ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const signals = {
      rtoRate: reputation?.rtoRate ? Number(reputation.rtoRate) : 0,
      cancelRate: reputation?.cancelRate ? Number(reputation.cancelRate) : 0,
      accountAgeDays,
      orderValue,
      failedOrdersCount: reputation ? reputation.rtoOrders + reputation.cancelledOrders : 0,
      completedOrdersCount: reputation?.completedOrders || 0,
    };

    return RiskEngine.evaluate(signals);
  }

  async saveRiskAssessment(orderId: string, result: RiskResult, tx: any = prisma) {
    return tx.riskAssessment.create({
      data: {
        orderId,
        score: result.score,
        level: result.level,
        signals: result.signals,
        reasons: result.reasons,
        action: result.action,
      }
    });
  }

  async getCODConfig() {
    const cacheKey = 'kiddybd:cache:cod-config';
    const cached = await redisConnection.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const config = await prisma.cODConfig.findFirst();
    if (config) {
      await redisConnection.setex(cacheKey, 300, JSON.stringify(config));
    }
    return config;
  }

  async isCODAllowed(riskLevel: RiskLevel, orderValue: number): Promise<{ allowed: boolean, reason?: string }> {
    const config = await this.getCODConfig();
    if (!config) return { allowed: true }; // default if no config

    if (orderValue < Number(config.minimumOrderAmount)) {
      return { allowed: false, reason: 'Order value below minimum for COD' };
    }
    
    if (Number(config.maximumCODAmount) > 0 && orderValue > Number(config.maximumCODAmount)) {
      return { allowed: false, reason: 'Order value above maximum for COD' };
    }

    if (riskLevel === RiskLevel.HIGH) {
       return { allowed: false, reason: 'RISK_REJECTED: COD not allowed for high risk orders' };
    }

    return { allowed: true };
  }

  async updateCODConfig(data: any, adminId: string) {
     let config = await prisma.cODConfig.findFirst();
     if (config) {
        config = await prisma.cODConfig.update({
           where: { id: config.id },
           data: { ...data, updatedBy: adminId }
        });
     } else {
        config = await prisma.cODConfig.create({
           data: { ...data, updatedBy: adminId }
        });
     }
     
     // invalidate cache
     await redisConnection.del('kiddybd:cache:cod-config');
     return config;
  }
}

export const riskService = new RiskService();
