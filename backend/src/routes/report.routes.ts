import { Router } from 'express';
import {
  getShopDashboard,
  getGstTaxReport,
  getProfitLossSummary
} from '../controllers/report.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenant.js';

const router = Router();

router.use(authenticateJWT, tenantContext);

router.get('/dashboard', getShopDashboard);
router.get('/gst-tax', requireRole(['Shop Owner', 'Shop Manager', 'Accountant']), getGstTaxReport);
router.get('/profit-loss', requireRole(['Shop Owner', 'Shop Manager', 'Accountant']), getProfitLossSummary);

export default router;
