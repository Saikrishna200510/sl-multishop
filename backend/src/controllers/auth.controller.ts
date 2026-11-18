import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma.js';
import { hashPassword, verifyPassword, generateAccessToken, generateRefreshToken } from '../utils/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../types/index.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import crypto from 'crypto';

// Validation schemas
export const registerShopSchema = z.object({
  shopName: z.string().min(2).max(255),
  businessType: z.enum([
    'GROCERY',
    'CLOTHING',
    'ELECTRONICS',
    'PHARMACY',
    'RESTAURANT',
    'HARDWARE',
    'GENERAL_RETAIL'
  ]).default('GENERAL_RETAIL'),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  phone: z.string().optional(),
  planSlug: z.string().default('starter')
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  shopId: z.string().uuid().optional()
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1)
});

export const switchShopSchema = z.object({
  shopId: z.string().uuid()
});

export async function registerShop(req: Request, res: Response): Promise<void> {
  const data = registerShopSchema.parse(req.body);

  // Check if user email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });
  if (existingUser) {
    throw new AppError('An account with this email address already exists.', 409);
  }

  // Create unique slug
  let slug = data.shopName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  if (!slug) slug = 'shop';

  const existingSlug = await prisma.shop.findUnique({ where: { slug } });
  if (existingSlug) {
    slug = `${slug}-${Date.now().toString().slice(-4)}`;
  }

  // Get selected plan or fallback to starter
  const plan = await prisma.plan.findUnique({ where: { slug: data.planSlug } }) ||
    await prisma.plan.findFirst();

  if (!plan) {
    throw new AppError('No subscription plan available. Contact administrator.', 500);
  }

  const hashedPassword = await hashPassword(data.password);

  // Create shop, branch, counter, user, and subscription in an atomic transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create User
    const user = await tx.user.create({
      data: {
        email: data.email,
        password_hash: hashedPassword,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        status: 'ACTIVE'
      }
    });

    // 2. Create Shop
    const shop = await tx.shop.create({
      data: {
        name: data.shopName,
        slug,
        business_type: data.businessType,
        email: data.email,
        phone: data.phone,
        status: 'ACTIVE'
      }
    });

    // 3. Create Default Branch
    const branch = await tx.branch.create({
      data: {
        shop_id: shop.id,
        name: 'Main Branch',
        code: 'MAIN',
        is_main: true,
        phone: data.phone
      }
    });

    // 4. Create Default Counter
    const counter = await tx.counter.create({
      data: {
        shop_id: shop.id,
        branch_id: branch.id,
        name: 'Counter 1',
        code: 'CTR-01'
      }
    });

    // 5. Industry-specific settings setup
    const isGrocery = data.businessType === 'GROCERY';
    const isPharmacy = data.businessType === 'PHARMACY';
    const isClothing = data.businessType === 'CLOTHING';
    const isElectronics = data.businessType === 'ELECTRONICS';
    const isRestaurant = data.businessType === 'RESTAURANT';

    await tx.shopSettings.create({
      data: {
        shop_id: shop.id,
        industry_type: data.businessType,
        features_enabled: {
          weight_based_units: isGrocery || data.businessType === 'HARDWARE',
          expiry_tracking: isGrocery || isPharmacy,
          batch_tracking: isGrocery || isPharmacy,
          serial_number_tracking: isElectronics,
          variant_attributes: isClothing,
          restaurant_tables: isRestaurant
        },
        gst_enabled: true,
        default_tax_rate: 18.0,
        receipt_printer_type: 'THERMAL_80MM',
        invoice_prefix: 'INV-',
        next_invoice_number: 1001,
        telugu_invoice_enabled: true
      }
    });

    // 6. Find or create Shop Owner role
    let ownerRole = await tx.role.findFirst({
      where: { name: 'Shop Owner', is_system: true }
    });

    if (!ownerRole) {
      ownerRole = await tx.role.create({
        data: {
          name: 'Shop Owner',
          description: 'Owner with full access to shop',
          is_system: true
        }
      });
    }

    // 7. Assign Shop Owner role
    await tx.userRole.create({
      data: {
        user_id: user.id,
        role_id: ownerRole.id,
        shop_id: shop.id,
        branch_id: branch.id
      }
    });

    // 8. Create 14-day Trial Subscription
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 14);

    const subscription = await tx.subscription.create({
      data: {
        shop_id: shop.id,
        plan_id: plan.id,
        billing_cycle: 'MONTHLY',
        status: 'TRIAL',
        start_date: startDate,
        end_date: endDate,
        auto_renew: false
      }
    });

    return { user, shop, branch, counter, ownerRole, subscription };
  });

  // Generate tokens
  const tokenPayload = {
    userId: result.user.id,
    email: result.user.email,
    isSuperAdmin: result.user.is_super_admin,
    shopId: result.shop.id,
    branchId: result.branch.id,
    roleId: result.ownerRole.id,
    roleName: result.ownerRole.name
  };

  const accessToken = generateAccessToken(tokenPayload);
  const { token: refreshToken, hash: refreshHash } = generateRefreshToken(result.user.id);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      user_id: result.user.id,
      token_hash: refreshHash,
      expires_at: expiresAt,
      ip_address: req.ip
    }
  });

  res.status(201).json({
    success: true,
    message: 'Shop and account registered successfully',
    data: {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.first_name,
        lastName: result.user.last_name,
        isSuperAdmin: result.user.is_super_admin
      },
      shop: {
        id: result.shop.id,
        name: result.shop.name,
        slug: result.shop.slug,
        businessType: result.shop.business_type,
        status: result.shop.status
      },
      activeBranch: {
        id: result.branch.id,
        name: result.branch.name
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: '15m'
      }
    }
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const data = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: {
      user_roles: {
        include: {
          shop: true,
          role: true,
          branch: true
        }
      }
    }
  });

  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  const isPasswordValid = await verifyPassword(data.password, user.password_hash);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (user.status !== 'ACTIVE') {
    throw new AppError('Your account has been deactivated. Contact platform support.', 403);
  }

  // Super Admin login without mandatory shop
  if (user.is_super_admin && (!data.shopId || user.user_roles.length === 0)) {
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      isSuperAdmin: true
    };

    const accessToken = generateAccessToken(tokenPayload);
    const { token: refreshToken, hash: refreshHash } = generateRefreshToken(user.id);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token_hash: refreshHash,
        expires_at: expiresAt,
        ip_address: req.ip
      }
    });

    const allShops = await prisma.shop.findMany({
      where: { status: 'ACTIVE' },
      include: { branches: true }
    });

    const primaryShop = allShops[0];
    const availableShops = allShops.map((s) => ({
      shopId: s.id,
      shopName: s.name,
      businessType: s.business_type,
      roleName: 'Super Admin',
      branchId: s.branches[0]?.id,
      branchName: s.branches[0]?.name
    }));

    res.status(200).json({
      success: true,
      message: 'Super Admin login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          isSuperAdmin: true
        },
        activeShop: primaryShop ? {
          id: primaryShop.id,
          name: primaryShop.name,
          businessType: primaryShop.business_type,
          roleName: 'Super Admin',
          branchId: primaryShop.branches[0]?.id,
          branchName: primaryShop.branches[0]?.name
        } : null,
        availableShops,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: '15m'
        }
      }
    });
    return;
  }

  // Determine active shop membership
  let activeMembership = user.user_roles.find((ur) => ur.shop_id === data.shopId);
  if (!activeMembership) {
    activeMembership = user.user_roles[0];
  }

  if (!activeMembership || !activeMembership.shop) {
    throw new AppError('No shop memberships found for this user.', 403);
  }

  if (activeMembership.shop.status === 'SUSPENDED') {
    throw new AppError('This shop has been suspended by administration.', 403);
  }

  const tokenPayload = {
    userId: user.id,
    email: user.email,
    isSuperAdmin: user.is_super_admin,
    shopId: activeMembership.shop.id,
    branchId: activeMembership.branch_id || undefined,
    roleId: activeMembership.role_id,
    roleName: activeMembership.role.name
  };

  const accessToken = generateAccessToken(tokenPayload);
  const { token: refreshToken, hash: refreshHash } = generateRefreshToken(user.id);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      user_id: user.id,
      token_hash: refreshHash,
      expires_at: expiresAt,
      ip_address: req.ip
    }
  });

  const availableShops = user.user_roles
    .filter((ur) => ur.shop !== null)
    .map((ur) => ({
      shopId: ur.shop!.id,
      shopName: ur.shop!.name,
      businessType: ur.shop!.business_type,
      roleName: ur.role.name,
      branchId: ur.branch_id,
      branchName: ur.branch?.name
    }));

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        isSuperAdmin: user.is_super_admin
      },
      activeShop: {
        id: activeMembership.shop.id,
        name: activeMembership.shop.name,
        businessType: activeMembership.shop.business_type,
        roleName: activeMembership.role.name,
        branchId: activeMembership.branch_id,
        branchName: activeMembership.branch?.name
      },
      availableShops,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: '15m'
      }
    }
  });
}

export async function switchShop(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { shopId } = switchShopSchema.parse(req.body);

  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const membership = await prisma.userRole.findFirst({
    where: {
      user_id: req.user.id,
      shop_id: shopId
    },
    include: { shop: true, role: true, branch: true }
  });

  if (!membership || !membership.shop) {
    throw new AppError('You do not have access to this shop', 403);
  }

  if (membership.shop.status === 'SUSPENDED') {
    throw new AppError('This shop has been suspended', 403);
  }

  const tokenPayload = {
    userId: req.user.id,
    email: req.user.email,
    isSuperAdmin: req.user.is_super_admin,
    shopId: membership.shop.id,
    branchId: membership.branch_id || undefined,
    roleId: membership.role_id,
    roleName: membership.role.name
  };

  const accessToken = generateAccessToken(tokenPayload);

  res.status(200).json({
    success: true,
    message: 'Switched shop context successfully',
    data: {
      activeShop: {
        id: membership.shop.id,
        name: membership.shop.name,
        businessType: membership.shop.business_type,
        roleName: membership.role.name,
        branchId: membership.branch_id,
        branchName: membership.branch?.name
      },
      accessToken
    }
  });
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  const { refreshToken: token } = refreshTokenSchema.parse(req.body);

  const hash = crypto.createHash('sha256').update(token).digest('hex');

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token_hash: hash },
    include: {
      user: {
        include: {
          user_roles: {
            include: { shop: true, role: true, branch: true }
          }
        }
      }
    }
  });

  if (!storedToken || storedToken.revoked_at || new Date() > storedToken.expires_at) {
    throw new AppError('Invalid or expired refresh token. Please login again.', 401);
  }

  // Revoke old refresh token (rotation)
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revoked_at: new Date() }
  });

  const user = storedToken.user;
  const primaryMembership = user.user_roles[0];

  const tokenPayload = {
    userId: user.id,
    email: user.email,
    isSuperAdmin: user.is_super_admin,
    shopId: primaryMembership?.shop?.id,
    branchId: primaryMembership?.branch_id || undefined,
    roleId: primaryMembership?.role_id,
    roleName: primaryMembership?.role?.name
  };

  const newAccessToken = generateAccessToken(tokenPayload);
  const { token: newRefreshToken, hash: newRefreshHash } = generateRefreshToken(user.id);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      user_id: user.id,
      token_hash: newRefreshHash,
      expires_at: expiresAt,
      ip_address: req.ip
    }
  });

  res.status(200).json({
    success: true,
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: '15m'
    }
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const token = req.body.refreshToken;
  if (token) {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    await prisma.refreshToken
      .update({
        where: { token_hash: hash },
        data: { revoked_at: new Date() }
      })
      .catch(() => {});
  }

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
}

export async function getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      first_name: true,
      last_name: true,
      phone: true,
      is_super_admin: true,
      status: true,
      created_at: true
    }
  });

  let shopDetails = null;
  let roleDetails = null;

  const targetShopId = req.shopId || (req.headers['x-tenant-id'] as string) || (req.user.is_super_admin ? (await prisma.shop.findFirst({ where: { status: 'ACTIVE' }, orderBy: { created_at: 'asc' } }))?.id : undefined);

  if (targetShopId) {
    shopDetails = await prisma.shop.findUnique({
      where: { id: targetShopId },
      include: {
        shop_settings: true,
        subscriptions: {
          where: { status: { in: ['ACTIVE', 'TRIAL', 'PAST_DUE'] } },
          include: { plan: true },
          take: 1
        }
      }
    });

    if (req.user.role_id) {
      roleDetails = await prisma.role.findUnique({
        where: { id: req.user.role_id },
        include: {
          role_permissions: {
            include: { permission: true }
          }
        }
      });
    } else if (req.user.is_super_admin) {
      roleDetails = {
        id: 'super-admin-role',
        name: 'Super Admin',
        role_permissions: []
      } as any;
    }
  }

  res.status(200).json({
    success: true,
    data: {
      user,
      activeShop: shopDetails,
      role: roleDetails ? {
        id: roleDetails.id,
        name: roleDetails.name,
        permissions: roleDetails.role_permissions?.map((rp: any) => rp.permission?.name || '') || ['*']
      } : null
    }
  });
}
