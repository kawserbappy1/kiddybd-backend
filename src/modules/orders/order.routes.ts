import { Router } from 'express';
import { orderController } from './order.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { createOrderSchema } from './order.schema';
import { catchAsync } from '../../common/utils/catchAsync';
import { idempotencyMiddleware } from '../../middlewares/idempotency.middleware';

const router = Router();

// Public Direct Order Route (Guest checkout with auto-identified user by phone)
router.post(
  '/direct',
  catchAsync(orderController.createDirectOrder)
);

// Public Order Tracking by Order Number
router.get(
  '/track/:orderNumber',
  catchAsync(orderController.getOrderByOrderNumber)
);

router.use(authenticate);

router.post(
  '/',
  idempotencyMiddleware,
  validateRequest(createOrderSchema),
  catchAsync(orderController.createOrder)
);

router.get(
  '/',
  catchAsync(orderController.getOrders)
);

router.get(
  '/:id',
  catchAsync(orderController.getOrderById)
);

router.post(
  '/:id/cancel',
  catchAsync(orderController.cancelOrder)
);

export const orderRoutes = router;
