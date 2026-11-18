import { Response } from 'express';
import { z } from 'zod';
import { prisma, withTenantTransaction } from '../services/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../types/index.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { Decimal } from 'decimal.js';

export const openSessionSchema = z.object({
  branchId: z.string().uuid(),
  counterId: z.string().uuid(),
  openingCash: z.number().nonnegative()
});

export const closeSessionSchema = z.object({
  actualCash: z.number().nonnegative(),
  notes: z.string().optional()
});

export const cartItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  productName: z.string(),
  sku: z.string(),
  hsnCode: z.string().optional(),
  unitCode: z.string().default('PCS'),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  discountPercent: z.number().nonnegative().default(0),
  taxRate: z.number().nonnegative().default(0),
  batchNumber: z.string().optional(),
  serialNumbers: z.array(z.string()).optional()
});

export const checkoutSchema = z.object({
  branchId: z.string().uuid(),
  counterId: z.string().uuid().optional(),
  cashSessionId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  items: z.array(cartItemSchema).min(1, 'Cart cannot be empty'),
  invoiceDiscountAmount: z.number().nonnegative().default(0),
  paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'SPLIT', 'CREDIT']),
  payments: z.array(
    z.object({
      method: z.enum(['CASH', 'UPI', 'CARD', 'SPLIT', 'CREDIT', 'WALLET', 'BANK_TRANSFER']),
      amount: z.number().positive(),
      referenceNumber: z.string().optional()
    })
  ).min(1),
  language: z.enum(['en', 'te']).default('en'),
  notes: z.string().optional()
});

export async function openCashSession(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = openSessionSchema.parse(req.body);

  // Check if there is already an open session for this counter
  const existingOpen = await prisma.cashSession.findFirst({
    where: {
      shop_id: req.shopId,
      counter_id: data.counterId,
      status: 'OPEN'
    }
  });

  if (existingOpen) {
    throw new AppError('This counter already has an active open cash session. Please close it first.', 409);
  }

  const session = await prisma.cashSession.create({
    data: {
      shop_id: req.shopId!,
      branch_id: data.branchId,
      counter_id: data.counterId,
      opened_by: req.user!.id,
      opening_cash: data.openingCash,
      status: 'OPEN'
    },
    include: {
      counter: true,
      branch: true
    }
  });

  await logAuditEvent(req, {
    action: 'CASH_SESSION_OPENED',
    entityType: 'CASH_SESSION',
    entityId: session.id,
    newValues: { openingCash: data.openingCash, counterId: data.counterId }
  });

  res.status(201).json({
    success: true,
    message: 'Cash drawer session opened successfully',
    data: session
  });
}

export async function closeCashSession(req: AuthenticatedRequest, res: Response): Promise<void> {
  const sessionId = req.params.sessionId as string;
  const data = closeSessionSchema.parse(req.body);

  const session = await prisma.cashSession.findFirst({
    where: { id: sessionId, shop_id: req.shopId, status: 'OPEN' },
    include: {
      cash_transactions: true
    }
  });

  if (!session) {
    throw new AppError('Active open session not found', 404);
  }

  // Calculate expected cash: opening + cash_sales - cash_returns + cash_in - cash_out
  let netCashDelta = new Decimal(0);
  session.cash_transactions.forEach((tx: any) => {
    const amt = new Decimal(tx.amount.toString());
    if (tx.transaction_type === 'CASH_SALE' || tx.transaction_type === 'CASH_IN') {
      netCashDelta = netCashDelta.plus(amt);
    } else if (tx.transaction_type === 'CASH_RETURN' || tx.transaction_type === 'CASH_OUT') {
      netCashDelta = netCashDelta.minus(amt);
    }
  });

  const openingCash = new Decimal(session.opening_cash.toString());
  const expectedCash = openingCash.plus(netCashDelta);
  const actualCash = new Decimal(data.actualCash);
  const difference = actualCash.minus(expectedCash);

  const updated = await prisma.cashSession.update({
    where: { id: session.id },
    data: {
      closed_by: req.user!.id,
      closed_at: new Date(),
      expected_cash: expectedCash.toNumber(),
      actual_cash: actualCash.toNumber(),
      difference: difference.toNumber(),
      status: 'CLOSED',
      notes: data.notes
    }
  });

  await logAuditEvent(req, {
    action: 'CASH_SESSION_CLOSED',
    entityType: 'CASH_SESSION',
    entityId: session.id,
    newValues: { expectedCash: expectedCash.toNumber(), actualCash: actualCash.toNumber(), difference: difference.toNumber() }
  });

  res.status(200).json({
    success: true,
    message: 'Cash session closed successfully',
    data: updated
  });
}

export async function getCurrentSession(req: AuthenticatedRequest, res: Response): Promise<void> {
  const counterId = req.query.counterId as string;

  const session = await prisma.cashSession.findFirst({
    where: {
      shop_id: req.shopId,
      ...(counterId ? { counter_id: counterId } : {}),
      status: 'OPEN'
    },
    include: {
      counter: true,
      branch: true,
      cash_transactions: {
        take: 20,
        orderBy: { created_at: 'desc' }
      }
    }
  });

  res.status(200).json({
    success: true,
    data: session
  });
}

export async function checkout(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = checkoutSchema.parse(req.body);
  const shopId = req.shopId!;

  // Execute entire checkout within an isolated tenant transaction
  const invoice = await withTenantTransaction(shopId, async (tx) => {
    // 1. Fetch shop settings for invoice sequence and GST setup
    const settings = await tx.shopSettings.findUnique({
      where: { shop_id: shopId }
    });

    const prefix = settings?.invoice_prefix || 'INV-';
    const nextSeq = settings?.next_invoice_number || 1001;
    const invoiceNumber = `${prefix}${nextSeq}`;

    // Update next invoice number
    await tx.shopSettings.update({
      where: { shop_id: shopId },
      data: { next_invoice_number: nextSeq + 1 }
    });

    // 2. Validate customer and credit limit if credit payment
    let customer = null;
    if (data.customerId) {
      customer = await tx.customer.findFirst({
        where: { id: data.customerId, shop_id: shopId }
      });
      if (!customer) throw new AppError('Selected customer not found', 404);
    }

    // 3. Compute item lines, taxes, stock decrements
    let subtotal = new Decimal(0);
    let itemDiscountsTotal = new Decimal(0);
    let totalTaxAmount = new Decimal(0);

    const invoiceItemsData = [];
    const taxRateAggregates: Record<number, { taxable: Decimal; tax: Decimal }> = {};

    for (const item of data.items) {
      const qty = new Decimal(item.quantity);
      const unitPrice = new Decimal(item.unitPrice);
      const grossPrice = qty.mul(unitPrice);

      const discountAmount = grossPrice.mul(new Decimal(item.discountPercent)).div(100);
      const netTaxable = grossPrice.minus(discountAmount);

      const taxRate = new Decimal(item.taxRate);
      const taxAmount = netTaxable.mul(taxRate).div(100);
      const lineTotal = netTaxable.plus(taxAmount);

      subtotal = subtotal.plus(grossPrice);
      itemDiscountsTotal = itemDiscountsTotal.plus(discountAmount);
      totalTaxAmount = totalTaxAmount.plus(taxAmount);

      // Half CGST, Half SGST for intra-state
      const halfRate = taxRate.div(2);
      const halfTax = taxAmount.div(2);

      invoiceItemsData.push({
        shop_id: shopId,
        product_id: item.productId,
        variant_id: item.variantId,
        product_name: item.productName,
        sku: item.sku,
        hsn_code: item.hsnCode,
        unit_code: item.unitCode,
        batch_number: item.batchNumber,
        serial_numbers: item.serialNumbers || undefined,
        quantity: qty.toNumber(),
        unit_price: unitPrice.toNumber(),
        discount_percent: item.discountPercent,
        discount_amount: discountAmount.toNumber(),
        tax_rate: taxRate.toNumber(),
        tax_amount: taxAmount.toNumber(),
        cgst_rate: halfRate.toNumber(),
        cgst_amount: halfTax.toNumber(),
        sgst_rate: halfRate.toNumber(),
        sgst_amount: halfTax.toNumber(),
        igst_rate: 0,
        igst_amount: 0,
        total_price: lineTotal.toNumber()
      });

      // Aggregate taxes for InvoiceTax table
      const rateKey = taxRate.toNumber();
      if (!taxRateAggregates[rateKey]) {
        taxRateAggregates[rateKey] = { taxable: new Decimal(0), tax: new Decimal(0) };
      }
      taxRateAggregates[rateKey].taxable = taxRateAggregates[rateKey].taxable.plus(netTaxable);
      taxRateAggregates[rateKey].tax = taxRateAggregates[rateKey].tax.plus(taxAmount);

      // Decrement stock balance
      const stockBalance = await tx.stockBalance.findFirst({
        where: {
          branch_id: data.branchId,
          product_id: item.productId,
          variant_id: item.variantId || null
        }
      });

      if (stockBalance) {
        const prevStock = new Decimal(stockBalance.quantity.toString());
        const newStock = prevStock.minus(qty);

        await tx.stockBalance.update({
          where: { id: stockBalance.id },
          data: {
            quantity: newStock.toNumber(),
            available_quantity: new Decimal(stockBalance.available_quantity.toString()).minus(qty).toNumber()
          }
        });

        // Record stock movement
        await tx.stockMovement.create({
          data: {
            shop_id: shopId,
            branch_id: data.branchId,
            product_id: item.productId,
            variant_id: item.variantId,
            batch_number: item.batchNumber,
            movement_type: 'SALE',
            quantity: qty.toNumber(),
            previous_stock: prevStock.toNumber(),
            new_stock: newStock.toNumber(),
            unit_cost: stockBalance.cost_price,
            reference_id: invoiceNumber,
            reference_type: 'INVOICE',
            notes: `POS Sale #${invoiceNumber}`,
            created_by: req.user?.id
          }
        });
      }
    }

    // Invoice level discount and grand total
    const invoiceDiscount = new Decimal(data.invoiceDiscountAmount);
    const unroundedTotal = subtotal
      .minus(itemDiscountsTotal)
      .minus(invoiceDiscount)
      .plus(totalTaxAmount);

    const roundedTotal = unroundedTotal.round();
    const roundOff = roundedTotal.minus(unroundedTotal);

    // Sum paid amounts
    let totalPaid = new Decimal(0);
    data.payments.forEach((p) => {
      totalPaid = totalPaid.plus(new Decimal(p.amount));
    });

    const dueAmount = roundedTotal.minus(totalPaid);

    // Handle credit payment validation
    const hasCredit = data.payments.some((p) => p.method === 'CREDIT');
    if (hasCredit) {
      if (!customer) {
        throw new AppError('Customer selection is required for credit payments', 400);
      }
      const creditAmt = data.payments
        .filter((p) => p.method === 'CREDIT')
        .reduce((sum, p) => sum.plus(new Decimal(p.amount)), new Decimal(0));

      const currentBalance = new Decimal(customer.current_balance.toString());
      const creditLimit = new Decimal(customer.credit_limit.toString());

      if (currentBalance.plus(creditAmt).gt(creditLimit)) {
        throw new AppError(`Credit limit exceeded! Allowed limit: Rs. ${creditLimit.toFixed(2)}, Current debt: Rs. ${currentBalance.toFixed(2)}`, 400);
      }
    }

    // 4. Create Invoice
    const createdInvoice = await tx.invoice.create({
      data: {
        shop_id: shopId,
        branch_id: data.branchId,
        counter_id: data.counterId,
        customer_id: data.customerId,
        cash_session_id: data.cashSessionId,
        invoice_number: invoiceNumber,
        subtotal: subtotal.toNumber(),
        item_discount_amount: itemDiscountsTotal.toNumber(),
        invoice_discount_amount: invoiceDiscount.toNumber(),
        tax_amount: totalTaxAmount.toNumber(),
        round_off: roundOff.toNumber(),
        total_amount: roundedTotal.toNumber(),
        paid_amount: totalPaid.toNumber(),
        due_amount: dueAmount.gt(0) ? dueAmount.toNumber() : 0,
        status: dueAmount.lte(0) ? 'PAID' : 'PARTIALLY_PAID',
        payment_status: dueAmount.lte(0) ? 'COMPLETED' : 'PARTIAL',
        idempotency_key: req.idempotencyKey,
        language: data.language,
        notes: data.notes,
        created_by: req.user?.id,
        invoice_items: {
          create: invoiceItemsData
        }
      }
    });

    // 5. Create Invoice Taxes
    for (const [rate, agg] of Object.entries(taxRateAggregates)) {
      await tx.invoiceTax.create({
        data: {
          shop_id: shopId,
          invoice_id: createdInvoice.id,
          tax_name: `GST ${rate}%`,
          rate: Number(rate),
          taxable_amount: agg.taxable.toNumber(),
          tax_amount: agg.tax.toNumber()
        }
      });
    }

    // 6. Create Payments & Allocations
    let paymentIndex = 1;
    for (const pay of data.payments) {
      const paymentNumber = `PAY-${invoiceNumber}-${paymentIndex++}`;
      const payment = await tx.payment.create({
        data: {
          shop_id: shopId,
          branch_id: data.branchId,
          invoice_id: createdInvoice.id,
          customer_id: data.customerId,
          cash_session_id: data.cashSessionId,
          payment_number: paymentNumber,
          amount: pay.amount,
          payment_method: pay.method,
          reference_number: pay.referenceNumber,
          status: 'SUCCESS',
          created_by: req.user?.id
        }
      });

      await tx.paymentAllocation.create({
        data: {
          shop_id: shopId,
          payment_id: payment.id,
          invoice_id: createdInvoice.id,
          allocated_amount: pay.amount
        }
      });

      // If CASH and active session, record CashTransaction
      if (pay.method === 'CASH' && data.cashSessionId) {
        await tx.cashTransaction.create({
          data: {
            shop_id: shopId,
            cash_session_id: data.cashSessionId,
            transaction_type: 'CASH_SALE',
            amount: pay.amount,
            reason: `Sale #${invoiceNumber}`,
            created_by: req.user!.id
          }
        });
      }

      // If CREDIT, update customer ledger
      if (pay.method === 'CREDIT' && customer) {
        const curBal = new Decimal(customer.current_balance.toString());
        const newBal = curBal.plus(new Decimal(pay.amount));

        await tx.customerLedger.create({
          data: {
            shop_id: shopId,
            customer_id: customer.id,
            transaction_type: 'INVOICE',
            reference_id: invoiceNumber,
            debit: pay.amount,
            credit: 0,
            running_balance: newBal.toNumber(),
            notes: `Credit Sale Invoice #${invoiceNumber}`
          }
        });

        await tx.customer.update({
          where: { id: customer.id },
          data: { current_balance: newBal.toNumber() }
        });
      }
    }

    // 7. Award loyalty points if customer selected (1 point per 100 spent)
    if (customer && roundedTotal.gte(100)) {
      const earnedPoints = Math.floor(roundedTotal.toNumber() / 100);
      await tx.customer.update({
        where: { id: customer.id },
        data: { loyalty_points: { increment: earnedPoints } }
      });
    }

    return createdInvoice;
  });

  await logAuditEvent(req, {
    action: 'INVOICE_GENERATED',
    entityType: 'INVOICE',
    entityId: invoice.id,
    newValues: { invoiceNumber: invoice.invoice_number, total: invoice.total_amount }
  });

  res.status(201).json({
    success: true,
    message: 'Billing completed successfully',
    data: invoice
  });
}
