import { Response } from 'express';
import { z } from 'zod';
import { prisma, withTenantTransaction } from '../services/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../types/index.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { Decimal } from 'decimal.js';

export const createSupplierSchema = z.object({
  name: z.string().min(2),
  companyName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  gstin: z.string().max(20).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional()
});

export const createPOSchema = z.object({
  branchId: z.string().uuid(),
  supplierId: z.string().uuid(),
  expectedDate: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      variantId: z.string().uuid().optional(),
      quantity: z.number().positive(),
      unitCost: z.number().nonnegative(),
      taxRate: z.number().nonnegative().default(0),
      batchNumber: z.string().optional(),
      expiryDate: z.string().optional()
    })
  ).min(1),
  notes: z.string().optional()
});

export const receiveGRNSchema = z.object({
  purchaseOrderId: z.string().uuid(),
  supplierInvoiceNumber: z.string().optional(),
  notes: z.string().optional()
});

export async function listSuppliers(req: AuthenticatedRequest, res: Response): Promise<void> {
  const suppliers = await prisma.supplier.findMany({
    where: { shop_id: req.shopId, is_active: true },
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { purchase_orders: true } }
    }
  });

  res.status(200).json({ success: true, data: suppliers });
}

export async function createSupplier(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = createSupplierSchema.parse(req.body);

  const supplier = await prisma.supplier.create({
    data: {
      shop_id: req.shopId!,
      name: data.name,
      company_name: data.companyName,
      email: data.email,
      phone: data.phone,
      gstin: data.gstin,
      address: data.address,
      city: data.city,
      state: data.state
    }
  });

  await logAuditEvent(req, {
    action: 'SUPPLIER_CREATED',
    entityType: 'SUPPLIER',
    entityId: supplier.id,
    newValues: { name: supplier.name }
  });

  res.status(201).json({ success: true, message: 'Supplier created', data: supplier });
}

export async function createPurchaseOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = createPOSchema.parse(req.body);

  const poCount = await prisma.purchaseOrder.count({ where: { shop_id: req.shopId } });
  const poNumber = `PO-${1000 + poCount + 1}`;

  let subtotal = new Decimal(0);
  let totalTax = new Decimal(0);

  const purchaseItemsData = data.items.map((item) => {
    const qty = new Decimal(item.quantity);
    const cost = new Decimal(item.unitCost);
    const lineTotal = qty.mul(cost);
    const taxAmt = lineTotal.mul(new Decimal(item.taxRate)).div(100);

    subtotal = subtotal.plus(lineTotal);
    totalTax = totalTax.plus(taxAmt);

    return {
      shop_id: req.shopId!,
      product_id: item.productId,
      variant_id: item.variantId,
      quantity: qty.toNumber(),
      unit_cost: cost.toNumber(),
      tax_rate: item.taxRate,
      tax_amount: taxAmt.toNumber(),
      total: lineTotal.plus(taxAmt).toNumber(),
      batch_number: item.batchNumber,
      expiry_date: item.expiryDate ? new Date(item.expiryDate) : undefined
    };
  });

  const totalAmount = subtotal.plus(totalTax);

  const po = await prisma.purchaseOrder.create({
    data: {
      shop_id: req.shopId!,
      branch_id: data.branchId,
      supplier_id: data.supplierId,
      po_number: poNumber,
      order_date: new Date(),
      expected_date: data.expectedDate ? new Date(data.expectedDate) : undefined,
      subtotal: subtotal.toNumber(),
      tax_amount: totalTax.toNumber(),
      total_amount: totalAmount.toNumber(),
      status: 'ORDERED',
      notes: data.notes,
      created_by: req.user?.id,
      purchase_items: {
        create: purchaseItemsData
      }
    },
    include: { purchase_items: true }
  });

  res.status(201).json({
    success: true,
    message: 'Purchase order created successfully',
    data: po
  });
}

export async function receiveGoods(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = receiveGRNSchema.parse(req.body);

  const po = await prisma.purchaseOrder.findFirst({
    where: { id: data.purchaseOrderId, shop_id: req.shopId },
    include: { purchase_items: true, supplier: true }
  });

  if (!po) {
    throw new AppError('Purchase order not found', 404);
  }

  if (po.status === 'COMPLETED') {
    throw new AppError('This purchase order has already been fully received', 400);
  }

  const grnCount = await prisma.goodsReceipt.count({ where: { shop_id: req.shopId } });
  const grnNumber = `GRN-${1000 + grnCount + 1}`;

  await withTenantTransaction(req.shopId!, async (tx) => {
    // 1. Create Goods Receipt
    await tx.goodsReceipt.create({
      data: {
        shop_id: req.shopId!,
        purchase_order_id: po.id,
        grn_number: grnNumber,
        received_date: new Date(),
        supplier_invoice_number: data.supplierInvoiceNumber,
        received_items: po.purchase_items,
        notes: data.notes,
        received_by: req.user?.id
      }
    });

    // 2. Increment stock for each item
    for (const item of po.purchase_items) {
      let balance = await tx.stockBalance.findFirst({
        where: {
          branch_id: po.branch_id,
          product_id: item.product_id,
          variant_id: item.variant_id
        }
      });

      const prevQty = balance ? Number(balance.quantity) : 0;
      const recQty = Number(item.quantity);
      const newQty = prevQty + recQty;

      if (!balance) {
        balance = await tx.stockBalance.create({
          data: {
            shop_id: req.shopId!,
            branch_id: po.branch_id,
            product_id: item.product_id,
            variant_id: item.variant_id,
            batch_number: item.batch_number,
            expiry_date: item.expiry_date,
            quantity: newQty,
            available_quantity: newQty,
            cost_price: item.unit_cost
          }
        });
      } else {
        await tx.stockBalance.update({
          where: { id: balance.id },
          data: {
            quantity: newQty,
            available_quantity: newQty,
            cost_price: item.unit_cost // update cost price to latest procurement cost
          }
        });
      }

      // Stock movement
      await tx.stockMovement.create({
        data: {
          shop_id: req.shopId!,
          branch_id: po.branch_id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          batch_number: item.batch_number,
          movement_type: 'PURCHASE',
          quantity: recQty,
          previous_stock: prevQty,
          new_stock: newQty,
          unit_cost: item.unit_cost,
          reference_id: grnNumber,
          reference_type: 'GOODS_RECEIPT',
          notes: `GRN from ${po.supplier.name} (#${po.po_number})`,
          created_by: req.user?.id
        }
      });

      // Mark purchase item received quantity
      await tx.purchaseItem.update({
        where: { id: item.id },
        data: { received_quantity: item.quantity }
      });
    }

    // 3. Update PO status to COMPLETED
    await tx.purchaseOrder.update({
      where: { id: po.id },
      data: { status: 'COMPLETED' }
    });

    // 4. Update supplier credit balance
    const currentSupplierBal = new Decimal(po.supplier.current_balance.toString());
    const newSupplierBal = currentSupplierBal.plus(new Decimal(po.total_amount.toString()));

    await tx.supplier.update({
      where: { id: po.supplier_id },
      data: { current_balance: newSupplierBal.toNumber() }
    });
  });

  res.status(200).json({
    success: true,
    message: `Goods receipt ${grnNumber} processed successfully and inventory updated`
  });
}
