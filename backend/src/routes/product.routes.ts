import { Router } from 'express';
import {
  listProducts,
  getProductByBarcode,
  generateBarcode,
  createProduct,
  listCategories,
  createCategory,
  listBrands,
  createBrand,
  listUnits
} from '../controllers/product.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenant.js';

const router = Router();

router.use(authenticateJWT, tenantContext);

// Products
router.get('/', listProducts);
router.get('/generate-barcode', generateBarcode);
router.get('/barcode/:barcode', getProductByBarcode);
router.post('/', requireRole(['Shop Owner', 'Shop Manager', 'Inventory Manager']), createProduct);

// Categories
router.get('/categories', listCategories);
router.post('/categories', requireRole(['Shop Owner', 'Shop Manager']), createCategory);

// Brands
router.get('/brands', listBrands);
router.post('/brands', requireRole(['Shop Owner', 'Shop Manager']), createBrand);

// Units
router.get('/units', listUnits);

export default router;
