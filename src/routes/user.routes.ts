import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/users/:username - Public profile + follower/following counts
router.get('/:username', userController.getPublicProfile.bind(userController));

// PUT /api/users/profile - Update own profile (bio, avatar, name)
router.put('/profile', authenticateToken, userController.updateProfile.bind(userController));

export default router;
