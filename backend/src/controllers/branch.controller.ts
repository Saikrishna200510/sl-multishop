import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../types/index.js';
import { logAuditEvent } from '../utils/auditLogger.js';

export const createBranchSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(1).max(50),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  is_main: z.boolean().default(false)
});

export const createCounterSchema = z.object({
  branchId: z.string().uuid(),
  name: z.string().min(2),
  code: z.string().min(1).max(50),
  device_id: z.string().optional()
});

export async function listBranches(req: AuthenticatedRequest, res: Response): Promise<void> {
  const branches = await prisma.branch.findMany({
    where: { shop_id: req.shopId },
    orderBy: { created_at: 'asc' },
    include: {
      counters: true,
      _count: {
        select: {
          stock_balances: true,
          invoices: true
        }
      }
    }
  });

  res.status(200).json({
    success: true,
    data: branches
  });
}

export async function createBranch(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = createBranchSchema.parse(req.body);

  // Check plan branch limit
  const activeSub = await prisma.subscription.findFirst({
    where: { shop_id: req.shopId, status: { in: ['ACTIVE', 'TRIAL'] } },
    include: { plan: true }
  });

  if (activeSub?.plan) {
    const currentBranchCount = await prisma.branch.count({
      where: { shop_id: req.shopId }
    });

    if (currentBranchCount >= activeSub.plan.max_branches) {
      throw new AppError(`Plan limit reached: Your current plan allows maximum ${activeSub.plan.max_branches} branch(es). Please upgrade your subscription plan.`, 403);
    }
  }

  const existingCode = await prisma.branch.findUnique({
    where: {
      shop_id_code: {
        shop_id: req.shopId!,
        code: data.code
      }
    }
  });

  if (existingCode) {
    throw new AppError(`Branch code '${data.code}' is already in use in this shop.`, 409);
  }

  const branch = await prisma.branch.create({
    data: {
      shop_id: req.shopId!,
      ...data
    }
  });

  await logAuditEvent(req, {
    action: 'BRANCH_CREATED',
    entityType: 'BRANCH',
    entityId: branch.id,
    newValues: data
  });

  res.status(201).json({
    success: true,
    message: 'Branch created successfully',
    data: branch
  });
}

export async function listCounters(req: AuthenticatedRequest, res: Response): Promise<void> {
  const branchId = req.query.branchId as string;

  const whereClause: any = { shop_id: req.shopId };
  if (branchId) whereClause.branch_id = branchId;

  const counters = await prisma.counter.findMany({
    where: whereClause,
    orderBy: { created_at: 'asc' },
    include: {
      branch: { select: { id: true, name: true, code: true } }
    }
  });

  res.status(200).json({
    success: true,
    data: counters
  });
}

export async function createCounter(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = createCounterSchema.parse(req.body);

  // Check branch belongs to this shop
  const branch = await prisma.branch.findFirst({
    where: { id: data.branchId, shop_id: req.shopId }
  });

  if (!branch) {
    throw new AppError('Branch not found in this shop', 404);
  }

  // Check plan counter limit
  const activeSub = await prisma.subscription.findFirst({
    where: { shop_id: req.shopId, status: { in: ['ACTIVE', 'TRIAL'] } },
    include: { plan: true }
  });

  if (activeSub?.plan) {
    const currentCounterCount = await prisma.counter.count({
      where: { shop_id: req.shopId }
    });

    if (currentCounterCount >= activeSub.plan.max_counters) {
      throw new AppError(`Plan limit reached: Your current plan allows maximum ${activeSub.plan.max_counters} counter(s). Please upgrade your subscription plan.`, 403);
    }
  }

  const existingCode = await prisma.counter.findUnique({
    where: {
      branch_id_code: {
        branch_id: data.branchId,
        code: data.code
      }
    }
  });

  if (existingCode) {
    throw new AppError(`Counter code '${data.code}' already exists in this branch.`, 409);
  }

  const counter = await prisma.counter.create({
    data: {
      shop_id: req.shopId!,
      branch_id: data.branchId,
      name: data.name,
      code: data.code,
      device_id: data.device_id
    }
  });

  await logAuditEvent(req, {
    action: 'COUNTER_CREATED',
    entityType: 'COUNTER',
    entityId: counter.id,
    newValues: data
  });

  res.status(201).json({
    success: true,
    message: 'Counter created successfully',
    data: counter
  });
}
