import { PrismaClient, ShopStatus, UserStatus, BillingCycle, SubscriptionStatus, StockMovementType } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const PERMISSIONS = [
  // Superadmin permissions
  { name: 'platform:admin', module: 'admin', description: 'Full platform administrative control' },
  { name: 'shops:read', module: 'shops', description: 'View shop accounts' },
  { name: 'shops:manage', module: 'shops', description: 'Activate, suspend and manage shops' },
  { name: 'subscriptions:manage', module: 'subscriptions', description: 'Manage pricing plans and verify payments' },

  // Shop management
  { name: 'shop:profile:update', module: 'shop', description: 'Update shop profile and settings' },
  { name: 'branches:manage', module: 'branches', description: 'Create and manage branches' },
  { name: 'counters:manage', module: 'counters', description: 'Create and manage billing counters' },
  { name: 'users:manage', module: 'users', description: 'Manage shop employees and permissions' },

  // Catalog & Inventory
  { name: 'products:read', module: 'products', description: 'View products and categories' },
  { name: 'products:manage', module: 'products', description: 'Create and edit products, variants, barcodes' },
  { name: 'inventory:read', module: 'inventory', description: 'View stock balances and movements' },
  { name: 'inventory:adjust', module: 'inventory', description: 'Perform manual stock adjustments' },
  { name: 'inventory:transfer', module: 'inventory', description: 'Transfer stock between branches' },

  // Purchasing & Suppliers
  { name: 'suppliers:manage', module: 'suppliers', description: 'Manage suppliers and balances' },
  { name: 'purchases:manage', module: 'purchases', description: 'Create purchase orders and goods receipts' },

  // Sales & POS
  { name: 'pos:billing', module: 'pos', description: 'Access POS terminal and create invoices' },
  { name: 'invoices:read', module: 'invoices', description: 'View invoices and receipts' },
  { name: 'invoices:void', module: 'invoices', description: 'Cancel or void invoices' },
  { name: 'returns:manage', module: 'returns', description: 'Process sales returns and credit notes' },
  { name: 'cash_session:manage', module: 'cash', description: 'Open, close, and manage cash drawers' },

  // Customers & Financials
  { name: 'customers:manage', module: 'customers', description: 'Manage customers and credit ledgers' },
  { name: 'expenses:manage', module: 'expenses', description: 'Record and categorize store expenses' },
  { name: 'reports:view', module: 'reports', description: 'View sales, tax, profit, and inventory reports' },
  { name: 'audit:read', module: 'audit', description: 'Inspect audit logs' }
];

const SYSTEM_ROLES = [
  {
    name: 'Super Admin',
    is_system: true,
    description: 'Master platform administrator for SL MultiShop',
    permissions: PERMISSIONS.map((p) => p.name)
  },
  {
    name: 'Shop Owner',
    is_system: true,
    description: 'Owner with full access to shop configuration and operations',
    permissions: PERMISSIONS.filter((p) => !p.name.startsWith('platform:') && !p.name.startsWith('shops:') && p.name !== 'subscriptions:manage').map((p) => p.name)
  },
  {
    name: 'Shop Manager',
    is_system: true,
    description: 'Branch and store operations manager',
    permissions: [
      'shop:profile:update', 'branches:manage', 'counters:manage', 'users:manage',
      'products:read', 'products:manage', 'inventory:read', 'inventory:adjust', 'inventory:transfer',
      'suppliers:manage', 'purchases:manage', 'pos:billing', 'invoices:read', 'invoices:void',
      'returns:manage', 'cash_session:manage', 'customers:manage', 'expenses:manage', 'reports:view'
    ]
  },
  {
    name: 'Cashier',
    is_system: true,
    description: 'POS billing counter operator',
    permissions: [
      'products:read', 'pos:billing', 'invoices:read', 'returns:manage',
      'cash_session:manage', 'customers:manage'
    ]
  },
  {
    name: 'Accountant',
    is_system: true,
    description: 'Financial ledger, taxes, expenses and reports',
    permissions: [
      'invoices:read', 'returns:manage', 'suppliers:manage', 'purchases:manage',
      'customers:manage', 'expenses:manage', 'reports:view'
    ]
  },
  {
    name: 'Inventory Manager',
    is_system: true,
    description: 'Warehouse, stock procurement and transfer management',
    permissions: [
      'products:read', 'products:manage', 'inventory:read', 'inventory:adjust',
      'inventory:transfer', 'suppliers:manage', 'purchases:manage'
    ]
  }
];

const STANDARD_UNITS = [
  { name: 'Pieces', code: 'PCS', precision: 0 },
  { name: 'Kilograms', code: 'KG', precision: 3 },
  { name: 'Grams', code: 'GM', precision: 3 },
  { name: 'Litres', code: 'LTR', precision: 3 },
  { name: 'Millilitres', code: 'ML', precision: 3 },
  { name: 'Metres', code: 'MTR', precision: 2 },
  { name: 'Box', code: 'BOX', precision: 0 },
  { name: 'Packet', code: 'PKT', precision: 0 }
];

const STANDARD_TAX_RATES = [
  { name: 'GST 0%', rate: 0.0, cgst: 0.0, sgst: 0.0, igst: 0.0 },
  { name: 'GST 5%', rate: 5.0, cgst: 2.5, sgst: 2.5, igst: 5.0 },
  { name: 'GST 12%', rate: 12.0, cgst: 6.0, sgst: 6.0, igst: 12.0 },
  { name: 'GST 18%', rate: 18.0, cgst: 9.0, sgst: 9.0, igst: 18.0 },
  { name: 'GST 28%', rate: 28.0, cgst: 14.0, sgst: 14.0, igst: 28.0 }
];

const PLANS = [
  {
    name: 'Starter Plan',
    slug: 'starter',
    description: 'Perfect for small single-counter retail shops and groceries',
    monthly_price: 999.00,
    annual_price: 9990.00,
    max_branches: 1,
    max_counters: 1,
    max_users: 3,
    max_products: 1000,
    max_invoices_per_month: 1000,
    features: ['1 Branch', '1 Counter', '3 Staff Users', '1,000 Products', 'Thermal & A4 Invoices', 'GST Reports']
  },
  {
    name: 'Business Plan',
    slug: 'business',
    description: 'Ideal for growing supermarkets, apparel chains, and multi-counter retail',
    monthly_price: 2499.00,
    annual_price: 24990.00,
    max_branches: 3,
    max_counters: 5,
    max_users: 10,
    max_products: 15000,
    max_invoices_per_month: 10000,
    features: ['3 Branches', '5 Counters', '10 Staff Users', '15,000 Products', 'Inter-Branch Transfers', 'Barcode & Batch Tracking', 'Bilingual Telugu Invoices']
  },
  {
    name: 'Enterprise Plan',
    slug: 'enterprise',
    description: 'Designed for large supermarkets, department stores, and wholesale operations',
    monthly_price: 4999.00,
    annual_price: 49990.00,
    max_branches: 10,
    max_counters: 25,
    max_users: 50,
    max_products: 100000,
    max_invoices_per_month: 100000,
    features: ['Unlimited Scale', '10+ Branches', '25+ Counters', '50 Staff Users', 'Full API Access', 'Custom GST & Telugu Invoices', 'Dedicated Support']
  }
];

async function main() {
  console.log('--- Seeding SL MultiShop Database ---');

  // 1. Seed Permissions
  console.log('Seeding permissions...');
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: { description: perm.description, module: perm.module },
      create: perm
    });
  }

  // 2. Seed Roles and map permissions
  console.log('Seeding system roles...');
  for (const roleDef of SYSTEM_ROLES) {
    let role = await prisma.role.findFirst({
      where: { name: roleDef.name, shop_id: null }
    });

    if (!role) {
      role = await prisma.role.create({
        data: { name: roleDef.name, description: roleDef.description, is_system: true }
      });
    } else {
      await prisma.role.update({
        where: { id: role.id },
        data: { description: roleDef.description }
      });
    }

    for (const permName of roleDef.permissions) {
      const permRecord = await prisma.permission.findUnique({ where: { name: permName } });
      if (permRecord) {
        await prisma.rolePermission.upsert({
          where: { role_id_permission_id: { role_id: role.id, permission_id: permRecord.id } },
          update: {},
          create: { role_id: role.id, permission_id: permRecord.id }
        });
      }
    }
  }

  // 3. Seed Global Units
  console.log('Seeding standard units...');
  for (const unit of STANDARD_UNITS) {
    let unitRecord = await prisma.unit.findFirst({
      where: { code: unit.code, shop_id: null }
    });
    if (!unitRecord) {
      await prisma.unit.create({
        data: { name: unit.name, code: unit.code, precision: unit.precision }
      });
    }
  }

  // 4. Seed Standard Tax Rates
  console.log('Seeding standard tax rates...');
  for (const tax of STANDARD_TAX_RATES) {
    let taxRecord = await prisma.taxRate.findFirst({
      where: { name: tax.name, shop_id: null }
    });
    if (!taxRecord) {
      await prisma.taxRate.create({
        data: { name: tax.name, rate: tax.rate, cgst: tax.cgst, sgst: tax.sgst, igst: tax.igst }
      });
    }
  }

  // 5. Seed Subscription Plans
  console.log('Seeding subscription plans...');
  for (const plan of PLANS) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        description: plan.description,
        monthly_price: plan.monthly_price,
        annual_price: plan.annual_price,
        max_branches: plan.max_branches,
        max_counters: plan.max_counters,
        max_users: plan.max_users,
        max_products: plan.max_products,
        max_invoices_per_month: plan.max_invoices_per_month,
        features: plan.features
      },
      create: {
        name: plan.name,
        slug: plan.slug,
        description: plan.description,
        monthly_price: plan.monthly_price,
        annual_price: plan.annual_price,
        max_branches: plan.max_branches,
        max_counters: plan.max_counters,
        max_users: plan.max_users,
        max_products: plan.max_products,
        max_invoices_per_month: plan.max_invoices_per_month,
        features: plan.features
      }
    });
  }

  // 6. Seed Super Admin User
  const superAdminEmail = process.env.SUPERADMIN_EMAIL || 'admin@slit-solutions.com';
  const superAdminPassword = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@2026!SL';
  const superAdminHash = await argon2.hash(superAdminPassword);

  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: { password_hash: superAdminHash, is_super_admin: true, status: UserStatus.ACTIVE },
    create: {
      email: superAdminEmail,
      password_hash: superAdminHash,
      first_name: 'SL IT',
      last_name: 'Administrator',
      phone: '+91 9999999999',
      is_super_admin: true,
      status: UserStatus.ACTIVE
    }
  });

  const superAdminRole = await prisma.role.findFirst({ where: { name: 'Super Admin', is_system: true } });
  if (superAdminRole) {
    const existing = await prisma.userRole.findFirst({
      where: { user_id: superAdmin.id, role_id: superAdminRole.id, shop_id: null }
    });
    if (!existing) {
      await prisma.userRole.create({
        data: { user_id: superAdmin.id, role_id: superAdminRole.id, shop_id: null }
      });
    }
  }
  console.log(`Super Admin user ready: ${superAdminEmail}`);

  // 7. Seed Demo Shop for testing & immediate usability
  const demoShop = await prisma.shop.upsert({
    where: { slug: 'sl-supermarket' },
    update: {},
    create: {
      name: 'SL Supermarket & Grocery',
      slug: 'sl-supermarket',
      business_type: 'GROCERY',
      email: 'contact@slsupermarket.com',
      phone: '+91 9876543210',
      gstin: '37AAAAA0000A1Z5',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      status: ShopStatus.ACTIVE
    }
  });

  // Shop Settings
  await prisma.shopSettings.upsert({
    where: { shop_id: demoShop.id },
    update: {},
    create: {
      shop_id: demoShop.id,
      industry_type: 'GROCERY',
      features_enabled: {
        weight_based_units: true,
        expiry_tracking: true,
        batch_tracking: true,
        barcode_scanning: true
      },
      gst_enabled: true,
      default_tax_rate: 18.0,
      receipt_printer_type: 'THERMAL_80MM',
      invoice_prefix: 'SLM-',
      next_invoice_number: 1001,
      invoice_footer_note: 'Thank you for shopping with SL Supermarket!',
      invoice_terms: 'Goods once sold cannot be returned without original receipt.',
      telugu_invoice_enabled: true
    }
  });

  // Demo Branch
  const mainBranch = await prisma.branch.upsert({
    where: { shop_id_code: { shop_id: demoShop.id, code: 'MAIN' } },
    update: {},
    create: {
      shop_id: demoShop.id,
      name: 'Main Branch - MG Road',
      code: 'MAIN',
      is_main: true,
      city: 'Vijayawada',
      state: 'Andhra Pradesh',
      postal_code: '520002',
      phone: '+91 9876543210'
    }
  });

  // Demo Counter
  const mainCounter = await prisma.counter.upsert({
    where: { branch_id_code: { branch_id: mainBranch.id, code: 'CTR-01' } },
    update: {},
    create: {
      shop_id: demoShop.id,
      branch_id: mainBranch.id,
      name: 'Counter 1 (Express)',
      code: 'CTR-01',
      is_active: true
    }
  });

  // Demo Shop Owner User
  const ownerPassword = await argon2.hash('Owner@2026!SL');
  const shopOwnerUser = await prisma.user.upsert({
    where: { email: 'owner@slsupermarket.com' },
    update: { password_hash: ownerPassword },
    create: {
      email: 'owner@slsupermarket.com',
      password_hash: ownerPassword,
      first_name: 'Suresh',
      last_name: 'Reddy',
      phone: '+91 9876500001',
      status: UserStatus.ACTIVE
    }
  });

  const shopOwnerRole = await prisma.role.findFirst({ where: { name: 'Shop Owner', is_system: true } });
  if (shopOwnerRole) {
    await prisma.userRole.upsert({
      where: { user_id_role_id_shop_id: { user_id: shopOwnerUser.id, role_id: shopOwnerRole.id, shop_id: demoShop.id } },
      update: {},
      create: { user_id: shopOwnerUser.id, role_id: shopOwnerRole.id, shop_id: demoShop.id, branch_id: mainBranch.id }
    });
  }

  // Demo Cashier User
  const cashierPassword = await argon2.hash('Cashier@2026!SL');
  const cashierUser = await prisma.user.upsert({
    where: { email: 'cashier@slsupermarket.com' },
    update: { password_hash: cashierPassword },
    create: {
      email: 'cashier@slsupermarket.com',
      password_hash: cashierPassword,
      first_name: 'Ravi',
      last_name: 'Kumar',
      phone: '+91 9876500002',
      status: UserStatus.ACTIVE
    }
  });

  const cashierRole = await prisma.role.findFirst({ where: { name: 'Cashier', is_system: true } });
  if (cashierRole) {
    await prisma.userRole.upsert({
      where: { user_id_role_id_shop_id: { user_id: cashierUser.id, role_id: cashierRole.id, shop_id: demoShop.id } },
      update: {},
      create: { user_id: cashierUser.id, role_id: cashierRole.id, shop_id: demoShop.id, branch_id: mainBranch.id }
    });
  }

  // Demo Subscription: Business Plan Active
  const businessPlan = await prisma.plan.findUnique({ where: { slug: 'business' } });
  if (businessPlan) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 365);

    await prisma.subscription.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: { status: SubscriptionStatus.ACTIVE },
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        shop_id: demoShop.id,
        plan_id: businessPlan.id,
        billing_cycle: BillingCycle.ANNUAL,
        status: SubscriptionStatus.ACTIVE,
        start_date: startDate,
        end_date: endDate,
        auto_renew: true
      }
    });
  }

  // Demo Categories & Brands
  const catGrocery = await prisma.category.upsert({
    where: { shop_id_slug: { shop_id: demoShop.id, slug: 'staples-grains' } },
    update: {},
    create: { shop_id: demoShop.id, name: 'Staples & Grains', slug: 'staples-grains', description: 'Rice, wheat, pulses' }
  });

  const catSnacks = await prisma.category.upsert({
    where: { shop_id_slug: { shop_id: demoShop.id, slug: 'snacks-beverages' } },
    update: {},
    create: { shop_id: demoShop.id, name: 'Snacks & Beverages', slug: 'snacks-beverages', description: 'Biscuits, tea, coffee' }
  });

  const brandTata = await prisma.brand.upsert({
    where: { shop_id_name: { shop_id: demoShop.id, name: 'Tata' } },
    update: {},
    create: { shop_id: demoShop.id, name: 'Tata', description: 'Tata Consumer Products' }
  });

  const unitKg = await prisma.unit.findFirst({ where: { code: 'KG', shop_id: null } });
  const unitPcs = await prisma.unit.findFirst({ where: { code: 'PCS', shop_id: null } });

  // Demo Products with Barcodes & Initial Stock
  if (unitKg && unitPcs) {
    const prodRice = await prisma.product.upsert({
      where: { shop_id_sku: { shop_id: demoShop.id, sku: 'RICE-SONA-25' } },
      update: {},
      create: {
        shop_id: demoShop.id,
        category_id: catGrocery.id,
        brand_id: brandTata.id,
        unit_id: unitKg.id,
        name: 'Sona Masoori Raw Rice (25kg Bag)',
        sku: 'RICE-SONA-25',
        barcode: '8901234567890',
        hsn_code: '10063010',
        purchase_price: 1350.00,
        selling_price: 1550.00,
        mrp: 1650.00,
        tax_rate: 0.00,
        is_weight_based: true,
        min_stock_level: 5
      }
    });

    await prisma.productBarcode.upsert({
      where: { shop_id_barcode: { shop_id: demoShop.id, barcode: '8901234567890' } },
      update: {},
      create: {
        shop_id: demoShop.id,
        product_id: prodRice.id,
        barcode: '8901234567890',
        barcode_type: 'EAN13',
        is_primary: true
      }
    });

    const existingRiceBal = await prisma.stockBalance.findFirst({
      where: {
        branch_id: mainBranch.id,
        product_id: prodRice.id,
        variant_id: null,
        batch_number: null
      }
    });

    if (existingRiceBal) {
      await prisma.stockBalance.update({
        where: { id: existingRiceBal.id },
        data: { quantity: 50, available_quantity: 50 }
      });
    } else {
      await prisma.stockBalance.create({
        data: {
          shop_id: demoShop.id,
          branch_id: mainBranch.id,
          product_id: prodRice.id,
          quantity: 50,
          available_quantity: 50,
          cost_price: 1350.00
        }
      });
    }

    const prodTea = await prisma.product.upsert({
      where: { shop_id_sku: { shop_id: demoShop.id, sku: 'TEA-TATA-GOLD-500' } },
      update: {},
      create: {
        shop_id: demoShop.id,
        category_id: catSnacks.id,
        brand_id: brandTata.id,
        unit_id: unitPcs.id,
        name: 'Tata Tea Gold (500g)',
        sku: 'TEA-TATA-GOLD-500',
        barcode: '8901234567891',
        hsn_code: '09024020',
        purchase_price: 280.00,
        selling_price: 330.00,
        mrp: 350.00,
        tax_rate: 5.00,
        min_stock_level: 10
      }
    });

    await prisma.productBarcode.upsert({
      where: { shop_id_barcode: { shop_id: demoShop.id, barcode: '8901234567891' } },
      update: {},
      create: {
        shop_id: demoShop.id,
        product_id: prodTea.id,
        barcode: '8901234567891',
        barcode_type: 'EAN13',
        is_primary: true
      }
    });

    const existingTeaBal = await prisma.stockBalance.findFirst({
      where: {
        branch_id: mainBranch.id,
        product_id: prodTea.id,
        variant_id: null,
        batch_number: null
      }
    });

    if (existingTeaBal) {
      await prisma.stockBalance.update({
        where: { id: existingTeaBal.id },
        data: { quantity: 120, available_quantity: 120 }
      });
    } else {
      await prisma.stockBalance.create({
        data: {
          shop_id: demoShop.id,
          branch_id: mainBranch.id,
          product_id: prodTea.id,
          quantity: 120,
          available_quantity: 120,
          cost_price: 280.00
        }
      });
    }
  }

  // Demo Customer
  const demoCustomer = await prisma.customer.upsert({
    where: { shop_id_phone: { shop_id: demoShop.id, phone: '9848012345' } },
    update: {},
    create: {
      shop_id: demoShop.id,
      name: 'Venkatesh Naidu',
      phone: '9848012345',
      email: 'venkatesh@example.com',
      credit_limit: 5000.00,
      current_balance: 0.00,
      loyalty_points: 50
    }
  });

  // 8. Seed Sample Cash Session for Counter 1
  console.log('Seeding sample cash session...');
  const cashSession = await prisma.cashSession.create({
    data: {
      shop_id: demoShop.id,
      branch_id: mainBranch.id,
      counter_id: mainCounter.id,
      opened_by: cashierUser.id,
      opening_cash: 2000.00,
      status: 'OPEN',
      notes: 'Morning shift drawer opening float'
    }
  });

  // 9. Seed Sample Expense Categories and Store Expenses
  console.log('Seeding expense categories and expenses...');
  const expCatUtils = await prisma.expenseCategory.create({
    data: {
      shop_id: demoShop.id,
      name: 'Utilities & Power',
      description: 'Electricity, water, and power backup'
    }
  });

  const expCatRent = await prisma.expenseCategory.create({
    data: {
      shop_id: demoShop.id,
      name: 'Store Rent & Maintenance',
      description: 'Monthly shop premises lease'
    }
  });

  await prisma.expense.create({
    data: {
      shop_id: demoShop.id,
      branch_id: mainBranch.id,
      category_id: expCatUtils.id,
      amount: 3450.00,
      payment_method: 'UPI',
      reference_number: 'UPI-EB-889922',
      notes: 'Monthly APCPDCL electricity bill',
      created_by: shopOwnerUser.id
    }
  });

  // 10. Seed Supplier & Purchase Order
  console.log('Seeding supplier and purchase order...');
  const supplier = await prisma.supplier.create({
    data: {
      shop_id: demoShop.id,
      name: 'Sri Balaji Wholesale Traders',
      company_name: 'Balaji Agro Foods Pvt Ltd',
      phone: '+91 9988776655',
      email: 'orders@balajiagro.com',
      gstin: '37BBBBB1111B1Z2',
      address: 'Shop 14, Wholesale Market Yard',
      city: 'Vijayawada',
      state: 'Andhra Pradesh',
      current_balance: 18500.00
    }
  });

  // 11. Seed Sample Invoices & POS Sales
  console.log('Seeding sample sales invoices and payments...');
  const riceProduct = await prisma.product.findFirst({ where: { sku: 'RICE-SONA-25', shop_id: demoShop.id } });
  const teaProduct = await prisma.product.findFirst({ where: { sku: 'TEA-TATA-GOLD-500', shop_id: demoShop.id } });

  if (riceProduct && teaProduct) {
    // Invoice 1: Cash Sale (Rice Bag)
    const inv1 = await prisma.invoice.create({
      data: {
        shop_id: demoShop.id,
        branch_id: mainBranch.id,
        counter_id: mainCounter.id,
        customer_id: demoCustomer.id,
        cash_session_id: cashSession.id,
        invoice_number: 'SLM-1001',
        subtotal: 1550.00,
        tax_amount: 0.00,
        round_off: 0.00,
        total_amount: 1550.00,
        paid_amount: 1550.00,
        due_amount: 0.00,
        status: 'PAID',
        payment_status: 'COMPLETED',
        language: 'en',
        created_by: cashierUser.id,
        invoice_items: {
          create: [
            {
              shop_id: demoShop.id,
              product_id: riceProduct.id,
              product_name: riceProduct.name,
              sku: riceProduct.sku,
              unit_code: 'KG',
              quantity: 1,
              unit_price: 1550.00,
              total_price: 1550.00
            }
          ]
        },
        payments: {
          create: [
            {
              shop_id: demoShop.id,
              branch_id: mainBranch.id,
              cash_session_id: cashSession.id,
              customer_id: demoCustomer.id,
              payment_number: 'PAY-SLM-1001-1',
              amount: 1550.00,
              payment_method: 'CASH',
              status: 'SUCCESS',
              created_by: cashierUser.id
            }
          ]
        }
      }
    });

    await prisma.cashTransaction.create({
      data: {
        shop_id: demoShop.id,
        cash_session_id: cashSession.id,
        transaction_type: 'CASH_SALE',
        amount: 1550.00,
        reason: 'POS Sale #SLM-1001',
        created_by: cashierUser.id
      }
    });

    // Invoice 2: UPI Sale (Tata Tea Gold) with 5% GST
    const inv2 = await prisma.invoice.create({
      data: {
        shop_id: demoShop.id,
        branch_id: mainBranch.id,
        counter_id: mainCounter.id,
        cash_session_id: cashSession.id,
        invoice_number: 'SLM-1002',
        subtotal: 314.29,
        tax_amount: 15.71,
        round_off: 0.00,
        total_amount: 330.00,
        paid_amount: 330.00,
        due_amount: 0.00,
        status: 'PAID',
        payment_status: 'COMPLETED',
        language: 'te',
        created_by: cashierUser.id,
        invoice_items: {
          create: [
            {
              shop_id: demoShop.id,
              product_id: teaProduct.id,
              product_name: teaProduct.name,
              sku: teaProduct.sku,
              unit_code: 'PCS',
              quantity: 1,
              unit_price: 314.29,
              tax_rate: 5.0,
              tax_amount: 15.71,
              cgst_rate: 2.5,
              cgst_amount: 7.86,
              sgst_rate: 2.5,
              sgst_amount: 7.86,
              total_price: 330.00
            }
          ]
        },
        invoice_taxes: {
          create: [
            {
              shop_id: demoShop.id,
              tax_name: 'GST 5%',
              rate: 5.0,
              taxable_amount: 314.29,
              tax_amount: 15.71
            }
          ]
        },
        payments: {
          create: [
            {
              shop_id: demoShop.id,
              branch_id: mainBranch.id,
              payment_number: 'PAY-SLM-1002-1',
              amount: 330.00,
              payment_method: 'UPI',
              reference_number: 'UPI-AXIS-99221100',
              status: 'SUCCESS',
              created_by: cashierUser.id
            }
          ]
        }
      }
    });

    // Update settings next sequence
    await prisma.shopSettings.update({
      where: { shop_id: demoShop.id },
      data: { next_invoice_number: 1003 }
    });
  }

  console.log('--- Seed Completed Successfully! ---');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
