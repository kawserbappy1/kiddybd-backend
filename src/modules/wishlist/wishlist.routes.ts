import { Router } from 'express';
import { wishlistController } from './wishlist.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/wishlist', wishlistController.getWishlist);
router.post('/wishlist/:productId', wishlistController.addToWishlist);
router.delete('/wishlist/:productId', wishlistController.removeFromWishlist);

export const wishlistRoutes = router;
