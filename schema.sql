-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CUSTOM ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'procurement_officer', 'manager', 'vendor');
CREATE TYPE vendor_status AS ENUM ('pending', 'active', 'suspended', 'blacklisted');
CREATE TYPE rfq_status AS ENUM ('draft', 'published', 'closed', 'cancelled');
CREATE TYPE quotation_status AS ENUM ('submitted', 'under_review', 'shortlisted', 'rejected', 'awarded');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'escalated');
CREATE TYPE po_status AS ENUM ('draft', 'issued', 'acknowledged', 'fulfilled', 'cancelled');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
CREATE TYPE activity_entity AS ENUM ('rfq', 'quotation', 'approval', 'purchase_order', 'invoice', 'vendor', 'user');

-- CORE TABLES

-- 1. Profiles (Linked to auth.users)
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

-- Trigger to auto-create profile on Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'procurement_officer')
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
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
  address_line2       TEXT,
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
  user_id             UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by          UUID NOT NULL, -- references profiles.id but we decouple validation for demo fallbacks
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
  created_by          UUID NOT NULL,
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
  NEW.rfq_number := 'RFQ-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('rfq_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER set_rfq_number
  BEFORE INSERT ON public.rfqs
  FOR EACH ROW EXECUTE FUNCTION generate_rfq_number();

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
  delivery_terms      TEXT,
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
  NEW.quotation_number := 'QUO-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('quotation_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER set_quotation_number
  BEFORE INSERT ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION generate_quotation_number();

-- 7. Quotation Line Items
CREATE TABLE IF NOT EXISTS public.quotation_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id    UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  rfq_item_id     UUID REFERENCES public.rfq_items(id) ON DELETE SET NULL,
  item_name       TEXT NOT NULL,
  description     TEXT,
  quantity        NUMERIC(12, 3) NOT NULL,
  unit            TEXT NOT NULL,
  unit_price      NUMERIC(15, 2) NOT NULL CHECK (unit_price >= 0),
  tax_rate        NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
  tax_amount      NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_price     NUMERIC(15, 2) NOT NULL DEFAULT 0,
  sort_order      INTEGER NOT NULL DEFAULT 0
);

-- 8. Approvals
CREATE TABLE IF NOT EXISTS public.approvals (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id        UUID NOT NULL REFERENCES public.quotations(id) ON DELETE RESTRICT,
  status              approval_status NOT NULL DEFAULT 'pending',
  requested_by        UUID NOT NULL,
  approver_id         UUID,
  remarks             TEXT,
  rejection_reason    TEXT,
  requested_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actioned_at         TIMESTAMPTZ,
  escalated_to        UUID,
  escalated_at        TIMESTAMPTZ,
  escalation_reason   TEXT
);

-- 9. Purchase Orders (POs)
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
  issued_by           UUID NOT NULL,
  issued_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at     TIMESTAMPTZ,
  fulfilled_at        TIMESTAMPTZ,
  notes               TEXT,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PO Auto numbering
CREATE SEQUENCE IF NOT EXISTS po_seq START 1;
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.po_number := 'PO-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('po_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER set_po_number
  BEFORE INSERT ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION generate_po_number();

-- 10. Purchase Order Items
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_id               UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  quotation_item_id   UUID REFERENCES public.quotation_items(id) ON DELETE SET NULL,
  item_name           TEXT NOT NULL,
  description         TEXT,
  quantity            NUMERIC(12, 3) NOT NULL,
  unit                TEXT NOT NULL,
  unit_price          NUMERIC(15, 2) NOT NULL,
  tax_rate            NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
  tax_amount          NUMERIC(15, 2) NOT NULL,
  total_price         NUMERIC(15, 2) NOT NULL,
  sort_order          INTEGER NOT NULL DEFAULT 0
);

-- 11. Invoices
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
  email_sent          BOOLEAN NOT NULL DEFAULT FALSE,
  email_sent_at       TIMESTAMPTZ,
  email_sent_to       TEXT,
  pdf_url             TEXT,
  created_by          UUID NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes               TEXT
);

-- Invoice Auto numbering
CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1;
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('invoice_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER set_invoice_number
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

-- 12. Invoice Line Items
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id      UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  po_item_id      UUID REFERENCES public.purchase_order_items(id) ON DELETE SET NULL,
  item_name       TEXT NOT NULL,
  description     TEXT,
  hsn_code        TEXT,
  quantity        NUMERIC(12, 3) NOT NULL,
  unit            TEXT NOT NULL,
  unit_price      NUMERIC(15, 2) NOT NULL,
  cgst_rate       NUMERIC(5, 2) NOT NULL DEFAULT 9.00,
  sgst_rate       NUMERIC(5, 2) NOT NULL DEFAULT 9.00,
  igst_rate       NUMERIC(5, 2) NOT NULL DEFAULT 0,
  cgst_amount     NUMERIC(15, 2) NOT NULL,
  sgst_amount     NUMERIC(15, 2) NOT NULL,
  igst_amount     NUMERIC(15, 2) NOT NULL,
  total_price     NUMERIC(15, 2) NOT NULL,
  sort_order      INTEGER NOT NULL DEFAULT 0
);

-- 13. Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type     activity_entity NOT NULL,
  entity_id       UUID NOT NULL,
  action          TEXT NOT NULL,
  description     TEXT NOT NULL,
  old_value       JSONB,
  new_value       JSONB,
  performed_by    UUID,
  performed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address      INET,
  user_agent      TEXT
);

-- 14. Notifications
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

-- ROW LEVEL SECURITY (RLS) ACTIVATION
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

-- SEED CATEGORIES
INSERT INTO public.vendor_categories (name, description) VALUES
  ('IT & Software', 'Software, hardware, licenses, SaaS'),
  ('Office Supplies', 'Stationery, furniture, consumables'),
  ('Logistics', 'Courier, shipping, warehousing'),
  ('Marketing', 'Design, printing, advertisements'),
  ('Maintenance', 'Facility, repairs, AMC agreements')
ON CONFLICT (name) DO NOTHING;
