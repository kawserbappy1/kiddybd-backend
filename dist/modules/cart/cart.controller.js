"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartController = exports.CartController = void 0;
const cart_service_1 = require("./cart.service");
class CartController {
    async getCart(req, res) {
        const userId = req.user.id;
        const cart = await cart_service_1.cartService.getCart(userId);
        res.status(200).json({ success: true, data: cart });
    }
    async addItem(req, res) {
        const userId = req.user.id;
        const { variantId, quantity } = req.body;
        const item = await cart_service_1.cartService.addItem(userId, variantId, quantity);
        res.status(201).json({ success: true, data: item });
    }
    async updateItem(req, res) {
        const userId = req.user.id;
        const { id } = req.params;
        const { quantity } = req.body;
        const item = await cart_service_1.cartService.updateItem(userId, id, quantity);
        res.status(200).json({ success: true, data: item });
    }
    async removeItem(req, res) {
        const userId = req.user.id;
        const { id } = req.params;
        await cart_service_1.cartService.removeItem(userId, id);
        res.status(204).send();
    }
    async clearCart(req, res) {
        const userId = req.user.id;
        await cart_service_1.cartService.clearCart(userId);
        res.status(204).send();
    }
}
exports.CartController = CartController;
exports.cartController = new CartController();
