# SL MULTISHOP – REST API SPECIFICATION
**Product:** SL MultiShop  
**Company:** SL IT SOLUTIONS  
**Base URL:** `/api/v1`  
**Swagger UI:** `http://localhost:5000/api-docs`  

---

## 1. Authentication & Tenant Routing

### `POST /auth/register`
Creates a new tenant shop, default branch, default counter, shop owner account, and a 14-day trial subscription in an atomic transaction.
- **Request Body:**
  ```json
  {
    "shopName": "Sri Lakshmi Groceries",
    "businessType": "GROCERY",
    "firstName": "Suresh",
    "lastName": "Reddy",
    "email": "owner@srilakshmi.com",
    "password": "StrongPassword@2026",
    "phone": "+91 9876543210",
    "planSlug": "starter"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Shop and account registered successfully",
    "data": {
      "user": { "id": "uuid", "email": "owner@srilakshmi.com" },
      "shop": { "id": "uuid", "name": "Sri Lakshmi Groceries", "slug": "sri-lakshmi-groceries" },
      "tokens": { "accessToken": "jwt", "refreshToken": "hex", "expiresIn": "15m" }
    }
  }
  ```

### `POST /auth/login`
Authenticates a user and establishes their active shop session context.
- **Request Body:**
  ```json
  {
    "email": "owner@srilakshmi.com",
    "password": "StrongPassword@2026",
    "shopId": "optional-uuid"
  }
  ```

### `POST /auth/switch-shop`
Switches active shop context for multi-shop owners without re-entering credentials.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:** `{ "shopId": "uuid" }`

---

## 2. Point of Sale (POS) Billing & Cash Sessions

### `POST /pos/session/open`
Opens cash drawer session with opening float balance.
- **Headers:** `Authorization: Bearer <token>`, `x-tenant-id: <shopId>`
- **Request Body:**
  ```json
  {
    "branchId": "uuid",
    "counterId": "uuid",
    "openingCash": 2000.00
  }
  ```

### `POST /pos/checkout`
Executes an atomic, idempotent retail checkout transaction.
- **Headers:**
  - `Authorization: Bearer <token>`
  - `x-tenant-id: <shopId>`
  - `idempotency-key: POS-20261118-001`
- **Request Body:**
  ```json
  {
    "branchId": "uuid",
    "counterId": "uuid",
    "customerId": "uuid",
    "items": [
      {
        "productId": "uuid",
        "productName": "Sona Masoori Rice 25kg",
        "sku": "RICE-SONA-25",
        "unitCode": "KG",
        "quantity": 1,
        "unitPrice": 1550.00,
        "discountPercent": 0,
        "taxRate": 0
      }
    ],
    "invoiceDiscountAmount": 0,
    "paymentMethod": "CASH",
    "payments": [
      { "method": "CASH", "amount": 1550.00 }
    ],
    "language": "en"
  }
  ```
- **Response (201 Created):** Full created invoice record with items, taxes, and payment allocations.

---

## 3. Invoices & Receipts

### `GET /invoices`
Lists store invoices with filters for date range, customer, branch, and status.
- **Query Parameters:** `page`, `limit`, `search`, `status`, `startDate`, `endDate`, `branchId`

### `GET /invoices/:invoiceId/pdf`
Streams the generated PDF invoice.
- **Query Parameters:**
  - `format`: `thermal` (80mm receipt) or `a4` (full sheet GST invoice)
  - `lang`: `en` (English) or `te` (Telugu bilingual)

### `POST /invoices/:invoiceId/cancel`
Voids an invoice and restocks inventory.

---

## 4. Products & Catalog

- `GET /products`: List products with category, stock, and barcode details.
- `GET /products/barcode/:barcode`: Quick single-item lookup for barcode scanners.
- `POST /products`: Create product with pricing, tax rate, and industry options.
- `GET /products/categories`: Hierarchical category tree.
- `POST /products/categories`: Create category.
- `GET /products/units`: Standard global and custom shop units.

---

## 5. Inventory & Stock Operations

- `GET /inventory/balances`: Real-time stock counts with `?lowStock=true` filter.
- `POST /inventory/adjust`: Manual adjustment up/down with mandatory audit reason.
- `GET /inventory/movements`: Immutable stock movement audit log.
- `POST /inventory/transfers`: Create inter-branch stock dispatch.
- `POST /inventory/transfers/:id/receive`: Destination branch receipt and inventory update.

---

## 6. Customers & Ledgers

- `GET /customers`: Customer directory with debt/credit balances.
- `POST /customers`: Create customer with credit limit.
- `GET /customers/:id/ledger`: Full debit/credit running balance statement.

---

## 7. Financial Reports

- `GET /reports/dashboard`: Summary sales, tax, customer, and low stock metrics.
- `GET /reports/gst-tax`: Detailed GST turnover, CGST, and SGST breakdown by tax rate.
- `GET /reports/profit-loss`: Revenue, COGS, Gross Profit, Operating Expenses, and Net Profit.

---

## 8. Platform Super Admin

- `GET /admin/dashboard`: Platform-wide store counts, active/suspended ratios, and revenue.
- `GET /admin/shops`: Comprehensive shop directory with subscription status.
- `PATCH /admin/shops/:id/status`: Activate or suspend shop access.
- `GET /admin/payments`: List pending manual UPI subscription payments.
- `PATCH /admin/payments/:id/verify`: Approve or reject subscription payment.
- `GET /admin/plans`: SaaS pricing plans management.
- `GET /admin/audit-logs`: Platform-wide compliance audit trail.
