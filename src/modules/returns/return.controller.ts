import { Request, Response, NextFunction } from 'express';
import { returnService } from './return.service';

export class ReturnController {
  async createReturn(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const result = await returnService.createReturn(userId, req.body);
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async approveReturn(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user!.id;
      const returnId = req.params.id as string;
      
      const result = await returnService.approveReturn(returnId, adminId);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectReturn(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user!.id;
      const returnId = req.params.id as string;
      const { reason } = req.body;
      
      const result = await returnService.rejectReturn(returnId, adminId, reason);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllReturns(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await returnService.getAllReturns();
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getReturnById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await returnService.getReturnById(req.params.id as string);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getReturnsByOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await returnService.getReturnsByOrder(req.params.orderNumber as string);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

export const returnController = new ReturnController();
