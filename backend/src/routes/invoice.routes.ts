import { Router } from 'express';
import {
  listInvoices,
  getInvoiceDetails,
  downloadInvoicePdf,
  cancelInvoice
} from '../controllers/invoice.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenant.js';

const router = Router();

router.use(authenticateJWT, tenantContext);

router.get('/', listInvoices);
router.get('/:invoiceId', getInvoiceDetails);
router.get('/:invoiceId/pdf', downloadInvoicePdf);
router.post('/:invoiceId/cancel', requireRole(['Shop Owner', 'Shop Manager']), cancelInvoice);

export default router;
