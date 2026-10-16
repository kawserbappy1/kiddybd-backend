import { Router } from 'express';
import { cartController } from './cart.controller';
import { validateRequest } from '../../middlewares/validate.middleware';
import { authenticate } from '../../middlewares/auth.middleware';
import { addItemSchema, updateItemSchema, itemIdSchema } from './cart.schema';
import { catchAsync } from '../../common/utils/catchAsync';

const router = Router();

router.use(authenticate);

router.get('/', catchAsync(cartController.getCart));
router.post('/items', validateRequest(addItemSchema), catchAsync(cartController.addItem));
router.patch('/items/:id', validateRequest(updateItemSchema), catchAsync(cartController.updateItem));
router.delete('/items/:id', validateRequest(itemIdSchema), catchAsync(cartController.removeItem));
router.delete('/', catchAsync(cartController.clearCart));

export { router as cartRoutes };
