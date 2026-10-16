import { Router } from 'express';
import { riskController } from './risk.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';
import { catchAsync } from '../../common/utils/catchAsync';

const router = Router();

router.use(authenticate);
router.use(authorize(['SUPER_ADMIN']));

router.get(
  '/risk/:orderId',
  catchAsync(riskController.getOrderRisk)
);

router.get(
  '/cod-config',
  catchAsync(riskController.getCODConfig)
);

router.patch(
  '/cod-config',
  catchAsync(riskController.updateCODConfig)
);

export const riskAdminRoutes = router;
