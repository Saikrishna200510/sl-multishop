import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../types/index.js';
import { logAuditEvent } from '../utils/auditLogger.js';

export const submitPaymentSchema = z.object({
  planSlug: z.string(),
  billingCycle: z.enum(['MONTHLY', 'ANNUAL']).default('MONTHLY'),
  paymentMethod: z.string().default('UPI'),
  transactionReference: z.string().min(4, 'Transaction ID / UTR is required'),
  notes: z.string().optional()
});

export async function getMySubscription(req: AuthenticatedRequest, res: Response): Promise<void> {
  const shopId = req.shopId;
  if (!shopId) {
    throw new AppError('Tenant shop context is required', 400);
  }

  const subscription = await prisma.subscription.findFirst({
    where: { shop_id: shopId },
    orderBy: { created_at: 'desc' },
    include: {
      plan: true,
      payments: {
        take: 5,
        orderBy: { created_at: 'desc' }
      }
    }
  });

  if (!subscription) {
    throw new AppError('No subscription record found for this shop', 404);
  }

  // Calculate current usage stats
  const [branchesCount, countersCount, usersCount, productsCount, monthInvoicesCount] = await Promise.all([
    prisma.branch.count({ where: { shop_id: shopId } }),
    prisma.counter.count({ where: { shop_id: shopId } }),
    prisma.userRole.count({ where: { shop_id: shopId } }),
    prisma.product.count({ where: { shop_id: shopId, is_active: true } }),
    prisma.invoice.count({
      where: {
        shop_id: shopId,
        invoice_date: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    })
  ]);

  const now = new Date();
  const endDate = new Date(subscription.end_date);
  const diffTime = endDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  res.status(200).json({
    success: true,
    data: {
      subscription,
      daysLeft: daysLeft > 0 ? daysLeft : 0,
      isExpired: daysLeft <= 0,
      usage: {
        branches: { current: branchesCount, max: subscription.plan.max_branches },
        counters: { current: countersCount, max: subscription.plan.max_counters },
        users: { current: usersCount, max: subscription.plan.max_users },
        products: { current: productsCount, max: subscription.plan.max_products },
        monthInvoices: { current: monthInvoicesCount, max: subscription.plan.max_invoices_per_month }
      }
    }
  });
}

export async function listAvailablePlans(req: AuthenticatedRequest, res: Response): Promise<void> {
  const plans = await prisma.plan.findMany({
    where: { is_active: true },
    orderBy: { monthly_price: 'asc' }
  });

  res.status(200).json({
    success: true,
    data: plans
  });
}

export async function submitSubscriptionPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
  const shopId = req.shopId;
  if (!shopId) {
    throw new AppError('Tenant shop context is required', 400);
  }
  const data = submitPaymentSchema.parse(req.body);

  const plan = await prisma.plan.findUnique({
    where: { slug: data.planSlug }
  });

  if (!plan) {
    throw new AppError('Selected plan not found', 404);
  }

  const currentSub = await prisma.subscription.findFirst({
    where: { shop_id: shopId },
    orderBy: { created_at: 'desc' }
  });

  if (!currentSub) {
    throw new AppError('Subscription not found for this shop', 404);
  }

  const amount = data.billingCycle === 'ANNUAL' ? plan.annual_price : plan.monthly_price;

  const paymentRecord = await prisma.subscriptionPayment.create({
    data: {
      shop_id: shopId,
      subscription_id: currentSub.id,
      amount: amount,
      payment_method: data.paymentMethod,
      transaction_reference: data.transactionReference,
      status: 'PENDING',
      notes: data.notes || `Renewal/Upgrade for ${plan.name} (${data.billingCycle})`
    }
  });

  await logAuditEvent(req, {
    action: 'SUBSCRIPTION_PAYMENT_SUBMITTED',
    entityType: 'SUBSCRIPTION_PAYMENT',
    entityId: paymentRecord.id,
    newValues: { plan: plan.name, ref: data.transactionReference, amount }
  });

  res.status(201).json({
    success: true,
    message: 'Payment submission received. Your subscription will be updated upon administrator verification.',
    data: paymentRecord
  });
}
