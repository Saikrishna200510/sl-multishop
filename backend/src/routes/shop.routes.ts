import { Router } from 'express';
import {
  getShopProfile,
  updateShopProfile,
  updateShopSettings,
  listStaff,
  addStaff
} from '../controllers/shop.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenant.js';

const router = Router();

router.use(authenticateJWT, tenantContext);

router.get('/profile', getShopProfile);
router.patch('/profile', requireRole(['Shop Owner', 'Shop Manager']), updateShopProfile);
router.patch('/settings', requireRole(['Shop Owner']), updateShopSettings);

// Staff management
router.get('/staff', requireRole(['Shop Owner', 'Shop Manager']), listStaff);
router.post('/staff', requireRole(['Shop Owner', 'Shop Manager']), addStaff);

export default router;
