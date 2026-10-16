"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shipmentController = exports.ShipmentController = void 0;
const shipment_service_1 = require("./shipment.service");
class ShipmentController {
    async createShipment(req, res, next) {
        try {
            const orderId = req.params.orderId;
            const { provider } = req.body;
            const result = await shipment_service_1.shipmentService.createShipment(orderId, provider || 'Mock');
            res.status(201).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getShipment(req, res, next) {
        try {
            const shipmentId = req.params.id;
            const userId = req.user?.id;
            const result = await shipment_service_1.shipmentService.getShipmentById(shipmentId, userId);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async handleWebhook(req, res, next) {
        try {
            const provider = req.params.provider;
            const signatureHeader = req.headers['x-signature'];
            const signature = (Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader) || req.body.signature || '';
            const result = await shipment_service_1.shipmentService.handleCourierWebhook(provider, req.body, signature);
            res.status(200).json({
                success: true,
                message: 'Webhook processed'
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ShipmentController = ShipmentController;
exports.shipmentController = new ShipmentController();
