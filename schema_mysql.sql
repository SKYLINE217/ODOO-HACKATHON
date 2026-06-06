-- ============================================================
-- VendorBridge — Complete MySQL Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS vendorbridge;
USE vendorbridge;

-- 1. Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR(36) PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  role ENUM('admin','procurement_officer','manager','vendor') NOT NULL DEFAULT 'procurement_officer',
  avatar_url TEXT,
  phone VARCHAR(50),
  department VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Vendor Categories
CREATE TABLE IF NOT EXISTS vendor_categories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Vendors
CREATE TABLE IF NOT EXISTS vendors (
  id VARCHAR(36) PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  category_id VARCHAR(36),
  status ENUM('pending','active','suspended','blacklisted') NOT NULL DEFAULT 'pending',
  contact_person VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50) NOT NULL,
  website VARCHAR(255),
  address_line1 TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) NOT NULL DEFAULT 'India',
  pincode VARCHAR(20),
  gst_number VARCHAR(50) UNIQUE,
  pan_number VARCHAR(50),
  msme_registered BOOLEAN DEFAULT FALSE,
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_orders INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_by VARCHAR(36),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES vendor_categories(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- 4. RFQs
CREATE TABLE IF NOT EXISTS rfqs (
  id VARCHAR(36) PRIMARY KEY,
  rfq_number VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('draft','published','closed','cancelled') NOT NULL DEFAULT 'draft',
  deadline TIMESTAMP NOT NULL,
  budget_estimate DECIMAL(15,2),
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  created_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  published_at TIMESTAMP NULL DEFAULT NULL,
  closed_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE
);

-- 5. RFQ Items
CREATE TABLE IF NOT EXISTS rfq_items (
  id VARCHAR(36) PRIMARY KEY,
  rfq_id VARCHAR(36) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity DECIMAL(12,3) NOT NULL,
  unit VARCHAR(50) NOT NULL DEFAULT 'units',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rfq_id) REFERENCES rfqs(id) ON DELETE CASCADE
);

-- 6. Quotations
CREATE TABLE IF NOT EXISTS quotations (
  id VARCHAR(36) PRIMARY KEY,
  quotation_number VARCHAR(50) NOT NULL UNIQUE,
  rfq_id VARCHAR(36) NOT NULL,
  vendor_id VARCHAR(36) NOT NULL,
  status ENUM('pending','approved','rejected','submitted','under_review','shortlisted','awarded') NOT NULL DEFAULT 'pending',
  validity_days INT NOT NULL DEFAULT 30,
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  cgst_rate DECIMAL(5,2) NOT NULL DEFAULT 9,
  cgst_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  sgst_rate DECIMAL(5,2) NOT NULL DEFAULT 9,
  sgst_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  igst_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  igst_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  delivery_days INT,
  payment_terms TEXT,
  notes TEXT,
  created_by VARCHAR(36),
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY (rfq_id, vendor_id),
  FOREIGN KEY (rfq_id) REFERENCES rfqs(id) ON DELETE RESTRICT,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- 7. Approvals
CREATE TABLE IF NOT EXISTS approvals (
  id VARCHAR(36) PRIMARY KEY,
  quotation_id VARCHAR(36) NOT NULL,
  status ENUM('pending','approved','rejected','escalated') NOT NULL DEFAULT 'pending',
  requested_by VARCHAR(36) NOT NULL,
  actioned_by VARCHAR(36),
  remarks TEXT,
  requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actioned_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE RESTRICT,
  FOREIGN KEY (requested_by) REFERENCES profiles(id),
  FOREIGN KEY (actioned_by) REFERENCES profiles(id)
);

-- 8. Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id VARCHAR(36) PRIMARY KEY,
  po_number VARCHAR(50) NOT NULL UNIQUE,
  quotation_id VARCHAR(36) NOT NULL UNIQUE,
  vendor_id VARCHAR(36) NOT NULL,
  status ENUM('draft','issued','acknowledged','fulfilled','cancelled') NOT NULL DEFAULT 'draft',
  subtotal DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  delivery_address TEXT,
  delivery_date DATE,
  payment_terms TEXT,
  notes TEXT,
  created_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fulfilled_at TIMESTAMP NULL DEFAULT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE RESTRICT,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  FOREIGN KEY (created_by) REFERENCES profiles(id)
);

-- 9. Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(36) PRIMARY KEY,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  po_id VARCHAR(36) NOT NULL,
  vendor_id VARCHAR(36) NOT NULL,
  status ENUM('draft','sent','paid','overdue','cancelled') NOT NULL DEFAULT 'draft',
  subtotal DECIMAL(15,2) NOT NULL,
  cgst_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  sgst_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  igst_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_tax DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  due_date DATE,
  paid_at TIMESTAMP NULL DEFAULT NULL,
  payment_reference VARCHAR(255),
  notes TEXT,
  created_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE RESTRICT,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  FOREIGN KEY (created_by) REFERENCES profiles(id)
);

-- 10. Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id VARCHAR(36) PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  performed_by VARCHAR(36),
  performed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  FOREIGN KEY (performed_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- 11. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  `read` BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- ============================================================
-- SEED DATA: Vendor Categories
-- ============================================================
INSERT IGNORE INTO vendor_categories (id, name, description) VALUES
  ('cat-1', 'IT & Software',        'Hardware, software licenses, SaaS, cloud'),
  ('cat-2', 'Office Supplies',      'Stationery, furniture, consumables'),
  ('cat-3', 'Logistics',            'Courier, shipping, 3PL warehousing'),
  ('cat-4', 'Facility Management',  'Cleaning, security, AMC, repairs'),
  ('cat-5', 'Electrical & Power',   'UPS, DG sets, cables, BMS automation'),
  ('cat-6', 'Civil & Construction', 'Civil works, interiors, fit-outs'),
  ('cat-7', 'Packaging',            'Corrugated boxes, eco-packaging, mailers'),
  ('cat-8', 'Consulting & IT Services', 'ERP, cloud migration, managed services');
