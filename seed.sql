-- ============================================================
-- VendorBridge — Complete Demo Seed Data
-- Run this AFTER schema.sql in your Supabase SQL Editor
-- Creates 3 demo users with deep, realistic procurement data
-- ============================================================

-- ============================================================
-- STEP 1: Create auth users via Supabase Dashboard first!
-- Then get their UUIDs with: SELECT id, email FROM auth.users;
-- Replace the UUIDs below with your actual values.
-- ============================================================

DO $$
DECLARE
  -- Replace these with ACTUAL UUIDs from your auth.users table
  v_alex   UUID := '00000000-0000-0000-0000-000000000001';
  v_sarah  UUID := '00000000-0000-0000-0000-000000000002';
  v_raj    UUID := '00000000-0000-0000-0000-000000000003';

  -- Vendor IDs
  vid_apex    UUID := gen_random_uuid();
  vid_swift   UUID := gen_random_uuid();
  vid_supe    UUID := gen_random_uuid();
  vid_delta   UUID := gen_random_uuid();
  vid_nova    UUID := gen_random_uuid();
  vid_metro   UUID := gen_random_uuid();
  vid_infra   UUID := gen_random_uuid();
  vid_prime   UUID := gen_random_uuid();

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

-- ============================================================
-- PROFILES (match auth users)
-- ============================================================
INSERT INTO public.profiles (id, full_name, email, role, department, phone, avatar_url)
VALUES
  (v_alex,  'Alex Mercer',    'alex.mercer@vendorbridge.io',   'admin',                'Executive Office',    '+91 98100 11001', NULL),
  (v_sarah, 'Sarah Connor',   'sarah.connor@vendorbridge.io',  'manager',              'Operations & IT',     '+91 98200 22002', NULL),
  (v_raj,   'Raj Kumar',      'raj.kumar@vendorbridge.io',     'procurement_officer',  'Procurement & Supply','+91 98300 33003', NULL)
ON CONFLICT (id) DO UPDATE SET
  full_name  = EXCLUDED.full_name,
  email      = EXCLUDED.email,
  role       = EXCLUDED.role,
  department = EXCLUDED.department,
  phone      = EXCLUDED.phone;

-- ============================================================
-- VENDORS (owned by Alex — admin sees all)
-- ============================================================
INSERT INTO public.vendors (id, company_name, contact_person, email, phone, gst_number, status, rating, total_orders, created_by, notes)
VALUES
  (vid_apex,  'Apex Technology Solutions Pvt. Ltd.',  'Anand Krishnan',     'anand.krishnan@apextech.in',       '+91 22 6600 7700', '27AABCA1234A1Z5', 'active',      4.8, 22, v_alex,  'Preferred IT hardware & server vendor. ISO 27001 certified.'),
  (vid_swift, 'Swift Cargo & Logistics Ltd.',         'Priyanka Sharma',    'priya.sharma@swiftlogistics.co.in','+91 80 4455 6677', '29AACCS9876B2Z3', 'active',      4.3, 15, v_alex,  'Pan-India 3PL logistics. 48-hour SLA on priority shipments.'),
  (vid_supe,  'Superior Office Furnishings',          'Robert D''Souza',    'robert@superiorofficein.com',      '+91 44 2233 4455', '33AABCS5678C3Z2', 'active',      4.6, 31, v_raj,   'Premium ergonomic seating and modular workstation supplier.'),
  (vid_delta, 'Delta Facility Management Services',   'Vikram Nair',        'vikram.nair@deltafacility.co.in',  '+91 40 5566 7788', '36AADCD1122D4Z1', 'suspended',   3.2,  8, v_alex,  'Suspended pending GST compliance audit outcome.'),
  (vid_nova,  'Nova Electricals & Automation',        'Meena Iyer',         'meena@novaelectricals.in',         '+91 79 3344 5566', '24AABCN7890E5Z6', 'active',      4.5, 18, v_raj,   'Industrial-grade UPS, DG sets and BMS automation.'),
  (vid_metro, 'MetroSoft IT Consulting LLP',          'Karan Mehta',        'karan.mehta@metrosoft.in',         '+91 11 4567 8901', '07AABCM4321F6Z7', 'active',      4.7, 12, v_sarah, 'Enterprise SAP, cloud migration, and SaaS integration.'),
  (vid_infra, 'Infra Build & Civil Works',            'Suresh Babu',        'suresh@infrabuild.in',             '+91 20 3456 7890', '27AABCI8765G7Z8', 'pending',     0.0,  0, v_raj,   'New vendor for civil works — awaiting site compliance review.'),
  (vid_prime, 'PrimePack Industries',                 'Deepa Reddy',        'deepa@primepack.in',               '+91 40 2345 6789', '36AABCP3456H8Z9', 'active',      4.1, 27, v_raj,   'Industrial packaging materials and biodegradable supplies.')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RFQs
-- ============================================================
INSERT INTO public.rfqs (id, rfq_number, title, description, status, deadline, budget_estimate, created_by)
VALUES
  (rfq1, 'RFQ-2026-00042', 'Data Centre Server Infrastructure Upgrade',
   'Procurement of 8 rack-mount servers (2U, Xeon Gold), 2 redundant UPS 15kVA, and structured cabling for secondary DC expansion.',
   'closed', NOW() - INTERVAL '25 days', 3200000, v_raj),

  (rfq2, 'RFQ-2026-00043', 'Corporate Office Ergonomic Furniture',
   'Bulk supply of 80 premium ergonomic chairs with lumbar support and 30 height-adjustable workstations for HO renovation.',
   'closed', NOW() - INTERVAL '18 days', 1800000, v_raj),

  (rfq3, 'RFQ-2026-00044', 'Enterprise SaaS ERP Implementation',
   'End-to-end SAP S/4HANA implementation with 12-month hypercare support, data migration, and user training.',
   'published', NOW() + INTERVAL '12 days', 8500000, v_sarah),

  (rfq4, 'RFQ-2026-00045', 'Annual AMC — UPS & Power Backup Systems',
   'Annual maintenance contract covering 6 UPS units and 2 DG sets across 3 warehouse locations. Includes quarterly servicing.',
   'published', NOW() + INTERVAL '8 days', 480000, v_raj),

  (rfq5, 'RFQ-2026-00046', 'Biodegradable Packaging Materials — Q3 FY27',
   'Quarterly procurement of eco-certified corrugated boxes, bubble wrap alternatives, and bio-mailers for logistics operations.',
   'draft', NOW() + INTERVAL '20 days', 650000, v_raj)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RFQ ITEMS
-- ============================================================
INSERT INTO public.rfq_items (rfq_id, item_name, quantity, unit, description, sort_order)
VALUES
  -- RFQ 1 — Server infra
  (rfq1, 'Rack Server 2U (Xeon Gold 6330, 256GB RAM)', 8,  'units', 'Dual PSU, iDRAC9, 2×10GbE NIC', 1),
  (rfq1, 'Redundant Online UPS 15kVA',                 2,  'units', 'Double conversion, 30min battery backup', 2),
  (rfq1, 'Cat6A Structured Cabling Kit',               10, 'rolls', '305m per roll, plenum rated', 3),
  (rfq1, '42U Server Rack Cabinet',                    4,  'units', 'Lockable, with PDUs and cable management', 4),

  -- RFQ 2 — Furniture
  (rfq2, 'Premium Mesh Ergonomic Chair',              80,  'units', 'Adjustable lumbar, 4D armrests, tilt lock', 1),
  (rfq2, 'Height-Adjustable Sit-Stand Desk',          30,  'units', '140×70cm, dual motor, memory presets', 2),
  (rfq2, 'Monitor Arm (Dual)',                        30,  'units', 'Gas spring, 27" max per arm', 3),

  -- RFQ 3 — ERP
  (rfq3, 'SAP S/4HANA License (250 users)',            1,  'package', 'Perpetual enterprise license', 1),
  (rfq3, 'Implementation & Config Services',           1,  'lump sum', '18-month project timeline', 2),
  (rfq3, 'Data Migration (Legacy ERP → SAP)',          1,  'lump sum', '3 million records', 3),
  (rfq3, 'User Training (250 users)',                250,  'person-days', 'Role-based training workshops', 4),

  -- RFQ 4 — AMC
  (rfq4, 'UPS Quarterly Preventive Maintenance',       6,  'units', '3 locations × 2 UPS each', 1),
  (rfq4, 'DG Set 6-Monthly Servicing',                 2,  'units', 'Load testing + fuel system check', 2),
  (rfq4, '24×7 Emergency Breakdown Support',           1,  'contract', '4-hour response SLA', 3),

  -- RFQ 5 — Packaging
  (rfq5, 'Corrugated Boxes (Various Sizes)',        5000,  'units', 'A3/A4/A5 FSC certified', 1),
  (rfq5, 'Bio-Mailers (Compostable)',               2000,  'units', '100% compostable, custom print', 2),
  (rfq5, 'Honeycomb Wrap (Alternative to Bubble)', 1000,  'metres', 'Recycled paper based', 3)
ON CONFLICT DO NOTHING;

-- ============================================================
-- QUOTATIONS (vendor bids on RFQs)
-- ============================================================
INSERT INTO public.quotations (id, quotation_number, rfq_id, vendor_id, status, validity_days, subtotal, cgst_rate, cgst_amount, sgst_rate, sgst_amount, igst_rate, igst_amount, total_amount, notes, created_by)
VALUES
  -- Quotations for RFQ 1 (Server infra)
  (quo1, 'QUO-2026-00017', rfq1, vid_apex, 'approved', 30,
   2750000, 9, 247500, 9, 247500, 0, 0, 3245000,
   'Includes 3-year onsite warranty and 24×7 NOC support. Dell certified partner.', v_raj),

  (quo2, 'QUO-2026-00018', rfq1, vid_nova, 'rejected', 30,
   2900000, 9, 261000, 9, 261000, 0, 0, 3422000,
   'Higher spec UPS units offered. Marginally over budget.', v_raj),

  -- Quotations for RFQ 2 (Furniture)
  (quo3, 'QUO-2026-00019', rfq2, vid_supe, 'approved', 21,
   1550000, 9, 139500, 9, 139500, 0, 0, 1829000,
   'Herman Miller Aeron equivalent chairs. 5-year frame warranty. Delivery in 3 weeks.', v_raj),

  (quo4, 'QUO-2026-00020', rfq2, vid_prime, 'rejected', 21,
   1480000, 9, 133200, 9, 133200, 0, 0, 1746400,
   'Competitive pricing but delivery timeline is 6 weeks — too slow for renovation schedule.', v_raj),

  -- Quotations for RFQ 3 (ERP — pending evaluation)
  (quo5, 'QUO-2026-00021', rfq3, vid_metro, 'pending', 45,
   7200000, 9, 648000, 9, 648000, 0, 0, 8496000,
   'Full implementation + 12 months hypercare. Certified SAP Gold Partner.', v_sarah),

  -- Quotations for RFQ 4 (AMC)
  (quo6, 'QUO-2026-00022', rfq4, vid_nova, 'approved', 15,
   420000, 9, 37800, 9, 37800, 0, 0, 495600,
   'AMC for all 6 UPS + 2 DGs. 4-hour SLA guaranteed. Parts included.', v_raj)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PURCHASE ORDERS
-- ============================================================
INSERT INTO public.purchase_orders (id, po_number, quotation_id, vendor_id, status, subtotal, tax_amount, total_amount, delivery_date, notes, created_by)
VALUES
  (po1, 'PO-2026-00009', quo1, vid_apex, 'issued',
   2750000, 495000, 3245000, NOW() + INTERVAL '18 days',
   'Deliver to: VendorBridge DC-2, MIDC Mahape, Navi Mumbai. Contact Raj Kumar (+91 98300 33003) for entry.', v_raj),

  (po2, 'PO-2026-00010', quo3, vid_supe, 'fulfilled',
   1550000, 279000, 1829000, NOW() - INTERVAL '5 days',
   'Installation completed on 01-Jun-2026. Delivery challan #SUP-2026-0891.', v_raj),

  (po3, 'PO-2026-00011', quo6, vid_nova, 'acknowledged',
   420000, 75600, 495600, NOW() + INTERVAL '30 days',
   'AMC commences 01-Jul-2026. First quarterly service due Q3-2026.', v_raj),

  (po4, 'PO-2026-00008', quo3, vid_supe, 'fulfilled',
   1550000, 279000, 1829000, NOW() - INTERVAL '30 days',
   'Previous PO for Phase-1 furniture. Fully delivered and accepted.', v_raj)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- INVOICES
-- ============================================================
INSERT INTO public.invoices (id, invoice_number, po_id, vendor_id, status, subtotal, cgst_amount, sgst_amount, igst_amount, total_tax, total_amount, due_date, paid_at, notes, created_by)
VALUES
  (inv1, 'INV-2026-00012', po1, vid_apex, 'sent',
   2750000, 247500, 247500, 0, 495000, 3245000,
   NOW() + INTERVAL '30 days', NULL,
   'Pro-forma invoice for server hardware. Advance 30% due before dispatch.', v_raj),

  (inv2, 'INV-2026-00010', po2, vid_supe, 'paid',
   1550000, 139500, 139500, 0, 279000, 1829000,
   NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days',
   'Full payment processed via RTGS. UTR: HDFC20260603000123.', v_raj),

  (inv3, 'INV-2026-00013', po3, vid_nova, 'sent',
   420000, 37800, 37800, 0, 75600, 495600,
   NOW() + INTERVAL '45 days', NULL,
   'AMC invoice for FY 2026-27. Payment due within 45 days of PO acceptance.', v_raj),

  (inv4, 'INV-2026-00011', po4, vid_supe, 'paid',
   1550000, 139500, 139500, 0, 279000, 1829000,
   NOW() - INTERVAL '35 days', NOW() - INTERVAL '33 days',
   'Phase-1 furniture delivery — paid in full. Closed.', v_raj)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- APPROVALS
-- ============================================================
INSERT INTO public.approvals (quotation_id, status, remarks, requested_by, actioned_by, actioned_at)
VALUES
  (quo1, 'approved', 'L1 approved. Price is 2% below benchmarked market rate. Dell Platinum warranty adds value.', v_raj, v_sarah, NOW() - INTERVAL '20 days'),
  (quo2, 'rejected',  'Exceeds budget envelope by 6.9%. Vendor was informed. Asked to revise.', v_raj, v_sarah, NOW() - INTERVAL '19 days'),
  (quo3, 'approved', 'Approved after vendor presentation. Superior quality verified via sample inspection.', v_raj, v_sarah, NOW() - INTERVAL '12 days'),
  (quo4, 'rejected',  'Delivery timeline does not align with site readiness. Vendor asked to rebid next cycle.', v_raj, v_sarah, NOW() - INTERVAL '11 days'),
  (quo5, 'pending',   'Under L2 evaluation. Technical review committee meeting scheduled 12-Jun-2026.', v_sarah, NULL, NULL),
  (quo6, 'approved', 'AMC rate negotiated down by 8% from initial offer. Service SLA confirmed.', v_raj, v_sarah, NOW() - INTERVAL '6 days')
ON CONFLICT DO NOTHING;

-- ============================================================
-- ACTIVITY LOGS
-- ============================================================
INSERT INTO public.activity_logs (entity_type, entity_id, action, description, performed_by, ip_address)
VALUES
  ('rfq',            rfq1::text,  'CREATE',   'Created RFQ-2026-00042: Data Centre Server Infrastructure Upgrade',               v_raj,   '192.168.1.104'),
  ('rfq',            rfq1::text,  'PUBLISH',  'Published RFQ-2026-00042 to vendor portal. 3 vendors invited.',                   v_raj,   '192.168.1.104'),
  ('quotation',      quo1::text,  'SUBMIT',   'Quotation QUO-2026-00017 received from Apex Technology Solutions',               v_raj,   '10.0.0.22'),
  ('quotation',      quo2::text,  'SUBMIT',   'Quotation QUO-2026-00018 received from Nova Electricals & Automation',           v_raj,   '10.0.0.31'),
  ('approval',       quo1::text,  'APPROVE',  'Approved QUO-2026-00017 — ₹32,45,000. L1 clearance by Sarah Connor.',           v_sarah, '192.168.1.50'),
  ('approval',       quo2::text,  'REJECT',   'Rejected QUO-2026-00018 — over budget by 6.9%',                                  v_sarah, '192.168.1.50'),
  ('purchase_order', po1::text,   'CREATE',   'PO-2026-00009 raised against QUO-2026-00017. Apex Tech.',                        v_raj,   '192.168.1.104'),
  ('purchase_order', po1::text,   'ISSUE',    'PO-2026-00009 formally issued to vendor. Expected delivery 24-Jun-2026.',        v_raj,   '192.168.1.104'),
  ('invoice',        inv1::text,  'RECEIVE',  'Pro-forma invoice INV-2026-00012 received from Apex. Due 06-Jul-2026.',           v_raj,   '192.168.1.104'),
  ('rfq',            rfq2::text,  'CREATE',   'Created RFQ-2026-00043: Corporate Office Ergonomic Furniture',                   v_raj,   '192.168.1.104'),
  ('quotation',      quo3::text,  'SUBMIT',   'Quotation QUO-2026-00019 received from Superior Office Furnishings',             v_raj,   '10.0.0.41'),
  ('approval',       quo3::text,  'APPROVE',  'Approved QUO-2026-00019 — ₹18,29,000. Sample quality excellent.',               v_sarah, '192.168.1.50'),
  ('purchase_order', po2::text,   'FULFILL',  'PO-2026-00010 marked fulfilled. Delivery challan #SUP-2026-0891 verified.',      v_raj,   '192.168.1.104'),
  ('invoice',        inv2::text,  'PAY',      'INV-2026-00010 paid in full ₹18,29,000. UTR: HDFC20260603000123.',               v_alex,  '192.168.10.1'),
  ('vendor',         vid_delta::text, 'SUSPEND', 'Vendor Delta Facility Management suspended pending GST audit.',               v_alex,  '192.168.10.1'),
  ('rfq',            rfq3::text,  'CREATE',   'Created RFQ-2026-00044: Enterprise SaaS ERP Implementation',                     v_sarah, '192.168.1.50'),
  ('rfq',            rfq3::text,  'PUBLISH',  'Published RFQ-2026-00044. MetroSoft invited to bid.',                            v_sarah, '192.168.1.50'),
  ('quotation',      quo5::text,  'SUBMIT',   'Quotation QUO-2026-00021 received from MetroSoft IT Consulting',                 v_sarah, '10.0.0.55'),
  ('rfq',            rfq4::text,  'PUBLISH',  'Published RFQ-2026-00045 for AMC. Nova Electricals invited.',                   v_raj,   '192.168.1.104'),
  ('approval',       quo6::text,  'APPROVE',  'Approved QUO-2026-00022 (AMC). Rate negotiated 8% below initial offer.',        v_sarah, '192.168.1.50')
ON CONFLICT DO NOTHING;

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
INSERT INTO public.notifications (user_id, type, title, message, read)
VALUES
  -- Alex (admin)
  (v_alex, 'warning', 'Vendor Suspension Alert', 'Delta Facility Management has been suspended pending GST compliance audit. Review required.', false),
  (v_alex, 'success', 'Payment Processed', 'Invoice INV-2026-00010 (₹18,29,000) to Superior Office Furnishings paid successfully.', true),
  (v_alex, 'info',    'New RFQ Published', 'RFQ-2026-00044 (Enterprise ERP) published by Sarah Connor. High-value procurement — ₹85L.', false),
  (v_alex, 'warning', 'Budget Threshold Alert', 'Total monthly commitments at 78% of Q2 budget. Review spend dashboard.', false),
  (v_alex, 'success', 'Vendor Registered', 'Infra Build & Civil Works successfully registered. Compliance review pending.', true),

  -- Sarah (manager)
  (v_sarah, 'info',    'Approval Required', 'Quotation QUO-2026-00021 from MetroSoft awaiting your L2 approval. Value: ₹84,96,000.', false),
  (v_sarah, 'success', 'PO Fulfilled',      'Purchase Order PO-2026-00010 (Office Furniture) marked fulfilled. Delivery verified.', true),
  (v_sarah, 'warning', 'RFQ Deadline Soon', 'RFQ-2026-00044 closes in 12 days. Only 1 bid received. Consider extending deadline.', false),
  (v_sarah, 'info',    'Invoice Due',        'Invoice INV-2026-00012 (₹32,45,000) from Apex Technology due on 06-Jul-2026.', false),
  (v_sarah, 'success', 'Approval Completed', 'Your approval of QUO-2026-00022 (AMC) has been processed. PO-2026-00011 raised.', true),

  -- Raj (procurement officer)
  (v_raj, 'info',    'Quotation Received',   'New bid QUO-2026-00021 from MetroSoft IT for RFQ-2026-00044. Review and forward.', false),
  (v_raj, 'success', 'RFQ Closed',           'RFQ-2026-00042 (Server Infra) closed with 2 bids. Apex Tech selected and PO issued.', true),
  (v_raj, 'warning', 'Invoice Pending',      'Pro-forma invoice INV-2026-00012 from Apex Technology requires 30% advance payment.', false),
  (v_raj, 'info',    'AMC PO Acknowledged',  'Nova Electricals acknowledged PO-2026-00011. AMC commences 01-Jul-2026.', false),
  (v_raj, 'warning', 'Draft RFQ Pending',    'RFQ-2026-00046 (Packaging Q3) is still in draft. Publish before 15-Jun-2026.', false)
ON CONFLICT DO NOTHING;

END $$;

-- ============================================================
-- VERIFICATION QUERIES (run to check data)
-- ============================================================
-- SELECT COUNT(*) FROM vendors;            -- Should be 8
-- SELECT COUNT(*) FROM rfqs;              -- Should be 5
-- SELECT COUNT(*) FROM rfq_items;         -- Should be 16
-- SELECT COUNT(*) FROM quotations;        -- Should be 6
-- SELECT COUNT(*) FROM purchase_orders;   -- Should be 4
-- SELECT COUNT(*) FROM invoices;          -- Should be 4
-- SELECT COUNT(*) FROM approvals;         -- Should be 6
-- SELECT COUNT(*) FROM activity_logs;     -- Should be 20
-- SELECT COUNT(*) FROM notifications;     -- Should be 15
