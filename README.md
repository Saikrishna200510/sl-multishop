# SL MULTISHOP – MULTI-TENANT BILLING & POS SAAS
**A Product of SL IT SOLUTIONS**

SL MultiShop is a production-grade multi-tenant SaaS billing and point-of-sale management platform engineered to support thousands of retail businesses across diverse industries: grocery stores, supermarkets, clothing & apparel, electronics, pharmacies, restaurants, hardware, and general retail.

---

## Key Features

- **True Multi-Tenancy**: Isolated shop data enforced via `shop_id`, PostgreSQL Row-Level Security (RLS), and verified JWT membership claims.
- **Fast POS Interface**: Instant barcode scanning, keyboard hotkeys (`F2` for search, `F9` for sale), cart discounts, GST taxes, round-off, cash drawer change calculation.
- **Bilingual Receipts**: Instant 80mm thermal receipt and A4 GST invoice PDF generation in both **English and Telugu**.
- **Industry Architecture**: Unified codebase supporting weight-based items, sizes/colors, serials/warranties, batch/expiry compliance, and restaurant table/KOT modes.
- **Cash Sessions**: Shift management tracking opening cash float, expected cash, actual drawer counts, and cash variance.
- **Complete ERP Features**: Products, Categories, Stock Balances, Stock Transfers, Suppliers, Purchase Orders, Goods Receipts, Customers, Debt Ledgers, Operating Expenses, and Financial Reports (GSTR-1/GSTR-3B tax breakdowns and P&L statements).
- **Subscription Engine**: Starter, Business, and Enterprise plans with resource limits (branches, counters, users, products), 14-day trials, grace periods, and manual UPI verification.
- **Super Admin Platform**: Master oversight dashboard, shop activation/suspension, plan manager, payment verifications, and audit logging.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, TanStack Query, React Hook Form, Zod, Recharts, Lucide Icons, react-i18next |
| **Backend** | Node.js, Express.js, TypeScript, Prisma ORM, Argon2id, JWT with refresh rotation, Swagger/OpenAPI |
| **Database** | PostgreSQL 17 with Row-Level Security (RLS), ACID transactions, B-Tree & GIN indexes |
| **Infrastructure** | Docker, Docker Compose, Caddy 2 (Automatic TLS), Ubuntu VPS |

---

## Quick Start (Local Development)

### 1. Prerequisites
- Node.js 20+ and npm
- PostgreSQL 17

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:seed
npm run dev
```
The backend API starts on `http://localhost:5000`.  
Swagger documentation is available at `http://localhost:5000/api-docs`.

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
The frontend SPA starts on `http://localhost:5173`.

---

## Default Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Super Admin** | `admin@slit-solutions.com` | `SuperAdmin@2026!SL` |
| **Shop Owner** | `owner@slsupermarket.com` | `Owner@2026!SL` |
| **Cashier (POS)** | `cashier@slsupermarket.com` | `Cashier@2026!SL` |

---

## Project Structure

```text
billings/
├── backend/                  # Node.js + Express + Prisma REST API
│   ├── prisma/
│   │   ├── schema.prisma     # 42+ relational tables & enums
│   │   ├── rls-setup.sql     # PostgreSQL Row-Level Security policies
│   │   └── seed.ts           # Master seeds (Roles, Perms, Plans, Demo Shop)
│   ├── src/
│   │   ├── config/           # App & Swagger configuration
│   │   ├── controllers/      # Auth, Admin, POS, Invoice, Product, etc.
│   │   ├── middleware/       # JWT auth, tenant isolation, idempotency
│   │   ├── routes/           # REST endpoint routers
│   │   ├── services/         # Prisma client & RLS transactions
│   │   ├── utils/            # Argon2id, JWT, PDFKit thermal/A4 generator
│   │   ├── __tests__/        # Unit, billing & tenant isolation test suites
│   │   ├── app.ts            # Express app assembly
│   │   └── server.ts         # Server bootstrap
├── frontend/                 # React + Vite + Tailwind CSS SPA
│   ├── src/
│   │   ├── components/       # POSCart, POSProductGrid, ReceiptModal, Tables
│   │   ├── context/          # Auth & Active Shop context
│   │   ├── locales/          # English (en.json) & Telugu (te.json)
│   │   ├── pages/            # POS, Dashboard, Catalog, Inventory, Settings
│   │   ├── services/         # API client with tenant headers
│   │   ├── App.tsx           # Router & layout
│   │   └── main.tsx          # React DOM entry
├── deploy/                   # Production Deployment & Infrastructure
│   ├── docker-compose.yml    # Caddy, Backend, Frontend, PostgreSQL 17
│   ├── backend.Dockerfile    # Multi-stage production container build
│   ├── frontend.Dockerfile   # Multi-stage container build with Caddy
│   ├── Caddyfile             # Reverse proxy, security headers & auto TLS
│   ├── backup.sh             # Automated daily PostgreSQL backup script
│   └── restore.sh            # Disaster recovery restoration script
├── docs/                     # Technical Documentation
│   ├── ER_DIAGRAM.md         # Full relational diagram & data dictionary
│   ├── API_REFERENCE.md      # OpenAPI REST endpoint specifications
│   ├── DEPLOYMENT_GUIDE.md   # Ubuntu VPS production setup guide
│   └── BACKUP_RECOVERY.md    # Disaster recovery procedures
└── package.json              # Monorepo root scripts
```

---

## Production Deployment (Docker Compose)

```bash
docker compose -f deploy/docker-compose.yml up -d --build
```
Ensure ports 80 and 443 are open. Caddy handles TLS certificates automatically.

---

**SL MULTISHOP – A PRODUCT OF SL IT SOLUTIONS.**
