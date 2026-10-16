"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsController = exports.AnalyticsController = void 0;
const analytics_service_1 = require("./analytics.service");
class AnalyticsController {
    getOrders = async (req, res, next) => {
        try {
            const data = await analytics_service_1.analyticsService.getOrdersAnalytics();
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    };
    getCustomers = async (req, res, next) => {
        try {
            const data = await analytics_service_1.analyticsService.getCustomersAnalytics();
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    };
    getProducts = async (req, res, next) => {
        try {
            const data = await analytics_service_1.analyticsService.getProductsAnalytics();
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    };
    getCouriers = async (req, res, next) => {
        try {
            const data = await analytics_service_1.analyticsService.getCouriersAnalytics();
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    };
    getSettlement = async (req, res, next) => {
        try {
            const data = await analytics_service_1.analyticsService.getSettlementAnalytics();
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.AnalyticsController = AnalyticsController;
exports.analyticsController = new AnalyticsController();
