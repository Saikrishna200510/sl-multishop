import { prisma } from '../services/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';

export interface AuditLogOptions {
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
}

export async function logAuditEvent(
  req: AuthenticatedRequest,
  options: AuditLogOptions
): Promise<void> {
  try {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];

    await prisma.auditLog.create({
      data: {
        shop_id: req.shopId || req.user?.shop_id || null,
        user_id: req.user?.id || null,
        action: options.action,
        entity_type: options.entityType,
        entity_id: options.entityId || null,
        old_values: options.oldValues ? options.oldValues : undefined,
        new_values: options.newValues ? options.newValues : undefined,
        ip_address: ip ? String(ip).substring(0, 50) : null,
        user_agent: userAgent ? String(userAgent).substring(0, 255) : null
      }
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
