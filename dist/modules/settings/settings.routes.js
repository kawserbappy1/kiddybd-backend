"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsRoutes = void 0;
const express_1 = require("express");
const settings_controller_1 = require("./settings.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const rbac_middleware_1 = require("../../middlewares/rbac.middleware");
const client_1 = require("@prisma/client");
const audit_log_middleware_1 = require("../../middlewares/audit-log.middleware");
const router = (0, express_1.Router)();
// Public endpoint to read store settings (logo, contact, social links, footer)
router.get('/settings', settings_controller_1.settingsController.getSettings);
// Protected endpoint for Super Admin to update settings
router.patch('/settings', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.SUPER_ADMIN, client_1.Role.ADMIN]), (0, audit_log_middleware_1.auditLog)('Settings'), settings_controller_1.settingsController.updateSettings);
exports.settingsRoutes = router;
