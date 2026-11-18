import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../types/index.js';
import { logAuditEvent } from '../utils/auditLogger.js';

export const createExpenseCategorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional()
});

export const createExpenseSchema = z.object({
  branchId: z.string().uuid(),
  categoryId: z.string().uuid(),
  amount: z.number().positive(),
  paymentMethod: z.string().default('CASH'),
  referenceNumber: z.string().optional(),
  expenseDate: z.string().optional(),
  notes: z.string().optional()
});

export async function listExpenseCategories(req: AuthenticatedRequest, res: Response): Promise<void> {
  const categories = await prisma.expenseCategory.findMany({
    where: { shop_id: req.shopId },
    orderBy: { name: 'asc' },
    include: { _count: { select: { expenses: true } } }
  });

  res.status(200).json({ success: true, data: categories });
}

export async function createExpenseCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = createExpenseCategorySchema.parse(req.body);

  const category = await prisma.expenseCategory.create({
    data: {
      shop_id: req.shopId!,
      name: data.name,
      description: data.description
    }
  });

  res.status(201).json({ success: true, message: 'Expense category created', data: category });
}

export async function listExpenses(req: AuthenticatedRequest, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '50', 10);
  const branchId = req.query.branchId as string;
  const skip = (page - 1) * limit;

  const whereClause: any = { shop_id: req.shopId };
  if (branchId) whereClause.branch_id = branchId;

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { expense_date: 'desc' },
      include: {
        category: true,
        branch: { select: { id: true, name: true } }
      }
    }),
    prisma.expense.count({ where: whereClause })
  ]);

  res.status(200).json({
    success: true,
    data: expenses,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
  });
}

export async function createExpense(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = createExpenseSchema.parse(req.body);

  const expense = await prisma.expense.create({
    data: {
      shop_id: req.shopId!,
      branch_id: data.branchId,
      category_id: data.categoryId,
      amount: data.amount,
      payment_method: data.paymentMethod,
      reference_number: data.referenceNumber,
      expense_date: data.expenseDate ? new Date(data.expenseDate) : new Date(),
      notes: data.notes,
      created_by: req.user?.id
    },
    include: { category: true }
  });

  await logAuditEvent(req, {
    action: 'EXPENSE_RECORDED',
    entityType: 'EXPENSE',
    entityId: expense.id,
    newValues: { amount: data.amount, category: expense.category.name }
  });

  res.status(201).json({
    success: true,
    message: 'Expense recorded successfully',
    data: expense
  });
}
