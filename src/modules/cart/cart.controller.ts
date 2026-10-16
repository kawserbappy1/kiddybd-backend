import { Request, Response } from 'express';
import { cartService } from './cart.service';

export class CartController {
  async getCart(req: Request, res: Response) {
    const userId = req.user!.id;
    const cart = await cartService.getCart(userId);
    res.status(200).json({ success: true, data: cart });
  }

  async addItem(req: Request, res: Response) {
    const userId = req.user!.id;
    const { variantId, quantity } = req.body;
    const item = await cartService.addItem(userId, variantId, quantity);
    res.status(201).json({ success: true, data: item });
  }

  async updateItem(req: Request, res: Response) {
    const userId = req.user!.id;
    const { id } = req.params;
    const { quantity } = req.body;
    const item = await cartService.updateItem(userId, id as string, quantity);
    res.status(200).json({ success: true, data: item });
  }

  async removeItem(req: Request, res: Response) {
    const userId = req.user!.id;
    const { id } = req.params;
    await cartService.removeItem(userId, id as string);
    res.status(204).send();
  }

  async clearCart(req: Request, res: Response) {
    const userId = req.user!.id;
    await cartService.clearCart(userId);
    res.status(204).send();
  }
}

export const cartController = new CartController();
