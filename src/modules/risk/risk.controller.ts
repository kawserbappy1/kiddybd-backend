import { Request, Response } from 'express';
import { prisma } from '../../database/prisma.service';
import { riskService } from './risk.service';
import { NotFoundError } from '../../common/errors';

export const riskController = {
  async getOrderRisk(req: Request, res: Response) {
    const orderId = req.params.orderId as string;
    const assessment = await prisma.riskAssessment.findUnique({
      where: { orderId }
    });
    
    if (!assessment) {
      throw new NotFoundError('Risk assessment not found for this order');
    }
    
    res.json({ success: true, data: assessment });
  },

  async getCODConfig(req: Request, res: Response) {
    const config = await riskService.getCODConfig();
    res.json({ success: true, data: config || {} });
  },

  async updateCODConfig(req: Request, res: Response) {
    const adminId = req.user!.id;
    const config = await riskService.updateCODConfig(req.body, adminId);
    res.json({ success: true, data: config });
  }
};
