import { Request, Response, NextFunction } from 'express';
import { verificationService } from './verification.service';
import { OrderVerificationType } from '@prisma/client';
import { AppError } from '../../common/errors';

export class VerificationController {
  async verifyOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { otp } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      if (!otp) {
        throw new AppError('OTP is required', 400, 'OTP_REQUIRED');
      }

      await verificationService.verifyOrder(id, userId, otp);

      res.status(200).json({
        success: true,
        message: 'Order verified successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async resendVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      // In a real scenario, type might come from request, but we default to OTP here
      const type = (req.body.type as OrderVerificationType) || OrderVerificationType.OTP;
      
      const { otp } = await verificationService.createVerification(id, type);

      res.status(200).json({
        success: true,
        message: 'Verification code sent successfully',
        // In production we shouldn't return OTP, but it might be useful for testing envs
        data: process.env.NODE_ENV !== 'production' ? { otp } : undefined
      });
    } catch (error) {
      next(error);
    }
  }
}

export const verificationController = new VerificationController();
