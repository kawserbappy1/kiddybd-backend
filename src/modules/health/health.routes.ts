import { Router } from 'express';
import { HealthController } from './health.controller';

const router = Router();
const healthController = new HealthController();

router.get('/', healthController.check);
router.get('/live', healthController.live);
router.get('/ready', healthController.ready);

export { router as healthRouter };
