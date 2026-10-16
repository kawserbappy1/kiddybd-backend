"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.riskController = void 0;
const prisma_service_1 = require("../../database/prisma.service");
const risk_service_1 = require("./risk.service");
const errors_1 = require("../../common/errors");
exports.riskController = {
    async getOrderRisk(req, res) {
        const orderId = req.params.orderId;
        const assessment = await prisma_service_1.prisma.riskAssessment.findUnique({
            where: { orderId }
        });
        if (!assessment) {
            throw new errors_1.NotFoundError('Risk assessment not found for this order');
        }
        res.json({ success: true, data: assessment });
    },
    async getCODConfig(req, res) {
        const config = await risk_service_1.riskService.getCODConfig();
        res.json({ success: true, data: config || {} });
    },
    async updateCODConfig(req, res) {
        const adminId = req.user.id;
        const config = await risk_service_1.riskService.updateCODConfig(req.body, adminId);
        res.json({ success: true, data: config });
    }
};
