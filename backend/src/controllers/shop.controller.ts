import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../types/index.js';
import { hashPassword } from '../utils/auth.js';
import { logAuditEvent } from '../utils/auditLogger.js';

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  gstin: z.string().max(20).optional(),
  currency: z.string().max(10).optional(),
  timezone: z.string().max(50).optional(),
  logo_url: z.string().optional()
});

export const updateSettingsSchema = z.object({
  industry_type: z.string().optional(),
  features_enabled: z.record(z.boolean()).optional(),
  gst_enabled: z.boolean().optional(),
  is_composition_scheme: z.boolean().optional(),
  default_tax_rate: z.number().optional(),
  receipt_printer_type: z.string().optional(),
  invoice_prefix: z.string().max(20).optional(),
  invoice_footer_note: z.string().optional(),
  invoice_terms: z.string().optional(),
  telugu_invoice_enabled: z.boolean().optional(),
  loyalty_program_enabled: z.boolean().optional(),
  low_stock_threshold_default: z.number().int().optional()
});

export const addStaffSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  roleName: z.enum(['Shop Manager', 'Cashier', 'Accountant', 'Inventory Manager']),
  branchId: z.string().uuid().optional()
});

export async function getShopProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.shopId) {
    throw new AppError('Tenant shop context is required', 400);
  }

  const shop = await prisma.shop.findUnique({
    where: { id: req.shopId },
    include: {
      shop_settings: true,
      branches: {
        include: { counters: true }
      },
      subscriptions: {
        where: { status: { in: ['ACTIVE', 'TRIAL', 'PAST_DUE'] } },
        include: { plan: true },
        take: 1
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

export async function updateShopProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.shopId) {
    throw new AppError('Tenant shop context is required', 400);
  }
  const data = updateProfileSchema.parse(req.body);

  const updated = await prisma.shop.update({
    where: { id: req.shopId },
    data
  });

  await logAuditEvent(req, {
    action: 'SHOP_PROFILE_UPDATED',
    entityType: 'SHOP',
    entityId: req.shopId,
    newValues: data
  });

  res.status(200).json({
    success: true,
    message: 'Shop profile updated successfully',
    data: updated
  });
}

export async function updateShopSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.shopId) {
    throw new AppError('Tenant shop context is required', 400);
  }
  const data = updateSettingsSchema.parse(req.body);

  const updated = await prisma.shopSettings.upsert({
    where: { shop_id: req.shopId },
    update: data,
    create: {
      shop_id: req.shopId!,
      ...data
    }
  });

  await logAuditEvent(req, {
    action: 'SHOP_SETTINGS_UPDATED',
    entityType: 'SHOP_SETTINGS',
    entityId: req.shopId,
    newValues: data
  });

  res.status(200).json({
    success: true,
    message: 'Shop settings updated successfully',
    data: updated
  });
}

export async function listStaff(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.shopId) {
    throw new AppError('Tenant shop context is required', 400);
  }
  const staff = await prisma.userRole.findMany({
    where: { shop_id: req.shopId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          phone: true,
          status: true,
          created_at: true
        }
      },
      role: true,
      branch: { select: { id: true, name: true, code: true } }
    }
  });

  res.status(200).json({
    success: true,
    data: staff.map((s) => ({
      membershipId: s.id,
      user: s.user,
      role: s.role.name,
      branch: s.branch
    }))
  });
}

export async function addStaff(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.shopId) {
    throw new AppError('Tenant shop context is required', 400);
  }
  const data = addStaffSchema.parse(req.body);

  // Check plan staff limit
  const activeSub = await prisma.subscription.findFirst({
    where: { shop_id: req.shopId, status: { in: ['ACTIVE', 'TRIAL'] } },
    include: { plan: true }
  });

  if (activeSub?.plan) {
    const currentStaffCount = await prisma.userRole.count({
      where: { shop_id: req.shopId }
    });

    if (currentStaffCount >= activeSub.plan.max_users) {
      throw new AppError(`Plan limit reached: Your current plan allows maximum ${activeSub.plan.max_users} users. Please upgrade your subscription plan.`, 403);
    }
  }

  // Find or create User
  let user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    const hashedPassword = await hashPassword(data.password);
    user = await prisma.user.create({
      data: {
        email: data.email,
        password_hash: hashedPassword,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        status: 'ACTIVE'
      }
    });
  }

  const role = await prisma.role.findFirst({
    where: { name: data.roleName, is_system: true }
  });

  if (!role) {
    throw new AppError(`Role '${data.roleName}' not found`, 404);
  }

  // Check if user is already a member of this shop
  const existingRole = await prisma.userRole.findFirst({
    where: { user_id: user.id, shop_id: req.shopId }
  });

  if (existingRole) {
    throw new AppError('This user is already a team member of this shop', 409);
  }

  const userRole = await prisma.userRole.create({
    data: {
      user_id: user.id,
      role_id: role.id,
      shop_id: req.shopId!,
      branch_id: data.branchId
    },
    include: { role: true, branch: true }
  });

  await logAuditEvent(req, {
    action: 'STAFF_MEMBER_ADDED',
    entityType: 'USER_ROLE',
    entityId: userRole.id,
    newValues: { email: user.email, role: role.name }
  });

  res.status(201).json({
    success: true,
    message: 'Staff member added successfully',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      },
      role: role.name,
      branch: userRole.branch
    }
  });
}
