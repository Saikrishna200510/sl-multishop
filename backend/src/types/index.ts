import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_super_admin: boolean;
  shop_id?: string;
  branch_id?: string;
  role_id?: string;
  role_name?: string;
  permissions?: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  shopId?: string;
  branchId?: string;
  isSuperAdmin?: boolean;
  idempotencyKey?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}
