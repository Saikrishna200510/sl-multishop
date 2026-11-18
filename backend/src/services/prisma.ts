import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

/**
 * Executes a transaction scoped to a specific tenant for PostgreSQL Row-Level Security.
 */
export async function withTenantTransaction<T>(
  shopId: string,
  fn: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    // Set RLS session variable for this transaction
    await tx.$executeRawUnsafe(`SET LOCAL app.current_shop_id = '${shopId}';`);
    await tx.$executeRawUnsafe(`SET LOCAL app.is_super_admin = 'false';`);
    return await fn(tx as unknown as PrismaClient);
  });
}

/**
 * Executes a transaction with Super Admin bypass for cross-tenant administration.
 */
export async function withSuperAdminTransaction<T>(
  fn: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.is_super_admin = 'true';`);
    return await fn(tx as unknown as PrismaClient);
  });
}
