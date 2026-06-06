-- ============================================================
-- VendorBridge Full Schema + Demo Seed Data
-- Run this in the Supabase SQL Editor
-- ============================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CUSTOM ENUMS (safe re-creation)
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('admin', 'procurement_officer', 'manager', 'vendor'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE vendor_status AS ENUM ('pending', 'active', 'suspended', 'blacklisted'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE rfq_status AS ENUM ('draft', 'published', 'closed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE quotation_status AS ENUM ('submitted', 'under_review', 'shortlisted', 'rejected', 'awarded'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'escalated'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE po_status AS ENUM ('draft', 'issued', 'acknowledged', 'fulfilled', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE activity_entity AS ENUM ('rfq', 'quotation', 'approval', 'purchase_order', 'invoice', 'vendor', 'user'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================
-- CORE TABLES
-- ============================================================

-- 1. Profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  role            user_role NOT NULL DEFAULT 'procurement_officer',
  avatar_url      TEXT,
  phone           TEXT,
  department      TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'procurement_officer')
  )
  ON CONFLICT (id) DO NOTHING;
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
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name        TEXT NOT NULL,
  category_id         UUID REFERENCES public.vendor_categories(id) ON DELETE SET NULL,
  status              vendor_status NOT NULL DEFAULT 'pending',
  contact_person      TEXT NOT NULL,
  email               TEXT NOT NULL UNIQUE,
  phone               TEXT NOT NULL,
  website             TEXT,
  address_line1       TEXT,
  city                TEXT,
  state               TEXT,
  country             TEXT NOT NULL DEFAULT 'India',
  pincode             TEXT,
  gst_number          TEXT UNIQUE,
  pan_number          TEXT,
  msme_registered     BOOLEAN DEFAULT FALSE,
  rating              NUMERIC(3, 2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_orders        INTEGER NOT NULL DEFAULT 0,
  notes               TEXT,
  created_by          UUID, -- scoped to the user who created it
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Request For Quotations (RFQs)
CREATE TABLE IF NOT EXISTS public.rfqs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_number          TEXT NOT NULL UNIQUE,
  title               TEXT NOT NULL,
  description         TEXT,
  status              rfq_status NOT NULL DEFAULT 'draft',
  deadline            TIMESTAMPTZ NOT NULL,
  budget_estimate     NUMERIC(15, 2),
  currency            TEXT NOT NULL DEFAULT 'INR',
  created_by          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at        TIMESTAMPTZ,
  closed_at           TIMESTAMPTZ
);

-- RFQ Auto numbering
CREATE SEQUENCE IF NOT EXISTS rfq_seq START 1;
CREATE OR REPLACE FUNCTION generate_rfq_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.rfq_number IS NULL OR NEW.rfq_number = '' THEN
    NEW.rfq_number := 'RFQ-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('rfq_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS set_rfq_number ON public.rfqs;
CREATE TRIGGER set_rfq_number BEFORE INSERT ON public.rfqs FOR EACH ROW EXECUTE FUNCTION generate_rfq_number();

-- 5. RFQ Line Items
CREATE TABLE IF NOT EXISTS public.rfq_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id          UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  item_name       TEXT NOT NULL,
  description     TEXT,
  quantity        NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
  unit            TEXT NOT NULL DEFAULT 'unit',
  specifications  TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Quotations
CREATE TABLE IF NOT EXISTS public.quotations (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_number    TEXT NOT NULL UNIQUE,
  rfq_id              UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE RESTRICT,
  vendor_id           UUID NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  status              quotation_status NOT NULL DEFAULT 'submitted',
  subtotal            NUMERIC(15, 2) NOT NULL DEFAULT 0,
  tax_amount          NUMERIC(15, 2) NOT NULL DEFAULT 0,
  discount_amount     NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_amount        NUMERIC(15, 2) NOT NULL DEFAULT 0,
  currency            TEXT NOT NULL DEFAULT 'INR',
  delivery_days       INTEGER,
  payment_terms       TEXT,
  validity_days       INTEGER NOT NULL DEFAULT 30,
  notes               TEXT,
  submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (rfq_id, vendor_id)
);

-- Quotation Auto numbering
CREATE SEQUENCE IF NOT EXISTS quotation_seq START 1;
CREATE OR REPLACE FUNCTION generate_quotation_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.quotation_number IS NULL OR NEW.quotation_number = '' THEN
    NEW.quotation_number := 'QUO-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('quotation_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS set_quotation_number ON public.quotations;
CREATE TRIGGER set_quotation_number BEFORE INSERT ON public.quotations FOR EACH ROW EXECUTE FUNCTION generate_quotation_number();

-- 7. Approvals
CREATE TABLE IF NOT EXISTS public.approvals (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id        UUID NOT NULL REFERENCES public.quotations(id) ON DELETE RESTRICT,
  status              approval_status NOT NULL DEFAULT 'pending',
  requested_by        UUID NOT NULL REFERENCES public.profiles(id),
  approver_id         UUID REFERENCES public.profiles(id),
  remarks             TEXT,
  rejection_reason    TEXT,
  requested_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actioned_at         TIMESTAMPTZ
);

-- 8. Purchase Orders (POs)
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_number           TEXT NOT NULL UNIQUE,
  quotation_id        UUID NOT NULL UNIQUE REFERENCES public.quotations(id) ON DELETE RESTRICT,
  vendor_id           UUID NOT NULL REFERENCES public.vendors(id),
  status              po_status NOT NULL DEFAULT 'draft',
  subtotal            NUMERIC(15, 2) NOT NULL,
  tax_amount          NUMERIC(15, 2) NOT NULL DEFAULT 0,
  discount_amount     NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_amount        NUMERIC(15, 2) NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'INR',
  delivery_address    TEXT,
  delivery_date       DATE,
  payment_terms       TEXT,
  issued_by           UUID NOT NULL REFERENCES public.profiles(id),
  issued_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fulfilled_at        TIMESTAMPTZ,
  notes               TEXT,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PO Auto numbering
CREATE SEQUENCE IF NOT EXISTS po_seq START 1;
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.po_number IS NULL OR NEW.po_number = '' THEN
    NEW.po_number := 'PO-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('po_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS set_po_number ON public.purchase_orders;
CREATE TRIGGER set_po_number BEFORE INSERT ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION generate_po_number();

-- 9. Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number      TEXT NOT NULL UNIQUE,
  po_id               UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE RESTRICT,
  vendor_id           UUID NOT NULL REFERENCES public.vendors(id),
  status              invoice_status NOT NULL DEFAULT 'draft',
  subtotal            NUMERIC(15, 2) NOT NULL,
  cgst_amount         NUMERIC(15, 2) NOT NULL DEFAULT 0,
  sgst_amount         NUMERIC(15, 2) NOT NULL DEFAULT 0,
  igst_amount         NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_tax           NUMERIC(15, 2) NOT NULL DEFAULT 0,
  discount_amount     NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_amount        NUMERIC(15, 2) NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'INR',
  due_date            DATE,
  paid_at             TIMESTAMPTZ,
  payment_reference   TEXT,
  created_by          UUID NOT NULL REFERENCES public.profiles(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes               TEXT
);

-- Invoice Auto numbering
CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1;
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('invoice_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS set_invoice_number ON public.invoices;
CREATE TRIGGER set_invoice_number BEFORE INSERT ON public.invoices FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

-- 10. Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type     activity_entity NOT NULL,
  entity_id       UUID NOT NULL,
  action          TEXT NOT NULL,
  description     TEXT NOT NULL,
  old_value       JSONB,
  new_value       JSONB,
  performed_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  performed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address      INET,
  user_agent      TEXT
);

-- 11. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  message         TEXT NOT NULL,
  type            TEXT NOT NULL,
  entity_type     activity_entity,
  entity_id       UUID,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update only their own
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- RFQs: all authenticated users can read; only creator can edit/delete
DROP POLICY IF EXISTS "rfqs_select" ON public.rfqs;
CREATE POLICY "rfqs_select" ON public.rfqs FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "rfqs_insert" ON public.rfqs;
CREATE POLICY "rfqs_insert" ON public.rfqs FOR INSERT WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "rfqs_update" ON public.rfqs;
CREATE POLICY "rfqs_update" ON public.rfqs FOR UPDATE USING (auth.uid() = created_by);
DROP POLICY IF EXISTS "rfqs_delete" ON public.rfqs;
CREATE POLICY "rfqs_delete" ON public.rfqs FOR DELETE USING (auth.uid() = created_by);

-- RFQ Items: follow RFQ access
DROP POLICY IF EXISTS "rfq_items_select" ON public.rfq_items;
CREATE POLICY "rfq_items_select" ON public.rfq_items FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "rfq_items_insert" ON public.rfq_items;
CREATE POLICY "rfq_items_insert" ON public.rfq_items FOR INSERT WITH CHECK (
  auth.uid() = (SELECT created_by FROM public.rfqs WHERE id = rfq_id)
);

-- Vendors: all auth can read; managers/admins can manage
DROP POLICY IF EXISTS "vendors_select" ON public.vendors;
CREATE POLICY "vendors_select" ON public.vendors FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "vendors_insert" ON public.vendors;
CREATE POLICY "vendors_insert" ON public.vendors FOR INSERT WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "vendors_update" ON public.vendors;
CREATE POLICY "vendors_update" ON public.vendors FOR UPDATE USING (auth.role() = 'authenticated');

-- Quotations: all authenticated can view
DROP POLICY IF EXISTS "quotations_select" ON public.quotations;
CREATE POLICY "quotations_select" ON public.quotations FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "quotations_insert" ON public.quotations;
CREATE POLICY "quotations_insert" ON public.quotations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "quotations_update" ON public.quotations;
CREATE POLICY "quotations_update" ON public.quotations FOR UPDATE USING (auth.role() = 'authenticated');

-- Approvals
DROP POLICY IF EXISTS "approvals_select" ON public.approvals;
CREATE POLICY "approvals_select" ON public.approvals FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "approvals_update" ON public.approvals;
CREATE POLICY "approvals_update" ON public.approvals FOR UPDATE USING (
  auth.uid() = approver_id OR auth.uid() = requested_by
);

-- Purchase Orders
DROP POLICY IF EXISTS "pos_select" ON public.purchase_orders;
CREATE POLICY "pos_select" ON public.purchase_orders FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "pos_insert" ON public.purchase_orders;
CREATE POLICY "pos_insert" ON public.purchase_orders FOR INSERT WITH CHECK (auth.uid() = issued_by);
DROP POLICY IF EXISTS "pos_update" ON public.purchase_orders;
CREATE POLICY "pos_update" ON public.purchase_orders FOR UPDATE USING (auth.role() = 'authenticated');

-- Invoices
DROP POLICY IF EXISTS "invoices_select" ON public.invoices;
CREATE POLICY "invoices_select" ON public.invoices FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "invoices_insert" ON public.invoices;
CREATE POLICY "invoices_insert" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "invoices_update" ON public.invoices;
CREATE POLICY "invoices_update" ON public.invoices FOR UPDATE USING (auth.role() = 'authenticated');

-- Activity Logs
DROP POLICY IF EXISTS "activity_select" ON public.activity_logs;
CREATE POLICY "activity_select" ON public.activity_logs FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "activity_insert" ON public.activity_logs;
CREATE POLICY "activity_insert" ON public.activity_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Notifications: user can only see their own
DROP POLICY IF EXISTS "notif_select" ON public.notifications;
CREATE POLICY "notif_select" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "notif_update" ON public.notifications;
CREATE POLICY "notif_update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Vendor Categories
INSERT INTO public.vendor_categories (name, description) VALUES
  ('IT & Software', 'Software, hardware, licenses, SaaS'),
  ('Office Supplies', 'Stationery, furniture, consumables'),
  ('Logistics', 'Courier, shipping, warehousing'),
  ('Marketing', 'Design, printing, advertisements'),
  ('Maintenance', 'Facility, repairs, AMC agreements')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- DEMO USERS SETUP INSTRUCTIONS
-- ============================================================
-- After running this script, create 3 users in the Supabase Auth dashboard:
--
-- 1. alex.mercer@vendorbridge.io  | Password: Admin@123   | Role: admin
-- 2. sarah.connor@vendorbridge.io | Password: Manager@123 | Role: manager  
-- 3. raj.kumar@vendorbridge.io    | Password: Procure@123 | Role: procurement_officer
--
-- Then run the DEMO DATA seeding below, replacing the UUIDs with the actual
-- profile IDs that were auto-created for those users.
--
-- To get the IDs: SELECT id, email FROM public.profiles;
-- ============================================================

-- ============================================================
-- DEMO DATA (run after creating auth users above)
-- Replace ADMIN_UUID, MANAGER_UUID, OFFICER_UUID with real IDs
-- ============================================================

-- Example seed data (copy and modify UUIDs after creating auth users):
/*
DO $$
DECLARE
  admin_id UUID := 'REPLACE_WITH_ALEX_PROFILE_ID';
  manager_id UUID := 'REPLACE_WITH_SARAH_PROFILE_ID';
  officer_id UUID := 'REPLACE_WITH_RAJ_PROFILE_ID';
  cat_it UUID;
  cat_office UUID;
  cat_logistics UUID;
  vendor1_id UUID;
  vendor2_id UUID;
  vendor3_id UUID;
  rfq1_id UUID;
  rfq2_id UUID;
  quo1_id UUID;
  quo2_id UUID;
  po1_id UUID;
BEGIN
  -- Update profiles with rich details
  UPDATE public.profiles SET department = 'Administration & IT', phone = '+91 98765 43210', avatar_url = 'https://i.pravatar.cc/150?u=alex' WHERE id = admin_id;
  UPDATE public.profiles SET department = 'Management', phone = '+91 98765 43211' WHERE id = manager_id;
  UPDATE public.profiles SET department = 'Procurement & Logistics', phone = '+91 98765 43212' WHERE id = officer_id;

  SELECT id INTO cat_it FROM public.vendor_categories WHERE name = 'IT & Software';
  SELECT id INTO cat_office FROM public.vendor_categories WHERE name = 'Office Supplies';
  SELECT id INTO cat_logistics FROM public.vendor_categories WHERE name = 'Logistics';

  -- Vendors
  INSERT INTO public.vendors (company_name, category_id, status, contact_person, email, phone, city, state, gst_number, rating, total_orders, created_by)
  VALUES
    ('Apex Tech Solutions', cat_it, 'active', 'Karan Mehta', 'contact@apextech.io', '+91 22 4000 1111', 'Mumbai', 'Maharashtra', '27AABCU9603R1ZX', 4.8, 12, admin_id),
    ('SwiftOffice Supplies', cat_office, 'active', 'Priya Sharma', 'info@swiftoffice.com', '+91 11 4000 2222', 'New Delhi', 'Delhi', '07AAECS4583Q1ZK', 4.2, 8, officer_id),
    ('QuickShip Logistics', cat_logistics, 'pending', 'Amit Patel', 'ops@quickship.in', '+91 79 4000 3333', 'Ahmedabad', 'Gujarat', NULL, 3.9, 3, officer_id)
  RETURNING id INTO vendor1_id;

  SELECT id INTO vendor1_id FROM public.vendors WHERE email = 'contact@apextech.io';
  SELECT id INTO vendor2_id FROM public.vendors WHERE email = 'info@swiftoffice.com';
  SELECT id INTO vendor3_id FROM public.vendors WHERE email = 'ops@quickship.in';

  -- RFQs
  INSERT INTO public.rfqs (title, description, status, deadline, budget_estimate, created_by, published_at)
  VALUES
    ('Server Hardware Upgrade - FY26', 'Procurement of 4x rack servers, networking switches, and UPS systems for HQ data centre.', 'published', NOW() + INTERVAL '30 days', 1200000, admin_id, NOW() - INTERVAL '3 days'),
    ('Office Ergonomic Chairs - 50 Units', 'Supply of 50 ergonomic office chairs with lumbar support for the new floor expansion.', 'closed', NOW() - INTERVAL '5 days', 320000, officer_id, NOW() - INTERVAL '20 days')
  RETURNING id INTO rfq1_id;

  SELECT id INTO rfq1_id FROM public.rfqs WHERE title LIKE 'Server Hardware%';
  SELECT id INTO rfq2_id FROM public.rfqs WHERE title LIKE 'Office Ergonomic%';

  -- Quotations for RFQ1
  INSERT INTO public.quotations (rfq_id, vendor_id, status, subtotal, tax_amount, total_amount, delivery_days, payment_terms, notes)
  VALUES
    (rfq1_id, vendor1_id, 'awarded', 700000, 126000, 826000, 21, 'Net 30', 'Best pricing with 3-year AMC included.'),
    (rfq1_id, vendor2_id, 'rejected', 780000, 140400, 920400, 30, 'Net 45', 'Higher quote but better warranty.')
  RETURNING id INTO quo1_id;

  SELECT id INTO quo1_id FROM public.quotations WHERE vendor_id = vendor1_id AND rfq_id = rfq1_id;

  -- Quotations for RFQ2
  INSERT INTO public.quotations (rfq_id, vendor_id, status, subtotal, tax_amount, total_amount, delivery_days, payment_terms, notes)
  VALUES
    (rfq2_id, vendor2_id, 'awarded', 270000, 48600, 318600, 14, 'Advance 50%', 'ISO certified supplier, fast delivery.')
  RETURNING id INTO quo2_id;

  SELECT id INTO quo2_id FROM public.quotations WHERE rfq_id = rfq2_id;

  -- Approvals
  INSERT INTO public.approvals (quotation_id, status, requested_by, approver_id, remarks, actioned_at)
  VALUES
    (quo1_id, 'approved', officer_id, manager_id, 'Approved after cost review and vendor background check.', NOW() - INTERVAL '2 days'),
    (quo2_id, 'approved', officer_id, manager_id, 'Approved with condition: delivery before month-end.', NOW() - INTERVAL '10 days');

  -- Purchase Orders
  INSERT INTO public.purchase_orders (quotation_id, vendor_id, status, subtotal, tax_amount, total_amount, delivery_address, delivery_date, payment_terms, issued_by)
  VALUES
    (quo1_id, vendor1_id, 'issued', 700000, 126000, 826000, 'VendorBridge HQ, Bandra Kurla Complex, Mumbai - 400051', (NOW() + INTERVAL '21 days')::DATE, 'Net 30', admin_id),
    (quo2_id, vendor2_id, 'fulfilled', 270000, 48600, 318600, 'VendorBridge Branch, Connaught Place, New Delhi - 110001', (NOW() - INTERVAL '2 days')::DATE, 'Advance 50%', officer_id)
  RETURNING id INTO po1_id;

  SELECT id INTO po1_id FROM public.purchase_orders WHERE vendor_id = vendor1_id;

  -- Invoices
  INSERT INTO public.invoices (po_id, vendor_id, status, subtotal, cgst_amount, sgst_amount, total_tax, total_amount, due_date, created_by, notes)
  VALUES
    (po1_id, vendor1_id, 'sent', 700000, 63000, 63000, 126000, 826000, (NOW() + INTERVAL '30 days')::DATE, admin_id, 'Invoice for server hardware batch 1 of 2.');

  -- Activity Logs
  INSERT INTO public.activity_logs (entity_type, entity_id, action, description, performed_by)
  VALUES
    ('rfq', rfq1_id, 'PUBLISH', 'Published RFQ: Server Hardware Upgrade - FY26', admin_id),
    ('rfq', rfq2_id, 'CLOSE', 'Closed RFQ: Office Ergonomic Chairs after receiving bids', officer_id),
    ('vendor', vendor1_id, 'REGISTER', 'Registered vendor: Apex Tech Solutions (IT & Software)', admin_id),
    ('quotation', quo1_id, 'AWARD', 'Awarded quotation QUO to Apex Tech Solutions for ₹8,26,000', admin_id),
    ('purchase_order', po1_id, 'ISSUE', 'Issued Purchase Order PO to Apex Tech Solutions', admin_id);

  -- Notifications for admin
  INSERT INTO public.notifications (user_id, title, message, type, entity_type, entity_id)
  VALUES
    (admin_id, 'Approval Complete', 'Sarah Connor approved PO for Apex Tech Solutions.', 'success', 'purchase_order', po1_id),
    (manager_id, 'Approval Request', 'Raj Kumar requested approval for Server Hardware quotation.', 'warning', 'quotation', quo1_id),
    (officer_id, 'RFQ Deadline Approaching', 'Server Hardware RFQ deadline in 3 days.', 'info', 'rfq', rfq1_id);

END $$;
*/
