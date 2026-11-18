import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../types/index.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { getUniqueEan13Barcode } from '../utils/barcode.js';

export const createCategorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  parentId: z.string().uuid().optional(),
  description: z.string().optional()
});

export const createBrandSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional()
});

export const createUnitSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).max(20),
  precision: z.number().int().min(0).max(4).default(0)
});

export const createProductSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(1),
  barcode: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  unitId: z.string().uuid(),
  hsnCode: z.string().optional(),
  description: z.string().optional(),
  taxRate: z.number().nonnegative().default(0),
  purchasePrice: z.number().nonnegative(),
  sellingPrice: z.number().nonnegative(),
  mrp: z.number().nonnegative().optional(),
  minStockLevel: z.number().nonnegative().default(0),
  isVariantProduct: z.boolean().default(false),
  isWeightBased: z.boolean().default(false),
  isBatchTracked: z.boolean().default(false),
  isExpiryTracked: z.boolean().default(false),
  isSerialTracked: z.boolean().default(false),
  metadata: z.record(z.any()).optional(),
  initialStock: z.object({
    branchId: z.string().uuid(),
    quantity: z.number().nonnegative()
  }).optional()
});

export async function listProducts(req: AuthenticatedRequest, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '50', 10);
  const search = req.query.search as string;
  const categoryId = req.query.categoryId as string;
  const skip = (page - 1) * limit;

  const whereClause: any = { shop_id: req.shopId, is_active: true };

  if (categoryId) {
    whereClause.category_id = categoryId;
  }

  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { barcode: { contains: search, mode: 'insensitive' } },
      { barcodes: { some: { barcode: { contains: search, mode: 'insensitive' } } } }
    ];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        category: true,
        brand: true,
        unit: true,
        barcodes: true,
        variants: true,
        stock_balances: {
          select: {
            branch_id: true,
            quantity: true,
            available_quantity: true,
            cost_price: true
          }
        }
      }
    }),
    prisma.product.count({ where: whereClause })
  ]);

  res.status(200).json({
    success: true,
    data: products,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
  });
}

export async function generateBarcode(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.shopId) {
    throw new AppError('Tenant shop context is required', 400);
  }
  const barcode = await getUniqueEan13Barcode(req.shopId);
  res.status(200).json({
    success: true,
    data: { barcode }
  });
}

export async function getProductByBarcode(req: AuthenticatedRequest, res: Response): Promise<void> {
  const barcode = req.params.barcode as string;

  // Search in primary barcode or barcode table
  let product = await prisma.product.findFirst({
    where: {
      shop_id: req.shopId,
      barcode: barcode,
      is_active: true
    },
    include: {
      category: true,
      brand: true,
      unit: true,
      variants: true,
      stock_balances: true
    }
  });

  if (!product) {
    const barcodeRecord = await prisma.productBarcode.findFirst({
      where: {
        shop_id: req.shopId,
        barcode: barcode
      },
      include: {
        product: {
          include: {
            category: true,
            brand: true,
            unit: true,
            variants: true,
            stock_balances: true
          }
        },
        variant: true
      }
    });

    if (barcodeRecord) {
      res.status(200).json({
        success: true,
        data: {
          ...barcodeRecord.product,
          selectedVariant: barcodeRecord.variant
        }
      });
      return;
    }
  }

  if (!product) {
    throw new AppError(`No product found with barcode: ${barcode}`, 404);
  }

  res.status(200).json({
    success: true,
    data: product
  });
}

export async function createProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = createProductSchema.parse(req.body);

  // Check plan product limits
  const activeSub = await prisma.subscription.findFirst({
    where: { shop_id: req.shopId, status: { in: ['ACTIVE', 'TRIAL'] } },
    include: { plan: true }
  });

  if (activeSub?.plan) {
    const count = await prisma.product.count({ where: { shop_id: req.shopId } });
    if (count >= activeSub.plan.max_products) {
      throw new AppError(`Product limit reached: Your current plan allows maximum ${activeSub.plan.max_products} products. Upgrade your plan to add more.`, 403);
    }
  }

  // Check SKU uniqueness in this shop
  const existingSku = await prisma.product.findUnique({
    where: {
      shop_id_sku: {
        shop_id: req.shopId!,
        sku: data.sku
      }
    }
  });

  if (existingSku) {
    throw new AppError(`Product with SKU '${data.sku}' already exists in your catalog.`, 409);
  }

  // Automatic Barcode / EAN-13 generation if not explicitly provided
  const assignedBarcode = (data.barcode && data.barcode.trim())
    ? data.barcode.trim()
    : await getUniqueEan13Barcode(req.shopId!);

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        shop_id: req.shopId!,
        name: data.name,
        sku: data.sku,
        barcode: assignedBarcode,
        category_id: data.categoryId,
        brand_id: data.brandId,
        unit_id: data.unitId,
        hsn_code: data.hsnCode || null,
        description: data.description,
        tax_rate: data.taxRate,
        purchase_price: data.purchasePrice,
        selling_price: data.sellingPrice,
        mrp: data.mrp,
        min_stock_level: data.minStockLevel,
        is_variant_product: data.isVariantProduct,
        is_weight_based: data.isWeightBased,
        is_batch_tracked: data.isBatchTracked,
        is_expiry_tracked: data.isExpiryTracked,
        is_serial_tracked: data.isSerialTracked,
        metadata: data.metadata || {}
      }
    });

    // Create primary barcode entry
    await tx.productBarcode.create({
      data: {
        shop_id: req.shopId!,
        product_id: created.id,
        barcode: assignedBarcode,
        is_primary: true
      }
    });

    // Add initial stock if provided
    if (data.initialStock && data.initialStock.quantity > 0) {
      await tx.stockBalance.create({
        data: {
          shop_id: req.shopId!,
          branch_id: data.initialStock.branchId,
          product_id: created.id,
          quantity: data.initialStock.quantity,
          available_quantity: data.initialStock.quantity,
          cost_price: data.purchasePrice
        }
      });

      await tx.stockMovement.create({
        data: {
          shop_id: req.shopId!,
          branch_id: data.initialStock.branchId,
          product_id: created.id,
          movement_type: 'ADJUSTMENT_UP',
          quantity: data.initialStock.quantity,
          previous_stock: 0,
          new_stock: data.initialStock.quantity,
          unit_cost: data.purchasePrice,
          reference_type: 'INITIAL_STOCK',
          notes: 'Initial stock on product creation',
          created_by: req.user?.id
        }
      });
    }

    return created;
  });

  await logAuditEvent(req, {
    action: 'PRODUCT_CREATED',
    entityType: 'PRODUCT',
    entityId: product.id,
    newValues: { name: product.name, sku: product.sku }
  });

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product
  });
}

// ----------------------------------------------------
// Categories, Brands & Units
// ----------------------------------------------------

export async function listCategories(req: AuthenticatedRequest, res: Response): Promise<void> {
  const categories = await prisma.category.findMany({
    where: { shop_id: req.shopId, is_active: true },
    orderBy: { name: 'asc' },
    include: {
      children: true,
      _count: { select: { products: true } }
    }
  });

  res.status(200).json({ success: true, data: categories });
}

export async function createCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = createCategorySchema.parse(req.body);
  const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const category = await prisma.category.create({
    data: {
      shop_id: req.shopId!,
      name: data.name,
      slug,
      parent_id: data.parentId,
      description: data.description
    }
  });

  res.status(201).json({ success: true, message: 'Category created', data: category });
}

export async function listBrands(req: AuthenticatedRequest, res: Response): Promise<void> {
  const brands = await prisma.brand.findMany({
    where: { shop_id: req.shopId, is_active: true },
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } }
  });

  res.status(200).json({ success: true, data: brands });
}

export async function createBrand(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = createBrandSchema.parse(req.body);

  const brand = await prisma.brand.create({
    data: {
      shop_id: req.shopId!,
      name: data.name,
      description: data.description
    }
  });

  res.status(201).json({ success: true, message: 'Brand created', data: brand });
}

export async function listUnits(req: AuthenticatedRequest, res: Response): Promise<void> {
  // Global standard units (shop_id: null) + custom shop units
  const units = await prisma.unit.findMany({
    where: {
      OR: [
        { shop_id: null },
        { shop_id: req.shopId }
      ],
      is_active: true
    },
    orderBy: { name: 'asc' }
  });

  res.status(200).json({ success: true, data: units });
}
