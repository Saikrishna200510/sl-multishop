import { Router } from 'express';
import {
  listCustomers,
  createCustomer,
  getCustomerDetails,
  getCustomerLedger
} from '../controllers/customer.controller.js';
import { authenticateJWT } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenant.js';

const router = Router();

router.use(authenticateJWT, tenantContext);

router.get('/', listCustomers);
router.post('/', createCustomer);
router.get('/:customerId', getCustomerDetails);
router.get('/:customerId/ledger', getCustomerLedger);

export default router;
