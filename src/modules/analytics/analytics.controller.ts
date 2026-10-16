import { Request, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service';

export class AnalyticsController {
  getOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await analyticsService.getOrdersAnalytics();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getCustomers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await analyticsService.getCustomersAnalytics();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await analyticsService.getProductsAnalytics();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getCouriers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await analyticsService.getCouriersAnalytics();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getSettlement = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await analyticsService.getSettlementAnalytics();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}

export const analyticsController = new AnalyticsController();
