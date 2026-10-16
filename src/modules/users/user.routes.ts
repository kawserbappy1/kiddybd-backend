import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { catchAsync } from '../../common/utils/catchAsync';
import {
  getProfile,
  updateProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} from './user.controller';
import { updateProfileSchema, createAddressSchema, updateAddressSchema } from './user.validation';

const router = Router();

// All user routes require authentication
router.use(catchAsync(authenticate));

router.get('/profile', catchAsync(getProfile));
router.patch('/profile', validateRequest(updateProfileSchema), catchAsync(updateProfile));

router.get('/addresses', catchAsync(getAddresses));
router.post('/addresses', validateRequest(createAddressSchema), catchAsync(addAddress));
router.patch('/addresses/:id', validateRequest(updateAddressSchema), catchAsync(updateAddress));
router.delete('/addresses/:id', catchAsync(deleteAddress));

export const userRoutes = router;
