import { Router } from 'express';
import { paymentController } from './payment.controller';

const router = Router();

// Endpoint for initiating payment from client (Supports both Authenticated and Guest checkouts)
router.post('/initiate', paymentController.initiatePayment);

// SSLCommerz redirect callback endpoints (SSLCommerz POSTs form data to these)
router.post('/sslcommerz/success', paymentController.handleSSLCommerzSuccess);
router.post('/sslcommerz/fail', paymentController.handleSSLCommerzFail);
router.post('/sslcommerz/cancel', paymentController.handleSSLCommerzCancel);
router.post('/sslcommerz/ipn', paymentController.handleSSLCommerzIPN);

// GET fallbacks for manual browser redirects / testing
router.get('/sslcommerz/success', paymentController.handleSSLCommerzSuccess);
router.get('/sslcommerz/fail', paymentController.handleSSLCommerzFail);
router.get('/sslcommerz/cancel', paymentController.handleSSLCommerzCancel);

export const paymentRoutes = router;
