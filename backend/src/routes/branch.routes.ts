import { Router } from 'express';
import {
  listBranches,
  createBranch,
  listCounters,
  createCounter
} from '../controllers/branch.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenant.js';

const router = Router();

router.use(authenticateJWT, tenantContext);

// Branches
router.get('/', listBranches);
router.post('/', requireRole(['Shop Owner', 'Shop Manager']), createBranch);

// Counters
router.get('/counters', listCounters);
router.post('/counters', requireRole(['Shop Owner', 'Shop Manager']), createCounter);

export default router;
