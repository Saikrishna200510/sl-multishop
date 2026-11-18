import { Router } from 'express';
import {
  listExpenseCategories,
  createExpenseCategory,
  listExpenses,
  createExpense
} from '../controllers/expense.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenant.js';

const router = Router();

router.use(authenticateJWT, tenantContext);

router.get('/', listExpenses);
router.post('/', requireRole(['Shop Owner', 'Shop Manager', 'Accountant']), createExpense);
router.get('/categories', listExpenseCategories);
router.post('/categories', requireRole(['Shop Owner', 'Shop Manager', 'Accountant']), createExpenseCategory);

export default router;
