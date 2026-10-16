import { Router } from 'express';
import { settingsController } from './settings.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';
import { Role } from '@prisma/client';
import { auditLog } from '../../middlewares/audit-log.middleware';

const router = Router();

// Public endpoint to read store settings (logo, contact, social links, footer)
router.get('/settings', settingsController.getSettings);

// Protected endpoint for Super Admin to update settings
router.patch(
  '/settings',
  authenticate,
  authorize([Role.SUPER_ADMIN, Role.ADMIN]),
  auditLog('Settings'),
  settingsController.updateSettings
);

export const settingsRoutes = router;
