import { Router } from 'express';
import {
  getMySubscription,
  listAvailablePlans,
  submitSubscriptionPayment
} from '../controllers/subscription.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenant.js';

const router = Router();

router.use(authenticateJWT, tenantContext);

router.get('/my', getMySubscription);
router.get('/plans', listAvailablePlans);
router.post('/pay', requireRole(['Shop Owner']), submitSubscriptionPayment);

export default router;
