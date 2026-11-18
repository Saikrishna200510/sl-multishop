import { Router } from 'express';
import {
  openCashSession,
  closeCashSession,
  getCurrentSession,
  checkout
} from '../controllers/pos.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenant.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';

const router = Router();

router.use(authenticateJWT, tenantContext);

// Cash drawer management
router.get('/session', getCurrentSession);
router.post('/session/open', requireRole(['Shop Owner', 'Shop Manager', 'Cashier']), openCashSession);
router.post('/session/:sessionId/close', requireRole(['Shop Owner', 'Shop Manager', 'Cashier']), closeCashSession);

// POS Checkout (Transactional + Idempotent)
router.post(
  '/checkout',
  requireRole(['Shop Owner', 'Shop Manager', 'Cashier']),
  idempotencyMiddleware({ required: false }),
  checkout
);

export default router;
