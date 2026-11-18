import { Router } from 'express';
import {
  listSuppliers,
  createSupplier,
  createPurchaseOrder,
  receiveGoods
} from '../controllers/supplier.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenant.js';

const router = Router();

router.use(authenticateJWT, tenantContext);

// Suppliers
router.get('/', listSuppliers);
router.post('/', requireRole(['Shop Owner', 'Shop Manager', 'Inventory Manager', 'Accountant']), createSupplier);

// Purchase Orders & GRN
router.post('/orders', requireRole(['Shop Owner', 'Shop Manager', 'Inventory Manager']), createPurchaseOrder);
router.post('/grn', requireRole(['Shop Owner', 'Shop Manager', 'Inventory Manager']), receiveGoods);

export default router;
