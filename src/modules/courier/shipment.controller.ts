import { Request, Response, NextFunction } from 'express';
import { shipmentService } from './shipment.service';

export class ShipmentController {
  async createShipment(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = req.params.orderId as string;
      const { provider } = req.body;
      const result = await shipmentService.createShipment(orderId, provider || 'Mock');
      
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getShipment(req: Request, res: Response, next: NextFunction) {
    try {
      const shipmentId = req.params.id as string;
      const userId = req.user?.id;
      
      const result = await shipmentService.getShipmentById(shipmentId, userId);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const provider = req.params.provider as string;
      const signatureHeader = req.headers['x-signature'];
      const signature = (Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader) || req.body.signature || '';
      
      const result = await shipmentService.handleCourierWebhook(provider, req.body, signature as string);
      
      res.status(200).json({
        success: true,
        message: 'Webhook processed'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const shipmentController = new ShipmentController();
