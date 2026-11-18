--
-- PostgreSQL database dump
--

\restrict 589NBXEpEoXNd8ijGaJxD1a33u6BQKgYQqEpbyL86saemmIEfQnFZxzA3U3SLmS

-- Dumped from database version 18.6 (Homebrew)
-- Dumped by pg_dump version 18.6 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: BillingCycle; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."BillingCycle" AS ENUM (
    'MONTHLY',
    'ANNUAL'
);


ALTER TYPE public."BillingCycle" OWNER TO postgres;

--
-- Name: CashSessionStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CashSessionStatus" AS ENUM (
    'OPEN',
    'CLOSED'
);


ALTER TYPE public."CashSessionStatus" OWNER TO postgres;

--
-- Name: CashTxType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CashTxType" AS ENUM (
    'CASH_SALE',
    'CASH_RETURN',
    'CASH_IN',
    'CASH_OUT'
);


ALTER TYPE public."CashTxType" OWNER TO postgres;

--
-- Name: IdempotencyStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."IdempotencyStatus" AS ENUM (
    'IN_PROGRESS',
    'COMPLETED',
    'FAILED'
);


ALTER TYPE public."IdempotencyStatus" OWNER TO postgres;

--
-- Name: InvoicePaymentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."InvoicePaymentStatus" AS ENUM (
    'UNPAID',
    'PARTIAL',
    'COMPLETED'
);


ALTER TYPE public."InvoicePaymentStatus" OWNER TO postgres;

--
-- Name: InvoiceStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."InvoiceStatus" AS ENUM (
    'DRAFT',
    'ISSUED',
    'PAID',
    'PARTIALLY_PAID',
    'CANCELLED',
    'REFUNDED'
);


ALTER TYPE public."InvoiceStatus" OWNER TO postgres;

--
-- Name: LedgerType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."LedgerType" AS ENUM (
    'INVOICE',
    'PAYMENT',
    'RETURN',
    'ADJUSTMENT'
);


ALTER TYPE public."LedgerType" OWNER TO postgres;

--
-- Name: POStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."POStatus" AS ENUM (
    'DRAFT',
    'ORDERED',
    'PARTIAL_RECEIVED',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."POStatus" OWNER TO postgres;

--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'CASH',
    'UPI',
    'CARD',
    'SPLIT',
    'CREDIT',
    'WALLET',
    'BANK_TRANSFER'
);


ALTER TYPE public."PaymentMethod" OWNER TO postgres;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'VERIFIED',
    'REJECTED',
    'SUCCESS',
    'FAILED'
);


ALTER TYPE public."PaymentStatus" OWNER TO postgres;

--
-- Name: ReturnStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ReturnStatus" AS ENUM (
    'PENDING',
    'COMPLETED',
    'REJECTED'
);


ALTER TYPE public."ReturnStatus" OWNER TO postgres;

--
-- Name: ShopStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ShopStatus" AS ENUM (
    'ACTIVE',
    'SUSPENDED',
    'PENDING_VERIFICATION',
    'INACTIVE'
);


ALTER TYPE public."ShopStatus" OWNER TO postgres;

--
-- Name: StockMovementType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StockMovementType" AS ENUM (
    'PURCHASE',
    'SALE',
    'RETURN_IN',
    'RETURN_OUT',
    'ADJUSTMENT_UP',
    'ADJUSTMENT_DOWN',
    'TRANSFER_IN',
    'TRANSFER_OUT'
);


ALTER TYPE public."StockMovementType" OWNER TO postgres;

--
-- Name: SubscriptionStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SubscriptionStatus" AS ENUM (
    'TRIAL',
    'ACTIVE',
    'PAST_DUE',
    'CANCELLED',
    'EXPIRED',
    'SUSPENDED'
);


ALTER TYPE public."SubscriptionStatus" OWNER TO postgres;

--
-- Name: TicketPriority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TicketPriority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
);


ALTER TYPE public."TicketPriority" OWNER TO postgres;

--
-- Name: TicketStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TicketStatus" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED'
);


ALTER TYPE public."TicketStatus" OWNER TO postgres;

--
-- Name: TransferStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TransferStatus" AS ENUM (
    'PENDING',
    'IN_TRANSIT',
    'RECEIVED',
    'CANCELLED'
);


ALTER TYPE public."TransferStatus" OWNER TO postgres;

--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED'
);


ALTER TYPE public."UserStatus" OWNER TO postgres;

--
-- Name: current_app_shop_id(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.current_app_shop_id() RETURNS uuid
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_shop_id', true), '')::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$;


ALTER FUNCTION public.current_app_shop_id() OWNER TO postgres;

--
-- Name: is_app_super_admin(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_app_super_admin() RETURNS boolean
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN COALESCE(current_setting('app.is_super_admin', true) = 'true', false);
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$;


ALTER FUNCTION public.is_app_super_admin() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id uuid NOT NULL,
    shop_id uuid,
    user_id uuid,
    action character varying(100) NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id character varying(100),
    old_values jsonb,
    new_values jsonb,
    ip_address character varying(50),
    user_agent text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.audit_logs FORCE ROW LEVEL SECURITY;


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: branches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.branches (
    id uuid NOT NULL,
    shop_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(50) NOT NULL,
    phone character varying(50),
    email character varying(255),
    address_line1 text,
    address_line2 text,
    city character varying(100),
    state character varying(100),
    postal_code character varying(20),
    is_main boolean DEFAULT false NOT NULL,
    status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);

ALTER TABLE ONLY public.branches FORCE ROW LEVEL SECURITY;


ALTER TABLE public.branches OWNER TO postgres;

--
-- Name: brands; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.brands (
    id uuid NOT NULL,
    shop_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);

ALTER TABLE ONLY public.brands FORCE ROW LEVEL SECURITY;


ALTER TABLE public.brands OWNER TO postgres;

--
-- Name: cash_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cash_sessions (
    id uuid NOT NULL,
    shop_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    counter_id uuid NOT NULL,
    opened_by uuid NOT NULL,
    closed_by uuid,
    opened_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    closed_at timestamp(6) with time zone,
    opening_cash numeric(12,2) NOT NULL,
    expected_cash numeric(12,2),
    actual_cash numeric(12,2),
    difference numeric(12,2),
    status public."CashSessionStatus" DEFAULT 'OPEN'::public."CashSessionStatus" NOT NULL,
    notes text
);

ALTER TABLE ONLY public.cash_sessions FORCE ROW LEVEL SECURITY;


ALTER TABLE public.cash_sessions OWNER TO postgres;

--
-- Name: cash_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cash_transactions (
    id uuid NOT NULL,
    shop_id uuid NOT NULL,
    cash_session_id uuid NOT NULL,
    transaction_type public."CashTxType" NOT NULL,
    amount numeric(12,2) NOT NULL,
    reason text,
    created_by uuid NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.cash_transactions FORCE ROW LEVEL SECURITY;


ALTER TABLE public.cash_transactions OWNER TO postgres;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id uuid NOT NULL,
    shop_id uuid NOT NULL,
    parent_id uuid,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);

ALTER TABLE ONLY public.categories FORCE ROW LEVEL SECURITY;


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: counters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.counters (
    id uuid NOT NULL,
    shop_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(50) NOT NULL,
    device_id character varying(100),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);

ALTER TABLE ONLY public.counters FORCE ROW LEVEL SECURITY;


ALTER TABLE public.counters OWNER TO postgres;

--
-- Name: credit_notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.credit_notes (
    id uuid NOT NULL,
    shop_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    sales_return_id uuid,
    credit_note_number character varying(100) NOT NULL,
    amount numeric(12,2) NOT NULL,
    used_amount numeric(12,2) DEFAULT 0 NOT NULL,
    balance_amount numeric(12,2) NOT NULL,
    issue_date timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expiry_date date,
    status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.credit_notes FORCE ROW LEVEL SECURITY;


ALTER TABLE public.credit_notes OWNER TO postgres;

--
-- Name: customer_addresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_addresses (
    id uuid NOT NULL,
    shop_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    type character varying(20) DEFAULT 'BILLING'::character varying NOT NULL,
    address_line1 text NOT NULL,
    address_line2 text,
    city character varying(100) NOT NULL,
    state character varying(100) NOT NULL,
    postal_code character varying(20) NOT NULL,
    is_default boolean DEFAULT true NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.customer_addresses FORCE ROW LEVEL SECURITY;


ALTER TABLE public.customer_addresses OWNER TO postgres;

--
-- Name: customer_ledger; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_ledger (
    id uuid NOT NULL,
    shop_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    transaction_type public."LedgerType" NOT NULL,
    reference_id character varying(100),
    debit numeric(12,2) DEFAULT 0 NOT NULL,
    credit numeric(12,2) DEFAULT 0 NOT NULL,
    running_balance numeric(12,2) NOT NULL,
    notes text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.customer_ledger FORCE ROW LEVEL SECURITY;


ALTER TABLE public.customer_ledger OWNER TO postgres;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id uuid NOT NULL,
    shop_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    phone character varying(50),
    email character varying(255),
    gstin character varying(20),
    credit_limit numeric(12,2) DEFAULT 0 NOT NULL,
    current_balance numeric(12,2) DEFAULT 0 NOT NULL,
    loyalty_points integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);

ALTER TABLE ONLY public.customers FORCE ROW LEVEL SECURITY;


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: expense_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expense_categories (
    id uuid NOT NULL,
    shop_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.expense_categories FORCE ROW LEVEL SECURITY;


ALTER TABLE public.expense_categories OWNER TO postgres;

--
-- Name: expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expenses (
    id uuid NOT NULL,
    shop_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    category_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    payment_method character varying(50) DEFAULT 'CASH'::character varying NOT NULL,
    reference_number character varying(100),
    expense_date date DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes text,
    receipt_url text,
    created_by uuid,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.expenses FORCE ROW LEVEL SECURITY;


ALTER TABLE public.expenses OWNER TO postgres;

--
-- Name: goods_receipts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.goods_receipts (
    id uuid NOT NULL,
    shop_id uuid NOT NULL,
    purchase_order_id uuid NOT NULL,
    grn_number character varying(100) NOT NULL,
    received_date date DEFAULT CURRENT_TIMESTAMP NOT NULL,
    supplier_invoice_number character varying(100),
    received_items jsonb NOT NULL,
    notes text,
    received_by uuid,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.goods_receipts FORCE ROW LEVEL SECURITY;


ALTER TABLE public.goods_receipts OWNER TO postgres;

--
-- Name: idempotency_keys; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.idempotency_keys (
    id uuid NOT NULL,
    shop_id uuid NOT NULL,
    key character varying(128) NOT NULL,
    request_path character varying(255) NOT NULL,
    request_payload_hash character varying(64) NOT NULL,
    response_status integer,
    response_body jsonb,
    status public."IdempotencyStatus" DEFAULT 'IN_PROGRESS'::public."IdempotencyStatus" NOT NULL,
    expires_at timestamp(6) with time zone NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.idempotency_keys FORCE ROW LEVEL SECURITY;


ALTER TABLE public.idempotency_keys OWNER TO postgres;

--
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoice_items (
    id uuid NOT NULL,
    shop_id uuid NOT NULL,
    invoice_id uuid NOT NULL,
    product_id uuid NOT NULL,
    variant_id uuid,
    product_name character varying(255) NOT NULL,
    sku character varying(100) NOT NULL,
    hsn_code character varying(50),
    unit_code character varying(20) NOT NULL,
    batch_number character varying(100),
    serial_numbers jsonb,
    quantity numeric(12,3) NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    discount_percent numeric(5,2) DEFAULT 0 NOT NULL,
    discount_amount numeric(12,2) DEFAULT 0 NOT NULL,
    tax_rate numeric(5,2) DEFAULT 0 NOT NULL,
    tax_amount numeric(12,2) DEFAULT 0 NOT NULL,
    cgst_rate numeric(5,2) DEFAULT 0 NOT NULL,
    cgst_amount numeric(12,2) DEFAULT 0 NOT NULL,
    sgst_rate numeric(5,2) DEFAULT 0 NOT NULL,
    sgst_amount numeric(12,2) DEFAULT 0 NOT NULL,
    igst_rate numeric(5,2) DEFAULT 0 NOT NULL,
    igst_amount numeric(12,2) DEFAULT 0 NOT NULL,
    total_price numeric(12,2) NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.invoice_items FORCE ROW LEVEL SECURITY;


ALTER TABLE public.invoice_items OWNER TO postgres;

--
-- Name: invoice_taxes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoice_taxes (
    id uuid NOT NULL,
    shop_id uuid NOT NULL,
    invoice_id uuid NOT NULL,
    tax_rate_id uuid,
    tax_name character varying(100) NOT NULL,
    rate numeric(5,2) NOT NULL,
    taxable_amount numeric(12,2) NOT NULL,
    tax_amount numeric(12,2) NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.invoice_taxes FORCE ROW LEVEL SECURITY;


ALTER TABLE public.invoice_taxes OWNER TO postgres;

--
-- Name: invoice_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoice_templates (
    id uuid NOT NULL,
    shop_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    type character varying(50) DEFAULT 'THERMAL_80MM'::character varying NOT NULL,
    template_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);

ALTER TABLE ONLY public.invoice_templates FORCE ROW LEVEL SECURITY;


ALTER TABLE public.invoice_templates OWNER TO postgres;

--
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    id uuid NOT NULL,
    shop_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    counter_id uuid,
    customer_id uuid,
    cash_session_id uuid,
    invoice_number character varying(100) NOT NULL,
    invoice_date timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    item_discount_amount numeric(12,2) DEFAULT 0 NOT NULL,
    invoice_discount_amount numeric(12,2) DEFAULT 0 NOT NULL,
    tax_amount numeric(12,2) DEFAULT 0 NOT NULL,
    round_off numeric(5,2) DEFAULT 0 NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    paid_amount numeric(12,2) DEFAULT 0 NOT NULL,
    due_amount numeric(12,2) DEFAULT 0 NOT NULL,
    status public."InvoiceStatus" DEFAULT 'ISSUED'::public."InvoiceStatus" NOT NULL,
    payment_status public."InvoicePaymentStatus" DEFAULT 'COMPLETED'::public."InvoicePaymentStatus" NOT NULL,
    idempotency_key character varying(100),
    notes text,
    language character varying(10) DEFAULT 'en'::character varying NOT NULL,
    created_by uuid,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);

ALTER TABLE ONLY public.invoices FORCE ROW LEVEL SECURITY;


ALTER TABLE public.invoices OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid NOT NULL,
    shop_id uuid,
    user_id uuid,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    type character varying(20) DEFAULT 'INFO'::character varying NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.notifications FORCE ROW LEVEL SECURITY;


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: payment_allocations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_allocations (
    id uuid NOT NULL,
    shop_id uuid NOT NULL,
    payment_id uuid NOT NULL,
    invoice_id uuid NOT NULL,
    allocated_amount numeric(12,2) NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.payment_allocations FORCE ROW LEVEL SECURITY;


ALTER TABLE public.payment_allocations OWNER TO postgres;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id uuid NOT NULL,
    shop_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    invoice_id uuid,
    customer_id uuid,
    cash_session_id uuid,
    payment_number character varying(100) NOT NULL,
    amount numeric(12,2) NOT NULL,
    payment_method public."PaymentMethod" DEFAULT 'CASH'::public."PaymentMethod" NOT NULL,
    reference_number character varying(100),
    status character varying(30) DEFAULT 'SUCCESS'::character varying NOT NULL,
    payment_date timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes text,
    created_by uuid,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.payments FORCE ROW LEVEL SECURITY;


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    module character varying(50) NOT NULL,
    description text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- Name: plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plans (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    description text,
    monthly_price numeric(10,2) NOT NULL,
    annual_price numeric(10,2) NOT NULL,
    max_branches integer DEFAULT 1 NOT NULL,
    max_counters integer DEFAULT 1 NOT NULL,
    max_users integer DEFAULT 3 NOT NULL,
    max_products integer DEFAULT 1000 NOT NULL,
    max_invoices_per_month integer DEFAULT 1000 NOT NULL,
    features jsonb,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.plans OWNER TO postgres;

--
-- Name: product_barcodes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_barcodes (
    id uuid NOT NULL,
    shop_id uuid NOT NULL,
    product_id uuid NOT NULL,
    variant_id uuid,
    barcode character varying(100) NOT NULL,
    barcode_type character varying(30) DEFAULT 'EAN13'::character varying NOT NULL,
    is_primary boolean DEFAULT true NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.product_barcodes FORCE ROW LEVEL SECURITY;


ALTER TABLE public.product_barcodes OWNER TO postgres;

--
-- Name: product_variants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_variants (
    id uuid NOT NULL,
    shop_id uuid NOT NULL,
    product_id uuid NOT NULL,
    name character varying(150) NOT NULL,
    sku character varying(100) NOT NULL,
    barcode character varying(100),
    attributes jsonb NOT NULL,
    purchase_price numeric(12,2) NOT NULL,
    selling_price numeric(12,2) NOT NULL,
    mrp numeric(12,2),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);

ALTER TABLE ONLY public.product_variants FORCE ROW LEVEL SECURITY;


ALTER TABLE public.product_variants OWNER TO postgres;

--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id uuid NOT NULL,
    shop_id uuid NOT NULL,
    category_id uuid,
    brand_id uuid,
    unit_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    sku character varying(100) NOT NULL,
    barcode character varying(100),
    hsn_code character varying(50),
    description text,
    is_variant_product boolean DEFAULT false NOT NULL,
    tax_rate numeric(5,2) DEFAULT 0.00 NOT NULL,
    purchase_price numeric(12,2) NOT NULL,
    selling_price numeric(12,2) NOT NULL,
    mrp numeric(12,2),
    min_stock_level numeric(12,3) DEFAULT 0 NOT NULL,
    is_batch_tracked boolean DEFAULT false NOT NULL,
    is_expiry_tracked boolean DEFAULT false NOT NULL,
    is_serial_tracked boolean DEFAULT false NOT NULL,
    is_weight_based boolean DEFAULT false NOT NULL,
    metadata jsonb,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);

ALTER TABLE ONLY public.products FORCE ROW LEVEL SECURITY;


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: purchase_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_items (
    id uuid NOT NULL,
    shop_id uuid NOT NULL,
    purchase_order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    variant_id uuid,
    quantity numeric(12,3) NOT NULL,
    received_quantity numeric(12,3) DEFAULT 0 NOT NULL,
    unit_cost numeric(12,2) NOT NULL,
    tax_rate numeric(5,2) DEFAULT 0 NOT NULL,
    tax_amount numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) NOT NULL,
    batch_number character varying(100),
    expiry_date date,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.purchase_items FORCE ROW LEVEL SECURITY;


ALTER TABLE public.purchase_items OWNER TO postgres;

--
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_orders (
    id uuid NOT NULL,
    shop_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    supplier_id uuid NOT NULL,
    po_number character varying(100) NOT NULL,
    order_date date DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expected_date date,
    subtotal numeric(12,2) NOT NULL,
    tax_amount numeric(12,2) DEFAULT 0 NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    paid_amount numeric(12,2) DEFAULT 0 NOT NULL,
    status public."POStatus" DEFAULT 'DRAFT'::public."POStatus" NOT NULL,
    notes text,
    created_by uuid,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);

ALTER TABLE ONLY public.purchase_orders FORCE ROW LEVEL SECURITY;


ALTER TABLE public.purchase_orders OWNER TO postgres;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_hash text NOT NULL,
    device_info text,
    ip_address character varying(50),
    expires_at timestamp(6) with time zone NOT NULL,
    revoked_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.refresh_tokens OWNER TO postgres;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    id uuid NOT NULL,
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id uuid NOT NULL,
    shop_id uuid,
    name character varying(100) NOT NULL,
    description text,
    is_system boolean DEFAULT false NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);

ALTER TABLE ONLY public.roles FORCE ROW LEVEL SECURITY;


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: sales_return_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sales_return_items (
    id uuid NOT NULL,
    shop_id uuid NOT NULL,
    sales_return_id uuid NOT NULL,
    invoice_item_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity numeric(12,3) NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    tax_amount numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) NOT NULL,
    reason text,
    restock boolean DEFAULT true NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.sales_return_items FORCE ROW LEVEL SECURITY;


ALTER TABLE public.sales_return_items OWNER TO postgres;

--
-- Name: sales_returns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sales_returns (
    id uuid NOT NULL,
    shop_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    invoice_id uuid NOT NULL,
    customer_id uuid,
    return_number character varying(100) NOT NULL,
    return_date timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    tax_amount numeric(12,2) DEFAULT 0 NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    refund_method character varying(50) DEFAULT 'CREDIT_NOTE'::character varying NOT NULL,
    status public."ReturnStatus" DEFAULT 'COMPLETED'::public."ReturnStatus" NOT NULL,
    notes text,
    created_by uuid,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.sales_returns FORCE ROW LEVEL SECURITY;


ALTER TABLE public.sales_returns OWNER TO postgres;

--
-- Name: shop_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shop_settings (
    id uuid NOT NULL,
    shop_id uuid NOT NULL,
    industry_type character varying(50) DEFAULT 'GENERAL_RETAIL'::character varying NOT NULL,
    features_enabled jsonb DEFAULT '{}'::jsonb NOT NULL,
    gst_enabled boolean DEFAULT true NOT NULL,
    is_composition_scheme boolean DEFAULT false NOT NULL,
    default_tax_rate numeric(5,2) DEFAULT 18.0 NOT NULL,
    receipt_printer_type character varying(50) DEFAULT 'THERMAL_80MM'::character varying NOT NULL,
    invoice_prefix character varying(20) DEFAULT 'INV-'::character varying NOT NULL,
    next_invoice_number integer DEFAULT 1 NOT NULL,
    invoice_footer_note text,
    invoice_terms text,
    telugu_invoice_enabled boolean DEFAULT true NOT NULL,
    loyalty_program_enabled boolean DEFAULT false NOT NULL,
    low_stock_threshold_default integer DEFAULT 10 NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);

ALTER TABLE ONLY public.shop_settings FORCE ROW LEVEL SECURITY;


ALTER TABLE public.shop_settings OWNER TO postgres;

--
-- Name: shops; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shops (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(100) NOT NULL,
    business_type character varying(50) DEFAULT 'GENERAL_RETAIL'::character varying NOT NULL,
    logo_url text,
    email character varying(255),
    phone character varying(50),
    gstin character varying(20),
    currency character varying(10) DEFAULT 'INR'::character varying NOT NULL,
    timezone character varying(50) DEFAULT 'Asia/Kolkata'::character varying NOT NULL,
    status public."ShopStatus" DEFAULT 'ACTIVE'::public."ShopStatus" NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.shops OWNER TO postgres;

--
-- Name: stock_balances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stock_balances (
    id uuid NOT NULL,
    shop_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    product_id uuid NOT NULL,
    variant_id uuid,
    batch_number character varying(100),
    expiry_date date,
    quantity numeric(12,3) DEFAULT 0 NOT NULL,
    available_quantity numeric(12,3) DEFAULT 0 NOT NULL,
    reserved_quantity numeric(12,3) DEFAULT 0 NOT NULL,
    cost_price numeric(12,2) DEFAULT 0 NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);

ALTER TABLE ONLY public.stock_balances FORCE ROW LEVEL SECURITY;


ALTER TABLE public.stock_balances OWNER TO postgres;

--
-- Name: stock_movements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stock_movements (
    id uuid NOT NULL,
    shop_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    product_id uuid NOT NULL,
    variant_id uuid,
    batch_number character varying(100),
    movement_type public."StockMovementType" NOT NULL,
    quantity numeric(12,3) NOT NULL,
    previous_stock numeric(12,3) NOT NULL,
    new_stock numeric(12,3) NOT NULL,
    unit_cost numeric(12,2) NOT NULL,
    reference_id character varying(100),
    reference_type character varying(50),
    notes text,
    created_by uuid,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.stock_movements FORCE ROW LEVEL SECURITY;


ALTER TABLE public.stock_movements OWNER TO postgres;

--
-- Name: stock_transfers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stock_transfers (
    id uuid NOT NULL,
    shop_id uuid NOT NULL,
    transfer_number character varying(100) NOT NULL,
    source_branch_id uuid NOT NULL,
    destination_branch_id uuid NOT NULL,
    status public."TransferStatus" DEFAULT 'PENDING'::public."TransferStatus" NOT NULL,
    items jsonb NOT NULL,
    notes text,
    sent_by uuid,
    received_by uuid,
    sent_at timestamp(6) with time zone,
    received_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);

ALTER TABLE ONLY public.stock_transfers FORCE ROW LEVEL SECURITY;


ALTER TABLE public.stock_transfers OWNER TO postgres;

--
-- Name: subscription_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscription_payments (
    id uuid NOT NULL,
    subscription_id uuid NOT NULL,
    shop_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_method character varying(50) DEFAULT 'UPI'::character varying NOT NULL,
    transaction_reference character varying(100),
    status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    verified_by uuid,
    verified_at timestamp(6) with time zone,
    notes text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);

ALTER TABLE ONLY public.subscription_payments FORCE ROW LEVEL SECURITY;


ALTER TABLE public.subscription_payments OWNER TO postgres;

--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscriptions (
    id uuid NOT NULL,
    shop_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    billing_cycle public."BillingCycle" DEFAULT 'MONTHLY'::public."BillingCycle" NOT NULL,
    status public."SubscriptionStatus" DEFAULT 'TRIAL'::public."SubscriptionStatus" NOT NULL,
    start_date timestamp(6) with time zone NOT NULL,
    end_date timestamp(6) with time zone NOT NULL,
    grace_period_end timestamp(6) with time zone,
    auto_renew boolean DEFAULT true NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);

ALTER TABLE ONLY public.subscriptions FORCE ROW LEVEL SECURITY;


ALTER TABLE public.subscriptions OWNER TO postgres;

--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.suppliers (
    id uuid NOT NULL,
    shop_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    company_name character varying(255),
    email character varying(255),
    phone character varying(50),
    gstin character varying(20),
    address text,
    city character varying(100),
    state character varying(100),
    current_balance numeric(12,2) DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);

ALTER TABLE ONLY public.suppliers FORCE ROW LEVEL SECURITY;


ALTER TABLE public.suppliers OWNER TO postgres;

--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.support_tickets (
    id uuid NOT NULL,
    shop_id uuid NOT NULL,
    user_id uuid NOT NULL,
    ticket_number character varying(50) NOT NULL,
    subject character varying(255) NOT NULL,
    description text NOT NULL,
    priority public."TicketPriority" DEFAULT 'MEDIUM'::public."TicketPriority" NOT NULL,
    status public."TicketStatus" DEFAULT 'OPEN'::public."TicketStatus" NOT NULL,
    responses jsonb DEFAULT '[]'::jsonb,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);

ALTER TABLE ONLY public.support_tickets FORCE ROW LEVEL SECURITY;


ALTER TABLE public.support_tickets OWNER TO postgres;

--
-- Name: tax_rates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tax_rates (
    id uuid NOT NULL,
    shop_id uuid,
    name character varying(100) NOT NULL,
    rate numeric(5,2) NOT NULL,
    cgst numeric(5,2) DEFAULT 0 NOT NULL,
    sgst numeric(5,2) DEFAULT 0 NOT NULL,
    igst numeric(5,2) DEFAULT 0 NOT NULL,
    cess numeric(5,2) DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.tax_rates FORCE ROW LEVEL SECURITY;


ALTER TABLE public.tax_rates OWNER TO postgres;

--
-- Name: units; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.units (
    id uuid NOT NULL,
    shop_id uuid,
    name character varying(50) NOT NULL,
    code character varying(20) NOT NULL,
    "precision" integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);

ALTER TABLE ONLY public.units FORCE ROW LEVEL SECURITY;


ALTER TABLE public.units OWNER TO postgres;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    shop_id uuid,
    branch_id uuid,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.user_roles FORCE ROW LEVEL SECURITY;


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    phone character varying(50),
    is_super_admin boolean DEFAULT false NOT NULL,
    status public."UserStatus" DEFAULT 'ACTIVE'::public."UserStatus" NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, shop_id, user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, created_at) FROM stdin;
651ecf48-9aef-43bd-a5b1-d59eff772ee1	59dad0f9-a002-4050-9a83-367bcbaba360	c23544b5-23c3-486c-9920-c9966ed25f1f	INVOICE_CANCELLED	INVOICE	cb61636f-b828-437e-b947-a00c483da8b2	\N	{"reason": "Voided by manager"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	2026-11-18 09:37:19.106+05:30
a0cca8a7-4aa5-4754-bc41-820b0f4f74e1	59dad0f9-a002-4050-9a83-367bcbaba360	c23544b5-23c3-486c-9920-c9966ed25f1f	PRODUCT_CREATED	PRODUCT	3c67e934-0eb4-4dba-9fc0-e7747cfe1396	\N	{"sku": "TEST-BASMATI-5KG-AUTO", "name": "Test Organic Basmati Rice 5kg"}	::1	curl/8.7.1	2026-11-18 09:38:47.299+05:30
\.


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.branches (id, shop_id, name, code, phone, email, address_line1, address_line2, city, state, postal_code, is_main, status, created_at, updated_at) FROM stdin;
133a7f05-5337-4b61-bb09-50b33078d12f	59dad0f9-a002-4050-9a83-367bcbaba360	Main Branch - MG Road	MAIN	+91 9876543210	\N	\N	\N	Vijayawada	Andhra Pradesh	520002	t	ACTIVE	2026-11-18 07:29:27.017+05:30	2026-11-18 07:29:27.017+05:30
\.


--
-- Data for Name: brands; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.brands (id, shop_id, name, description, is_active, created_at, updated_at) FROM stdin;
67a16861-e26e-455c-84c3-dac37490bea1	59dad0f9-a002-4050-9a83-367bcbaba360	Tata	Tata Consumer Products	t	2026-11-18 07:29:27.144+05:30	2026-11-18 07:29:27.144+05:30
\.


--
-- Data for Name: cash_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cash_sessions (id, shop_id, branch_id, counter_id, opened_by, closed_by, opened_at, closed_at, opening_cash, expected_cash, actual_cash, difference, status, notes) FROM stdin;
25ae4658-72e3-402a-8d01-f2fcb2dcdfc3	59dad0f9-a002-4050-9a83-367bcbaba360	133a7f05-5337-4b61-bb09-50b33078d12f	517ec1d0-5afd-4432-a87e-3cdd7cfbafc2	0946ed64-6d5b-4f29-96b5-5e036e587e0d	\N	2026-11-18 08:08:19.691+05:30	\N	2000.00	\N	\N	\N	OPEN	Morning shift drawer opening float
\.


--
-- Data for Name: cash_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cash_transactions (id, shop_id, cash_session_id, transaction_type, amount, reason, created_by, created_at) FROM stdin;
1a44299b-b09e-4889-b512-07458e1f55b9	59dad0f9-a002-4050-9a83-367bcbaba360	25ae4658-72e3-402a-8d01-f2fcb2dcdfc3	CASH_SALE	1550.00	POS Sale #SLM-1001	0946ed64-6d5b-4f29-96b5-5e036e587e0d	2026-11-18 08:08:19.727+05:30
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, shop_id, parent_id, name, slug, description, is_active, created_at, updated_at) FROM stdin;
595f065d-34f7-4f9b-9145-497cfd12c0fb	59dad0f9-a002-4050-9a83-367bcbaba360	\N	Staples & Grains	staples-grains	Rice, wheat, pulses	t	2026-11-18 07:29:27.137+05:30	2026-11-18 07:29:27.137+05:30
e038ea60-56ff-4994-8524-0538b7bf6dfb	59dad0f9-a002-4050-9a83-367bcbaba360	\N	Snacks & Beverages	snacks-beverages	Biscuits, tea, coffee	t	2026-11-18 07:29:27.142+05:30	2026-11-18 07:29:27.142+05:30
\.


--
-- Data for Name: counters; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.counters (id, shop_id, branch_id, name, code, device_id, is_active, created_at, updated_at) FROM stdin;
517ec1d0-5afd-4432-a87e-3cdd7cfbafc2	59dad0f9-a002-4050-9a83-367bcbaba360	133a7f05-5337-4b61-bb09-50b33078d12f	Counter 1 (Express)	CTR-01	\N	t	2026-11-18 07:29:27.02+05:30	2026-11-18 07:29:27.02+05:30
\.


--
-- Data for Name: credit_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.credit_notes (id, shop_id, customer_id, sales_return_id, credit_note_number, amount, used_amount, balance_amount, issue_date, expiry_date, status, created_at) FROM stdin;
\.


--
-- Data for Name: customer_addresses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_addresses (id, shop_id, customer_id, type, address_line1, address_line2, city, state, postal_code, is_default, created_at) FROM stdin;
\.


--
-- Data for Name: customer_ledger; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_ledger (id, shop_id, customer_id, transaction_type, reference_id, debit, credit, running_balance, notes, created_at) FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, shop_id, name, phone, email, gstin, credit_limit, current_balance, loyalty_points, is_active, created_at, updated_at) FROM stdin;
73a5c7b4-13c0-437c-a406-1ca816940a18	59dad0f9-a002-4050-9a83-367bcbaba360	Venkatesh Naidu	9848012345	venkatesh@example.com	\N	5000.00	0.00	50	t	2026-11-18 07:29:27.175+05:30	2026-11-18 07:29:27.175+05:30
\.


--
-- Data for Name: expense_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expense_categories (id, shop_id, name, description, created_at) FROM stdin;
fab8d06c-b1a8-4f32-839b-2c9702ef139f	59dad0f9-a002-4050-9a83-367bcbaba360	Utilities & Power	Electricity, water, and power backup	2026-11-18 08:08:19.7+05:30
1db7805e-a57a-46f8-9f4d-65bd04e7e87d	59dad0f9-a002-4050-9a83-367bcbaba360	Store Rent & Maintenance	Monthly shop premises lease	2026-11-18 08:08:19.704+05:30
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expenses (id, shop_id, branch_id, category_id, amount, payment_method, reference_number, expense_date, notes, receipt_url, created_by, created_at) FROM stdin;
9424ad72-c463-40bf-b3c5-40a07435ecff	59dad0f9-a002-4050-9a83-367bcbaba360	133a7f05-5337-4b61-bb09-50b33078d12f	fab8d06c-b1a8-4f32-839b-2c9702ef139f	3450.00	UPI	UPI-EB-889922	2026-11-18	Monthly APCPDCL electricity bill	\N	c23544b5-23c3-486c-9920-c9966ed25f1f	2026-11-18 08:08:19.705+05:30
\.


--
-- Data for Name: goods_receipts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.goods_receipts (id, shop_id, purchase_order_id, grn_number, received_date, supplier_invoice_number, received_items, notes, received_by, created_at) FROM stdin;
\.


--
-- Data for Name: idempotency_keys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.idempotency_keys (id, shop_id, key, request_path, request_payload_hash, response_status, response_body, status, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoice_items (id, shop_id, invoice_id, product_id, variant_id, product_name, sku, hsn_code, unit_code, batch_number, serial_numbers, quantity, unit_price, discount_percent, discount_amount, tax_rate, tax_amount, cgst_rate, cgst_amount, sgst_rate, sgst_amount, igst_rate, igst_amount, total_price, created_at) FROM stdin;
1b3c6c51-e545-429b-a864-a042c6f6781d	59dad0f9-a002-4050-9a83-367bcbaba360	3bdd4704-1ce3-455e-a7df-47a58be4ffe2	938516f4-8678-46fe-b089-eb3f4695b040	\N	Sona Masoori Raw Rice (25kg Bag)	RICE-SONA-25	\N	KG	\N	\N	1.000	1550.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	1550.00	2026-11-18 08:08:19.713+05:30
d2872511-8639-417a-90ea-1469d0484241	59dad0f9-a002-4050-9a83-367bcbaba360	cb61636f-b828-437e-b947-a00c483da8b2	3563c4e3-54a4-460e-b963-35a4a7794752	\N	Tata Tea Gold (500g)	TEA-TATA-GOLD-500	\N	PCS	\N	\N	1.000	314.29	0.00	0.00	5.00	15.71	2.50	7.86	2.50	7.86	0.00	0.00	330.00	2026-11-18 08:08:19.73+05:30
\.


--
-- Data for Name: invoice_taxes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoice_taxes (id, shop_id, invoice_id, tax_rate_id, tax_name, rate, taxable_amount, tax_amount, created_at) FROM stdin;
e705b025-7055-4540-ad64-0268d49a34b3	59dad0f9-a002-4050-9a83-367bcbaba360	cb61636f-b828-437e-b947-a00c483da8b2	\N	GST 5%	5.00	314.29	15.71	2026-11-18 08:08:19.73+05:30
\.


--
-- Data for Name: invoice_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoice_templates (id, shop_id, name, type, template_json, is_default, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoices (id, shop_id, branch_id, counter_id, customer_id, cash_session_id, invoice_number, invoice_date, subtotal, item_discount_amount, invoice_discount_amount, tax_amount, round_off, total_amount, paid_amount, due_amount, status, payment_status, idempotency_key, notes, language, created_by, created_at, updated_at) FROM stdin;
3bdd4704-1ce3-455e-a7df-47a58be4ffe2	59dad0f9-a002-4050-9a83-367bcbaba360	133a7f05-5337-4b61-bb09-50b33078d12f	517ec1d0-5afd-4432-a87e-3cdd7cfbafc2	73a5c7b4-13c0-437c-a406-1ca816940a18	25ae4658-72e3-402a-8d01-f2fcb2dcdfc3	SLM-1001	2026-11-18 08:08:19.713+05:30	1550.00	0.00	0.00	0.00	0.00	1550.00	1550.00	0.00	PAID	COMPLETED	\N	\N	en	0946ed64-6d5b-4f29-96b5-5e036e587e0d	2026-11-18 08:08:19.713+05:30	2026-11-18 08:08:19.713+05:30
cb61636f-b828-437e-b947-a00c483da8b2	59dad0f9-a002-4050-9a83-367bcbaba360	133a7f05-5337-4b61-bb09-50b33078d12f	517ec1d0-5afd-4432-a87e-3cdd7cfbafc2	\N	25ae4658-72e3-402a-8d01-f2fcb2dcdfc3	SLM-1002	2026-11-18 08:08:19.73+05:30	314.29	0.00	0.00	15.71	0.00	330.00	330.00	0.00	CANCELLED	COMPLETED	\N	Cancelled: Voided by manager	te	0946ed64-6d5b-4f29-96b5-5e036e587e0d	2026-11-18 08:08:19.73+05:30	2026-11-18 09:37:19.076+05:30
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, shop_id, user_id, title, message, type, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: payment_allocations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_allocations (id, shop_id, payment_id, invoice_id, allocated_amount, created_at) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, shop_id, branch_id, invoice_id, customer_id, cash_session_id, payment_number, amount, payment_method, reference_number, status, payment_date, notes, created_by, created_at) FROM stdin;
8966f57c-ea64-476b-b903-8b062eeb89ff	59dad0f9-a002-4050-9a83-367bcbaba360	133a7f05-5337-4b61-bb09-50b33078d12f	3bdd4704-1ce3-455e-a7df-47a58be4ffe2	73a5c7b4-13c0-437c-a406-1ca816940a18	25ae4658-72e3-402a-8d01-f2fcb2dcdfc3	PAY-SLM-1001-1	1550.00	CASH	\N	SUCCESS	2026-11-18 08:08:19.713+05:30	\N	0946ed64-6d5b-4f29-96b5-5e036e587e0d	2026-11-18 08:08:19.713+05:30
4210a938-fd60-4fae-b5cc-a06d26f6aa5e	59dad0f9-a002-4050-9a83-367bcbaba360	133a7f05-5337-4b61-bb09-50b33078d12f	cb61636f-b828-437e-b947-a00c483da8b2	\N	\N	PAY-SLM-1002-1	330.00	UPI	UPI-AXIS-99221100	SUCCESS	2026-11-18 08:08:19.73+05:30	\N	0946ed64-6d5b-4f29-96b5-5e036e587e0d	2026-11-18 08:08:19.73+05:30
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permissions (id, name, module, description, created_at) FROM stdin;
63dfa9ba-02d8-4c95-bfdf-fe2fbd658ea4	invoices:void	invoices	Cancel or void invoices	2026-11-18 07:27:02.449+05:30
2b19d76d-3915-4b09-8e0a-a2392ebdc3b9	returns:manage	returns	Process sales returns and credit notes	2026-11-18 07:27:02.449+05:30
e2d09549-f0a5-4ac4-9946-c84afc43845c	cash_session:manage	cash	Open, close, and manage cash drawers	2026-11-18 07:27:02.45+05:30
059281e3-734b-4119-9f99-bec535668a75	customers:manage	customers	Manage customers and credit ledgers	2026-11-18 07:27:02.45+05:30
9dddd418-4a08-40e7-bdca-b46786392bdb	expenses:manage	expenses	Record and categorize store expenses	2026-11-18 07:27:02.451+05:30
a4a263f9-d301-44a5-8dda-dd8fa66a8616	reports:view	reports	View sales, tax, profit, and inventory reports	2026-11-18 07:27:02.452+05:30
c16f8c72-1a3d-4135-80b0-7699a8d6238d	audit:read	audit	Inspect audit logs	2026-11-18 07:27:02.452+05:30
57c04d12-db3d-4597-872c-76d92796972d	platform:admin	admin	Full platform administrative control	2026-11-18 07:27:02.424+05:30
362ca9f6-fdcd-4a64-a790-b2ac2599e4a7	shops:read	shops	View shop accounts	2026-11-18 07:27:02.435+05:30
0d1df6a7-b938-4a5d-9fbe-d4b76eb0182a	shops:manage	shops	Activate, suspend and manage shops	2026-11-18 07:27:02.436+05:30
030cb850-37e2-40f3-be3b-05307ada1cc4	subscriptions:manage	subscriptions	Manage pricing plans and verify payments	2026-11-18 07:27:02.437+05:30
a4df207e-1add-43b5-93e5-a1a269036548	shop:profile:update	shop	Update shop profile and settings	2026-11-18 07:27:02.438+05:30
9066867a-b9d8-4db2-a15e-8c09298db654	branches:manage	branches	Create and manage branches	2026-11-18 07:27:02.439+05:30
c4c18984-56f3-4591-a921-05e71a932dab	counters:manage	counters	Create and manage billing counters	2026-11-18 07:27:02.439+05:30
d85d2025-3453-4c18-8169-12e3bad5f524	users:manage	users	Manage shop employees and permissions	2026-11-18 07:27:02.44+05:30
de606e66-21f4-4f74-aa32-e00d5aaa91c9	products:read	products	View products and categories	2026-11-18 07:27:02.442+05:30
b8e126e7-603a-4a37-bdc5-09dc7a2302eb	products:manage	products	Create and edit products, variants, barcodes	2026-11-18 07:27:02.443+05:30
196e3252-4fe5-49df-8f17-2d0b8c411026	inventory:read	inventory	View stock balances and movements	2026-11-18 07:27:02.444+05:30
a295a3e3-9bb9-472c-94c0-0cf925b135ed	inventory:adjust	inventory	Perform manual stock adjustments	2026-11-18 07:27:02.445+05:30
6413e394-c682-43d1-bc4a-df14d17f96ed	inventory:transfer	inventory	Transfer stock between branches	2026-11-18 07:27:02.445+05:30
d3d088f2-e7a6-4f16-933c-e0f574518ec9	suppliers:manage	suppliers	Manage suppliers and balances	2026-11-18 07:27:02.446+05:30
9a5ff3f5-9436-4500-8840-881b0002ba61	purchases:manage	purchases	Create purchase orders and goods receipts	2026-11-18 07:27:02.447+05:30
30666a78-1dbf-46d2-a5c2-007077e19130	pos:billing	pos	Access POS terminal and create invoices	2026-11-18 07:27:02.447+05:30
f326a913-8dfd-45c9-97bb-43a909faa483	invoices:read	invoices	View invoices and receipts	2026-11-18 07:27:02.448+05:30
\.


--
-- Data for Name: plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.plans (id, name, slug, description, monthly_price, annual_price, max_branches, max_counters, max_users, max_products, max_invoices_per_month, features, is_active, created_at, updated_at) FROM stdin;
405c5c76-0880-4704-a073-0878e5556a23	Starter Plan	starter	Perfect for small single-counter retail shops and groceries	999.00	9990.00	1	1	3	1000	1000	["1 Branch", "1 Counter", "3 Staff Users", "1,000 Products", "Thermal & A4 Invoices", "GST Reports"]	t	2026-11-18 07:29:26.923+05:30	2026-11-18 08:08:19.512+05:30
c854f27f-1074-4ad2-8370-f074a0e8a705	Business Plan	business	Ideal for growing supermarkets, apparel chains, and multi-counter retail	2499.00	24990.00	3	5	10	15000	10000	["3 Branches", "5 Counters", "10 Staff Users", "15,000 Products", "Inter-Branch Transfers", "Barcode & Batch Tracking", "Bilingual Telugu Invoices"]	t	2026-11-18 07:29:26.927+05:30	2026-11-18 08:08:19.514+05:30
44f96fde-4f57-40d2-83c5-ba2e04e5d029	Enterprise Plan	enterprise	Designed for large supermarkets, department stores, and wholesale operations	4999.00	49990.00	10	25	50	100000	100000	["Unlimited Scale", "10+ Branches", "25+ Counters", "50 Staff Users", "Full API Access", "Custom GST & Telugu Invoices", "Dedicated Support"]	t	2026-11-18 07:29:26.928+05:30	2026-11-18 08:08:19.515+05:30
\.


--
-- Data for Name: product_barcodes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_barcodes (id, shop_id, product_id, variant_id, barcode, barcode_type, is_primary, created_at) FROM stdin;
d01caaf6-27b4-480f-8a94-3131d52a8564	59dad0f9-a002-4050-9a83-367bcbaba360	938516f4-8678-46fe-b089-eb3f4695b040	\N	8901234567890	EAN13	t	2026-11-18 07:29:27.157+05:30
97f75ebc-942a-4eec-98e7-0b1e9e0e607b	59dad0f9-a002-4050-9a83-367bcbaba360	3563c4e3-54a4-460e-b963-35a4a7794752	\N	8901234567891	EAN13	t	2026-11-18 07:29:27.172+05:30
d7efe560-e252-4733-a92f-362cf6bfc34b	59dad0f9-a002-4050-9a83-367bcbaba360	3c67e934-0eb4-4dba-9fc0-e7747cfe1396	\N	8903851877086	EAN13	t	2026-11-18 09:38:47.296+05:30
\.


--
-- Data for Name: product_variants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_variants (id, shop_id, product_id, name, sku, barcode, attributes, purchase_price, selling_price, mrp, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, shop_id, category_id, brand_id, unit_id, name, sku, barcode, hsn_code, description, is_variant_product, tax_rate, purchase_price, selling_price, mrp, min_stock_level, is_batch_tracked, is_expiry_tracked, is_serial_tracked, is_weight_based, metadata, is_active, created_at, updated_at) FROM stdin;
938516f4-8678-46fe-b089-eb3f4695b040	59dad0f9-a002-4050-9a83-367bcbaba360	595f065d-34f7-4f9b-9145-497cfd12c0fb	67a16861-e26e-455c-84c3-dac37490bea1	2092b9d2-b151-43d2-89df-571412a0fec7	Sona Masoori Raw Rice (25kg Bag)	RICE-SONA-25	8901234567890	10063010	\N	f	0.00	1350.00	1550.00	1650.00	5.000	f	f	f	t	\N	t	2026-11-18 07:29:27.15+05:30	2026-11-18 07:29:27.15+05:30
3563c4e3-54a4-460e-b963-35a4a7794752	59dad0f9-a002-4050-9a83-367bcbaba360	e038ea60-56ff-4994-8524-0538b7bf6dfb	67a16861-e26e-455c-84c3-dac37490bea1	ce5a68ab-7321-4f13-843c-9492ef935764	Tata Tea Gold (500g)	TEA-TATA-GOLD-500	8901234567891	09024020	\N	f	5.00	280.00	330.00	350.00	10.000	f	f	f	f	\N	t	2026-11-18 07:29:27.169+05:30	2026-11-18 07:29:27.169+05:30
3c67e934-0eb4-4dba-9fc0-e7747cfe1396	59dad0f9-a002-4050-9a83-367bcbaba360	\N	\N	b87deb88-1ae7-4b53-9aca-8c4cce805245	Test Organic Basmati Rice 5kg	TEST-BASMATI-5KG-AUTO	8903851877086	\N	\N	f	5.00	280.00	350.00	\N	0.000	f	f	f	f	{}	t	2026-11-18 09:38:47.291+05:30	2026-11-18 09:38:47.291+05:30
\.


--
-- Data for Name: purchase_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.purchase_items (id, shop_id, purchase_order_id, product_id, variant_id, quantity, received_quantity, unit_cost, tax_rate, tax_amount, total, batch_number, expiry_date, created_at) FROM stdin;
\.


--
-- Data for Name: purchase_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.purchase_orders (id, shop_id, branch_id, supplier_id, po_number, order_date, expected_date, subtotal, tax_amount, total_amount, paid_amount, status, notes, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refresh_tokens (id, user_id, token_hash, device_info, ip_address, expires_at, revoked_at, created_at) FROM stdin;
6453f78a-b827-46cd-8658-9186e9c0129d	c23544b5-23c3-486c-9920-c9966ed25f1f	bf920eaafa47687d9f5a7c6847367b4026019dcbbc0dab879b2ac558d658af20	\N	::1	2026-11-25 07:41:03.584+05:30	\N	2026-11-18 07:41:03.585+05:30
3f5eeb73-d772-4891-aeb7-27cead3c595d	95bcda4b-cf23-45d1-8066-0237f42d9f95	a91efbd15213f5f64d04bd4ed95cd1b84bd21a97ad1df5c6a2d5be0c1501db60	\N	::1	2026-11-25 07:50:51.298+05:30	\N	2026-11-18 07:50:51.301+05:30
69994e42-c990-4a10-a4bd-13d80e174fb3	c23544b5-23c3-486c-9920-c9966ed25f1f	8aa22a79ec2548aa1363ddcbed428950065f17156b780cb1740cab3b7599f3f8	\N	::1	2026-11-25 08:52:34.295+05:30	\N	2026-11-18 08:52:34.296+05:30
6fe8f470-10ab-40ca-9d7a-0b0d81bdce18	0946ed64-6d5b-4f29-96b5-5e036e587e0d	ab086a5343123760791b1fd137eb9d8362ba2ace04051a29d964f05788ca4b86	\N	::1	2026-11-25 08:52:43.1+05:30	\N	2026-11-18 08:52:43.101+05:30
3223a019-d38a-41f1-b778-5445a363f840	95bcda4b-cf23-45d1-8066-0237f42d9f95	07aec94d39580326bbec0c1f8d60dd94123311238ec4482bc86490a7ccdc4926	\N	::1	2026-11-25 08:52:49.72+05:30	\N	2026-11-18 08:52:49.721+05:30
bb1896c5-092c-487d-b03e-01bf7d010d6c	c23544b5-23c3-486c-9920-c9966ed25f1f	7bacb01c2bef303be2ee3fd3ef8b4cb60c63c63e1f639ca2abbd3e0a7e2a5eab	\N	::1	2026-11-25 08:53:38.534+05:30	\N	2026-11-18 08:53:38.535+05:30
7107ea45-854a-48b3-a81d-d94c0951c0a4	95bcda4b-cf23-45d1-8066-0237f42d9f95	946698c298d055c157842dbf0bcdc8c44c5b05054e459d7b705ba49301ba131d	\N	::1	2026-11-25 08:54:30.776+05:30	\N	2026-11-18 08:54:30.776+05:30
ee6617fc-274a-4c37-8d7c-a985b72cf758	95bcda4b-cf23-45d1-8066-0237f42d9f95	7c40790a20b4560245f658578ad58d46a9821c896088573f139cddf8f6a0898b	\N	::1	2026-11-25 08:55:32.312+05:30	\N	2026-11-18 08:55:32.312+05:30
e131364c-beed-4e5f-b22f-392afdf37ce6	c23544b5-23c3-486c-9920-c9966ed25f1f	b2524d8bcd3ac4fb6df7bbbcbe8757d85e021c81be569d7655aa07d4b54deb65	\N	::1	2026-11-25 08:56:10.87+05:30	\N	2026-11-18 08:56:10.871+05:30
b67d9619-1362-46ba-ba9a-5723816b23c1	95bcda4b-cf23-45d1-8066-0237f42d9f95	cf065c9f358420d3388adde40fa9d5536f1dda6b54eb3cf2cdf7517d36d40abb	\N	::1	2026-11-25 08:58:35.25+05:30	2026-11-18 09:01:34.708+05:30	2026-11-18 08:58:35.251+05:30
a6083ab4-7f40-4949-bd15-aff6ae7570ca	c23544b5-23c3-486c-9920-c9966ed25f1f	7e12f09c1de72f60b570e496c78e83e49a1e5588b65b2c226c1ee10c2f537e58	\N	::1	2026-11-25 09:01:41.037+05:30	\N	2026-11-18 09:01:41.038+05:30
630dcbf9-61f9-4918-8b09-7683328050a5	c23544b5-23c3-486c-9920-c9966ed25f1f	3b9f9d5f740c01ca6f2f5e3c3da340fa85cc31ad9bff99a08ebec7ca39970413	\N	::1	2026-11-25 09:24:59.684+05:30	\N	2026-11-18 09:24:59.685+05:30
fd615686-9e66-442c-a189-50e70a75800f	c23544b5-23c3-486c-9920-c9966ed25f1f	3ec9267d8831015cc1bc6579b8ce24fb6682891e9cabad7a9e42d9132534b9c1	\N	::1	2026-11-25 09:38:26.862+05:30	\N	2026-11-18 09:38:26.863+05:30
96e68fd9-d4ef-4941-bfc4-9eea678bc6cd	c23544b5-23c3-486c-9920-c9966ed25f1f	f7609d036388d9e0f6a334d7e1f61bbd198364c9544dd785fa98fbd0cccb9834	\N	::1	2026-11-25 09:38:47.229+05:30	\N	2026-11-18 09:38:47.23+05:30
b41d8126-fbb0-4c48-a088-ad82ee715aaa	c23544b5-23c3-486c-9920-c9966ed25f1f	15de5ed176f0873a2c0140b50e2a93d304ccbe43b2f23caa6c365deafa3a1dc2	\N	::1	2026-11-25 09:39:43.725+05:30	\N	2026-11-18 09:39:43.726+05:30
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permissions (id, role_id, permission_id, created_at) FROM stdin;
f27dbe4e-4164-4c6e-bbfd-100d25d47ced	92dbb20d-6e4f-4340-a3d4-809fba1d8394	57c04d12-db3d-4597-872c-76d92796972d	2026-11-18 07:29:26.749+05:30
9566a0e0-3569-41ce-8afe-ccf29a5eec41	92dbb20d-6e4f-4340-a3d4-809fba1d8394	362ca9f6-fdcd-4a64-a790-b2ac2599e4a7	2026-11-18 07:29:26.757+05:30
3182da6b-9205-4a95-8999-24705f957815	92dbb20d-6e4f-4340-a3d4-809fba1d8394	0d1df6a7-b938-4a5d-9fbe-d4b76eb0182a	2026-11-18 07:29:26.759+05:30
8d5c95c2-282b-47b4-acd4-9e47080baddf	92dbb20d-6e4f-4340-a3d4-809fba1d8394	030cb850-37e2-40f3-be3b-05307ada1cc4	2026-11-18 07:29:26.761+05:30
86c1b478-8238-43a8-aacb-1cfdb9108d8a	92dbb20d-6e4f-4340-a3d4-809fba1d8394	a4df207e-1add-43b5-93e5-a1a269036548	2026-11-18 07:29:26.763+05:30
f3cbca72-f0fe-417b-8872-3239323e628d	92dbb20d-6e4f-4340-a3d4-809fba1d8394	9066867a-b9d8-4db2-a15e-8c09298db654	2026-11-18 07:29:26.765+05:30
a5fe87a1-ab79-47f9-9ada-41879c8e0971	92dbb20d-6e4f-4340-a3d4-809fba1d8394	c4c18984-56f3-4591-a921-05e71a932dab	2026-11-18 07:29:26.767+05:30
311087a0-8223-42ec-817e-ff366ba44334	92dbb20d-6e4f-4340-a3d4-809fba1d8394	d85d2025-3453-4c18-8169-12e3bad5f524	2026-11-18 07:29:26.769+05:30
ad4ebc9f-9ddd-4499-b9f8-00cd42d19bc7	92dbb20d-6e4f-4340-a3d4-809fba1d8394	de606e66-21f4-4f74-aa32-e00d5aaa91c9	2026-11-18 07:29:26.77+05:30
385e4b80-105e-4369-a72d-dd30855b994f	92dbb20d-6e4f-4340-a3d4-809fba1d8394	b8e126e7-603a-4a37-bdc5-09dc7a2302eb	2026-11-18 07:29:26.772+05:30
0f8d84a4-3e7a-4f8e-b1f6-ef8ef26a3845	92dbb20d-6e4f-4340-a3d4-809fba1d8394	196e3252-4fe5-49df-8f17-2d0b8c411026	2026-11-18 07:29:26.774+05:30
bb8a63de-7068-4b53-a95b-5dbce6556f8b	92dbb20d-6e4f-4340-a3d4-809fba1d8394	a295a3e3-9bb9-472c-94c0-0cf925b135ed	2026-11-18 07:29:26.776+05:30
144a35c9-56ab-4b32-abde-c3fb4b5297ec	92dbb20d-6e4f-4340-a3d4-809fba1d8394	6413e394-c682-43d1-bc4a-df14d17f96ed	2026-11-18 07:29:26.778+05:30
770f268b-57dd-4cbb-a420-1fd2cca50822	92dbb20d-6e4f-4340-a3d4-809fba1d8394	d3d088f2-e7a6-4f16-933c-e0f574518ec9	2026-11-18 07:29:26.78+05:30
2816c86d-f1c6-4833-ade7-f2ad1bf61627	92dbb20d-6e4f-4340-a3d4-809fba1d8394	9a5ff3f5-9436-4500-8840-881b0002ba61	2026-11-18 07:29:26.782+05:30
92bf1b00-8209-4d55-aaa8-8dd17aea17a4	92dbb20d-6e4f-4340-a3d4-809fba1d8394	30666a78-1dbf-46d2-a5c2-007077e19130	2026-11-18 07:29:26.784+05:30
cdbe0e36-42e7-47bb-a216-9d49536bac62	92dbb20d-6e4f-4340-a3d4-809fba1d8394	f326a913-8dfd-45c9-97bb-43a909faa483	2026-11-18 07:29:26.786+05:30
6e69cff5-e860-44f6-9c95-611ae6cb6a73	92dbb20d-6e4f-4340-a3d4-809fba1d8394	63dfa9ba-02d8-4c95-bfdf-fe2fbd658ea4	2026-11-18 07:29:26.788+05:30
17ad5eba-0c40-4d4a-9e84-ea09ba7265d1	92dbb20d-6e4f-4340-a3d4-809fba1d8394	2b19d76d-3915-4b09-8e0a-a2392ebdc3b9	2026-11-18 07:29:26.79+05:30
33662ab2-f530-478d-97ca-8cf71b67cfd8	92dbb20d-6e4f-4340-a3d4-809fba1d8394	e2d09549-f0a5-4ac4-9946-c84afc43845c	2026-11-18 07:29:26.792+05:30
141bfe63-ddf5-4d97-920c-6c2c8a64b9f3	92dbb20d-6e4f-4340-a3d4-809fba1d8394	059281e3-734b-4119-9f99-bec535668a75	2026-11-18 07:29:26.794+05:30
606c2081-221f-4e2f-b0c2-96b7abac21ff	92dbb20d-6e4f-4340-a3d4-809fba1d8394	9dddd418-4a08-40e7-bdca-b46786392bdb	2026-11-18 07:29:26.795+05:30
8430a174-4674-463f-ae27-4c69ea66749c	92dbb20d-6e4f-4340-a3d4-809fba1d8394	a4a263f9-d301-44a5-8dda-dd8fa66a8616	2026-11-18 07:29:26.797+05:30
5de8d018-167f-4d57-b4f1-87a6674b7a80	92dbb20d-6e4f-4340-a3d4-809fba1d8394	c16f8c72-1a3d-4135-80b0-7699a8d6238d	2026-11-18 07:29:26.799+05:30
8ef07831-a033-477a-a307-7159d3c7c866	61650f94-e4c4-4a39-b381-ff4e3b02233e	a4df207e-1add-43b5-93e5-a1a269036548	2026-11-18 07:29:26.803+05:30
82fd0e06-7ae4-456a-8ac4-7be261fdc5cc	61650f94-e4c4-4a39-b381-ff4e3b02233e	9066867a-b9d8-4db2-a15e-8c09298db654	2026-11-18 07:29:26.805+05:30
79e8051e-fec1-428d-a925-bd4fd312819c	61650f94-e4c4-4a39-b381-ff4e3b02233e	c4c18984-56f3-4591-a921-05e71a932dab	2026-11-18 07:29:26.807+05:30
544078e6-784b-4ede-8bb5-093bc4eab549	61650f94-e4c4-4a39-b381-ff4e3b02233e	d85d2025-3453-4c18-8169-12e3bad5f524	2026-11-18 07:29:26.809+05:30
be4e58c0-79c1-49e3-a0f0-59a11b97ed3a	61650f94-e4c4-4a39-b381-ff4e3b02233e	de606e66-21f4-4f74-aa32-e00d5aaa91c9	2026-11-18 07:29:26.81+05:30
ed70539e-7bfc-4ea6-9225-9a364bb17c2f	61650f94-e4c4-4a39-b381-ff4e3b02233e	b8e126e7-603a-4a37-bdc5-09dc7a2302eb	2026-11-18 07:29:26.812+05:30
8a77f378-2f8e-40d8-84b9-3d078ef31d7c	61650f94-e4c4-4a39-b381-ff4e3b02233e	196e3252-4fe5-49df-8f17-2d0b8c411026	2026-11-18 07:29:26.814+05:30
c112caff-fbb0-45da-87ce-8af4dadbe522	61650f94-e4c4-4a39-b381-ff4e3b02233e	a295a3e3-9bb9-472c-94c0-0cf925b135ed	2026-11-18 07:29:26.816+05:30
a52808cb-3e93-434c-8ae8-b5aa5b4b247d	61650f94-e4c4-4a39-b381-ff4e3b02233e	6413e394-c682-43d1-bc4a-df14d17f96ed	2026-11-18 07:29:26.818+05:30
51dd1093-b461-4c00-804d-944c5935b8a1	61650f94-e4c4-4a39-b381-ff4e3b02233e	d3d088f2-e7a6-4f16-933c-e0f574518ec9	2026-11-18 07:29:26.82+05:30
4a06a1f4-95bb-4344-bb05-cf61dbf32565	61650f94-e4c4-4a39-b381-ff4e3b02233e	9a5ff3f5-9436-4500-8840-881b0002ba61	2026-11-18 07:29:26.822+05:30
4978062a-0d4a-432f-be2b-e1ae1043a304	61650f94-e4c4-4a39-b381-ff4e3b02233e	30666a78-1dbf-46d2-a5c2-007077e19130	2026-11-18 07:29:26.824+05:30
313cd889-7757-49ae-8e32-790e14d5171c	61650f94-e4c4-4a39-b381-ff4e3b02233e	f326a913-8dfd-45c9-97bb-43a909faa483	2026-11-18 07:29:26.826+05:30
e377c138-ec91-4331-9ff6-2e42108102f9	61650f94-e4c4-4a39-b381-ff4e3b02233e	63dfa9ba-02d8-4c95-bfdf-fe2fbd658ea4	2026-11-18 07:29:26.827+05:30
40b84c46-31d6-40c6-85d6-2376d62c89a9	61650f94-e4c4-4a39-b381-ff4e3b02233e	2b19d76d-3915-4b09-8e0a-a2392ebdc3b9	2026-11-18 07:29:26.829+05:30
2d189731-69be-4ea2-8509-807f799f0cca	61650f94-e4c4-4a39-b381-ff4e3b02233e	e2d09549-f0a5-4ac4-9946-c84afc43845c	2026-11-18 07:29:26.831+05:30
32e8c144-5f02-4085-8eb8-63c5748c7541	61650f94-e4c4-4a39-b381-ff4e3b02233e	059281e3-734b-4119-9f99-bec535668a75	2026-11-18 07:29:26.832+05:30
6461d4e8-3977-4718-b535-0b7faa86c96c	61650f94-e4c4-4a39-b381-ff4e3b02233e	9dddd418-4a08-40e7-bdca-b46786392bdb	2026-11-18 07:29:26.834+05:30
3ce89a9b-ae84-442b-bf97-4bd7cac9bda6	61650f94-e4c4-4a39-b381-ff4e3b02233e	a4a263f9-d301-44a5-8dda-dd8fa66a8616	2026-11-18 07:29:26.836+05:30
2133a7d3-7ce3-4d9d-8781-778a63460328	61650f94-e4c4-4a39-b381-ff4e3b02233e	c16f8c72-1a3d-4135-80b0-7699a8d6238d	2026-11-18 07:29:26.838+05:30
8f974afb-7855-467c-b2c2-c75148b42eaa	00f229fe-9784-4f72-9b8f-c3b41b367dca	a4df207e-1add-43b5-93e5-a1a269036548	2026-11-18 07:29:26.84+05:30
ff4e078b-74ca-4e77-966c-ac343f5e63f7	00f229fe-9784-4f72-9b8f-c3b41b367dca	9066867a-b9d8-4db2-a15e-8c09298db654	2026-11-18 07:29:26.842+05:30
99e3fc3a-d7f7-4845-8d9a-48b6547a8fb4	00f229fe-9784-4f72-9b8f-c3b41b367dca	c4c18984-56f3-4591-a921-05e71a932dab	2026-11-18 07:29:26.843+05:30
102116f7-d850-461a-85c0-8c3abd14ac8b	00f229fe-9784-4f72-9b8f-c3b41b367dca	d85d2025-3453-4c18-8169-12e3bad5f524	2026-11-18 07:29:26.845+05:30
ac7f9c90-3619-4f6e-a051-d59346121e05	00f229fe-9784-4f72-9b8f-c3b41b367dca	de606e66-21f4-4f74-aa32-e00d5aaa91c9	2026-11-18 07:29:26.846+05:30
a012084e-4500-43bf-a470-0ffe51ec1c8f	00f229fe-9784-4f72-9b8f-c3b41b367dca	b8e126e7-603a-4a37-bdc5-09dc7a2302eb	2026-11-18 07:29:26.848+05:30
1453a3ec-d563-48b6-b7bb-58cf194215a8	00f229fe-9784-4f72-9b8f-c3b41b367dca	196e3252-4fe5-49df-8f17-2d0b8c411026	2026-11-18 07:29:26.85+05:30
14c20931-b95a-4590-bd62-b673bbe7f45a	00f229fe-9784-4f72-9b8f-c3b41b367dca	a295a3e3-9bb9-472c-94c0-0cf925b135ed	2026-11-18 07:29:26.851+05:30
f22688db-45bb-49d0-a68d-442a6190e90b	00f229fe-9784-4f72-9b8f-c3b41b367dca	6413e394-c682-43d1-bc4a-df14d17f96ed	2026-11-18 07:29:26.853+05:30
8c3749c1-5233-4fc6-aa1a-565442d1798f	00f229fe-9784-4f72-9b8f-c3b41b367dca	d3d088f2-e7a6-4f16-933c-e0f574518ec9	2026-11-18 07:29:26.854+05:30
0680e48e-6e2e-4cba-bc8f-2b1bcbf6f409	00f229fe-9784-4f72-9b8f-c3b41b367dca	9a5ff3f5-9436-4500-8840-881b0002ba61	2026-11-18 07:29:26.856+05:30
b11681a6-71cd-4906-92bd-d83bc879f71f	00f229fe-9784-4f72-9b8f-c3b41b367dca	30666a78-1dbf-46d2-a5c2-007077e19130	2026-11-18 07:29:26.857+05:30
4300ef6c-4efd-47a3-a8f6-6d9640e2b13e	00f229fe-9784-4f72-9b8f-c3b41b367dca	f326a913-8dfd-45c9-97bb-43a909faa483	2026-11-18 07:29:26.859+05:30
982346a7-0403-4d7e-919a-b760dc04c2a3	00f229fe-9784-4f72-9b8f-c3b41b367dca	63dfa9ba-02d8-4c95-bfdf-fe2fbd658ea4	2026-11-18 07:29:26.86+05:30
2a9dfe99-7f22-4481-b890-6a1db61a26fc	00f229fe-9784-4f72-9b8f-c3b41b367dca	2b19d76d-3915-4b09-8e0a-a2392ebdc3b9	2026-11-18 07:29:26.861+05:30
b4681de7-b46b-4891-b021-759a9b8572b8	00f229fe-9784-4f72-9b8f-c3b41b367dca	e2d09549-f0a5-4ac4-9946-c84afc43845c	2026-11-18 07:29:26.863+05:30
2f5636be-d926-425f-95e0-e579d5ebb701	00f229fe-9784-4f72-9b8f-c3b41b367dca	059281e3-734b-4119-9f99-bec535668a75	2026-11-18 07:29:26.864+05:30
17d792e4-a7c7-4519-a42d-46443f5e4685	00f229fe-9784-4f72-9b8f-c3b41b367dca	9dddd418-4a08-40e7-bdca-b46786392bdb	2026-11-18 07:29:26.866+05:30
6807761b-05c1-4c4c-9666-f1e9ec0df328	00f229fe-9784-4f72-9b8f-c3b41b367dca	a4a263f9-d301-44a5-8dda-dd8fa66a8616	2026-11-18 07:29:26.867+05:30
75faedfb-feec-4ffb-8409-e5326f3fc514	d61d789b-3082-4343-aedf-9485b24f55d0	de606e66-21f4-4f74-aa32-e00d5aaa91c9	2026-11-18 07:29:26.869+05:30
4a21bd6e-a117-44c5-a8b4-0191f16a31c7	d61d789b-3082-4343-aedf-9485b24f55d0	30666a78-1dbf-46d2-a5c2-007077e19130	2026-11-18 07:29:26.871+05:30
609b6600-8f42-4cfe-9a34-c77271d00dc7	d61d789b-3082-4343-aedf-9485b24f55d0	f326a913-8dfd-45c9-97bb-43a909faa483	2026-11-18 07:29:26.872+05:30
d6fa4b15-a8b4-4438-a006-1d4784ab70a3	d61d789b-3082-4343-aedf-9485b24f55d0	2b19d76d-3915-4b09-8e0a-a2392ebdc3b9	2026-11-18 07:29:26.874+05:30
390927f8-68a6-4b48-84a8-5d939bfb1eae	d61d789b-3082-4343-aedf-9485b24f55d0	e2d09549-f0a5-4ac4-9946-c84afc43845c	2026-11-18 07:29:26.875+05:30
36658fd5-de19-45e2-b3d8-29ffcbe24fdd	d61d789b-3082-4343-aedf-9485b24f55d0	059281e3-734b-4119-9f99-bec535668a75	2026-11-18 07:29:26.877+05:30
0f8943fb-0504-4a95-8c91-2ef6c1400f09	155fe47f-86aa-4f52-8a6e-c6036951a56b	f326a913-8dfd-45c9-97bb-43a909faa483	2026-11-18 07:29:26.88+05:30
810dc9de-4463-4ce7-a2f9-81988b5a07aa	155fe47f-86aa-4f52-8a6e-c6036951a56b	2b19d76d-3915-4b09-8e0a-a2392ebdc3b9	2026-11-18 07:29:26.881+05:30
f9f6a01c-c952-47a5-9b46-11a5760df7c6	155fe47f-86aa-4f52-8a6e-c6036951a56b	d3d088f2-e7a6-4f16-933c-e0f574518ec9	2026-11-18 07:29:26.883+05:30
8f63d694-d9e1-4f81-acdc-f86d3bcb0ae5	155fe47f-86aa-4f52-8a6e-c6036951a56b	9a5ff3f5-9436-4500-8840-881b0002ba61	2026-11-18 07:29:26.884+05:30
5ab512df-d9ef-427f-864d-1de37d031925	155fe47f-86aa-4f52-8a6e-c6036951a56b	059281e3-734b-4119-9f99-bec535668a75	2026-11-18 07:29:26.886+05:30
2f2b3a9d-dfc4-4c57-8c3b-d337c4e97e30	155fe47f-86aa-4f52-8a6e-c6036951a56b	9dddd418-4a08-40e7-bdca-b46786392bdb	2026-11-18 07:29:26.888+05:30
8f9022e0-cb61-4af9-b6e9-297063a59626	155fe47f-86aa-4f52-8a6e-c6036951a56b	a4a263f9-d301-44a5-8dda-dd8fa66a8616	2026-11-18 07:29:26.889+05:30
bc71d5a3-08db-4eb4-8dd0-eea6d8b0f47b	603803e0-f6a5-4abe-9ff2-8ed728190149	de606e66-21f4-4f74-aa32-e00d5aaa91c9	2026-11-18 07:29:26.892+05:30
b528a90b-b49f-4be8-87fa-767c4951a127	603803e0-f6a5-4abe-9ff2-8ed728190149	b8e126e7-603a-4a37-bdc5-09dc7a2302eb	2026-11-18 07:29:26.893+05:30
9cb6baef-d707-49ed-983c-1c945cf71500	603803e0-f6a5-4abe-9ff2-8ed728190149	196e3252-4fe5-49df-8f17-2d0b8c411026	2026-11-18 07:29:26.895+05:30
c63ca4f8-ccd7-4ca9-b231-07400f5517db	603803e0-f6a5-4abe-9ff2-8ed728190149	a295a3e3-9bb9-472c-94c0-0cf925b135ed	2026-11-18 07:29:26.897+05:30
bf56e492-235a-4524-a9bf-ebbc4d49e857	603803e0-f6a5-4abe-9ff2-8ed728190149	6413e394-c682-43d1-bc4a-df14d17f96ed	2026-11-18 07:29:26.898+05:30
8db7d343-2835-4b99-a8c5-f98552f00eb4	603803e0-f6a5-4abe-9ff2-8ed728190149	d3d088f2-e7a6-4f16-933c-e0f574518ec9	2026-11-18 07:29:26.9+05:30
4e6e00aa-4541-4e67-a648-899de67e4c46	603803e0-f6a5-4abe-9ff2-8ed728190149	9a5ff3f5-9436-4500-8840-881b0002ba61	2026-11-18 07:29:26.901+05:30
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, shop_id, name, description, is_system, created_at, updated_at) FROM stdin;
92dbb20d-6e4f-4340-a3d4-809fba1d8394	\N	Super Admin	Master platform administrator for SL MultiShop	t	2026-11-18 07:29:26.743+05:30	2026-11-18 08:08:19.402+05:30
61650f94-e4c4-4a39-b381-ff4e3b02233e	\N	Shop Owner	Owner with full access to shop configuration and operations	t	2026-11-18 07:29:26.801+05:30	2026-11-18 08:08:19.441+05:30
00f229fe-9784-4f72-9b8f-c3b41b367dca	\N	Shop Manager	Branch and store operations manager	t	2026-11-18 07:29:26.839+05:30	2026-11-18 08:08:19.464+05:30
d61d789b-3082-4343-aedf-9485b24f55d0	\N	Cashier	POS billing counter operator	t	2026-11-18 07:29:26.868+05:30	2026-11-18 08:08:19.484+05:30
155fe47f-86aa-4f52-8a6e-c6036951a56b	\N	Accountant	Financial ledger, taxes, expenses and reports	t	2026-11-18 07:29:26.879+05:30	2026-11-18 08:08:19.491+05:30
603803e0-f6a5-4abe-9ff2-8ed728190149	\N	Inventory Manager	Warehouse, stock procurement and transfer management	t	2026-11-18 07:29:26.891+05:30	2026-11-18 08:08:19.498+05:30
\.


--
-- Data for Name: sales_return_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sales_return_items (id, shop_id, sales_return_id, invoice_item_id, product_id, quantity, unit_price, tax_amount, total, reason, restock, created_at) FROM stdin;
\.


--
-- Data for Name: sales_returns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sales_returns (id, shop_id, branch_id, invoice_id, customer_id, return_number, return_date, subtotal, tax_amount, total_amount, refund_method, status, notes, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: shop_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shop_settings (id, shop_id, industry_type, features_enabled, gst_enabled, is_composition_scheme, default_tax_rate, receipt_printer_type, invoice_prefix, next_invoice_number, invoice_footer_note, invoice_terms, telugu_invoice_enabled, loyalty_program_enabled, low_stock_threshold_default, updated_at) FROM stdin;
d4917630-ac38-4a6c-a511-34007da91f5c	59dad0f9-a002-4050-9a83-367bcbaba360	GROCERY	{"batch_tracking": true, "expiry_tracking": true, "barcode_scanning": true, "weight_based_units": true}	t	f	18.00	THERMAL_80MM	SLM-	1003	Thank you for shopping with SL Supermarket!	Goods once sold cannot be returned without original receipt.	t	f	10	2026-11-18 08:08:19.736+05:30
\.


--
-- Data for Name: shops; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shops (id, name, slug, business_type, logo_url, email, phone, gstin, currency, timezone, status, created_at, updated_at) FROM stdin;
59dad0f9-a002-4050-9a83-367bcbaba360	SL Supermarket & Grocery	sl-supermarket	GROCERY	\N	contact@slsupermarket.com	+91 9876543210	37AAAAA0000A1Z5	INR	Asia/Kolkata	ACTIVE	2026-11-18 07:29:27.008+05:30	2026-11-18 07:29:27.008+05:30
\.


--
-- Data for Name: stock_balances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stock_balances (id, shop_id, branch_id, product_id, variant_id, batch_number, expiry_date, quantity, available_quantity, reserved_quantity, cost_price, updated_at) FROM stdin;
53dae61a-3140-490a-aaf2-b59e16e1bb7e	59dad0f9-a002-4050-9a83-367bcbaba360	133a7f05-5337-4b61-bb09-50b33078d12f	938516f4-8678-46fe-b089-eb3f4695b040	\N	\N	\N	50.000	50.000	0.000	1350.00	2026-11-18 08:08:19.68+05:30
2a163f72-262c-4451-9044-621a527c46bd	59dad0f9-a002-4050-9a83-367bcbaba360	133a7f05-5337-4b61-bb09-50b33078d12f	3563c4e3-54a4-460e-b963-35a4a7794752	\N	\N	\N	121.000	121.000	0.000	280.00	2026-11-18 09:37:19.088+05:30
\.


--
-- Data for Name: stock_movements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stock_movements (id, shop_id, branch_id, product_id, variant_id, batch_number, movement_type, quantity, previous_stock, new_stock, unit_cost, reference_id, reference_type, notes, created_by, created_at) FROM stdin;
52896b50-789c-4cb4-9ca9-3d5ec51bcae7	59dad0f9-a002-4050-9a83-367bcbaba360	133a7f05-5337-4b61-bb09-50b33078d12f	3563c4e3-54a4-460e-b963-35a4a7794752	\N	\N	RETURN_IN	1.000	120.000	121.000	280.00	SLM-1002	INVOICE_VOID	Restock due to cancelled invoice #SLM-1002	c23544b5-23c3-486c-9920-c9966ed25f1f	2026-11-18 09:37:19.093+05:30
\.


--
-- Data for Name: stock_transfers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stock_transfers (id, shop_id, transfer_number, source_branch_id, destination_branch_id, status, items, notes, sent_by, received_by, sent_at, received_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: subscription_payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscription_payments (id, subscription_id, shop_id, amount, payment_method, transaction_reference, status, verified_by, verified_at, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscriptions (id, shop_id, plan_id, billing_cycle, status, start_date, end_date, grace_period_end, auto_renew, created_at, updated_at) FROM stdin;
00000000-0000-0000-0000-000000000001	59dad0f9-a002-4050-9a83-367bcbaba360	c854f27f-1074-4ad2-8370-f074a0e8a705	ANNUAL	ACTIVE	2026-11-18 07:29:27.131+05:30	2027-11-18 07:29:27.131+05:30	\N	t	2026-11-18 07:29:27.133+05:30	2026-11-18 08:08:19.659+05:30
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.suppliers (id, shop_id, name, company_name, email, phone, gstin, address, city, state, current_balance, is_active, created_at, updated_at) FROM stdin;
835f5ca0-4e71-44db-8132-b2580098ae5c	59dad0f9-a002-4050-9a83-367bcbaba360	Sri Balaji Wholesale Traders	Balaji Agro Foods Pvt Ltd	orders@balajiagro.com	+91 9988776655	37BBBBB1111B1Z2	Shop 14, Wholesale Market Yard	Vijayawada	Andhra Pradesh	18500.00	t	2026-11-18 08:08:19.707+05:30	2026-11-18 08:08:19.707+05:30
\.


--
-- Data for Name: support_tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.support_tickets (id, shop_id, user_id, ticket_number, subject, description, priority, status, responses, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: tax_rates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tax_rates (id, shop_id, name, rate, cgst, sgst, igst, cess, is_active, created_at) FROM stdin;
12b741d0-b7d0-4ce8-9bc6-b626cf151fc4	\N	GST 0%	0.00	0.00	0.00	0.00	0.00	t	2026-11-18 07:29:26.916+05:30
a6abfed6-236c-4192-8076-8ab37e24fb8a	\N	GST 5%	5.00	2.50	2.50	5.00	0.00	t	2026-11-18 07:29:26.919+05:30
01206152-106d-47ee-96db-98e28fbd6658	\N	GST 12%	12.00	6.00	6.00	12.00	0.00	t	2026-11-18 07:29:26.92+05:30
43419bad-933b-4f7c-914e-fb18dc9d92aa	\N	GST 18%	18.00	9.00	9.00	18.00	0.00	t	2026-11-18 07:29:26.922+05:30
3f317f35-cbe6-48ce-a315-c155cf8b9f6c	\N	GST 28%	28.00	14.00	14.00	28.00	0.00	t	2026-11-18 07:29:26.923+05:30
\.


--
-- Data for Name: units; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.units (id, shop_id, name, code, "precision", is_active, created_at, updated_at) FROM stdin;
ce5a68ab-7321-4f13-843c-9492ef935764	\N	Pieces	PCS	0	t	2026-11-18 07:29:26.905+05:30	2026-11-18 07:29:26.905+05:30
2092b9d2-b151-43d2-89df-571412a0fec7	\N	Kilograms	KG	3	t	2026-11-18 07:29:26.908+05:30	2026-11-18 07:29:26.908+05:30
0d210368-1734-4467-bcb5-89dd5dd851a6	\N	Grams	GM	3	t	2026-11-18 07:29:26.909+05:30	2026-11-18 07:29:26.909+05:30
a5ba90b7-dfb6-43be-ae13-4d16df1fcbd1	\N	Litres	LTR	3	t	2026-11-18 07:29:26.91+05:30	2026-11-18 07:29:26.91+05:30
0fff8ea3-be08-448c-9e9a-db682fa930da	\N	Millilitres	ML	3	t	2026-11-18 07:29:26.911+05:30	2026-11-18 07:29:26.911+05:30
c86b559d-a7ac-4cfc-9d2c-0e11f48c12ed	\N	Metres	MTR	2	t	2026-11-18 07:29:26.911+05:30	2026-11-18 07:29:26.911+05:30
b87deb88-1ae7-4b53-9aca-8c4cce805245	\N	Box	BOX	0	t	2026-11-18 07:29:26.912+05:30	2026-11-18 07:29:26.912+05:30
9d5a809d-eec4-47a2-a3cd-0d13d2462199	\N	Packet	PKT	0	t	2026-11-18 07:29:26.913+05:30	2026-11-18 07:29:26.913+05:30
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_roles (id, user_id, role_id, shop_id, branch_id, created_at) FROM stdin;
82868734-555f-42fe-907c-0efe0bbc4e33	95bcda4b-cf23-45d1-8066-0237f42d9f95	92dbb20d-6e4f-4340-a3d4-809fba1d8394	\N	\N	2026-11-18 07:29:27.005+05:30
6d14cacd-8b42-4901-a2e8-4af52c3d380d	c23544b5-23c3-486c-9920-c9966ed25f1f	61650f94-e4c4-4a39-b381-ff4e3b02233e	59dad0f9-a002-4050-9a83-367bcbaba360	133a7f05-5337-4b61-bb09-50b33078d12f	2026-11-18 07:29:27.074+05:30
bf55a42e-ea7b-4ab3-b693-73361b78ab25	0946ed64-6d5b-4f29-96b5-5e036e587e0d	d61d789b-3082-4343-aedf-9485b24f55d0	59dad0f9-a002-4050-9a83-367bcbaba360	133a7f05-5337-4b61-bb09-50b33078d12f	2026-11-18 07:29:27.129+05:30
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, first_name, last_name, phone, is_super_admin, status, created_at, updated_at) FROM stdin;
95bcda4b-cf23-45d1-8066-0237f42d9f95	admin@slit-solutions.com	$argon2id$v=19$m=65536,t=3,p=4$lJUOxAPoZJi5wzCwqF/Mrw$mVFEfP0HOGUm1JfAgYtWMQf5omG9E86zflFRW+7jxP0	SL IT	Administrator	+91 9999999999	t	ACTIVE	2026-11-18 07:29:26.994+05:30	2026-11-18 08:08:19.558+05:30
c23544b5-23c3-486c-9920-c9966ed25f1f	owner@slsupermarket.com	$argon2id$v=19$m=65536,t=3,p=4$UqNxarfQJN87YbLKe55tBQ$e+mvgz++yi5TZE/kBqTLSka9Zxxz9vY+miH/rKjbp+w	Suresh	Reddy	+91 9876500001	f	ACTIVE	2026-11-18 07:29:27.071+05:30	2026-11-18 08:08:19.618+05:30
0946ed64-6d5b-4f29-96b5-5e036e587e0d	cashier@slsupermarket.com	$argon2id$v=19$m=65536,t=3,p=4$bP7Fpuz2uzH7x6ZcRNdieA$jG6FJhQzbw/mSSUc4SnG+nW+RTkZWonTBLBxL8osBWM	Ravi	Kumar	+91 9876500002	f	ACTIVE	2026-11-18 07:29:27.127+05:30	2026-11-18 08:08:19.655+05:30
\.


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);


--
-- Name: cash_sessions cash_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cash_sessions
    ADD CONSTRAINT cash_sessions_pkey PRIMARY KEY (id);


--
-- Name: cash_transactions cash_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cash_transactions
    ADD CONSTRAINT cash_transactions_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: counters counters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.counters
    ADD CONSTRAINT counters_pkey PRIMARY KEY (id);


--
-- Name: credit_notes credit_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT credit_notes_pkey PRIMARY KEY (id);


--
-- Name: customer_addresses customer_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_pkey PRIMARY KEY (id);


--
-- Name: customer_ledger customer_ledger_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_ledger
    ADD CONSTRAINT customer_ledger_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: expense_categories expense_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: goods_receipts goods_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goods_receipts
    ADD CONSTRAINT goods_receipts_pkey PRIMARY KEY (id);


--
-- Name: idempotency_keys idempotency_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.idempotency_keys
    ADD CONSTRAINT idempotency_keys_pkey PRIMARY KEY (id);


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- Name: invoice_taxes invoice_taxes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_taxes
    ADD CONSTRAINT invoice_taxes_pkey PRIMARY KEY (id);


--
-- Name: invoice_templates invoice_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_templates
    ADD CONSTRAINT invoice_templates_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: payment_allocations payment_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_allocations
    ADD CONSTRAINT payment_allocations_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- Name: product_barcodes product_barcodes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_barcodes
    ADD CONSTRAINT product_barcodes_pkey PRIMARY KEY (id);


--
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: purchase_items purchase_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT purchase_items_pkey PRIMARY KEY (id);


--
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sales_return_items sales_return_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_return_items
    ADD CONSTRAINT sales_return_items_pkey PRIMARY KEY (id);


--
-- Name: sales_returns sales_returns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_returns
    ADD CONSTRAINT sales_returns_pkey PRIMARY KEY (id);


--
-- Name: shop_settings shop_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shop_settings
    ADD CONSTRAINT shop_settings_pkey PRIMARY KEY (id);


--
-- Name: shops shops_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT shops_pkey PRIMARY KEY (id);


--
-- Name: stock_balances stock_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_balances
    ADD CONSTRAINT stock_balances_pkey PRIMARY KEY (id);


--
-- Name: stock_movements stock_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_pkey PRIMARY KEY (id);


--
-- Name: stock_transfers stock_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_pkey PRIMARY KEY (id);


--
-- Name: subscription_payments subscription_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: tax_rates tax_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_rates
    ADD CONSTRAINT tax_rates_pkey PRIMARY KEY (id);


--
-- Name: units units_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_action_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_logs_action_idx ON public.audit_logs USING btree (action);


--
-- Name: audit_logs_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_logs_created_at_idx ON public.audit_logs USING btree (created_at);


--
-- Name: audit_logs_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_logs_shop_id_idx ON public.audit_logs USING btree (shop_id);


--
-- Name: audit_logs_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_logs_user_id_idx ON public.audit_logs USING btree (user_id);


--
-- Name: branches_shop_id_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX branches_shop_id_code_key ON public.branches USING btree (shop_id, code);


--
-- Name: branches_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX branches_shop_id_idx ON public.branches USING btree (shop_id);


--
-- Name: brands_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX brands_shop_id_idx ON public.brands USING btree (shop_id);


--
-- Name: brands_shop_id_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX brands_shop_id_name_key ON public.brands USING btree (shop_id, name);


--
-- Name: cash_sessions_counter_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cash_sessions_counter_id_idx ON public.cash_sessions USING btree (counter_id);


--
-- Name: cash_sessions_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cash_sessions_shop_id_idx ON public.cash_sessions USING btree (shop_id);


--
-- Name: cash_sessions_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cash_sessions_status_idx ON public.cash_sessions USING btree (status);


--
-- Name: cash_transactions_cash_session_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cash_transactions_cash_session_id_idx ON public.cash_transactions USING btree (cash_session_id);


--
-- Name: cash_transactions_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cash_transactions_shop_id_idx ON public.cash_transactions USING btree (shop_id);


--
-- Name: categories_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX categories_shop_id_idx ON public.categories USING btree (shop_id);


--
-- Name: categories_shop_id_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX categories_shop_id_slug_key ON public.categories USING btree (shop_id, slug);


--
-- Name: counters_branch_id_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX counters_branch_id_code_key ON public.counters USING btree (branch_id, code);


--
-- Name: counters_branch_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX counters_branch_id_idx ON public.counters USING btree (branch_id);


--
-- Name: counters_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX counters_shop_id_idx ON public.counters USING btree (shop_id);


--
-- Name: credit_notes_customer_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX credit_notes_customer_id_idx ON public.credit_notes USING btree (customer_id);


--
-- Name: credit_notes_shop_id_credit_note_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX credit_notes_shop_id_credit_note_number_key ON public.credit_notes USING btree (shop_id, credit_note_number);


--
-- Name: credit_notes_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX credit_notes_shop_id_idx ON public.credit_notes USING btree (shop_id);


--
-- Name: customer_addresses_customer_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX customer_addresses_customer_id_idx ON public.customer_addresses USING btree (customer_id);


--
-- Name: customer_addresses_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX customer_addresses_shop_id_idx ON public.customer_addresses USING btree (shop_id);


--
-- Name: customer_ledger_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX customer_ledger_created_at_idx ON public.customer_ledger USING btree (created_at);


--
-- Name: customer_ledger_customer_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX customer_ledger_customer_id_idx ON public.customer_ledger USING btree (customer_id);


--
-- Name: customer_ledger_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX customer_ledger_shop_id_idx ON public.customer_ledger USING btree (shop_id);


--
-- Name: customers_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX customers_shop_id_idx ON public.customers USING btree (shop_id);


--
-- Name: customers_shop_id_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX customers_shop_id_name_idx ON public.customers USING btree (shop_id, name);


--
-- Name: customers_shop_id_phone_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX customers_shop_id_phone_key ON public.customers USING btree (shop_id, phone);


--
-- Name: expense_categories_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX expense_categories_shop_id_idx ON public.expense_categories USING btree (shop_id);


--
-- Name: expense_categories_shop_id_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX expense_categories_shop_id_name_key ON public.expense_categories USING btree (shop_id, name);


--
-- Name: expenses_branch_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX expenses_branch_id_idx ON public.expenses USING btree (branch_id);


--
-- Name: expenses_expense_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX expenses_expense_date_idx ON public.expenses USING btree (expense_date);


--
-- Name: expenses_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX expenses_shop_id_idx ON public.expenses USING btree (shop_id);


--
-- Name: goods_receipts_shop_id_grn_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX goods_receipts_shop_id_grn_number_key ON public.goods_receipts USING btree (shop_id, grn_number);


--
-- Name: goods_receipts_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX goods_receipts_shop_id_idx ON public.goods_receipts USING btree (shop_id);


--
-- Name: idempotency_keys_expires_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idempotency_keys_expires_at_idx ON public.idempotency_keys USING btree (expires_at);


--
-- Name: idempotency_keys_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idempotency_keys_shop_id_idx ON public.idempotency_keys USING btree (shop_id);


--
-- Name: idempotency_keys_shop_id_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idempotency_keys_shop_id_key_key ON public.idempotency_keys USING btree (shop_id, key);


--
-- Name: invoice_items_invoice_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX invoice_items_invoice_id_idx ON public.invoice_items USING btree (invoice_id);


--
-- Name: invoice_items_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX invoice_items_shop_id_idx ON public.invoice_items USING btree (shop_id);


--
-- Name: invoice_taxes_invoice_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX invoice_taxes_invoice_id_idx ON public.invoice_taxes USING btree (invoice_id);


--
-- Name: invoice_taxes_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX invoice_taxes_shop_id_idx ON public.invoice_taxes USING btree (shop_id);


--
-- Name: invoice_templates_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX invoice_templates_shop_id_idx ON public.invoice_templates USING btree (shop_id);


--
-- Name: invoices_branch_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX invoices_branch_id_idx ON public.invoices USING btree (branch_id);


--
-- Name: invoices_customer_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX invoices_customer_id_idx ON public.invoices USING btree (customer_id);


--
-- Name: invoices_idempotency_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX invoices_idempotency_key_key ON public.invoices USING btree (idempotency_key);


--
-- Name: invoices_invoice_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX invoices_invoice_date_idx ON public.invoices USING btree (invoice_date);


--
-- Name: invoices_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX invoices_shop_id_idx ON public.invoices USING btree (shop_id);


--
-- Name: invoices_shop_id_invoice_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX invoices_shop_id_invoice_number_key ON public.invoices USING btree (shop_id, invoice_number);


--
-- Name: invoices_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX invoices_status_idx ON public.invoices USING btree (status);


--
-- Name: notifications_is_read_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notifications_is_read_idx ON public.notifications USING btree (is_read);


--
-- Name: notifications_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notifications_shop_id_idx ON public.notifications USING btree (shop_id);


--
-- Name: notifications_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notifications_user_id_idx ON public.notifications USING btree (user_id);


--
-- Name: payment_allocations_invoice_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payment_allocations_invoice_id_idx ON public.payment_allocations USING btree (invoice_id);


--
-- Name: payment_allocations_payment_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payment_allocations_payment_id_idx ON public.payment_allocations USING btree (payment_id);


--
-- Name: payment_allocations_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payment_allocations_shop_id_idx ON public.payment_allocations USING btree (shop_id);


--
-- Name: payments_invoice_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payments_invoice_id_idx ON public.payments USING btree (invoice_id);


--
-- Name: payments_payment_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payments_payment_date_idx ON public.payments USING btree (payment_date);


--
-- Name: payments_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payments_shop_id_idx ON public.payments USING btree (shop_id);


--
-- Name: payments_shop_id_payment_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX payments_shop_id_payment_number_key ON public.payments USING btree (shop_id, payment_number);


--
-- Name: permissions_module_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX permissions_module_idx ON public.permissions USING btree (module);


--
-- Name: permissions_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX permissions_name_key ON public.permissions USING btree (name);


--
-- Name: plans_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX plans_name_key ON public.plans USING btree (name);


--
-- Name: plans_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX plans_slug_key ON public.plans USING btree (slug);


--
-- Name: product_barcodes_barcode_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX product_barcodes_barcode_idx ON public.product_barcodes USING btree (barcode);


--
-- Name: product_barcodes_shop_id_barcode_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX product_barcodes_shop_id_barcode_key ON public.product_barcodes USING btree (shop_id, barcode);


--
-- Name: product_barcodes_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX product_barcodes_shop_id_idx ON public.product_barcodes USING btree (shop_id);


--
-- Name: product_variants_product_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX product_variants_product_id_idx ON public.product_variants USING btree (product_id);


--
-- Name: product_variants_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX product_variants_shop_id_idx ON public.product_variants USING btree (shop_id);


--
-- Name: product_variants_shop_id_sku_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX product_variants_shop_id_sku_key ON public.product_variants USING btree (shop_id, sku);


--
-- Name: products_shop_id_barcode_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX products_shop_id_barcode_idx ON public.products USING btree (shop_id, barcode);


--
-- Name: products_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX products_shop_id_idx ON public.products USING btree (shop_id);


--
-- Name: products_shop_id_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX products_shop_id_name_idx ON public.products USING btree (shop_id, name);


--
-- Name: products_shop_id_sku_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX products_shop_id_sku_key ON public.products USING btree (shop_id, sku);


--
-- Name: purchase_items_purchase_order_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX purchase_items_purchase_order_id_idx ON public.purchase_items USING btree (purchase_order_id);


--
-- Name: purchase_items_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX purchase_items_shop_id_idx ON public.purchase_items USING btree (shop_id);


--
-- Name: purchase_orders_branch_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX purchase_orders_branch_id_idx ON public.purchase_orders USING btree (branch_id);


--
-- Name: purchase_orders_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX purchase_orders_shop_id_idx ON public.purchase_orders USING btree (shop_id);


--
-- Name: purchase_orders_shop_id_po_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX purchase_orders_shop_id_po_number_key ON public.purchase_orders USING btree (shop_id, po_number);


--
-- Name: refresh_tokens_token_hash_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX refresh_tokens_token_hash_idx ON public.refresh_tokens USING btree (token_hash);


--
-- Name: refresh_tokens_token_hash_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX refresh_tokens_token_hash_key ON public.refresh_tokens USING btree (token_hash);


--
-- Name: refresh_tokens_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX refresh_tokens_user_id_idx ON public.refresh_tokens USING btree (user_id);


--
-- Name: role_permissions_role_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX role_permissions_role_id_idx ON public.role_permissions USING btree (role_id);


--
-- Name: role_permissions_role_id_permission_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX role_permissions_role_id_permission_id_key ON public.role_permissions USING btree (role_id, permission_id);


--
-- Name: roles_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX roles_shop_id_idx ON public.roles USING btree (shop_id);


--
-- Name: roles_shop_id_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX roles_shop_id_name_key ON public.roles USING btree (shop_id, name);


--
-- Name: sales_return_items_sales_return_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sales_return_items_sales_return_id_idx ON public.sales_return_items USING btree (sales_return_id);


--
-- Name: sales_return_items_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sales_return_items_shop_id_idx ON public.sales_return_items USING btree (shop_id);


--
-- Name: sales_returns_invoice_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sales_returns_invoice_id_idx ON public.sales_returns USING btree (invoice_id);


--
-- Name: sales_returns_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sales_returns_shop_id_idx ON public.sales_returns USING btree (shop_id);


--
-- Name: sales_returns_shop_id_return_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX sales_returns_shop_id_return_number_key ON public.sales_returns USING btree (shop_id, return_number);


--
-- Name: shop_settings_shop_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX shop_settings_shop_id_key ON public.shop_settings USING btree (shop_id);


--
-- Name: shops_slug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX shops_slug_idx ON public.shops USING btree (slug);


--
-- Name: shops_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX shops_slug_key ON public.shops USING btree (slug);


--
-- Name: shops_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX shops_status_idx ON public.shops USING btree (status);


--
-- Name: stock_balances_branch_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX stock_balances_branch_id_idx ON public.stock_balances USING btree (branch_id);


--
-- Name: stock_balances_branch_id_product_id_variant_id_batch_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX stock_balances_branch_id_product_id_variant_id_batch_number_key ON public.stock_balances USING btree (branch_id, product_id, variant_id, batch_number);


--
-- Name: stock_balances_product_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX stock_balances_product_id_idx ON public.stock_balances USING btree (product_id);


--
-- Name: stock_balances_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX stock_balances_shop_id_idx ON public.stock_balances USING btree (shop_id);


--
-- Name: stock_movements_branch_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX stock_movements_branch_id_idx ON public.stock_movements USING btree (branch_id);


--
-- Name: stock_movements_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX stock_movements_created_at_idx ON public.stock_movements USING btree (created_at);


--
-- Name: stock_movements_product_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX stock_movements_product_id_idx ON public.stock_movements USING btree (product_id);


--
-- Name: stock_movements_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX stock_movements_shop_id_idx ON public.stock_movements USING btree (shop_id);


--
-- Name: stock_transfers_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX stock_transfers_shop_id_idx ON public.stock_transfers USING btree (shop_id);


--
-- Name: stock_transfers_shop_id_transfer_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX stock_transfers_shop_id_transfer_number_key ON public.stock_transfers USING btree (shop_id, transfer_number);


--
-- Name: subscription_payments_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX subscription_payments_shop_id_idx ON public.subscription_payments USING btree (shop_id);


--
-- Name: subscription_payments_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX subscription_payments_status_idx ON public.subscription_payments USING btree (status);


--
-- Name: subscription_payments_subscription_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX subscription_payments_subscription_id_idx ON public.subscription_payments USING btree (subscription_id);


--
-- Name: subscriptions_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX subscriptions_shop_id_idx ON public.subscriptions USING btree (shop_id);


--
-- Name: subscriptions_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX subscriptions_status_idx ON public.subscriptions USING btree (status);


--
-- Name: suppliers_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX suppliers_shop_id_idx ON public.suppliers USING btree (shop_id);


--
-- Name: suppliers_shop_id_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX suppliers_shop_id_name_key ON public.suppliers USING btree (shop_id, name);


--
-- Name: support_tickets_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX support_tickets_shop_id_idx ON public.support_tickets USING btree (shop_id);


--
-- Name: support_tickets_shop_id_ticket_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX support_tickets_shop_id_ticket_number_key ON public.support_tickets USING btree (shop_id, ticket_number);


--
-- Name: support_tickets_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX support_tickets_status_idx ON public.support_tickets USING btree (status);


--
-- Name: tax_rates_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tax_rates_shop_id_idx ON public.tax_rates USING btree (shop_id);


--
-- Name: tax_rates_shop_id_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX tax_rates_shop_id_name_key ON public.tax_rates USING btree (shop_id, name);


--
-- Name: units_shop_id_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX units_shop_id_code_key ON public.units USING btree (shop_id, code);


--
-- Name: units_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX units_shop_id_idx ON public.units USING btree (shop_id);


--
-- Name: user_roles_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_roles_shop_id_idx ON public.user_roles USING btree (shop_id);


--
-- Name: user_roles_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_roles_user_id_idx ON public.user_roles USING btree (user_id);


--
-- Name: user_roles_user_id_role_id_shop_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX user_roles_user_id_role_id_shop_id_key ON public.user_roles USING btree (user_id, role_id, shop_id);


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_is_super_admin_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_is_super_admin_idx ON public.users USING btree (is_super_admin);


--
-- Name: audit_logs audit_logs_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: branches branches_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: brands brands_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cash_sessions cash_sessions_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cash_sessions
    ADD CONSTRAINT cash_sessions_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cash_sessions cash_sessions_counter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cash_sessions
    ADD CONSTRAINT cash_sessions_counter_id_fkey FOREIGN KEY (counter_id) REFERENCES public.counters(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cash_sessions cash_sessions_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cash_sessions
    ADD CONSTRAINT cash_sessions_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cash_transactions cash_transactions_cash_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cash_transactions
    ADD CONSTRAINT cash_transactions_cash_session_id_fkey FOREIGN KEY (cash_session_id) REFERENCES public.cash_sessions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cash_transactions cash_transactions_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cash_transactions
    ADD CONSTRAINT cash_transactions_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: categories categories_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: counters counters_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.counters
    ADD CONSTRAINT counters_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: counters counters_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.counters
    ADD CONSTRAINT counters_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: credit_notes credit_notes_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT credit_notes_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: credit_notes credit_notes_sales_return_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT credit_notes_sales_return_id_fkey FOREIGN KEY (sales_return_id) REFERENCES public.sales_returns(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: credit_notes credit_notes_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT credit_notes_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: customer_addresses customer_addresses_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: customer_addresses customer_addresses_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: customer_ledger customer_ledger_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_ledger
    ADD CONSTRAINT customer_ledger_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: customer_ledger customer_ledger_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_ledger
    ADD CONSTRAINT customer_ledger_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: customers customers_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: expense_categories expense_categories_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: expenses expenses_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: expenses expenses_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.expense_categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: expenses expenses_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: goods_receipts goods_receipts_purchase_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goods_receipts
    ADD CONSTRAINT goods_receipts_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: goods_receipts goods_receipts_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goods_receipts
    ADD CONSTRAINT goods_receipts_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: idempotency_keys idempotency_keys_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.idempotency_keys
    ADD CONSTRAINT idempotency_keys_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invoice_items invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invoice_items invoice_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: invoice_items invoice_items_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invoice_items invoice_items_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: invoice_taxes invoice_taxes_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_taxes
    ADD CONSTRAINT invoice_taxes_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invoice_taxes invoice_taxes_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_taxes
    ADD CONSTRAINT invoice_taxes_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invoice_taxes invoice_taxes_tax_rate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_taxes
    ADD CONSTRAINT invoice_taxes_tax_rate_id_fkey FOREIGN KEY (tax_rate_id) REFERENCES public.tax_rates(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: invoice_templates invoice_templates_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_templates
    ADD CONSTRAINT invoice_templates_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invoices invoices_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invoices invoices_cash_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_cash_session_id_fkey FOREIGN KEY (cash_session_id) REFERENCES public.cash_sessions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: invoices invoices_counter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_counter_id_fkey FOREIGN KEY (counter_id) REFERENCES public.counters(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: invoices invoices_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: invoices invoices_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payment_allocations payment_allocations_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_allocations
    ADD CONSTRAINT payment_allocations_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payment_allocations payment_allocations_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_allocations
    ADD CONSTRAINT payment_allocations_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payment_allocations payment_allocations_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_allocations
    ADD CONSTRAINT payment_allocations_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments payments_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments payments_cash_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_cash_session_id_fkey FOREIGN KEY (cash_session_id) REFERENCES public.cash_sessions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_barcodes product_barcodes_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_barcodes
    ADD CONSTRAINT product_barcodes_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_barcodes product_barcodes_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_barcodes
    ADD CONSTRAINT product_barcodes_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_barcodes product_barcodes_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_barcodes
    ADD CONSTRAINT product_barcodes_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_variants product_variants_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_variants product_variants_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: products products_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: products products_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: purchase_items purchase_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT purchase_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: purchase_items purchase_items_purchase_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT purchase_items_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: purchase_items purchase_items_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT purchase_items_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: purchase_items purchase_items_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT purchase_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: purchase_orders purchase_orders_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: purchase_orders purchase_orders_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: purchase_orders purchase_orders_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: roles roles_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sales_return_items sales_return_items_invoice_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_return_items
    ADD CONSTRAINT sales_return_items_invoice_item_id_fkey FOREIGN KEY (invoice_item_id) REFERENCES public.invoice_items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sales_return_items sales_return_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_return_items
    ADD CONSTRAINT sales_return_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sales_return_items sales_return_items_sales_return_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_return_items
    ADD CONSTRAINT sales_return_items_sales_return_id_fkey FOREIGN KEY (sales_return_id) REFERENCES public.sales_returns(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sales_return_items sales_return_items_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_return_items
    ADD CONSTRAINT sales_return_items_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sales_returns sales_returns_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_returns
    ADD CONSTRAINT sales_returns_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sales_returns sales_returns_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_returns
    ADD CONSTRAINT sales_returns_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sales_returns sales_returns_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_returns
    ADD CONSTRAINT sales_returns_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: shop_settings shop_settings_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shop_settings
    ADD CONSTRAINT shop_settings_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stock_balances stock_balances_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_balances
    ADD CONSTRAINT stock_balances_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stock_balances stock_balances_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_balances
    ADD CONSTRAINT stock_balances_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stock_balances stock_balances_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_balances
    ADD CONSTRAINT stock_balances_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stock_balances stock_balances_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_balances
    ADD CONSTRAINT stock_balances_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stock_movements stock_movements_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stock_movements stock_movements_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stock_movements stock_movements_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stock_movements stock_movements_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stock_transfers stock_transfers_destination_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_destination_branch_id_fkey FOREIGN KEY (destination_branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: stock_transfers stock_transfers_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stock_transfers stock_transfers_source_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_source_branch_id_fkey FOREIGN KEY (source_branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: subscription_payments subscription_payments_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: subscription_payments subscription_payments_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: subscriptions subscriptions_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: suppliers suppliers_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: support_tickets support_tickets_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: support_tickets support_tickets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tax_rates tax_rates_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_rates
    ADD CONSTRAINT tax_rates_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: units units_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles user_roles_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles user_roles_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: branches; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

--
-- Name: brands; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

--
-- Name: cash_sessions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: cash_transactions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: categories; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

--
-- Name: counters; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.counters ENABLE ROW LEVEL SECURITY;

--
-- Name: credit_notes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.credit_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: customer_addresses; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

--
-- Name: customer_ledger; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.customer_ledger ENABLE ROW LEVEL SECURITY;

--
-- Name: customers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

--
-- Name: expense_categories; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: expenses; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

--
-- Name: goods_receipts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.goods_receipts ENABLE ROW LEVEL SECURITY;

--
-- Name: idempotency_keys; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

--
-- Name: invoice_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

--
-- Name: invoice_taxes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.invoice_taxes ENABLE ROW LEVEL SECURITY;

--
-- Name: invoice_templates; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: invoices; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_allocations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.payment_allocations ENABLE ROW LEVEL SECURITY;

--
-- Name: payments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

--
-- Name: product_barcodes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.product_barcodes ENABLE ROW LEVEL SECURITY;

--
-- Name: product_variants; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: purchase_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;

--
-- Name: purchase_orders; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

--
-- Name: roles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

--
-- Name: sales_return_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.sales_return_items ENABLE ROW LEVEL SECURITY;

--
-- Name: sales_returns; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.sales_returns ENABLE ROW LEVEL SECURITY;

--
-- Name: shop_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: stock_balances; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.stock_balances ENABLE ROW LEVEL SECURITY;

--
-- Name: stock_movements; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

--
-- Name: stock_transfers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;

--
-- Name: subscription_payments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: subscriptions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: suppliers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

--
-- Name: support_tickets; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

--
-- Name: tax_rates; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tax_rates ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.audit_logs USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: branches tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.branches USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: brands tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.brands USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: cash_sessions tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.cash_sessions USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: cash_transactions tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.cash_transactions USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: categories tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.categories USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: counters tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.counters USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: credit_notes tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.credit_notes USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: customer_addresses tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.customer_addresses USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: customer_ledger tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.customer_ledger USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: customers tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.customers USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: expense_categories tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.expense_categories USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: expenses tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.expenses USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: goods_receipts tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.goods_receipts USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: idempotency_keys tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.idempotency_keys USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: invoice_items tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.invoice_items USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: invoice_taxes tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.invoice_taxes USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: invoice_templates tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.invoice_templates USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: invoices tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.invoices USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: notifications tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.notifications USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: payment_allocations tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.payment_allocations USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: payments tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.payments USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: product_barcodes tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.product_barcodes USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: product_variants tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.product_variants USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: products tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.products USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: purchase_items tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.purchase_items USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: purchase_orders tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.purchase_orders USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: roles tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.roles USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: sales_return_items tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.sales_return_items USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: sales_returns tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.sales_returns USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: shop_settings tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.shop_settings USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: stock_balances tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.stock_balances USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: stock_movements tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.stock_movements USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: stock_transfers tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.stock_transfers USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: subscription_payments tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.subscription_payments USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: subscriptions tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.subscriptions USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: suppliers tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.suppliers USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: support_tickets tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.support_tickets USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: tax_rates tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.tax_rates USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: units tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.units USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: user_roles tenant_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_policy ON public.user_roles USING (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id()) OR ((shop_id IS NULL) AND (public.is_app_super_admin() = true)))) WITH CHECK (((public.is_app_super_admin() = true) OR (shop_id = public.current_app_shop_id())));


--
-- Name: units; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict 589NBXEpEoXNd8ijGaJxD1a33u6BQKgYQqEpbyL86saemmIEfQnFZxzA3U3SLmS

