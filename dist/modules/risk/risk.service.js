"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.riskService = exports.RiskService = void 0;
const prisma_service_1 = require("../../database/prisma.service");
const risk_engine_1 = require("./domain/risk-engine");
const client_1 = require("@prisma/client");
const ioredis_1 = __importDefault(require("ioredis"));
const redisConnection = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379');
class RiskService {
    async assessOrder(userId, orderValue) {
        const reputation = await prisma_service_1.prisma.customerReputation.findUnique({ where: { userId } });
        const user = await prisma_service_1.prisma.user.findUnique({ where: { id: userId } });
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
        return risk_engine_1.RiskEngine.evaluate(signals);
    }
    async saveRiskAssessment(orderId, result, tx = prisma_service_1.prisma) {
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
        if (cached)
            return JSON.parse(cached);
        const config = await prisma_service_1.prisma.cODConfig.findFirst();
        if (config) {
            await redisConnection.setex(cacheKey, 300, JSON.stringify(config));
        }
        return config;
    }
    async isCODAllowed(riskLevel, orderValue) {
        const config = await this.getCODConfig();
        if (!config)
            return { allowed: true }; // default if no config
        if (orderValue < Number(config.minimumOrderAmount)) {
            return { allowed: false, reason: 'Order value below minimum for COD' };
        }
        if (Number(config.maximumCODAmount) > 0 && orderValue > Number(config.maximumCODAmount)) {
            return { allowed: false, reason: 'Order value above maximum for COD' };
        }
        if (riskLevel === client_1.RiskLevel.HIGH) {
            return { allowed: false, reason: 'RISK_REJECTED: COD not allowed for high risk orders' };
        }
        return { allowed: true };
    }
    async updateCODConfig(data, adminId) {
        let config = await prisma_service_1.prisma.cODConfig.findFirst();
        if (config) {
            config = await prisma_service_1.prisma.cODConfig.update({
                where: { id: config.id },
                data: { ...data, updatedBy: adminId }
            });
        }
        else {
            config = await prisma_service_1.prisma.cODConfig.create({
                data: { ...data, updatedBy: adminId }
            });
        }
        // invalidate cache
        await redisConnection.del('kiddybd:cache:cod-config');
        return config;
    }
}
exports.RiskService = RiskService;
exports.riskService = new RiskService();
