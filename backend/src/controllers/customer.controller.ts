import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../types/index.js';
import { logAuditEvent } from '../utils/auditLogger.js';

export const createCustomerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  gstin: z.string().max(20).optional(),
  creditLimit: z.number().nonnegative().default(0),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional()
});

export async function listCustomers(req: AuthenticatedRequest, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '50', 10);
  const search = req.query.search as string;
  const skip = (page - 1) * limit;

  const whereClause: any = { shop_id: req.shopId, is_active: true };

  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        customer_addresses: true,
        _count: { select: { invoices: true } }
      }
    }),
    prisma.customer.count({ where: whereClause })
  ]);

  res.status(200).json({
    success: true,
    data: customers,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
  });
}

export async function createCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = createCustomerSchema.parse(req.body);

  if (data.phone) {
    const existing = await prisma.customer.findUnique({
      where: {
        shop_id_phone: {
          shop_id: req.shopId!,
          phone: data.phone
        }
      }
    });

    if (existing) {
      throw new AppError(`Customer with phone number ${data.phone} already exists in this shop.`, 409);
    }
  }

  const customer = await prisma.$transaction(async (tx) => {
    const created = await tx.customer.create({
      data: {
        shop_id: req.shopId!,
        name: data.name,
        phone: data.phone,
        email: data.email,
        gstin: data.gstin,
        credit_limit: data.creditLimit,
        current_balance: 0
      }
    });

    if (data.addressLine1) {
      await tx.customerAddress.create({
        data: {
          shop_id: req.shopId!,
          customer_id: created.id,
          address_line1: data.addressLine1,
          city: data.city || '',
          state: data.state || '',
          postal_code: data.postalCode || '',
          is_default: true
        }
      });
    }

    return created;
  });

  await logAuditEvent(req, {
    action: 'CUSTOMER_CREATED',
    entityType: 'CUSTOMER',
    entityId: customer.id,
    newValues: { name: customer.name, phone: customer.phone }
  });

  res.status(201).json({
    success: true,
    message: 'Customer created successfully',
    data: customer
  });
}

export async function getCustomerDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
  const customerId = req.params.customerId as string;

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, shop_id: req.shopId },
    include: {
      customer_addresses: true,
      invoices: {
        take: 10,
        orderBy: { invoice_date: 'desc' },
        select: {
          id: true,
          invoice_number: true,
          invoice_date: true,
          total_amount: true,
          paid_amount: true,
          due_amount: true,
          status: true
        }
      },
      customer_ledger: {
        take: 15,
        orderBy: { created_at: 'desc' }
      }
    }
  });

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  res.status(200).json({ success: true, data: customer });
}

export async function getCustomerLedger(req: AuthenticatedRequest, res: Response): Promise<void> {
  const customerId = req.params.customerId as string;

  const ledger = await prisma.customerLedger.findMany({
    where: { customer_id: customerId, shop_id: req.shopId },
    orderBy: { created_at: 'asc' }
  });

  res.status(200).json({ success: true, data: ledger });
}
