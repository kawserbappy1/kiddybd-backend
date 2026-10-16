"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const catchAsync_1 = require("../../common/utils/catchAsync");
const user_controller_1 = require("./user.controller");
const user_validation_1 = require("./user.validation");
const router = (0, express_1.Router)();
// All user routes require authentication
router.use((0, catchAsync_1.catchAsync)(auth_middleware_1.authenticate));
router.get('/profile', (0, catchAsync_1.catchAsync)(user_controller_1.getProfile));
router.patch('/profile', (0, validate_middleware_1.validateRequest)(user_validation_1.updateProfileSchema), (0, catchAsync_1.catchAsync)(user_controller_1.updateProfile));
router.get('/addresses', (0, catchAsync_1.catchAsync)(user_controller_1.getAddresses));
router.post('/addresses', (0, validate_middleware_1.validateRequest)(user_validation_1.createAddressSchema), (0, catchAsync_1.catchAsync)(user_controller_1.addAddress));
router.patch('/addresses/:id', (0, validate_middleware_1.validateRequest)(user_validation_1.updateAddressSchema), (0, catchAsync_1.catchAsync)(user_controller_1.updateAddress));
router.delete('/addresses/:id', (0, catchAsync_1.catchAsync)(user_controller_1.deleteAddress));
exports.userRoutes = router;
