import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { updateUserAvatar } from '../controllers/userController.js';
import { upload } from '../middleware/multer.js';

const router = Router();

router.post(
  '/users/me/avatar',
  authenticate,
  upload.single('avatar'),
  updateUserAvatar,
);
export default router;
