"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.catalogRoutes = void 0;
const express_1 = require("express");
const catalogController = __importStar(require("./catalog.controller"));
const catchAsync_1 = require("../../common/utils/catchAsync");
const cloudinary_service_1 = require("../../integrations/cloudinary.service");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const rbac_middleware_1 = require("../../middlewares/rbac.middleware");
const audit_log_middleware_1 = require("../../middlewares/audit-log.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Upload image route (Products, Avatars) via Multer & Cloudinary
router.post('/upload', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.INVENTORY_MANAGER, client_1.Role.CONTENT_MANAGER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN]), cloudinary_service_1.uploadSingleImage, (0, catchAsync_1.catchAsync)(catalogController.uploadImage));
// Public catalog routes
router.get('/products', (0, catchAsync_1.catchAsync)(catalogController.listProducts));
router.get('/products/:slug', (0, catchAsync_1.catchAsync)(catalogController.getProductBySlug));
router.get('/categories', (0, catchAsync_1.catchAsync)(catalogController.getCategories));
router.get('/brands', (0, catchAsync_1.catchAsync)(catalogController.getBrands));
router.get('/age-groups', (0, catchAsync_1.catchAsync)(catalogController.getAgeGroups));
router.get('/skills', (0, catchAsync_1.catchAsync)(catalogController.getSkills));
// Admin product management routes (INVENTORY_MANAGER, ADMIN, SUPER_ADMIN)
router.get('/admin/products/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.INVENTORY_MANAGER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN]), (0, catchAsync_1.catchAsync)(catalogController.getProductById));
router.post('/admin/products', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.INVENTORY_MANAGER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN]), (0, audit_log_middleware_1.auditLog)('Product'), (0, catchAsync_1.catchAsync)(catalogController.createProduct));
router.patch('/admin/products/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.INVENTORY_MANAGER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN]), (0, audit_log_middleware_1.auditLog)('Product'), (0, catchAsync_1.catchAsync)(catalogController.updateProduct));
router.delete('/admin/products/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.INVENTORY_MANAGER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN]), (0, audit_log_middleware_1.auditLog)('Product'), (0, catchAsync_1.catchAsync)(catalogController.deleteProduct));
// Admin category management routes
router.post('/admin/categories', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.INVENTORY_MANAGER, client_1.Role.CONTENT_MANAGER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN]), (0, audit_log_middleware_1.auditLog)('Category'), (0, catchAsync_1.catchAsync)(catalogController.createCategory));
router.patch('/admin/categories/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.INVENTORY_MANAGER, client_1.Role.CONTENT_MANAGER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN]), (0, audit_log_middleware_1.auditLog)('Category'), (0, catchAsync_1.catchAsync)(catalogController.updateCategory));
router.delete('/admin/categories/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.INVENTORY_MANAGER, client_1.Role.CONTENT_MANAGER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN]), (0, audit_log_middleware_1.auditLog)('Category'), (0, catchAsync_1.catchAsync)(catalogController.deleteCategory));
// Admin brand management routes
router.post('/admin/brands', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.INVENTORY_MANAGER, client_1.Role.CONTENT_MANAGER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN]), (0, audit_log_middleware_1.auditLog)('Brand'), (0, catchAsync_1.catchAsync)(catalogController.createBrand));
router.patch('/admin/brands/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.INVENTORY_MANAGER, client_1.Role.CONTENT_MANAGER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN]), (0, audit_log_middleware_1.auditLog)('Brand'), (0, catchAsync_1.catchAsync)(catalogController.updateBrand));
router.delete('/admin/brands/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.INVENTORY_MANAGER, client_1.Role.CONTENT_MANAGER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN]), (0, audit_log_middleware_1.auditLog)('Brand'), (0, catchAsync_1.catchAsync)(catalogController.deleteBrand));
// Variants
router.post('/admin/products/:id/variants', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.INVENTORY_MANAGER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN]), (0, audit_log_middleware_1.auditLog)('ProductVariant'), (0, catchAsync_1.catchAsync)(catalogController.addVariant));
router.patch('/admin/products/:id/variants/:variantId', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.INVENTORY_MANAGER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN]), (0, audit_log_middleware_1.auditLog)('ProductVariant'), (0, catchAsync_1.catchAsync)(catalogController.updateVariant));
// Articles & Blog routes (CONTENT_MANAGER, ADMIN, SUPER_ADMIN)
router.get('/articles', (0, catchAsync_1.catchAsync)(catalogController.getArticles));
router.get('/articles/:slug', (0, catchAsync_1.catchAsync)(catalogController.getArticleBySlug));
router.post('/admin/articles', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.CONTENT_MANAGER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN]), (0, audit_log_middleware_1.auditLog)('Article'), (0, catchAsync_1.catchAsync)(catalogController.createArticle));
router.patch('/admin/articles/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.CONTENT_MANAGER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN]), (0, audit_log_middleware_1.auditLog)('Article'), (0, catchAsync_1.catchAsync)(catalogController.updateArticle));
router.delete('/admin/articles/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.CONTENT_MANAGER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN]), (0, audit_log_middleware_1.auditLog)('Article'), (0, catchAsync_1.catchAsync)(catalogController.deleteArticle));
// Age Groups & Skills admin routes
router.post('/admin/age-groups', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.INVENTORY_MANAGER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN]), (0, audit_log_middleware_1.auditLog)('AgeGroup'), (0, catchAsync_1.catchAsync)(catalogController.createAgeGroup));
router.post('/admin/skills', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.INVENTORY_MANAGER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN]), (0, audit_log_middleware_1.auditLog)('Skill'), (0, catchAsync_1.catchAsync)(catalogController.createSkill));
exports.catalogRoutes = router;
