import { Router } from 'express';
import {
  registerShop,
  login,
  refreshToken,
  switchShop,
  logout,
  getProfile
} from '../controllers/auth.controller.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();

router.post('/register', registerShop);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

// Authenticated routes
router.get('/profile', authenticateJWT, getProfile);
router.post('/switch-shop', authenticateJWT, switchShop);

export default router;
