import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { verifyAccessToken } from '../utils/auth.js';
import { AppError } from './errorHandler.js';
import { prisma } from '../services/prisma.js';

export async function authenticateJWT(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Authentication required: Missing Bearer token', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);

    // Verify user is active in DB
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        is_super_admin: true,
        status: true
      }
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('User account is inactive or not found', 401);
    }

    req.user = {
      ...user,
      shop_id: payload.shopId,
      branch_id: payload.branchId,
      role_id: payload.roleId,
      role_name: payload.roleName
    };
    req.isSuperAdmin = user.is_super_admin;
    req.shopId = payload.shopId;
    req.branchId = payload.branchId;

    next();
  } catch (err: any) {
    if (err instanceof AppError) {
      next(err);
    } else {
      next(new AppError('Invalid or expired token', 401));
    }
  }
}

export function requireSuperAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || !req.user.is_super_admin) {
    throw new AppError('Access denied: Super Admin privilege required', 403);
  }
  next();
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (req.user.is_super_admin) {
      return next();
    }

    if (!req.user.role_name || !allowedRoles.includes(req.user.role_name)) {
      throw new AppError(`Access denied: Requires one of [${allowedRoles.join(', ')}]`, 403);
    }

    next();
  };
}

export function requirePermission(permissionName: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (req.user.is_super_admin) {
      return next();
    }

    if (!req.user.role_id) {
      throw new AppError('No role assigned for this shop context', 403);
    }

    const hasPermission = await prisma.rolePermission.findFirst({
      where: {
        role_id: req.user.role_id,
        permission: { name: permissionName }
      }
    });

    if (!hasPermission) {
      throw new AppError(`Forbidden: Missing required permission '${permissionName}'`, 403);
    }

    next();
  };
}
