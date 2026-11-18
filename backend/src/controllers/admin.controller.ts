import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../types/index.js';
import { logAuditEvent } from '../utils/auditLogger.js';

// Schemas
export const updateShopStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION', 'INACTIVE']),
  reason: z.string().optional()
});

export const planSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  monthly_price: z.number().nonnegative(),
  annual_price: z.number().nonnegative(),
  max_branches: z.number().int().positive(),
  max_counters: z.number().int().positive(),
  max_users: z.number().int().positive(),
  max_products: z.number().int().positive(),
  max_invoices_per_month: z.number().int().positive(),
  features: z.array(z.string()).optional(),
  is_active: z.boolean().default(true)
});

export const verifyPaymentSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  notes: z.string().optional()
});

export const updateTicketSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  responseMessage: z.string().optional()
});

export async function getPlatformDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
  const [
    totalShops,
    activeShops,
    suspendedShops,
    totalUsers,
    totalInvoices,
    recentPayments,
    recentShops
  ] = await Promise.all([
    prisma.shop.count(),
    prisma.shop.count({ where: { status: 'ACTIVE' } }),
    prisma.shop.count({ where: { status: 'SUSPENDED' } }),
    prisma.user.count(),
    prisma.invoice.count(),
    prisma.subscriptionPayment.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        shop: { select: { id: true, name: true, slug: true } },
        subscription: { include: { plan: { select: { name: true } } } }
      }
    }),
    prisma.shop.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        subscriptions: {
          take: 1,
          orderBy: { created_at: 'desc' },
          include: { plan: true }
        }
      }
    })
  ]);

  // Aggregate verified revenue
  const revenueAgg = await prisma.subscriptionPayment.aggregate({
    where: { status: 'VERIFIED' },
    _sum: { amount: true }
  });

  res.status(200).json({
    success: true,
    data: {
      metrics: {
        totalShops,
        activeShops,
        suspendedShops,
        totalUsers,
        totalInvoices,
        totalPlatformRevenue: revenueAgg._sum.amount || 0
      },
      recentPayments,
      recentShops
    }
  });
}

export async function listShops(req: AuthenticatedRequest, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '20', 10);
  const search = req.query.search as string;
  const status = req.query.status as any;
  const skip = (page - 1) * limit;

  const whereClause: any = {};
  if (status) whereClause.status = status;
  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [shops, total] = await Promise.all([
    prisma.shop.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        subscriptions: {
          take: 1,
          orderBy: { created_at: 'desc' },
          include: { plan: true }
        },
        _count: {
          select: {
            branches: true,
            counters: true,
            invoices: true,
            products: true,
            user_roles: true
          }
        }
      }
    }),
    prisma.shop.count({ where: whereClause })
  ]);

  res.status(200).json({
    success: true,
    data: shops,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}

export async function getShopDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
  const shopId = req.params.shopId as string;

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      shop_settings: true,
      branches: { include: { counters: true } },
      subscriptions: {
        orderBy: { created_at: 'desc' },
        include: {
          plan: true,
          payments: { orderBy: { created_at: 'desc' } }
        }
      },
      user_roles: {
        include: {
          user: { select: { id: true, email: true, first_name: true, last_name: true, phone: true } },
          role: true
        }
      },
      _count: {
        select: {
          products: true,
          customers: true,
          invoices: true,
          audit_logs: true
        }
      }
    }
  });

  if (!shop) {
    throw new AppError('Shop not found', 404);
  }

  res.status(200).json({
    success: true,
    data: shop
  });
}

export async function updateShopStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  const shopId = req.params.shopId as string;
  const { status, reason } = updateShopStatusSchema.parse(req.body);

  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) {
    throw new AppError('Shop not found', 404);
  }

  const updated = await prisma.shop.update({
    where: { id: shopId },
    data: { status }
  });

  await logAuditEvent(req, {
    action: `SHOP_STATUS_CHANGED_TO_${status}`,
    entityType: 'SHOP',
    entityId: shopId,
    oldValues: { status: shop.status },
    newValues: { status, reason }
  });

  res.status(200).json({
    success: true,
    message: `Shop status updated to ${status}`,
    data: updated
  });
}

// ----------------------------------------------------
// Plans Management
// ----------------------------------------------------

export async function listPlans(req: AuthenticatedRequest, res: Response): Promise<void> {
  const plans = await prisma.plan.findMany({
    orderBy: { monthly_price: 'asc' },
    include: {
      _count: { select: { subscriptions: true } }
    }
  });

  res.status(200).json({
    success: true,
    data: plans
  });
}

export async function createPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = planSchema.parse(req.body);

  const existingSlug = await prisma.plan.findUnique({ where: { slug: data.slug } });
  if (existingSlug) {
    throw new AppError('A plan with this slug already exists', 409);
  }

  const plan = await prisma.plan.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      monthly_price: data.monthly_price,
      annual_price: data.annual_price,
      max_branches: data.max_branches,
      max_counters: data.max_counters,
      max_users: data.max_users,
      max_products: data.max_products,
      max_invoices_per_month: data.max_invoices_per_month,
      features: data.features || [],
      is_active: data.is_active
    }
  });

  res.status(201).json({
    success: true,
    message: 'Plan created successfully',
    data: plan
  });
}

export async function updatePlan(req: AuthenticatedRequest, res: Response): Promise<void> {
  const planId = req.params.planId as string;
  const data = planSchema.partial().parse(req.body);

  const updated = await prisma.plan.update({
    where: { id: planId },
    data
  });

  res.status(200).json({
    success: true,
    message: 'Plan updated successfully',
    data: updated
  });
}

// ----------------------------------------------------
// Subscription Payments Verification
// ----------------------------------------------------

export async function listPendingPayments(req: AuthenticatedRequest, res: Response): Promise<void> {
  const payments = await prisma.subscriptionPayment.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      shop: { select: { id: true, name: true, phone: true, email: true } },
      subscription: { include: { plan: true } }
    }
  });

  res.status(200).json({
    success: true,
    data: payments
  });
}

export async function verifyPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
  const paymentId = req.params.paymentId as string;
  const { status, notes } = verifyPaymentSchema.parse(req.body);

  const payment = await prisma.subscriptionPayment.findUnique({
    where: { id: paymentId },
    include: { subscription: true }
  });

  if (!payment) {
    throw new AppError('Payment record not found', 404);
  }

  await prisma.$transaction(async (tx) => {
    // 1. Update Payment Record
    await tx.subscriptionPayment.update({
      where: { id: paymentId },
      data: {
        status,
        verified_by: req.user?.id,
        verified_at: new Date(),
        notes: notes || payment.notes
      }
    });

    // 2. If VERIFIED, activate/renew the subscription
    if (status === 'VERIFIED') {
      const currentEnd = new Date((payment as any).subscription.end_date);
      const newStart = currentEnd > new Date() ? currentEnd : new Date();
      const newEnd = new Date(newStart);

      if ((payment as any).subscription.billing_cycle === 'ANNUAL') {
        newEnd.setFullYear(newEnd.getFullYear() + 1);
      } else {
        newEnd.setMonth(newEnd.getMonth() + 1);
      }

      await tx.subscription.update({
        where: { id: payment.subscription_id },
        data: {
          status: 'ACTIVE',
          start_date: newStart,
          end_date: newEnd,
          grace_period_end: null
        }
      });

      // Ensure Shop status is ACTIVE
      await tx.shop.update({
        where: { id: payment.shop_id },
        data: { status: 'ACTIVE' }
      });
    }
  });

  await logAuditEvent(req, {
    action: `SUBSCRIPTION_PAYMENT_${status}`,
    entityType: 'SUBSCRIPTION_PAYMENT',
    entityId: paymentId,
    newValues: { status, notes }
  });

  res.status(200).json({
    success: true,
    message: `Payment marked as ${status}`
  });
}

// ----------------------------------------------------
// Support & Audit Logs
// ----------------------------------------------------

export async function listAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '50', 10);
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        shop: { select: { id: true, name: true } },
        user: { select: { id: true, email: true, first_name: true, last_name: true } }
      }
    }),
    prisma.auditLog.count()
  ]);

  res.status(200).json({
    success: true,
    data: logs,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
  });
}

export async function listSupportTickets(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tickets = await prisma.supportTicket.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      shop: { select: { id: true, name: true, phone: true } },
      user: { select: { id: true, email: true, first_name: true, last_name: true } }
    }
  });

  res.status(200).json({
    success: true,
    data: tickets
  });
}

export async function updateSupportTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
  const ticketId = req.params.ticketId as string;
  const { status, responseMessage } = updateTicketSchema.parse(req.body);

  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }

  const existingResponses = (ticket.responses as any[]) || [];
  if (responseMessage) {
    existingResponses.push({
      author: `${req.user?.first_name} (Super Admin)`,
      message: responseMessage,
      timestamp: new Date().toISOString()
    });
  }

  const updated = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      status: status || ticket.status,
      responses: existingResponses
    }
  });

  res.status(200).json({
    success: true,
    message: 'Ticket updated successfully',
    data: updated
  });
}
