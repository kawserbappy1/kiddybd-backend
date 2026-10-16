import { Router } from 'express';
import { rtoController } from './rto.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';

const router = Router();

// Routes for ORDER_MANAGER
router.get(
  '/admin/rto',
  authenticate,
  authorize(['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER']),
  rtoController.getAllRTOs
);

router.get(
  '/admin/rto/:orderId',
  authenticate,
  authorize(['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER']),
  rtoController.getRTOByOrderId
);

export const rtoRoutes = router;
