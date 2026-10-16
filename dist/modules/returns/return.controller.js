"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.returnController = exports.ReturnController = void 0;
const return_service_1 = require("./return.service");
class ReturnController {
    async createReturn(req, res, next) {
        try {
            const userId = req.user?.id;
            const result = await return_service_1.returnService.createReturn(userId, req.body);
            res.status(201).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async approveReturn(req, res, next) {
        try {
            const adminId = req.user.id;
            const returnId = req.params.id;
            const result = await return_service_1.returnService.approveReturn(returnId, adminId);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async rejectReturn(req, res, next) {
        try {
            const adminId = req.user.id;
            const returnId = req.params.id;
            const { reason } = req.body;
            const result = await return_service_1.returnService.rejectReturn(returnId, adminId, reason);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getAllReturns(req, res, next) {
        try {
            const result = await return_service_1.returnService.getAllReturns();
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getReturnById(req, res, next) {
        try {
            const result = await return_service_1.returnService.getReturnById(req.params.id);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getReturnsByOrder(req, res, next) {
        try {
            const result = await return_service_1.returnService.getReturnsByOrder(req.params.orderNumber);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ReturnController = ReturnController;
exports.returnController = new ReturnController();
