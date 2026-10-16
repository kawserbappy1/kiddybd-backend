import { Router } from 'express';
import { returnController } from './return.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';
import { idempotencyMiddleware } from '../../middlewares/idempotency.middleware';

const router = Router();

// Customer Routes
router.post('/returns', returnController.createReturn);
router.get('/returns/order/:orderNumber', returnController.getReturnsByOrder);

// Admin Routes
router.get(
  '/returns',
  authenticate,
  authorize(['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER', 'CUSTOMER_SUPPORT']),
  returnController.getAllReturns
);

router.get(
  '/returns/:id',
  authenticate,
  returnController.getReturnById
);

// Idempotency check can be added as middleware before controller
router.post(
  '/admin/returns/:id/approve',
  authenticate,
  authorize(['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER']),
  idempotencyMiddleware,
  returnController.approveReturn
);

router.post(
  '/admin/returns/:id/reject',
  authenticate,
  authorize(['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER']),
  returnController.rejectReturn
);

export const returnRoutes = router;
