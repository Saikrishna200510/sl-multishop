import { Router } from 'express';
import {
  getStockBalances,
  adjustStock,
  listStockMovements,
  createStockTransfer,
  receiveStockTransfer
} from '../controllers/inventory.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenant.js';

const router = Router();

router.use(authenticateJWT, tenantContext);

router.get('/balances', getStockBalances);
router.post('/adjust', requireRole(['Shop Owner', 'Shop Manager', 'Inventory Manager']), adjustStock);
router.get('/movements', listStockMovements);

// Inter-branch transfers
router.post('/transfers', requireRole(['Shop Owner', 'Shop Manager', 'Inventory Manager']), createStockTransfer);
router.post('/transfers/:transferId/receive', requireRole(['Shop Owner', 'Shop Manager', 'Inventory Manager']), receiveStockTransfer);

export default router;
