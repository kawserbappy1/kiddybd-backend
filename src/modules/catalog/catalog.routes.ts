import { Router } from 'express';
import * as catalogController from './catalog.controller';
import { catchAsync } from '../../common/utils/catchAsync';
import { uploadSingleImage } from '../../integrations/cloudinary.service';

import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';
import { auditLog } from '../../middlewares/audit-log.middleware';
import { Role } from '@prisma/client';

const router = Router();

// Upload image route (Products, Avatars) via Multer & Cloudinary
router.post(
  '/upload',
  authenticate,
  authorize([
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.ORDER_MANAGER,
    Role.INVENTORY_MANAGER,
    Role.CONTENT_MANAGER,
    Role.CUSTOMER_SUPPORT,
    Role.FINANCE_MANAGER,
  ]),
  uploadSingleImage,
  catchAsync(catalogController.uploadImage)
);

// Public catalog routes
router.get('/products', catchAsync(catalogController.listProducts));
router.get('/products/:slug', catchAsync(catalogController.getProductBySlug));
router.get('/categories', catchAsync(catalogController.getCategories));
router.get('/brands', catchAsync(catalogController.getBrands));
router.get('/age-groups', catchAsync(catalogController.getAgeGroups));
router.get('/skills', catchAsync(catalogController.getSkills));

// Admin product management routes (INVENTORY_MANAGER, ADMIN, SUPER_ADMIN)
router.get(
  '/admin/products/:id',
  authenticate,
  authorize([Role.INVENTORY_MANAGER, Role.ADMIN, Role.SUPER_ADMIN]),
  catchAsync(catalogController.getProductById)
);
router.post(
  '/admin/products',
  authenticate,
  authorize([Role.INVENTORY_MANAGER, Role.ADMIN, Role.SUPER_ADMIN]),
  auditLog('Product'),
  catchAsync(catalogController.createProduct)
);
router.patch(
  '/admin/products/:id',
  authenticate,
  authorize([Role.INVENTORY_MANAGER, Role.ADMIN, Role.SUPER_ADMIN]),
  auditLog('Product'),
  catchAsync(catalogController.updateProduct)
);
router.delete(
  '/admin/products/:id',
  authenticate,
  authorize([Role.INVENTORY_MANAGER, Role.ADMIN, Role.SUPER_ADMIN]),
  auditLog('Product'),
  catchAsync(catalogController.deleteProduct)
);

// Admin category management routes
router.post(
  '/admin/categories',
  authenticate,
  authorize([Role.INVENTORY_MANAGER, Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN]),
  auditLog('Category'),
  catchAsync(catalogController.createCategory)
);
router.patch(
  '/admin/categories/:id',
  authenticate,
  authorize([Role.INVENTORY_MANAGER, Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN]),
  auditLog('Category'),
  catchAsync(catalogController.updateCategory)
);
router.delete(
  '/admin/categories/:id',
  authenticate,
  authorize([Role.INVENTORY_MANAGER, Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN]),
  auditLog('Category'),
  catchAsync(catalogController.deleteCategory)
);

// Admin brand management routes
router.post(
  '/admin/brands',
  authenticate,
  authorize([Role.INVENTORY_MANAGER, Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN]),
  auditLog('Brand'),
  catchAsync(catalogController.createBrand)
);
router.patch(
  '/admin/brands/:id',
  authenticate,
  authorize([Role.INVENTORY_MANAGER, Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN]),
  auditLog('Brand'),
  catchAsync(catalogController.updateBrand)
);
router.delete(
  '/admin/brands/:id',
  authenticate,
  authorize([Role.INVENTORY_MANAGER, Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN]),
  auditLog('Brand'),
  catchAsync(catalogController.deleteBrand)
);

// Variants
router.post(
  '/admin/products/:id/variants',
  authenticate,
  authorize([Role.INVENTORY_MANAGER, Role.ADMIN, Role.SUPER_ADMIN]),
  auditLog('ProductVariant'),
  catchAsync(catalogController.addVariant)
);
router.patch(
  '/admin/products/:id/variants/:variantId',
  authenticate,
  authorize([Role.INVENTORY_MANAGER, Role.ADMIN, Role.SUPER_ADMIN]),
  auditLog('ProductVariant'),
  catchAsync(catalogController.updateVariant)
);

// Articles & Blog routes (CONTENT_MANAGER, ADMIN, SUPER_ADMIN)
router.get('/articles', catchAsync(catalogController.getArticles));
router.get('/articles/:slug', catchAsync(catalogController.getArticleBySlug));
router.post(
  '/admin/articles',
  authenticate,
  authorize([Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN]),
  auditLog('Article'),
  catchAsync(catalogController.createArticle)
);
router.patch(
  '/admin/articles/:id',
  authenticate,
  authorize([Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN]),
  auditLog('Article'),
  catchAsync(catalogController.updateArticle)
);
router.delete(
  '/admin/articles/:id',
  authenticate,
  authorize([Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN]),
  auditLog('Article'),
  catchAsync(catalogController.deleteArticle)
);

// Age Groups & Skills admin routes
router.post(
  '/admin/age-groups',
  authenticate,
  authorize([Role.INVENTORY_MANAGER, Role.ADMIN, Role.SUPER_ADMIN]),
  auditLog('AgeGroup'),
  catchAsync(catalogController.createAgeGroup)
);

router.post(
  '/admin/skills',
  authenticate,
  authorize([Role.INVENTORY_MANAGER, Role.ADMIN, Role.SUPER_ADMIN]),
  auditLog('Skill'),
  catchAsync(catalogController.createSkill)
);

export const catalogRoutes = router;

