import { Router } from 'express';
import { shipmentController } from './shipment.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';

const router = Router();

// Routes for Shipment
router.post('/admin/shipments/:orderId/create', authenticate, authorize(['ORDER_MANAGER', 'ADMIN', 'SUPER_ADMIN']), shipmentController.createShipment);
router.get('/shipments/:id', authenticate, shipmentController.getShipment);
router.post('/webhooks/courier/:provider', shipmentController.handleWebhook);

export const shipmentRoutes = router;
