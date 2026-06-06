export const INITIAL_SEEDS: Record<string, any[]> = {
  profiles: [
    {
      id: '00000000-0000-0000-0000-000000000001',
      full_name: 'Alex Mercer (Admin)',
      email: 'admin@vendorbridge.io',
      role: 'admin',
      department: 'Executive Office',
      avatar_url: null
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      full_name: 'Sarah Connor (Manager)',
      email: 'manager@vendorbridge.io',
      role: 'manager',
      department: 'Operations & IT',
      avatar_url: null
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      full_name: 'Raj Kumar (Procurement)',
      email: 'procurement@vendorbridge.io',
      role: 'procurement_officer',
      department: 'Procurement & Supply',
      avatar_url: null
    },
    {
      id: '00000000-0000-0000-0000-000000000004',
      full_name: 'Apex Vendor Rep',
      email: 'vendor@vendorbridge.io',
      role: 'vendor',
      department: 'Sales',
      avatar_url: null,
      vendor_id: 'vid-apex'
    }
  ],
  vendor_categories: [
    { id: 'cat-it', name: 'IT & Software', description: 'Computers, servers, networking, and cloud subscriptions' },
    { id: 'cat-off', name: 'Office Supplies', description: 'Furniture, stationary, and breakroom needs' },
    { id: 'cat-log', name: 'Logistics', description: 'Shipping, warehousing, and parcel courier services' },
    { id: 'cat-raw', name: 'Raw Materials', description: 'Steel, copper, plastics, and chemicals' },
    { id: 'cat-cons', name: 'Consulting Services', description: 'Legal, tax, security audits, and operations advisory' },
    { id: 'cat-mkt', name: 'Marketing & Advertising', description: 'PR, media buying, printing, and design assets' },
    { id: 'cat-maint', name: 'Maintenance & Repairs', description: 'HVAC, plumbing, electrical, and facility upkeep' }
  ],
  vendors: [
    {
      id: 'vid-apex',
      company_name: 'Apex Technology Solutions',
      category_id: 'cat-it',
      contact_person: 'Apex Vendor Rep',
      email: 'vendor@vendorbridge.io',
      phone: '+91 22 6600 7700',
      city: 'Mumbai',
      state: 'Maharashtra',
      gst_number: '27AABCA1234A1Z5',
      status: 'active',
      rating: 4.8,
      total_orders: 22,
      created_by: '00000000-0000-0000-0000-000000000001',
      notes: 'Linked to vendor@vendorbridge.io.'
    },
    {
      id: 'vid-swift',
      company_name: 'Swift Cargo & Logistics',
      category_id: 'cat-log',
      contact_person: 'Priyanka Sharma',
      email: 'priya@swiftlogistics.co.in',
      phone: '+91 80 4455 6677',
      city: 'Bengaluru',
      state: 'Karnataka',
      gst_number: '29AACCS9876B2Z3',
      status: 'active',
      rating: 4.3,
      total_orders: 15,
      created_by: '00000000-0000-0000-0000-000000000001',
      notes: 'Pan-India 3PL logistics.'
    },
    {
      id: 'vid-supe',
      company_name: 'Superior Office Furnishings',
      category_id: 'cat-off',
      contact_person: 'Robert D',
      email: 'robert@superior.com',
      phone: '+91 44 2233 4455',
      city: 'Chennai',
      state: 'Tamil Nadu',
      gst_number: '33AABCS5678C3Z2',
      status: 'active',
      rating: 4.6,
      total_orders: 31,
      created_by: '00000000-0000-0000-0000-000000000003',
      notes: 'Premium ergonomic seating.'
    }
  ],
  rfqs: [
    {
      id: 'rfq1',
      rfq_number: 'RFQ-2026-00042',
      title: 'Data Centre Upgrade',
      description: 'Procurement of 8 servers for new DC.',
      status: 'published',
      deadline: new Date(Date.now() + 10 * 86400000).toISOString(),
      budget_estimate: 3200000,
      created_by: '00000000-0000-0000-0000-000000000003',
      published_at: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 'rfq2',
      rfq_number: 'RFQ-2026-00043',
      title: 'Office Furniture',
      description: '80 ergonomic chairs for HO.',
      status: 'published',
      deadline: new Date(Date.now() + 18 * 86400000).toISOString(),
      budget_estimate: 1800000,
      created_by: '00000000-0000-0000-0000-000000000003',
      published_at: new Date(Date.now() - 5 * 86400000).toISOString()
    }
  ],
  rfq_items: [
    {
      id: 'rfq-item1',
      rfq_id: 'rfq1',
      item_name: 'Rack Server 2U',
      quantity: 8,
      uom: 'Units',
      description: 'Xeon Silver, 64GB RAM, 2TB SSD',
      sort_order: 1
    },
    {
      id: 'rfq-item2',
      rfq_id: 'rfq2',
      item_name: 'Ergonomic Mesh Chair',
      quantity: 80,
      uom: 'Units',
      description: 'High back, lumbar support',
      sort_order: 1
    }
  ],
  quotations: [
    {
      id: 'quo1',
      quotation_number: 'QUO-2026-00017',
      rfq_id: 'rfq1',
      vendor_id: 'vid-apex',
      status: 'approved',
      validity_days: 30,
      subtotal: 2750000,
      cgst_rate: 9,
      cgst_amount: 247500,
      sgst_rate: 9,
      sgst_amount: 247500,
      igst_rate: 0,
      igst_amount: 0,
      total_amount: 3245000,
      created_by: '00000000-0000-0000-0000-000000000004'
    },
    {
      id: 'quo2',
      quotation_number: 'QUO-2026-00018',
      rfq_id: 'rfq2',
      vendor_id: 'vid-supe',
      status: 'pending',
      validity_days: 21,
      subtotal: 1550000,
      cgst_rate: 9,
      cgst_amount: 139500,
      sgst_rate: 9,
      sgst_amount: 139500,
      igst_rate: 0,
      igst_amount: 0,
      total_amount: 1829000,
      created_by: '00000000-0000-0000-0000-000000000003'
    }
  ],
  approvals: [
    {
      id: 'app1',
      quotation_id: 'quo1',
      status: 'approved',
      remarks: 'Price below benchmark. L1 cleared.',
      requested_by: '00000000-0000-0000-0000-000000000003',
      actioned_by: '00000000-0000-0000-0000-000000000002',
      requested_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      actioned_at: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: 'app2',
      quotation_id: 'quo2',
      status: 'pending',
      remarks: 'Under L2 evaluation.',
      requested_by: '00000000-0000-0000-0000-000000000003',
      actioned_by: null,
      requested_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      actioned_at: null
    }
  ],
  purchase_orders: [
    {
      id: 'po1',
      po_number: 'PO-2026-00009',
      quotation_id: 'quo1',
      vendor_id: 'vid-apex',
      status: 'issued',
      subtotal: 2750000,
      tax_amount: 495000,
      total_amount: 3245000,
      delivery_date: new Date(Date.now() + 18 * 86400000).toISOString().split('T')[0],
      created_by: '00000000-0000-0000-0000-000000000003'
    }
  ],
  invoices: [
    {
      id: 'inv1',
      invoice_number: 'INV-2026-00012',
      po_id: 'po1',
      vendor_id: 'vid-apex',
      status: 'sent',
      subtotal: 2750000,
      cgst_amount: 247500,
      sgst_amount: 247500,
      igst_amount: 0,
      total_tax: 495000,
      total_amount: 3245000,
      due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      created_by: '00000000-0000-0000-0000-000000000004'
    }
  ],
  activity_logs: [
    {
      id: 'act1',
      entity_type: 'rfq',
      entity_id: 'rfq1',
      action: 'CREATE',
      description: 'Created RFQ-2026-00042: Data Centre Upgrade',
      performed_by: '00000000-0000-0000-0000-000000000003',
      performed_at: new Date(Date.now() - 4 * 86400000).toISOString()
    },
    {
      id: 'act2',
      entity_type: 'quotation',
      entity_id: 'quo1',
      action: 'SUBMIT',
      description: 'Quotation received from Apex Technology',
      performed_by: '00000000-0000-0000-0000-000000000004',
      performed_at: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: 'act3',
      entity_type: 'approval',
      entity_id: 'quo1',
      action: 'APPROVE',
      description: 'Approved QUO-2026-00017.',
      performed_by: '00000000-0000-0000-0000-000000000002',
      performed_at: new Date(Date.now() - 2 * 86400000).toISOString()
    }
  ],
  notifications: []
};
