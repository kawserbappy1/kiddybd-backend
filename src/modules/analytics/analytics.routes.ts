import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';

const router = Router();

// Assuming admin role is required for these endpoints
router.use(authenticate);
router.use(authorize(['SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER']));

router.get('/orders', analyticsController.getOrders);
router.get('/customers', analyticsController.getCustomers);
router.get('/products', analyticsController.getProducts);
router.get('/couriers', analyticsController.getCouriers);
router.get('/settlement', analyticsController.getSettlement);

export const analyticsRoutes = router;
