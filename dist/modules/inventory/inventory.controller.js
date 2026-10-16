"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adjustStock = exports.getStock = void 0;
const inventory_service_1 = require("./inventory.service");
const getStock = async (req, res) => {
    try {
        const stock = await inventory_service_1.inventoryService.getStock(req.params.variantId);
        if (!stock)
            return res.status(404).json({ status: 'error', message: 'Not found' });
        res.json({ status: 'success', data: stock });
    }
    catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};
exports.getStock = getStock;
const adjustStock = async (req, res) => {
    try {
        const { qty, reason } = req.body;
        const adminId = req.user?.id || '00000000-0000-0000-0000-000000000000';
        const result = await inventory_service_1.inventoryService.adjustStock(req.params.variantId, qty, reason, adminId);
        res.json({ status: 'success', data: result });
    }
    catch (err) {
        res.status(400).json({ status: 'error', message: err.message });
    }
};
exports.adjustStock = adjustStock;
