import { Router } from 'express';
import { paymentController } from '../payments/payment.controller';

const router = Router();

// Webhook endpoint (no auth, signature verified internally)
router.post('/payment/:provider', paymentController.handleWebhook);

export const webhookRoutes = router;
