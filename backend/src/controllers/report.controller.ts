import { Response } from 'express';
import { prisma } from '../services/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { Decimal } from 'decimal.js';

export async function getShopDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
  const shopId = req.shopId;
  if (!shopId) {
    throw new AppError('Tenant shop context is required', 400);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Parallel queries
  const [
    todayInvoices,
    monthInvoices,
    lowStockCount,
    totalProducts,
    totalCustomers,
    recentInvoices,
    paymentsByMethod
  ] = await Promise.all([
    // Today
    prisma.invoice.aggregate({
      where: {
        shop_id: shopId,
        invoice_date: { gte: today },
        status: { not: 'CANCELLED' }
      },
      _sum: { total_amount: true, paid_amount: true, due_amount: true },
      _count: { id: true }
    }),
    // Month
    prisma.invoice.aggregate({
      where: {
        shop_id: shopId,
        invoice_date: { gte: startOfMonth },
        status: { not: 'CANCELLED' }
      },
      _sum: { total_amount: true, tax_amount: true, item_discount_amount: true, invoice_discount_amount: true },
      _count: { id: true }
    }),
    // Low stock
    prisma.stockBalance.count({
      where: {
        shop_id: shopId,
        quantity: { lte: 5 }
      }
    }),
    // Counts
    prisma.product.count({ where: { shop_id: shopId, is_active: true } }),
    prisma.customer.count({ where: { shop_id: shopId, is_active: true } }),
    // Recent invoices
    prisma.invoice.findMany({
      where: { shop_id: shopId },
      take: 5,
      orderBy: { invoice_date: 'desc' },
      include: { customer: { select: { name: true, phone: true } } }
    }),
    // Payments by method this month
    prisma.payment.groupBy({
      by: ['payment_method'],
      where: {
        shop_id: shopId,
        payment_date: { gte: startOfMonth },
        status: 'SUCCESS'
      },
      _sum: { amount: true },
      _count: { id: true }
    })
  ]);

  // Aggregate expenses for the month
  const monthExpenses = await prisma.expense.aggregate({
    where: {
      shop_id: shopId,
      expense_date: { gte: startOfMonth }
    },
    _sum: { amount: true }
  });

  res.status(200).json({
    success: true,
    data: {
      today: {
        salesTotal: todayInvoices._sum.total_amount || 0,
        paidTotal: todayInvoices._sum.paid_amount || 0,
        dueTotal: todayInvoices._sum.due_amount || 0,
        invoiceCount: todayInvoices._count.id || 0
      },
      month: {
        salesTotal: monthInvoices._sum.total_amount || 0,
        taxTotal: monthInvoices._sum.tax_amount || 0,
        discountTotal: (Number(monthInvoices._sum.item_discount_amount || 0) + Number(monthInvoices._sum.invoice_discount_amount || 0)),
        invoiceCount: monthInvoices._count.id || 0,
        expensesTotal: monthExpenses._sum.amount || 0
      },
      counts: {
        products: totalProducts,
        customers: totalCustomers,
        lowStockItems: lowStockCount
      },
      paymentsByMethod: paymentsByMethod.map((p) => ({
        method: p.payment_method,
        total: p._sum.amount || 0,
        count: p._count.id
      })),
      recentInvoices
    }
  });
}

export async function getGstTaxReport(req: AuthenticatedRequest, res: Response): Promise<void> {
  const shopId = req.shopId;
  if (!shopId) {
    throw new AppError('Tenant shop context is required', 400);
  }
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

  const taxes = await prisma.invoiceTax.findMany({
    where: {
      shop_id: shopId,
      created_at: {
        gte: startDate,
        lte: endDate
      },
      invoice: {
        status: { not: 'CANCELLED' }
      }
    }
  });

  // Group by tax rate
  const rateBreakdown: Record<number, { taxable: Decimal; tax: Decimal; cgst: Decimal; sgst: Decimal }> = {};

  taxes.forEach((t) => {
    const rate = Number(t.rate);
    const taxable = new Decimal(t.taxable_amount.toString());
    const tax = new Decimal(t.tax_amount.toString());
    const halfTax = tax.div(2);

    if (!rateBreakdown[rate]) {
      rateBreakdown[rate] = { taxable: new Decimal(0), tax: new Decimal(0), cgst: new Decimal(0), sgst: new Decimal(0) };
    }

    rateBreakdown[rate].taxable = rateBreakdown[rate].taxable.plus(taxable);
    rateBreakdown[rate].tax = rateBreakdown[rate].tax.plus(tax);
    rateBreakdown[rate].cgst = rateBreakdown[rate].cgst.plus(halfTax);
    rateBreakdown[rate].sgst = rateBreakdown[rate].sgst.plus(halfTax);
  });

  const formatted = Object.entries(rateBreakdown).map(([rate, vals]) => ({
    taxRate: Number(rate),
    taxableAmount: vals.taxable.toNumber(),
    cgstAmount: vals.cgst.toNumber(),
    sgstAmount: vals.sgst.toNumber(),
    totalTaxAmount: vals.tax.toNumber()
  }));

  res.status(200).json({
    success: true,
    data: {
      period: { startDate, endDate },
      taxBreakdown: formatted
    }
  });
}

export async function getProfitLossSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
  const shopId = req.shopId;
  if (!shopId) {
    throw new AppError('Tenant shop context is required', 400);
  }
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

  // 1. Total revenue excluding taxes
  const invoiceItems = await prisma.invoiceItem.findMany({
    where: {
      shop_id: shopId,
      created_at: { gte: startDate, lte: endDate },
      invoice: { status: { not: 'CANCELLED' } }
    },
    include: {
      product: { select: { purchase_price: true } }
    }
  });

  let totalRevenue = new Decimal(0);
  let totalCostOfGoodsSold = new Decimal(0);

  invoiceItems.forEach((item) => {
    const qty = new Decimal(item.quantity.toString());
    const unitPrice = new Decimal(item.unit_price.toString());
    const costPrice = new Decimal(item.product.purchase_price.toString());

    totalRevenue = totalRevenue.plus(qty.mul(unitPrice).minus(new Decimal(item.discount_amount.toString())));
    totalCostOfGoodsSold = totalCostOfGoodsSold.plus(qty.mul(costPrice));
  });

  const grossProfit = totalRevenue.minus(totalCostOfGoodsSold);

  // 2. Total operating expenses
  const expenseAgg = await prisma.expense.aggregate({
    where: {
      shop_id: shopId,
      expense_date: { gte: startDate, lte: endDate }
    },
    _sum: { amount: true }
  });

  const totalExpenses = new Decimal(expenseAgg._sum.amount?.toString() || 0);
  const netProfit = grossProfit.minus(totalExpenses);

  res.status(200).json({
    success: true,
    data: {
      period: { startDate, endDate },
      totalRevenue: totalRevenue.toNumber(),
      totalCostOfGoodsSold: totalCostOfGoodsSold.toNumber(),
      grossProfit: grossProfit.toNumber(),
      operatingExpenses: totalExpenses.toNumber(),
      netProfit: netProfit.toNumber(),
      grossMarginPercent: totalRevenue.gt(0) ? grossProfit.div(totalRevenue).mul(100).toFixed(2) : 0
    }
  });
}
