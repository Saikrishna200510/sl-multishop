-- ====================================================================
-- SL MULTISHOP - POSTGRESQL ROW-LEVEL SECURITY (RLS) & TENANT ISOLATION
-- A Product of SL IT SOLUTIONS
-- ====================================================================

-- Create custom GUC namespace or helper function
CREATE OR REPLACE FUNCTION current_app_shop_id() RETURNS uuid AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_shop_id', true), '')::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION is_app_super_admin() RETURNS boolean AS $$
BEGIN
    RETURN COALESCE(current_setting('app.is_super_admin', true) = 'true', false);
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql STABLE;

-- Macro to enable RLS and add isolation policies for tenant tables
DO $$
DECLARE
    tbl text;
    tenant_tables text[] := ARRAY[
        'branches',
        'counters',
        'roles',
        'user_roles',
        'subscriptions',
        'subscription_payments',
        'categories',
        'brands',
        'units',
        'products',
        'product_variants',
        'product_barcodes',
        'stock_balances',
        'stock_movements',
        'stock_transfers',
        'suppliers',
        'purchase_orders',
        'purchase_items',
        'goods_receipts',
        'customers',
        'customer_addresses',
        'customer_ledger',
        'invoices',
        'invoice_items',
        'invoice_taxes',
        'payments',
        'payment_allocations',
        'sales_returns',
        'sales_return_items',
        'credit_notes',
        'expenses',
        'expense_categories',
        'cash_sessions',
        'cash_transactions',
        'shop_settings',
        'invoice_templates',
        'tax_rates',
        'audit_logs',
        'notifications',
        'support_tickets',
        'idempotency_keys'
    ];
BEGIN
    FOREACH tbl IN ARRAY tenant_tables
    LOOP
        -- Check if table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
            EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY;', tbl);

            -- Drop existing policy if any
            EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON public.%I;', tbl);

            -- Create unified tenant policy
            EXECUTE format(
                'CREATE POLICY tenant_isolation_policy ON public.%I
                 AS PERMISSIVE FOR ALL
                 USING (
                     is_app_super_admin() = true
                     OR shop_id = current_app_shop_id()
                     OR (shop_id IS NULL AND is_app_super_admin() = true)
                 )
                 WITH CHECK (
                     is_app_super_admin() = true
                     OR shop_id = current_app_shop_id()
                 );',
                tbl
            );
        END IF;
    END LOOP;
END $$;
