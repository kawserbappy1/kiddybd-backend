"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rtoController = exports.RTOController = void 0;
const rto_service_1 = require("./rto.service");
class RTOController {
    async getAllRTOs(req, res, next) {
        try {
            const rtos = await rto_service_1.rtoService.getAllRTOs();
            res.status(200).json({
                success: true,
                data: rtos
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getRTOByOrderId(req, res, next) {
        try {
            const orderId = req.params.orderId;
            const rto = await rto_service_1.rtoService.getRTOByOrderId(orderId);
            res.status(200).json({
                success: true,
                data: rto
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.RTOController = RTOController;
exports.rtoController = new RTOController();
