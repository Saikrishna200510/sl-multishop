import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { AppError } from './errorHandler.js';
import { prisma } from '../services/prisma.js';

export async function tenantContext(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required before tenant resolution', 401);
    }

    // 1. Super Admin cross-tenant handling
    if (req.user.is_super_admin) {
      const tenantHeader = req.headers['x-tenant-id'];
      const explicitShopId = (typeof tenantHeader === 'string' ? tenantHeader : req.params.shopId || req.user.shop_id) as string | undefined;
      if (explicitShopId && typeof explicitShopId === 'string') {
        const shop = await prisma.shop.findUnique({
          where: { id: explicitShopId }
        });
        if (shop) {
          req.shopId = shop.id;
          return next();
        }
      }

      // Default to first active shop so Super Admin can inspect shop pages seamlessly
      const defaultShop = await prisma.shop.findFirst({
        where: { status: 'ACTIVE' },
        orderBy: { created_at: 'asc' }
      });
      if (defaultShop) {
        req.shopId = defaultShop.id;
      }
      return next();
    }

    // 2. Regular user tenant resolution
    // Always resolve from verified DB memberships - NEVER trust client blindly
    const requestedShopId = (req.headers['x-tenant-id'] as string) || req.user.shop_id;

    if (!requestedShopId) {
      // Find the first active shop the user belongs to
      const membership = await prisma.userRole.findFirst({
        where: { user_id: req.user.id, shop_id: { not: null } },
        include: { shop: true, role: true, branch: true }
      });

      if (!membership || !membership.shop) {
        throw new AppError('No shop membership found for this user account', 403);
      }

      req.shopId = membership.shop.id;
      req.branchId = membership.branch_id || undefined;
      req.user.shop_id = membership.shop.id;
      req.user.branch_id = membership.branch_id || undefined;
      req.user.role_id = membership.role_id;
      req.user.role_name = membership.role.name;
    } else {
      // User explicitly specified or token had a shopId - verify membership
      const membership = await prisma.userRole.findFirst({
        where: {
          user_id: req.user.id,
          shop_id: requestedShopId
        },
        include: { shop: true, role: true, branch: true }
      });

      if (!membership || !membership.shop) {
        throw new AppError('Access denied: You do not have permissions for this shop', 403);
      }

      req.shopId = membership.shop.id;
      req.branchId = membership.branch_id || undefined;
      req.user.shop_id = membership.shop.id;
      req.user.branch_id = membership.branch_id || undefined;
      req.user.role_id = membership.role_id;
      req.user.role_name = membership.role.name;
    }

    // 3. Verify shop status
    const shop = await prisma.shop.findUnique({
      where: { id: req.shopId }
    });

    if (!shop || shop.status === 'INACTIVE') {
      throw new AppError('This shop account is inactive or not found', 403);
    }

    if (shop.status === 'SUSPENDED') {
      throw new AppError('This shop account has been suspended. Please contact platform support.', 403);
    }

    // 4. Verify shop subscription status (unless it is a subscription renewal or read-only status call)
    if (!req.path.startsWith('/subscriptions') && !req.path.startsWith('/auth')) {
      const activeSubscription = await prisma.subscription.findFirst({
        where: {
          shop_id: req.shopId,
          status: { in: ['ACTIVE', 'TRIAL', 'PAST_DUE'] }
        },
        orderBy: { end_date: 'desc' }
      });

      if (!activeSubscription) {
        throw new AppError('Active subscription required. Please renew your subscription plan.', 402);
      }

      // Check if past due beyond grace period
      if (activeSubscription.status === 'PAST_DUE' && activeSubscription.grace_period_end) {
        if (new Date() > new Date(activeSubscription.grace_period_end)) {
          throw new AppError('Your subscription grace period has ended. Please settle payment to continue.', 402);
        }
      }
    }

    next();
  } catch (err) {
    next(err);
  }
}
