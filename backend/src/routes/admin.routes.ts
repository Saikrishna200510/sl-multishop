import { Router } from 'express';
import {
  getPlatformDashboard,
  listShops,
  getShopDetails,
  updateShopStatus,
  listPlans,
  createPlan,
  updatePlan,
  listPendingPayments,
  verifyPayment,
  listAuditLogs,
  listSupportTickets,
  updateSupportTicket
} from '../controllers/admin.controller.js';
import { authenticateJWT, requireSuperAdmin } from '../middleware/auth.js';

const router = Router();

// Protect all admin routes with Super Admin check
router.use(authenticateJWT, requireSuperAdmin);

router.get('/dashboard', getPlatformDashboard);
router.get('/shops', listShops);
router.get('/shops/:shopId', getShopDetails);
router.patch('/shops/:shopId/status', updateShopStatus);

// Plans
router.get('/plans', listPlans);
router.post('/plans', createPlan);
router.patch('/plans/:planId', updatePlan);

// Payment Verifications
router.get('/payments', listPendingPayments);
router.patch('/payments/:paymentId/verify', verifyPayment);

// Audit & Support
router.get('/audit-logs', listAuditLogs);
router.get('/support-tickets', listSupportTickets);
router.patch('/support-tickets/:ticketId', updateSupportTicket);

export default router;
