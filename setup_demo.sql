-- ============================================================
-- VendorBridge — Hardcoded Users & Full Seed Script
-- Paste into Supabase SQL Editor.
-- This creates 4 hardcoded users with predefined passwords
-- and populates all tables with rich data.
-- ============================================================

-- Enable pgcrypto for password hashing if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  -- Hardcoded UUIDs for the demo users
  u_admin UUID := '00000000-0000-0000-0000-000000000001';
  u_mgr   UUID := '00000000-0000-0000-0000-000000000002';
  u_proc  UUID := '00000000-0000-0000-0000-000000000003';
  u_vend  UUID := '00000000-0000-0000-0000-000000000004';

  -- Category IDs
  cat_it   UUID;
  cat_off  UUID;
  cat_log  UUID;

  -- Vendor IDs
  vid_apex  UUID := gen_random_uuid();
  vid_swift UUID := gen_random_uuid();
  vid_supe  UUID := gen_random_uuid();

  -- RFQ IDs
  rfq1 UUID := gen_random_uuid();
  rfq2 UUID := gen_random_uuid();

  -- Quotation IDs
  quo1 UUID := gen_random_uuid();
  quo2 UUID := gen_random_uuid();

  -- PO IDs
  po1 UUID := gen_random_uuid();

  -- Invoice IDs
  inv1 UUID := gen_random_uuid();

BEGIN

  -- 1. CLEAN UP EXISTING DEMO USERS (Safely allows re-running)
  DELETE FROM auth.users WHERE id IN (u_admin, u_mgr, u_proc, u_vend);

  -- 2. CREATE HARDCODED AUTH.USERS
  -- Passwords for all users will be 'Admin@123'
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES
  (u_admin, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@vendorbridge.io', crypt('Admin@123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Alex Mercer", "role":"admin"}', NOW(), NOW()),
  (u_mgr, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'manager@vendorbridge.io', crypt('Admin@123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sarah Connor", "role":"manager"}', NOW(), NOW()),
  (u_proc, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'procurement@vendorbridge.io', crypt('Admin@123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Raj Kumar", "role":"procurement_officer"}', NOW(), NOW()),
  (u_vend, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'vendor@vendorbridge.io', crypt('Admin@123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Vendor Apex", "role":"vendor"}', NOW(), NOW());

  -- Update profiles explicitly just in case trigger didn't fire with correct data
  UPDATE public.profiles SET full_name = 'Alex Mercer (Admin)', role = 'admin', department = 'Executive Office' WHERE id = u_admin;
  UPDATE public.profiles SET full_name = 'Sarah Connor (Manager)', role = 'manager', department = 'Operations & IT' WHERE id = u_mgr;
  UPDATE public.profiles SET full_name = 'Raj Kumar (Procurement)', role = 'procurement_officer', department = 'Procurement & Supply' WHERE id = u_proc;
  UPDATE public.profiles SET full_name = 'Apex Vendor Rep', role = 'vendor', department = 'Sales' WHERE id = u_vend;

  -- 3. RESOLVE CATEGORIES
  SELECT id INTO cat_it   FROM public.vendor_categories WHERE name = 'IT & Software';
  SELECT id INTO cat_off  FROM public.vendor_categories WHERE name = 'Office Supplies';
  SELECT id INTO cat_log  FROM public.vendor_categories WHERE name = 'Logistics';

  -- 4. INSERT DATA
  -- Vendors
  INSERT INTO public.vendors (id, company_name, category_id, contact_person, email, phone, city, state, gst_number, status, rating, total_orders, created_by, notes)
  VALUES
    (vid_apex,  'Apex Technology Solutions', cat_it, 'Apex Vendor Rep', 'vendor@vendorbridge.io', '+91 22 6600 7700', 'Mumbai', 'Maharashtra', '27AABCA1234A1Z5', 'active', 4.8, 22, u_admin, 'Linked to vendor@vendorbridge.io.'),
    (vid_swift, 'Swift Cargo & Logistics',   cat_log,'Priyanka Sharma', 'priya@swiftlogistics.co.in', '+91 80 4455 6677', 'Bengaluru', 'Karnataka', '29AACCS9876B2Z3', 'active', 4.3, 15, u_admin, 'Pan-India 3PL logistics.'),
    (vid_supe,  'Superior Office Furnishings',cat_off,'Robert D', 'robert@superior.com', '+91 44 2233 4455', 'Chennai', 'Tamil Nadu', '33AABCS5678C3Z2', 'active', 4.6, 31, u_proc, 'Premium ergonomic seating.')
  ON CONFLICT (email) DO NOTHING;

  -- Link the vendor profile to the specific vendor company ID
  UPDATE public.profiles SET vendor_id = vid_apex WHERE id = u_vend;

  -- RFQs
  INSERT INTO public.rfqs (id, rfq_number, title, description, status, deadline, budget_estimate, created_by, published_at)
  VALUES
    (rfq1, 'RFQ-2026-00042', 'Data Centre Upgrade', 'Procurement of 8 servers for new DC.', 'published', NOW() + INTERVAL '10 days', 3200000, u_proc, NOW() - INTERVAL '2 days'),
    (rfq2, 'RFQ-2026-00043', 'Office Furniture', '80 ergonomic chairs for HO.', 'published', NOW() + INTERVAL '18 days', 1800000, u_proc, NOW() - INTERVAL '5 days')
  ON CONFLICT (rfq_number) DO NOTHING;

  -- Quotations
  INSERT INTO public.quotations (id, quotation_number, rfq_id, vendor_id, status, validity_days, subtotal, cgst_rate, cgst_amount, sgst_rate, sgst_amount, igst_rate, igst_amount, total_amount, created_by)
  VALUES
    (quo1, 'QUO-2026-00017', rfq1, vid_apex, 'approved', 30, 2750000, 9, 247500, 9, 247500, 0, 0, 3245000, u_vend),
    (quo2, 'QUO-2026-00018', rfq2, vid_supe, 'pending', 21, 1550000, 9, 139500, 9, 139500, 0, 0, 1829000, u_proc)
  ON CONFLICT (quotation_number) DO NOTHING;

  -- Approvals
  INSERT INTO public.approvals (quotation_id, status, remarks, requested_by, actioned_by, requested_at, actioned_at)
  VALUES
    (quo1, 'approved', 'Price below benchmark. L1 cleared.', u_proc, u_mgr, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 days'),
    (quo2, 'pending', 'Under L2 evaluation.', u_proc, NULL, NOW() - INTERVAL '1 days', NULL)
  ON CONFLICT DO NOTHING;

  -- Purchase Orders
  INSERT INTO public.purchase_orders (id, po_number, quotation_id, vendor_id, status, subtotal, tax_amount, total_amount, delivery_date, created_by)
  VALUES
    (po1, 'PO-2026-00009', quo1, vid_apex, 'issued', 2750000, 495000, 3245000, (NOW() + INTERVAL '18 days')::DATE, u_proc)
  ON CONFLICT (po_number) DO NOTHING;

  -- Invoices
  INSERT INTO public.invoices (id, invoice_number, po_id, vendor_id, status, subtotal, cgst_amount, sgst_amount, igst_amount, total_tax, total_amount, due_date, created_by)
  VALUES
    (inv1, 'INV-2026-00012', po1, vid_apex, 'sent', 2750000, 247500, 247500, 0, 495000, 3245000, (NOW() + INTERVAL '30 days')::DATE, u_vend)
  ON CONFLICT (invoice_number) DO NOTHING;

  -- Activity logs
  INSERT INTO public.activity_logs (entity_type, entity_id, action, description, performed_by)
  VALUES
    ('rfq', rfq1::text, 'CREATE', 'Created RFQ-2026-00042: Data Centre Upgrade', u_proc),
    ('quotation', quo1::text, 'SUBMIT', 'Quotation received from Apex Technology', u_vend),
    ('approval', quo1::text, 'APPROVE', 'Approved QUO-2026-00017.', u_mgr)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Demo Setup Complete. Use these logins with password Admin@123: admin@vendorbridge.io, manager@vendorbridge.io, procurement@vendorbridge.io, vendor@vendorbridge.io';
END $$;
