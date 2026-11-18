import { Response } from 'express';
import { z } from 'zod';
import { prisma, withTenantTransaction } from '../services/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../types/index.js';
import { logAuditEvent } from '../utils/auditLogger.js';

export const adjustStockSchema = z.object({
  branchId: z.string().uuid(),
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  type: z.enum(['ADJUSTMENT_UP', 'ADJUSTMENT_DOWN']),
  quantity: z.number().positive(),
  reason: z.string().min(2)
});

export const createTransferSchema = z.object({
  sourceBranchId: z.string().uuid(),
  destinationBranchId: z.string().uuid(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      variantId: z.string().uuid().optional(),
      productName: z.string(),
      quantity: z.number().positive()
    })
  ).min(1),
  notes: z.string().optional()
});

export async function getStockBalances(req: AuthenticatedRequest, res: Response): Promise<void> {
  const branchId = req.query.branchId as string;
  const lowStockOnly = req.query.lowStock === 'true';

  const whereClause: any = { shop_id: req.shopId };
  if (branchId) whereClause.branch_id = branchId;

  const balances = await prisma.stockBalance.findMany({
    where: whereClause,
    orderBy: { quantity: 'asc' },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          barcode: true,
          min_stock_level: true,
          unit: true
        }
      },
      variant: true,
      branch: { select: { id: true, name: true, code: true } }
    }
  });

  const filtered = lowStockOnly
    ? balances.filter((b) => Number(b.quantity) <= Number(b.product.min_stock_level))
    : balances;

  res.status(200).json({
    success: true,
    data: filtered
  });
}

export async function adjustStock(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = adjustStockSchema.parse(req.body);

  const updatedBalance = await withTenantTransaction(req.shopId!, async (tx) => {
    let balance = await tx.stockBalance.findFirst({
      where: {
        branch_id: data.branchId,
        product_id: data.productId,
        variant_id: data.variantId || null
      }
    });

    const product = await tx.product.findUnique({
      where: { id: data.productId }
    });

    if (!product) throw new AppError('Product not found', 404);

    const prevStock = balance ? Number(balance.quantity) : 0;
    const changeQty = data.quantity;
    const newStock = data.type === 'ADJUSTMENT_UP' ? prevStock + changeQty : Math.max(0, prevStock - changeQty);

    if (!balance) {
      balance = await tx.stockBalance.create({
        data: {
          shop_id: req.shopId!,
          branch_id: data.branchId,
          product_id: data.productId,
          variant_id: data.variantId,
          quantity: newStock,
          available_quantity: newStock,
          cost_price: product.purchase_price
        }
      });
    } else {
      balance = await tx.stockBalance.update({
        where: { id: balance.id },
        data: {
          quantity: newStock,
          available_quantity: newStock
        }
      });
    }

    await tx.stockMovement.create({
      data: {
        shop_id: req.shopId!,
        branch_id: data.branchId,
        product_id: data.productId,
        variant_id: data.variantId,
        movement_type: data.type,
        quantity: changeQty,
        previous_stock: prevStock,
        new_stock: newStock,
        unit_cost: balance.cost_price,
        reference_type: 'MANUAL_ADJUSTMENT',
        notes: data.reason,
        created_by: req.user?.id
      }
    });

    return balance;
  });

  await logAuditEvent(req, {
    action: 'STOCK_ADJUSTED',
    entityType: 'STOCK_BALANCE',
    entityId: updatedBalance.id,
    newValues: { type: data.type, quantity: data.quantity, reason: data.reason }
  });

  res.status(200).json({
    success: true,
    message: 'Stock adjusted successfully',
    data: updatedBalance
  });
}

export async function listStockMovements(req: AuthenticatedRequest, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '50', 10);
  const productId = req.query.productId as string;
  const branchId = req.query.branchId as string;
  const skip = (page - 1) * limit;

  const whereClause: any = { shop_id: req.shopId };
  if (productId) whereClause.product_id = productId;
  if (branchId) whereClause.branch_id = branchId;

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        branch: { select: { id: true, name: true } }
      }
    }),
    prisma.stockMovement.count({ where: whereClause })
  ]);

  res.status(200).json({
    success: true,
    data: movements,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
  });
}

export async function createStockTransfer(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = createTransferSchema.parse(req.body);

  if (data.sourceBranchId === data.destinationBranchId) {
    throw new AppError('Source and destination branches cannot be the same', 400);
  }

  const transferCount = await prisma.stockTransfer.count({ where: { shop_id: req.shopId } });
  const transferNumber = `TRF-${1000 + transferCount + 1}`;

  const transfer = await withTenantTransaction(req.shopId!, async (tx) => {
    // Deduct stock from source branch
    for (const item of data.items) {
      const sourceBalance = await tx.stockBalance.findFirst({
        where: {
          branch_id: data.sourceBranchId,
          product_id: item.productId,
          variant_id: item.variantId || null
        }
      });

      if (!sourceBalance || Number(sourceBalance.quantity) < item.quantity) {
        throw new AppError(`Insufficient stock for '${item.productName}' in source branch`, 400);
      }

      const prevQty = Number(sourceBalance.quantity);
      const newQty = prevQty - item.quantity;

      await tx.stockBalance.update({
        where: { id: sourceBalance.id },
        data: { quantity: newQty, available_quantity: newQty }
      });

      await tx.stockMovement.create({
        data: {
          shop_id: req.shopId!,
          branch_id: data.sourceBranchId,
          product_id: item.productId,
          variant_id: item.variantId,
          movement_type: 'TRANSFER_OUT',
          quantity: item.quantity,
          previous_stock: prevQty,
          new_stock: newQty,
          unit_cost: sourceBalance.cost_price,
          reference_id: transferNumber,
          reference_type: 'STOCK_TRANSFER',
          notes: `Transfer to branch`,
          created_by: req.user?.id
        }
      });
    }

    return await tx.stockTransfer.create({
      data: {
        shop_id: req.shopId!,
        transfer_number: transferNumber,
        source_branch_id: data.sourceBranchId,
        destination_branch_id: data.destinationBranchId,
        status: 'IN_TRANSIT',
        items: data.items,
        notes: data.notes,
        sent_by: req.user?.id,
        sent_at: new Date()
      }
    });
  });

  res.status(201).json({
    success: true,
    message: 'Stock transfer initiated',
    data: transfer
  });
}

export async function receiveStockTransfer(req: AuthenticatedRequest, res: Response): Promise<void> {
  const transferId = req.params.transferId as string;

  const transfer = await prisma.stockTransfer.findFirst({
    where: { id: transferId, shop_id: req.shopId, status: 'IN_TRANSIT' }
  });

  if (!transfer) {
    throw new AppError('Transfer not found or already completed', 404);
  }

  const items = transfer.items as any[];

  await withTenantTransaction(req.shopId!, async (tx) => {
    for (const item of items) {
      let destBalance = await tx.stockBalance.findFirst({
        where: {
          branch_id: transfer.destination_branch_id,
          product_id: item.productId,
          variant_id: item.variantId || null
        }
      });

      const prevQty = destBalance ? Number(destBalance.quantity) : 0;
      const newQty = prevQty + Number(item.quantity);

      if (!destBalance) {
        destBalance = await tx.stockBalance.create({
          data: {
            shop_id: req.shopId!,
            branch_id: transfer.destination_branch_id,
            product_id: item.productId,
            variant_id: item.variantId,
            quantity: newQty,
            available_quantity: newQty,
            cost_price: 0
          }
        });
      } else {
        await tx.stockBalance.update({
          where: { id: destBalance.id },
          data: { quantity: newQty, available_quantity: newQty }
        });
      }

      await tx.stockMovement.create({
        data: {
          shop_id: req.shopId!,
          branch_id: transfer.destination_branch_id,
          product_id: item.productId,
          variant_id: item.variantId,
          movement_type: 'TRANSFER_IN',
          quantity: item.quantity,
          previous_stock: prevQty,
          new_stock: newQty,
          unit_cost: destBalance.cost_price,
          reference_id: transfer.transfer_number,
          reference_type: 'STOCK_TRANSFER',
          notes: `Received from transfer #${transfer.transfer_number}`,
          created_by: req.user?.id
        }
      });
    }

    await tx.stockTransfer.update({
      where: { id: transfer.id },
      data: {
        status: 'RECEIVED',
        received_by: req.user?.id,
        received_at: new Date()
      }
    });
  });

  res.status(200).json({
    success: true,
    message: 'Stock transfer received and added to branch inventory'
  });
}
