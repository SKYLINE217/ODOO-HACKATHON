-- ============================================================
-- VendorBridge — Complete Demo Seed
-- Paste into Supabase SQL Editor AFTER running schema.sql
-- and AFTER creating the 3 auth users.
-- No manual UUID replacement needed — looks up by email.
-- ============================================================

DO $$
DECLARE
  -- Resolve user IDs from email (auto-created by trigger on signup)
  v_alex   UUID;
  v_sarah  UUID;
  v_raj    UUID;

  -- Category IDs
  cat_it   UUID;
  cat_off  UUID;
  cat_log  UUID;
  cat_fac  UUID;
  cat_elec UUID;
  cat_civ  UUID;
  cat_pack UUID;
  cat_cons UUID;

  -- Vendor IDs
  vid_apex  UUID := gen_random_uuid();
  vid_swift UUID := gen_random_uuid();
  vid_supe  UUID := gen_random_uuid();
  vid_delta UUID := gen_random_uuid();
  vid_nova  UUID := gen_random_uuid();
  vid_metro UUID := gen_random_uuid();
  vid_infra UUID := gen_random_uuid();
  vid_prime UUID := gen_random_uuid();

  -- RFQ IDs
  rfq1 UUID := gen_random_uuid();
  rfq2 UUID := gen_random_uuid();
  rfq3 UUID := gen_random_uuid();
  rfq4 UUID := gen_random_uuid();
  rfq5 UUID := gen_random_uuid();

  -- Quotation IDs
  quo1 UUID := gen_random_uuid();
  quo2 UUID := gen_random_uuid();
  quo3 UUID := gen_random_uuid();
  quo4 UUID := gen_random_uuid();
  quo5 UUID := gen_random_uuid();
  quo6 UUID := gen_random_uuid();

  -- PO IDs
  po1 UUID := gen_random_uuid();
  po2 UUID := gen_random_uuid();
  po3 UUID := gen_random_uuid();
  po4 UUID := gen_random_uuid();

  -- Invoice IDs
  inv1 UUID := gen_random_uuid();
  inv2 UUID := gen_random_uuid();
  inv3 UUID := gen_random_uuid();
  inv4 UUID := gen_random_uuid();

BEGIN
  -- Resolve UUIDs from profiles table
  SELECT id INTO v_alex  FROM public.profiles WHERE email = 'alex.mercer@vendorbridge.io';
  SELECT id INTO v_sarah FROM public.profiles WHERE email = 'sarah.connor@vendorbridge.io';
  SELECT id INTO v_raj   FROM public.profiles WHERE email = 'raj.kumar@vendorbridge.io';

  IF v_alex IS NULL OR v_sarah IS NULL OR v_raj IS NULL THEN
    RAISE EXCEPTION 'One or more demo users not found in profiles. Create them in Auth first.';
  END IF;

  -- Update profiles with rich details
  UPDATE public.profiles SET
    full_name  = 'Alex Mercer',
    role       = 'admin',
    department = 'Executive Office',
    phone      = '+91 98100 11001',
    is_active  = TRUE
  WHERE id = v_alex;

  UPDATE public.profiles SET
    full_name  = 'Sarah Connor',
    role       = 'manager',
    department = 'Operations & IT',
    phone      = '+91 98200 22002',
    is_active  = TRUE
  WHERE id = v_sarah;

  UPDATE public.profiles SET
    full_name  = 'Raj Kumar',
    role       = 'procurement_officer',
    department = 'Procurement & Supply',
    phone      = '+91 98300 33003',
    is_active  = TRUE
  WHERE id = v_raj;

  -- Resolve category IDs
  SELECT id INTO cat_it   FROM public.vendor_categories WHERE name = 'IT & Software';
  SELECT id INTO cat_off  FROM public.vendor_categories WHERE name = 'Office Supplies';
  SELECT id INTO cat_log  FROM public.vendor_categories WHERE name = 'Logistics';
  SELECT id INTO cat_fac  FROM public.vendor_categories WHERE name = 'Facility Management';
  SELECT id INTO cat_elec FROM public.vendor_categories WHERE name = 'Electrical & Power';
  SELECT id INTO cat_civ  FROM public.vendor_categories WHERE name = 'Civil & Construction';
  SELECT id INTO cat_pack FROM public.vendor_categories WHERE name = 'Packaging';
  SELECT id INTO cat_cons FROM public.vendor_categories WHERE name = 'Consulting & IT Services';

  -- ── VENDORS ────────────────────────────────────────────
  INSERT INTO public.vendors (id, company_name, category_id, contact_person, email, phone, city, state, gst_number, status, rating, total_orders, created_by, notes)
  VALUES
    (vid_apex,  'Apex Technology Solutions Pvt. Ltd.', cat_it,   'Anand Krishnan',  'anand@apextech.in',         '+91 22 6600 7700', 'Mumbai',      'Maharashtra', '27AABCA1234A1Z5', 'active',    4.8, 22, v_alex,  'Preferred IT hardware vendor. ISO 27001 certified. Dell Platinum Partner.'),
    (vid_swift, 'Swift Cargo & Logistics Ltd.',        cat_log,  'Priyanka Sharma', 'priya@swiftlogistics.co.in','+91 80 4455 6677', 'Bengaluru',   'Karnataka',   '29AACCS9876B2Z3', 'active',    4.3, 15, v_alex,  'Pan-India 3PL logistics. 48-hour SLA on priority shipments.'),
    (vid_supe,  'Superior Office Furnishings',         cat_off,  'Robert D''Souza', 'robert@superiorofficein.com','+91 44 2233 4455','Chennai',     'Tamil Nadu',  '33AABCS5678C3Z2', 'active',    4.6, 31, v_raj,   'Premium ergonomic seating and modular workstations. Herman Miller authorised.'),
    (vid_delta, 'Delta Facility Management Services',  cat_fac,  'Vikram Nair',     'vikram@deltafacility.co.in','+91 40 5566 7788', 'Hyderabad',   'Telangana',   '36AADCD1122D4Z1', 'suspended', 3.2,  8, v_alex,  'Suspended pending GST compliance audit.'),
    (vid_nova,  'Nova Electricals & Automation',       cat_elec, 'Meena Iyer',      'meena@novaelectricals.in',  '+91 79 3344 5566', 'Ahmedabad',   'Gujarat',     '24AABCN7890E5Z6', 'active',    4.5, 18, v_raj,   'Industrial UPS, DG sets and BMS automation. 4-hr emergency SLA.'),
    (vid_metro, 'MetroSoft IT Consulting LLP',         cat_cons, 'Karan Mehta',     'karan@metrosoft.in',        '+91 11 4567 8901', 'New Delhi',   'Delhi',       '07AABCM4321F6Z7', 'active',    4.7, 12, v_sarah, 'SAP Gold Partner. Cloud migration and ERP implementation specialists.'),
    (vid_infra, 'Infra Build & Civil Works',           cat_civ,  'Suresh Babu',     'suresh@infrabuild.in',      '+91 20 3456 7890', 'Pune',        'Maharashtra', '27AABCI8765G7Z8', 'pending',   0.0,  0, v_raj,   'New vendor for civil works — awaiting site compliance review.'),
    (vid_prime, 'PrimePack Industries',                cat_pack, 'Deepa Reddy',     'deepa@primepack.in',        '+91 40 2345 6789', 'Hyderabad',   'Telangana',   '36AABCP3456H8Z9', 'active',    4.1, 27, v_raj,   'Industrial and eco-certified packaging materials.')
  ON CONFLICT (email) DO NOTHING;

  -- ── RFQs ───────────────────────────────────────────────
  INSERT INTO public.rfqs (id, rfq_number, title, description, status, deadline, budget_estimate, created_by, published_at, closed_at)
  VALUES
    (rfq1, 'RFQ-2026-00042', 'Data Centre Server Infrastructure Upgrade',
     'Procurement of 8 rack-mount servers (2U, Xeon Gold), 2 redundant UPS 15kVA, structured cabling and 4 server rack cabinets for secondary DC expansion.',
     'closed', NOW() - INTERVAL '25 days', 3200000, v_raj, NOW() - INTERVAL '40 days', NOW() - INTERVAL '25 days'),

    (rfq2, 'RFQ-2026-00043', 'Corporate Office Ergonomic Furniture',
     'Bulk supply of 80 premium ergonomic chairs with lumbar support and 30 height-adjustable sit-stand workstations for HO renovation project.',
     'closed', NOW() - INTERVAL '18 days', 1800000, v_raj, NOW() - INTERVAL '35 days', NOW() - INTERVAL '18 days'),

    (rfq3, 'RFQ-2026-00044', 'Enterprise SAP S/4HANA ERP Implementation',
     'End-to-end SAP S/4HANA implementation with 18-month hypercare support, data migration of 3M records, and user training for 250 employees.',
     'published', NOW() + INTERVAL '12 days', 8500000, v_sarah, NOW() - INTERVAL '5 days', NULL),

    (rfq4, 'RFQ-2026-00045', 'Annual AMC — UPS & Power Backup Systems',
     'Annual maintenance contract covering 6 UPS units and 2 DG sets across 3 warehouse locations. Includes quarterly servicing and 24x7 breakdown support.',
     'published', NOW() + INTERVAL '8 days', 480000, v_raj, NOW() - INTERVAL '3 days', NULL),

    (rfq5, 'RFQ-2026-00046', 'Biodegradable Packaging Materials — Q3 FY27',
     'Quarterly procurement of FSC-certified corrugated boxes, bio-mailers, and honeycomb wrap alternatives for logistics operations.',
     'draft', NOW() + INTERVAL '20 days', 650000, v_raj, NULL, NULL)
  ON CONFLICT (rfq_number) DO NOTHING;

  -- ── RFQ ITEMS ──────────────────────────────────────────
  INSERT INTO public.rfq_items (rfq_id, item_name, quantity, unit, description, sort_order)
  VALUES
    (rfq1,'Rack Server 2U (Xeon Gold 6330, 256GB RAM)',8,'units','Dual PSU, iDRAC9, 2×10GbE NIC, 4×1.92TB SSD',1),
    (rfq1,'Redundant Online UPS 15kVA',2,'units','Double conversion, 30-min battery runtime',2),
    (rfq1,'Cat6A Structured Cabling Kit',10,'rolls','305m/roll, plenum rated, white jacket',3),
    (rfq1,'42U Server Rack Cabinet',4,'units','Lockable, with PDUs and cable management',4),
    (rfq2,'Premium Mesh Ergonomic Chair',80,'units','Adjustable lumbar, 4D armrests, tilt-lock mechanism',1),
    (rfq2,'Height-Adjustable Sit-Stand Desk',30,'units','140×70cm surface, dual motor, 3-memory presets',2),
    (rfq2,'Dual Monitor Arm',30,'units','Gas spring, 27" max per arm, VESA 75/100mm',3),
    (rfq3,'SAP S/4HANA License (250 Named Users)',1,'package','Perpetual enterprise license with annual maintenance',1),
    (rfq3,'Implementation & Configuration Services',1,'lump sum','18-month project timeline, ASAP methodology',2),
    (rfq3,'Data Migration (Legacy ERP → SAP)',1,'lump sum','3 million records, full validation cycle',3),
    (rfq3,'User Training',250,'person-days','Role-based training workshops, hands-on labs',4),
    (rfq4,'UPS Quarterly Preventive Maintenance',6,'units','3 locations × 2 UPS each, load test included',1),
    (rfq4,'DG Set 6-Monthly Servicing',2,'units','Load testing + fuel system + exhaust check',2),
    (rfq4,'24×7 Emergency Breakdown Support',1,'contract','4-hour on-site response SLA',3),
    (rfq5,'FSC Corrugated Boxes (A3/A4/A5 mixed)',5000,'units','100% recycled board, custom print available',1),
    (rfq5,'Compostable Bio-Mailers',2000,'units','100% certified compostable, self-seal',2),
    (rfq5,'Honeycomb Paper Wrap',1000,'metres','Recycled paper alternative to bubble wrap',3)
  ON CONFLICT DO NOTHING;

  -- ── QUOTATIONS ─────────────────────────────────────────
  INSERT INTO public.quotations (id, quotation_number, rfq_id, vendor_id, status, validity_days, subtotal, cgst_rate, cgst_amount, sgst_rate, sgst_amount, igst_rate, igst_amount, total_amount, notes, created_by)
  VALUES
    (quo1,'QUO-2026-00017',rfq1,vid_apex,'approved',30, 2750000,9,247500,9,247500,0,0,3245000,'3-year onsite warranty + 24×7 NOC support included. Dell Platinum certified.',v_raj),
    (quo2,'QUO-2026-00018',rfq1,vid_nova,'rejected',30, 2900000,9,261000,9,261000,0,0,3422000,'Higher-spec UPS offered. Over budget by 6.9%. Vendor asked to revise.',v_raj),
    (quo3,'QUO-2026-00019',rfq2,vid_supe,'approved',21, 1550000,9,139500,9,139500,0,0,1829000,'Herman Miller Aeron equivalent. 5-yr frame warranty. Delivery 3 weeks.',v_raj),
    (quo4,'QUO-2026-00020',rfq2,vid_prime,'rejected',21,1480000,9,133200,9,133200,0,0,1746400,'Competitive price but 6-week delivery misses renovation deadline.',v_raj),
    (quo5,'QUO-2026-00021',rfq3,vid_metro,'pending',45, 7200000,9,648000,9,648000,0,0,8496000,'Full implementation + 12-month hypercare. SAP Gold Partner. Demo scheduled.',v_sarah),
    (quo6,'QUO-2026-00022',rfq4,vid_nova,'approved',15,  420000,9,37800,9,37800,0,0,495600,'AMC for all 6 UPS + 2 DGs. Parts included. Rate negotiated 8% below initial.',v_raj)
  ON CONFLICT (quotation_number) DO NOTHING;

  -- ── PURCHASE ORDERS ────────────────────────────────────
  INSERT INTO public.purchase_orders (id, po_number, quotation_id, vendor_id, status, subtotal, tax_amount, total_amount, delivery_date, notes, created_by)
  VALUES
    (po1,'PO-2026-00009',quo1,vid_apex,'issued',    2750000,495000,3245000,(NOW()+INTERVAL'18 days')::DATE,'Deliver to: VendorBridge DC-2, MIDC Mahape, Navi Mumbai 400710. Contact Raj Kumar +91-98300-33003.',v_raj),
    (po2,'PO-2026-00010',quo3,vid_supe,'fulfilled',  1550000,279000,1829000,(NOW()-INTERVAL'5 days')::DATE,'Installation complete 01-Jun-2026. DC #SUP-2026-0891 verified by Raj Kumar.',v_raj),
    (po3,'PO-2026-00011',quo6,vid_nova,'acknowledged',420000,75600, 495600,(NOW()+INTERVAL'30 days')::DATE,'AMC commences 01-Jul-2026. First quarterly service Q3-FY27.',v_raj),
    (po4,'PO-2026-00008',quo4,vid_prime,'fulfilled', 1480000,266160,1746400,(NOW()-INTERVAL'30 days')::DATE,'Phase-1 furniture (pilot batch). Fully delivered and accepted.',v_raj)
  ON CONFLICT (po_number) DO NOTHING;

  -- ── INVOICES ───────────────────────────────────────────
  INSERT INTO public.invoices (id, invoice_number, po_id, vendor_id, status, subtotal, cgst_amount, sgst_amount, igst_amount, total_tax, total_amount, due_date, paid_at, payment_reference, notes, created_by)
  VALUES
    (inv1,'INV-2026-00012',po1,vid_apex,'sent',   2750000,247500,247500,0,495000,3245000,(NOW()+INTERVAL'30 days')::DATE,NULL,NULL,'Pro-forma invoice. 30% advance ₹9,73,500 due before dispatch.',v_raj),
    (inv2,'INV-2026-00010',po2,vid_supe,'paid',   1550000,139500,139500,0,279000,1829000,(NOW()-INTERVAL'5 days')::DATE,NOW()-INTERVAL'3 days','HDFC/RTGS/UTR-20260603-123456','Full payment processed. Closed.',v_raj),
    (inv3,'INV-2026-00013',po3,vid_nova,'sent',    420000,37800,37800,0,75600,495600,(NOW()+INTERVAL'45 days')::DATE,NULL,NULL,'AMC invoice FY 2026-27. Payment within 45 days of PO acceptance.',v_raj),
    (inv4,'INV-2026-00011',po4,vid_prime,'paid',  1480000,133200,133200,0,266400,1746400,(NOW()-INTERVAL'35 days')::DATE,NOW()-INTERVAL'33 days','ICICI/RTGS/UTR-20260504-789012','Phase-1 pilot delivery. Fully paid and closed.',v_raj)
  ON CONFLICT (invoice_number) DO NOTHING;

  -- ── APPROVALS ──────────────────────────────────────────
  INSERT INTO public.approvals (quotation_id, status, remarks, requested_by, actioned_by, requested_at, actioned_at)
  VALUES
    (quo1,'approved','Price 2% below benchmark. Dell Platinum warranty adds significant value. L1 cleared.',v_raj,v_sarah,NOW()-INTERVAL'22 days',NOW()-INTERVAL'20 days'),
    (quo2,'rejected','Over budget by 6.9%. Vendor informed and asked to revise before next cycle.',v_raj,v_sarah,NOW()-INTERVAL'21 days',NOW()-INTERVAL'19 days'),
    (quo3,'approved','Sample inspection passed. Delivery timeline confirmed. Superior quality validated.',v_raj,v_sarah,NOW()-INTERVAL'14 days',NOW()-INTERVAL'12 days'),
    (quo4,'rejected','6-week delivery does not align with site readiness. Vendor to rebid next quarter.',v_raj,v_sarah,NOW()-INTERVAL'13 days',NOW()-INTERVAL'11 days'),
    (quo5,'pending','Under L2 evaluation. Technical review committee meeting scheduled 12-Jun-2026.',v_sarah,NULL,NOW()-INTERVAL'3 days',NULL),
    (quo6,'approved','AMC rate negotiated 8% below initial quote. 4-hour SLA confirmed in writing.',v_raj,v_sarah,NOW()-INTERVAL'8 days',NOW()-INTERVAL'6 days')
  ON CONFLICT DO NOTHING;

  -- ── ACTIVITY LOGS ──────────────────────────────────────
  INSERT INTO public.activity_logs (entity_type, entity_id, action, description, performed_by, performed_at, ip_address)
  VALUES
    ('rfq',rfq1::text,'CREATE','Created RFQ-2026-00042: Data Centre Server Infrastructure Upgrade',v_raj,NOW()-INTERVAL'42 days','192.168.1.104'),
    ('rfq',rfq1::text,'PUBLISH','Published RFQ-2026-00042. Apex Tech and Nova Electricals invited to bid.',v_raj,NOW()-INTERVAL'40 days','192.168.1.104'),
    ('quotation',quo1::text,'SUBMIT','Quotation QUO-2026-00017 received from Apex Technology — ₹32,45,000',v_raj,NOW()-INTERVAL'35 days','10.0.0.22'),
    ('quotation',quo2::text,'SUBMIT','Quotation QUO-2026-00018 received from Nova Electricals — ₹34,22,000',v_raj,NOW()-INTERVAL'34 days','10.0.0.31'),
    ('approval',quo1::text,'APPROVE','Approved QUO-2026-00017. Price below benchmark. L1 clearance by Sarah Connor.',v_sarah,NOW()-INTERVAL'20 days','192.168.1.50'),
    ('approval',quo2::text,'REJECT','Rejected QUO-2026-00018. Budget overrun 6.9%.',v_sarah,NOW()-INTERVAL'19 days','192.168.1.50'),
    ('purchase_order',po1::text,'CREATE','PO-2026-00009 raised. Apex Technology Solutions. Value ₹32,45,000.',v_raj,NOW()-INTERVAL'18 days','192.168.1.104'),
    ('purchase_order',po1::text,'ISSUE','PO-2026-00009 formally issued. Expected delivery 24-Jun-2026.',v_raj,NOW()-INTERVAL'17 days','192.168.1.104'),
    ('invoice',inv1::text,'RECEIVE','Pro-forma INV-2026-00012 received from Apex. Due 06-Jul-2026.',v_raj,NOW()-INTERVAL'16 days','192.168.1.104'),
    ('rfq',rfq2::text,'CREATE','Created RFQ-2026-00043: Corporate Office Ergonomic Furniture',v_raj,NOW()-INTERVAL'37 days','192.168.1.104'),
    ('quotation',quo3::text,'SUBMIT','QUO-2026-00019 received from Superior Office Furnishings — ₹18,29,000',v_raj,NOW()-INTERVAL'30 days','10.0.0.41'),
    ('approval',quo3::text,'APPROVE','Approved QUO-2026-00019. Sample quality excellent. Delivery confirmed.',v_sarah,NOW()-INTERVAL'12 days','192.168.1.50'),
    ('purchase_order',po2::text,'FULFILL','PO-2026-00010 fulfilled. DC #SUP-2026-0891 verified.',v_raj,NOW()-INTERVAL'5 days','192.168.1.104'),
    ('invoice',inv2::text,'PAY','INV-2026-00010 paid ₹18,29,000. UTR: HDFC20260603000123.',v_alex,NOW()-INTERVAL'3 days','192.168.10.1'),
    ('vendor',vid_delta::text,'SUSPEND','Delta Facility Management suspended. GST audit pending.',v_alex,NOW()-INTERVAL'10 days','192.168.10.1'),
    ('rfq',rfq3::text,'CREATE','Created RFQ-2026-00044: Enterprise SAP S/4HANA ERP Implementation',v_sarah,NOW()-INTERVAL'7 days','192.168.1.50'),
    ('rfq',rfq3::text,'PUBLISH','Published RFQ-2026-00044. MetroSoft invited to bid.',v_sarah,NOW()-INTERVAL'5 days','192.168.1.50'),
    ('quotation',quo5::text,'SUBMIT','QUO-2026-00021 received from MetroSoft IT — ₹84,96,000',v_sarah,NOW()-INTERVAL'2 days','10.0.0.55'),
    ('rfq',rfq4::text,'PUBLISH','Published RFQ-2026-00045 (UPS/DG AMC). Nova Electricals invited.',v_raj,NOW()-INTERVAL'3 days','192.168.1.104'),
    ('approval',quo6::text,'APPROVE','Approved QUO-2026-00022 (AMC). 8% rate reduction negotiated.',v_sarah,NOW()-INTERVAL'6 days','192.168.1.50')
  ON CONFLICT DO NOTHING;

  -- ── NOTIFICATIONS ──────────────────────────────────────
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES
    (v_alex,'warning','Vendor Suspension','Delta Facility Management suspended pending GST audit. Review required.'),
    (v_alex,'success','Payment Processed','Invoice INV-2026-00010 (₹18,29,000) to Superior Office Furnishings paid via RTGS.'),
    (v_alex,'info','High-Value RFQ Published','RFQ-2026-00044 (SAP ERP, ₹85L) published by Sarah Connor. Requires attention.'),
    (v_alex,'warning','Budget Alert','Monthly commitments at 78% of Q2 envelope. Review spend dashboard.'),
    (v_sarah,'warning','Approval Required','QUO-2026-00021 from MetroSoft (₹84,96,000) awaiting your L2 approval.'),
    (v_sarah,'success','PO Fulfilled','PO-2026-00010 (Office Furniture) delivered and verified by Raj Kumar.'),
    (v_sarah,'info','RFQ Closing Soon','RFQ-2026-00044 closes in 12 days. Only 1 bid received so far.'),
    (v_sarah,'info','Invoice Due','INV-2026-00012 (₹32,45,000) from Apex Technology due 06-Jul-2026.'),
    (v_raj,'info','New Bid Received','QUO-2026-00021 submitted by MetroSoft IT for SAP ERP RFQ. Review and forward.'),
    (v_raj,'success','RFQ Closed','RFQ-2026-00042 (Server Infra) closed. Apex Tech selected. PO-2026-00009 issued.'),
    (v_raj,'warning','Advance Payment Due','30% advance ₹9,73,500 for INV-2026-00012 (Apex Tech) due before dispatch.'),
    (v_raj,'info','AMC PO Acknowledged','Nova Electricals confirmed PO-2026-00011. AMC starts 01-Jul-2026.'),
    (v_raj,'warning','Draft RFQ Pending','RFQ-2026-00046 (Packaging Q3) still in draft. Publish before 15-Jun-2026.')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Seed complete: 8 vendors, 5 RFQs, 17 items, 6 quotations, 4 POs, 4 invoices, 6 approvals, 20 activity logs, 13 notifications.';
END $$;
