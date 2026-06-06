-- ============================================================
-- VendorBridge — Complete Schema
-- Paste this entire file into Supabase SQL Editor and run it.
-- ============================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUMS
DO $$ BEGIN CREATE TYPE user_role       AS ENUM ('admin','procurement_officer','manager','vendor'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE vendor_status   AS ENUM ('pending','active','suspended','blacklisted');     EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE rfq_status      AS ENUM ('draft','published','closed','cancelled');         EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE quo_status      AS ENUM ('pending','approved','rejected','submitted','under_review','shortlisted','awarded'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE approval_status AS ENUM ('pending','approved','rejected','escalated');      EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE po_status       AS ENUM ('draft','issued','acknowledged','fulfilled','cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE invoice_status  AS ENUM ('draft','sent','paid','overdue','cancelled');      EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================
-- TABLES
-- ============================================================

-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  role        user_role NOT NULL DEFAULT 'procurement_officer',
  avatar_url  TEXT,
  phone       TEXT,
  department  TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup (handles both email/password and Google OAuth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_full_name TEXT;
  v_email     TEXT;
  v_role      user_role;
BEGIN
  -- Google OAuth uses 'name'; email/password signup uses 'full_name'
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email,'@',1)
  );
  -- Email can be in raw_user_meta_data for some providers
  v_email := COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', '');
  -- Role from metadata or default
  v_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'procurement_officer'
  );

  INSERT INTO public.profiles (id, full_name, email, role, avatar_url)
  VALUES (
    NEW.id,
    v_full_name,
    v_email,
    v_role,
    NEW.raw_user_meta_data->>'avatar_url'
  ) ON CONFLICT (id) DO UPDATE SET
    full_name  = EXCLUDED.full_name,
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = NOW();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Vendor Categories
CREATE TABLE IF NOT EXISTS public.vendor_categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Vendors
CREATE TABLE IF NOT EXISTS public.vendors (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name    TEXT NOT NULL,
  category_id     UUID REFERENCES public.vendor_categories(id) ON DELETE SET NULL,
  status          vendor_status NOT NULL DEFAULT 'pending',
  contact_person  TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  phone           TEXT NOT NULL,
  website         TEXT,
  address_line1   TEXT,
  city            TEXT,
  state           TEXT,
  country         TEXT NOT NULL DEFAULT 'India',
  pincode         TEXT,
  gst_number      TEXT UNIQUE,
  pan_number      TEXT,
  msme_registered BOOLEAN DEFAULT FALSE,
  rating          NUMERIC(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_orders    INTEGER NOT NULL DEFAULT 0,
  notes           TEXT,
  created_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. RFQs
CREATE SEQUENCE IF NOT EXISTS rfq_seq START 42;
CREATE TABLE IF NOT EXISTS public.rfqs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_number      TEXT NOT NULL UNIQUE DEFAULT '',
  title           TEXT NOT NULL,
  description     TEXT,
  status          rfq_status NOT NULL DEFAULT 'draft',
  deadline        TIMESTAMPTZ NOT NULL,
  budget_estimate NUMERIC(15,2),
  currency        TEXT NOT NULL DEFAULT 'INR',
  created_by      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at    TIMESTAMPTZ,
  closed_at       TIMESTAMPTZ
);
CREATE OR REPLACE FUNCTION generate_rfq_number() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.rfq_number IS NULL OR NEW.rfq_number = '' THEN
    NEW.rfq_number := 'RFQ-' || TO_CHAR(NOW(),'YYYY') || '-' || LPAD(nextval('rfq_seq')::TEXT,5,'0');
  END IF; RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS set_rfq_number ON public.rfqs;
CREATE TRIGGER set_rfq_number BEFORE INSERT ON public.rfqs FOR EACH ROW EXECUTE FUNCTION generate_rfq_number();

-- 5. RFQ Items
CREATE TABLE IF NOT EXISTS public.rfq_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id      UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  item_name   TEXT NOT NULL,
  description TEXT,
  quantity    NUMERIC(12,3) NOT NULL CHECK (quantity > 0),
  unit        TEXT NOT NULL DEFAULT 'units',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Quotations
CREATE SEQUENCE IF NOT EXISTS quotation_seq START 17;
CREATE TABLE IF NOT EXISTS public.quotations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_number TEXT NOT NULL UNIQUE DEFAULT '',
  rfq_id           UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE RESTRICT,
  vendor_id        UUID NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  status           quo_status NOT NULL DEFAULT 'pending',
  validity_days    INTEGER NOT NULL DEFAULT 30,
  subtotal         NUMERIC(15,2) NOT NULL DEFAULT 0,
  cgst_rate        NUMERIC(5,2) NOT NULL DEFAULT 9,
  cgst_amount      NUMERIC(15,2) NOT NULL DEFAULT 0,
  sgst_rate        NUMERIC(5,2) NOT NULL DEFAULT 9,
  sgst_amount      NUMERIC(15,2) NOT NULL DEFAULT 0,
  igst_rate        NUMERIC(5,2) NOT NULL DEFAULT 0,
  igst_amount      NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_amount     NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency         TEXT NOT NULL DEFAULT 'INR',
  delivery_days    INTEGER,
  payment_terms    TEXT,
  notes            TEXT,
  created_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  submitted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (rfq_id, vendor_id)
);
CREATE OR REPLACE FUNCTION generate_quotation_number() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.quotation_number IS NULL OR NEW.quotation_number = '' THEN
    NEW.quotation_number := 'QUO-' || TO_CHAR(NOW(),'YYYY') || '-' || LPAD(nextval('quotation_seq')::TEXT,5,'0');
  END IF; RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS set_quotation_number ON public.quotations;
CREATE TRIGGER set_quotation_number BEFORE INSERT ON public.quotations FOR EACH ROW EXECUTE FUNCTION generate_quotation_number();

-- 7. Approvals
CREATE TABLE IF NOT EXISTS public.approvals (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id  UUID NOT NULL REFERENCES public.quotations(id) ON DELETE RESTRICT,
  status        approval_status NOT NULL DEFAULT 'pending',
  requested_by  UUID NOT NULL REFERENCES public.profiles(id),
  actioned_by   UUID REFERENCES public.profiles(id),
  remarks       TEXT,
  requested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actioned_at   TIMESTAMPTZ
);

-- 8. Purchase Orders
CREATE SEQUENCE IF NOT EXISTS po_seq START 8;
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_number        TEXT NOT NULL UNIQUE DEFAULT '',
  quotation_id     UUID NOT NULL UNIQUE REFERENCES public.quotations(id) ON DELETE RESTRICT,
  vendor_id        UUID NOT NULL REFERENCES public.vendors(id),
  status           po_status NOT NULL DEFAULT 'draft',
  subtotal         NUMERIC(15,2) NOT NULL,
  tax_amount       NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_amount     NUMERIC(15,2) NOT NULL,
  currency         TEXT NOT NULL DEFAULT 'INR',
  delivery_address TEXT,
  delivery_date    DATE,
  payment_terms    TEXT,
  notes            TEXT,
  created_by       UUID NOT NULL REFERENCES public.profiles(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fulfilled_at     TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE OR REPLACE FUNCTION generate_po_number() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.po_number IS NULL OR NEW.po_number = '' THEN
    NEW.po_number := 'PO-' || TO_CHAR(NOW(),'YYYY') || '-' || LPAD(nextval('po_seq')::TEXT,5,'0');
  END IF; RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS set_po_number ON public.purchase_orders;
CREATE TRIGGER set_po_number BEFORE INSERT ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION generate_po_number();

-- 9. Invoices
CREATE SEQUENCE IF NOT EXISTS invoice_seq START 10;
CREATE TABLE IF NOT EXISTS public.invoices (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number     TEXT NOT NULL UNIQUE DEFAULT '',
  po_id              UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE RESTRICT,
  vendor_id          UUID NOT NULL REFERENCES public.vendors(id),
  status             invoice_status NOT NULL DEFAULT 'draft',
  subtotal           NUMERIC(15,2) NOT NULL,
  cgst_amount        NUMERIC(15,2) NOT NULL DEFAULT 0,
  sgst_amount        NUMERIC(15,2) NOT NULL DEFAULT 0,
  igst_amount        NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_tax          NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_amount       NUMERIC(15,2) NOT NULL,
  currency           TEXT NOT NULL DEFAULT 'INR',
  due_date           DATE,
  paid_at            TIMESTAMPTZ,
  payment_reference  TEXT,
  notes              TEXT,
  created_by         UUID NOT NULL REFERENCES public.profiles(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE OR REPLACE FUNCTION generate_invoice_number() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'INV-' || TO_CHAR(NOW(),'YYYY') || '-' || LPAD(nextval('invoice_seq')::TEXT,5,'0');
  END IF; RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS set_invoice_number ON public.invoices;
CREATE TRIGGER set_invoice_number BEFORE INSERT ON public.invoices FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

-- 10. Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type  TEXT NOT NULL,
  entity_id    TEXT NOT NULL,
  action       TEXT NOT NULL,
  description  TEXT NOT NULL,
  performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address   TEXT
);

-- 11. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type       TEXT NOT NULL DEFAULT 'info',
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfqs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications    ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Vendor categories (public read)
DROP POLICY IF EXISTS "cat_select" ON public.vendor_categories;
CREATE POLICY "cat_select" ON public.vendor_categories FOR SELECT USING (auth.role() = 'authenticated');

-- Vendors
DROP POLICY IF EXISTS "vendors_select" ON public.vendors;
CREATE POLICY "vendors_select" ON public.vendors FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "vendors_insert" ON public.vendors;
CREATE POLICY "vendors_insert" ON public.vendors FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "vendors_update" ON public.vendors;
CREATE POLICY "vendors_update" ON public.vendors FOR UPDATE USING (auth.role() = 'authenticated');

-- RFQs
DROP POLICY IF EXISTS "rfqs_select" ON public.rfqs;
CREATE POLICY "rfqs_select" ON public.rfqs FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "rfqs_insert" ON public.rfqs;
CREATE POLICY "rfqs_insert" ON public.rfqs FOR INSERT WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "rfqs_update" ON public.rfqs;
CREATE POLICY "rfqs_update" ON public.rfqs FOR UPDATE USING (auth.role() = 'authenticated');

-- RFQ Items
DROP POLICY IF EXISTS "rfq_items_select" ON public.rfq_items;
CREATE POLICY "rfq_items_select" ON public.rfq_items FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "rfq_items_insert" ON public.rfq_items;
CREATE POLICY "rfq_items_insert" ON public.rfq_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Quotations
DROP POLICY IF EXISTS "quo_select" ON public.quotations;
CREATE POLICY "quo_select" ON public.quotations FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "quo_insert" ON public.quotations;
CREATE POLICY "quo_insert" ON public.quotations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "quo_update" ON public.quotations;
CREATE POLICY "quo_update" ON public.quotations FOR UPDATE USING (auth.role() = 'authenticated');

-- Approvals
DROP POLICY IF EXISTS "approvals_select" ON public.approvals;
CREATE POLICY "approvals_select" ON public.approvals FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "approvals_insert" ON public.approvals;
CREATE POLICY "approvals_insert" ON public.approvals FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "approvals_update" ON public.approvals;
CREATE POLICY "approvals_update" ON public.approvals FOR UPDATE USING (auth.role() = 'authenticated');

-- Purchase Orders
DROP POLICY IF EXISTS "po_select" ON public.purchase_orders;
CREATE POLICY "po_select" ON public.purchase_orders FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "po_insert" ON public.purchase_orders;
CREATE POLICY "po_insert" ON public.purchase_orders FOR INSERT WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "po_update" ON public.purchase_orders;
CREATE POLICY "po_update" ON public.purchase_orders FOR UPDATE USING (auth.role() = 'authenticated');

-- Invoices
DROP POLICY IF EXISTS "inv_select" ON public.invoices;
CREATE POLICY "inv_select" ON public.invoices FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "inv_insert" ON public.invoices;
CREATE POLICY "inv_insert" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "inv_update" ON public.invoices;
CREATE POLICY "inv_update" ON public.invoices FOR UPDATE USING (auth.role() = 'authenticated');

-- Activity Logs
DROP POLICY IF EXISTS "activity_select" ON public.activity_logs;
CREATE POLICY "activity_select" ON public.activity_logs FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "activity_insert" ON public.activity_logs;
CREATE POLICY "activity_insert" ON public.activity_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Notifications
DROP POLICY IF EXISTS "notif_select" ON public.notifications;
CREATE POLICY "notif_select" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "notif_update" ON public.notifications;
CREATE POLICY "notif_update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "notif_insert" ON public.notifications;
CREATE POLICY "notif_insert" ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- SEED: Vendor Categories (safe to run now)
-- ============================================================
INSERT INTO public.vendor_categories (name, description) VALUES
  ('IT & Software',        'Hardware, software licenses, SaaS, cloud'),
  ('Office Supplies',      'Stationery, furniture, consumables'),
  ('Logistics',            'Courier, shipping, 3PL warehousing'),
  ('Facility Management',  'Cleaning, security, AMC, repairs'),
  ('Electrical & Power',   'UPS, DG sets, cables, BMS automation'),
  ('Civil & Construction', 'Civil works, interiors, fit-outs'),
  ('Packaging',            'Corrugated boxes, eco-packaging, mailers'),
  ('Consulting & IT Services', 'ERP, cloud migration, managed services')
ON CONFLICT (name) DO NOTHING;
