import { Response } from 'express';
import { prisma, withTenantTransaction } from '../services/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../types/index.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { generateThermalReceipt, generateA4Invoice, InvoicePrintData } from '../utils/pdfGenerator.js';

export async function listInvoices(req: AuthenticatedRequest, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '50', 10);
  const search = req.query.search as string;
  const status = req.query.status as any;
  const branchId = req.query.branchId as string;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;
  const skip = (page - 1) * limit;

  const whereClause: any = { shop_id: req.shopId };

  if (status) whereClause.status = status;
  if (branchId) whereClause.branch_id = branchId;

  if (startDate || endDate) {
    whereClause.invoice_date = {};
    if (startDate) whereClause.invoice_date.gte = new Date(startDate);
    if (endDate) {
      const eDate = new Date(endDate);
      eDate.setHours(23, 59, 59, 999);
      whereClause.invoice_date.lte = eDate;
    }
  }

  if (search) {
    whereClause.OR = [
      { invoice_number: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } },
      { customer: { phone: { contains: search, mode: 'insensitive' } } }
    ];
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { invoice_date: 'desc' },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        branch: { select: { id: true, name: true, code: true } },
        counter: { select: { id: true, name: true, code: true } },
        payments: true
      }
    }),
    prisma.invoice.count({ where: whereClause })
  ]);

  res.status(200).json({
    success: true,
    data: invoices,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
  });
}

export async function getInvoiceDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
  const invoiceId = req.params.invoiceId as string;

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, shop_id: req.shopId },
    include: {
      customer: { include: { customer_addresses: true } },
      branch: true,
      counter: true,
      invoice_items: true,
      invoice_taxes: true,
      payments: true,
      sales_returns: {
        include: { sales_return_items: true }
      }
    }
  });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  res.status(200).json({
    success: true,
    data: invoice
  });
}

export async function downloadInvoicePdf(req: AuthenticatedRequest, res: Response): Promise<void> {
  const invoiceId = req.params.invoiceId as string;
  const format = (req.query.format as string || 'thermal').toLowerCase(); // 'thermal' | 'a4'
  const lang = (req.query.lang as string || 'en').toLowerCase(); // 'en' | 'te'

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, shop_id: req.shopId },
    include: {
      shop: { include: { shop_settings: true } },
      branch: true,
      customer: true,
      invoice_items: true,
      payments: true
    }
  });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  const printData: InvoicePrintData = {
    invoiceNumber: invoice.invoice_number,
    invoiceDate: invoice.invoice_date.toISOString(),
    shopName: invoice.shop.name,
    shopAddress: `${invoice.branch.address_line1 || ''} ${invoice.branch.city || ''} ${invoice.branch.state || ''}`.trim(),
    shopPhone: invoice.branch.phone || invoice.shop.phone || undefined,
    shopGstin: invoice.shop.gstin || undefined,
    customerName: invoice.customer?.name,
    customerPhone: invoice.customer?.phone || undefined,
    items: invoice.invoice_items.map((i) => ({
      name: i.product_name,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unit_price),
      total: Number(i.total_price),
      taxRate: Number(i.tax_rate)
    })),
    subtotal: Number(invoice.subtotal),
    taxAmount: Number(invoice.tax_amount),
    discountAmount: Number(invoice.item_discount_amount) + Number(invoice.invoice_discount_amount),
    roundOff: Number(invoice.round_off),
    totalAmount: Number(invoice.total_amount),
    paidAmount: Number(invoice.paid_amount),
    paymentMethod: invoice.payments.map((p) => p.payment_method).join(', ') || 'CASH',
    footerNote: invoice.shop.shop_settings?.invoice_footer_note || undefined,
    terms: invoice.shop.shop_settings?.invoice_terms || undefined,
    language: lang
  };

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="Invoice-${invoice.invoice_number}.pdf"`);

  if (format === 'a4') {
    const pdfStream = generateA4Invoice(printData);
    pdfStream.pipe(res);
  } else {
    const pdfStream = generateThermalReceipt(printData);
    pdfStream.pipe(res);
  }
}

export async function cancelInvoice(req: AuthenticatedRequest, res: Response): Promise<void> {
  const invoiceId = req.params.invoiceId as string;
  const { reason } = req.body;

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, shop_id: req.shopId },
    include: { invoice_items: true }
  });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  if (invoice.status === 'CANCELLED') {
    throw new AppError('Invoice is already cancelled', 400);
  }

  await withTenantTransaction(req.shopId!, async (tx) => {
    // 1. Update Invoice status
    await tx.invoice.update({
      where: { id: invoiceId },
      data: { status: 'CANCELLED', notes: reason ? `Cancelled: ${reason}` : 'Cancelled by staff' }
    });

    // 2. Restock items
    for (const item of invoice.invoice_items) {
      const stockBalance = await tx.stockBalance.findFirst({
        where: {
          branch_id: invoice.branch_id,
          product_id: item.product_id,
          variant_id: item.variant_id
        }
      });

      if (stockBalance) {
        const prevQty = Number(stockBalance.quantity);
        const returnQty = Number(item.quantity);
        const newQty = prevQty + returnQty;

        await tx.stockBalance.update({
          where: { id: stockBalance.id },
          data: {
            quantity: newQty,
            available_quantity: Number(stockBalance.available_quantity) + returnQty
          }
        });

        await tx.stockMovement.create({
          data: {
            shop_id: req.shopId!,
            branch_id: invoice.branch_id,
            product_id: item.product_id,
            variant_id: item.variant_id,
            movement_type: 'RETURN_IN',
            quantity: returnQty,
            previous_stock: prevQty,
            new_stock: newQty,
            unit_cost: stockBalance.cost_price,
            reference_id: invoice.invoice_number,
            reference_type: 'INVOICE_VOID',
            notes: `Restock due to cancelled invoice #${invoice.invoice_number}`,
            created_by: req.user?.id
          }
        });
      }
    }
  });

  await logAuditEvent(req, {
    action: 'INVOICE_CANCELLED',
    entityType: 'INVOICE',
    entityId: invoiceId,
    newValues: { reason }
  });

  res.status(200).json({
    success: true,
    message: 'Invoice cancelled and stock restored successfully'
  });
}
