import { Request, Response, NextFunction } from 'express';
import { paymentService } from './payment.service';
import { AppError } from '../../common/errors';

export class PaymentController {
  async initiatePayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId, provider } = req.body;
      const userId = (req as any).user?.id;

      if (!orderId) {
        throw new AppError('OrderId is required', 400, 'VALIDATION_ERROR');
      }

      // Guest / direct orders might not have req.user, so userId is optional
      const result = await paymentService.initiatePayment(orderId, userId, provider || 'SSLCommerz');

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async handleSSLCommerzSuccess(req: Request, res: Response, next: NextFunction) {
    try {
      const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
      const payload = { ...req.body, ...req.query };

      await paymentService.handleSSLCommerzCallback(payload, 'SUCCESS');

      const orderNumber = payload.value_b || payload.tran_id || '';
      return res.redirect(`${frontendBaseUrl}/orders/${orderNumber}?payment_status=success`);
    } catch (error) {
      console.error('SSLCommerz Success Handler error:', error);
      const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
      return res.redirect(`${frontendBaseUrl}/checkout?payment_status=failed`);
    }
  }

  async handleSSLCommerzFail(req: Request, res: Response, next: NextFunction) {
    try {
      const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
      const payload = { ...req.body, ...req.query };

      await paymentService.handleSSLCommerzCallback(payload, 'FAILED');

      const orderNumber = payload.value_b || '';
      return res.redirect(`${frontendBaseUrl}/orders/${orderNumber}?payment_status=failed`);
    } catch (error) {
      console.error('SSLCommerz Fail Handler error:', error);
      const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
      return res.redirect(`${frontendBaseUrl}/checkout?payment_status=failed`);
    }
  }

  async handleSSLCommerzCancel(req: Request, res: Response, next: NextFunction) {
    try {
      const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
      const payload = { ...req.body, ...req.query };

      await paymentService.handleSSLCommerzCallback(payload, 'CANCELLED');

      const orderNumber = payload.value_b || '';
      return res.redirect(`${frontendBaseUrl}/orders/${orderNumber}?payment_status=cancelled`);
    } catch (error) {
      console.error('SSLCommerz Cancel Handler error:', error);
      const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
      return res.redirect(`${frontendBaseUrl}/checkout?payment_status=cancelled`);
    }
  }

  async handleSSLCommerzIPN(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = { ...req.body, ...req.query };
      await paymentService.handleSSLCommerzCallback(payload, 'IPN');

      return res.status(200).send('IPN OK');
    } catch (error) {
      console.error('SSLCommerz IPN error:', error);
      return res.status(400).send('IPN FAILED');
    }
  }

  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const provider = req.params.provider as string;
      const signatureHeader = req.headers['x-signature'];
      const signature = ((Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader) || req.body.signature || '') as string;

      const result = await paymentService.handleWebhook(provider, req.body, signature);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
