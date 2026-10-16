import { Request, Response, NextFunction } from 'express';
import { rtoService } from './rto.service';

export class RTOController {
  async getAllRTOs(req: Request, res: Response, next: NextFunction) {
    try {
      const rtos = await rtoService.getAllRTOs();
      res.status(200).json({
        success: true,
        data: rtos
      });
    } catch (error) {
      next(error);
    }
  }

  async getRTOByOrderId(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = req.params.orderId as string;
      const rto = await rtoService.getRTOByOrderId(orderId);
      res.status(200).json({
        success: true,
        data: rto
      });
    } catch (error) {
      next(error);
    }
  }
}

export const rtoController = new RTOController();
