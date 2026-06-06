import { query } from '@/lib/mysql';
import crypto from 'crypto';

interface ChainCall {
  method: string;
  args: any[];
}

export async function handleDbQuery(table: string, chain: ChainCall[]) {
  try {
    // Parse Chain Calls
  let operation: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
  let selectColumns = '*';
  const eqFilters: { column: string; value: any }[] = [];
  const neqFilters: { column: string; value: any }[] = [];
  const inFilters: { column: string; values: any[] }[] = [];
  let orderBy: { column: string; ascending: boolean } | null = null;
  let limit: number | null = null;
  let single = false;
  let insertData: any = null;
  let updateData: any = null;
  let upsertData: any = null;

  for (const call of chain) {
    if (call.method === 'select') {
      operation = 'select';
      selectColumns = call.args[0] || '*';
    } else if (call.method === 'eq') {
      eqFilters.push({ column: call.args[0], value: call.args[1] });
    } else if (call.method === 'neq') {
      neqFilters.push({ column: call.args[0], value: call.args[1] });
    } else if (call.method === 'in') {
      inFilters.push({ column: call.args[0], values: Array.isArray(call.args[1]) ? call.args[1] : [] });
    } else if (call.method === 'order') {
      const col = call.args[0];
      const opts = call.args[1] || {};
      orderBy = { column: col, ascending: opts.ascending !== false };
    } else if (call.method === 'limit') {
      limit = parseInt(call.args[0], 10);
    } else if (call.method === 'single') {
      single = true;
    } else if (call.method === 'insert') {
      operation = 'insert';
      insertData = call.args[0];
    } else if (call.method === 'update') {
      operation = 'update';
      updateData = call.args[0];
    } else if (call.method === 'upsert') {
      operation = 'upsert';
      upsertData = call.args[0];
    } else if (call.method === 'delete') {
      operation = 'delete';
    }
  }

  // WHERE Clause Builder
  const buildWhere = (tableAlias: string) => {
    const conditions: string[] = [];
    const params: any[] = [];

    for (const filter of eqFilters) {
      conditions.push(`${tableAlias}.\`${filter.column}\` = ?`);
      params.push(filter.value);
    }

    for (const filter of neqFilters) {
      conditions.push(`${tableAlias}.\`${filter.column}\` != ?`);
      params.push(filter.value);
    }

    for (const filter of inFilters) {
      if (filter.values.length > 0) {
        const placeholders = filter.values.map(() => '?').join(',');
        conditions.push(`${tableAlias}.\`${filter.column}\` IN (${placeholders})`);
        params.push(...filter.values);
      } else {
        conditions.push('1 = 0');
      }
    }

    const sql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { sql, params };
  };

  // ORDER BY & LIMIT builder
  const buildSuffix = (tableAlias: string) => {
    let suffix = '';
    if (orderBy) {
      suffix += ` ORDER BY ${tableAlias}.\`${orderBy.column}\` ${orderBy.ascending ? 'ASC' : 'DESC'}`;
    }
    if (limit !== null) {
      suffix += ` LIMIT ${limit}`;
    }
    return suffix;
  };

  // --- EXECUTE OPERATIONS ---

  if (operation === 'select') {
    let data: any = null;

    if (table === 'profiles') {
      const { sql, params } = buildWhere('p');
      const suffix = buildSuffix('p');
      const rows = await query(`SELECT p.* FROM profiles p ${sql} ${suffix}`, params);
      data = rows;
    } 
    else if (table === 'vendors') {
      const { sql, params } = buildWhere('v');
      const suffix = buildSuffix('v');
      const rows = await query(
        `SELECT v.*, vc.name AS category_name 
         FROM vendors v 
         LEFT JOIN vendor_categories vc ON v.category_id = vc.id 
         ${sql} ${suffix}`,
        params
      );

      data = rows.map((r: any) => ({
        ...r,
        vendor_categories: r.category_name ? { name: r.category_name } : null,
      }));
    } 
    else if (table === 'vendor_categories') {
      const { sql, params } = buildWhere('vc');
      const suffix = buildSuffix('vc');
      const rows = await query(`SELECT vc.* FROM vendor_categories vc ${sql} ${suffix}`, params);
      data = rows;
    } 
    else if (table === 'rfqs') {
      const { sql, params } = buildWhere('r');
      const suffix = buildSuffix('r');
      const rfqRows = await query(
        `SELECT r.*, p.full_name AS creator_name 
         FROM rfqs r 
         LEFT JOIN profiles p ON r.created_by = p.id 
         ${sql} ${suffix}`,
        params
      );

      if (rfqRows.length > 0 && selectColumns.includes('rfq_items')) {
        const rfqIds = rfqRows.map((r: any) => r.id);
        const placeholders = rfqIds.map(() => '?').join(',');
        const itemRows = await query(
          `SELECT * FROM rfq_items WHERE rfq_id IN (${placeholders}) ORDER BY sort_order ASC`,
          rfqIds
        );

        data = rfqRows.map((rfq: any) => ({
          ...rfq,
          profiles: rfq.creator_name ? { full_name: rfq.creator_name } : null,
          rfq_items: itemRows.filter((item: any) => item.rfq_id === rfq.id),
        }));
      } else {
        data = rfqRows.map((rfq: any) => ({
          ...rfq,
          profiles: rfq.creator_name ? { full_name: rfq.creator_name } : null,
        }));
      }
    } 
    else if (table === 'rfq_items') {
      const { sql, params } = buildWhere('ri');
      const suffix = buildSuffix('ri');
      const rows = await query(`SELECT ri.* FROM rfq_items ri ${sql} ${suffix}`, params);
      data = rows;
    } 
    else if (table === 'quotations') {
      const { sql, params } = buildWhere('q');
      const suffix = buildSuffix('q');
      const quoteRows = await query(
        `SELECT q.*, v.id AS vendor_id, v.company_name AS vendor_company_name 
         FROM quotations q 
         LEFT JOIN vendors v ON q.vendor_id = v.id 
         ${sql} ${suffix}`,
        params
      );

      data = quoteRows.map((q: any) => ({
        ...q,
        vendor: q.vendor_id ? { id: q.vendor_id, company_name: q.vendor_company_name } : null,
      }));
    } 
    else if (table === 'quotation_items') {
      const { sql, params } = buildWhere('qi');
      const suffix = buildSuffix('qi');
      const rows = await query(`SELECT qi.* FROM quotation_items qi ${sql} ${suffix}`, params);
      data = rows;
    } 
    else if (table === 'approvals') {
      const { sql, params } = buildWhere('a');
      const suffix = buildSuffix('a');
      const approvalRows = await query(
        `SELECT a.*, q.quotation_number, q.total_amount, r.title AS rfq_title, p.full_name AS requester_name, p.role AS requester_role 
         FROM approvals a 
         LEFT JOIN quotations q ON a.quotation_id = q.id 
         LEFT JOIN rfqs qrfq ON q.rfq_id = qrfq.id
         LEFT JOIN rfqs r ON q.rfq_id = r.id 
         LEFT JOIN profiles p ON a.requested_by = p.id 
         ${sql} ${suffix}`,
        params
      );

      data = approvalRows.map((app: any) => ({
        ...app,
        quotation: app.quotation_number
          ? {
              quotation_number: app.quotation_number,
              total_amount: app.total_amount,
              rfq: app.rfq_title ? { title: app.rfq_title } : null,
            }
          : null,
        requester: app.requester_name ? { full_name: app.requester_name, role: app.requester_role } : null,
      }));
    } 
    else if (table === 'purchase_orders') {
      const { sql, params } = buildWhere('po');
      const suffix = buildSuffix('po');
      const poRows = await query(
        `SELECT po.*, v.company_name AS vendor_company_name 
         FROM purchase_orders po 
         LEFT JOIN vendors v ON po.vendor_id = v.id 
         ${sql} ${suffix}`,
        params
      );
      data = poRows;
    } 
    else if (table === 'invoices') {
      const { sql, params } = buildWhere('i');
      const suffix = buildSuffix('i');
      const invoiceRows = await query(
        `SELECT i.*, v.company_name AS vendor_company_name 
         FROM invoices i 
         LEFT JOIN vendors v ON i.vendor_id = v.id 
         ${sql} ${suffix}`,
        params
      );

      data = invoiceRows.map((inv: any) => ({
        ...inv,
        vendor: inv.vendor_company_name ? { company_name: inv.vendor_company_name } : null,
      }));
    } 
    else if (table === 'activity_logs') {
      const { sql, params } = buildWhere('al');
      const suffix = buildSuffix('al');
      const rows = await query(
        `SELECT al.*, p.full_name AS performer_name 
         FROM activity_logs al 
         LEFT JOIN profiles p ON al.performed_by = p.id 
         ${sql} ${suffix}`,
        params
      );
      
      data = rows.map((r: any) => ({
        ...r,
        performer: r.performer_name ? { full_name: r.performer_name } : null,
      }));
    } 
    else if (table === 'notifications') {
      const { sql, params } = buildWhere('n');
      const suffix = buildSuffix('n');
      const rows = await query(`SELECT n.* FROM notifications n ${sql} ${suffix}`, params);
      data = rows;
    } 
    else {
      const { sql, params } = buildWhere('t');
      const suffix = buildSuffix('t');
      const rows = await query(`SELECT * FROM \`${table}\` t ${sql} ${suffix}`, params);
      data = rows;
    }

    if (single) {
      data = data && data.length > 0 ? data[0] : null;
    }

    return { data, error: null };
  }

  if (operation === 'insert') {
    const records = Array.isArray(insertData) ? insertData : [insertData];
    const insertedRecords: any[] = [];

    for (const record of records) {
      if (!record.id) {
        record.id = crypto.randomUUID();
      }

      if (table === 'rfqs' && (!record.rfq_number || record.rfq_number === '')) {
        const countRows = await query('SELECT COUNT(*) as count FROM rfqs');
        const count = countRows[0]?.count || 0;
        const year = new Date().getFullYear();
        record.rfq_number = `RFQ-${year}-${String(42 + count).padStart(5, '0')}`;
      }
      else if (table === 'quotations' && (!record.quotation_number || record.quotation_number === '')) {
        const countRows = await query('SELECT COUNT(*) as count FROM quotations');
        const count = countRows[0]?.count || 0;
        const year = new Date().getFullYear();
        record.quotation_number = `QUO-${year}-${String(17 + count).padStart(5, '0')}`;
      }
      else if (table === 'purchase_orders' && (!record.po_number || record.po_number === '')) {
        const countRows = await query('SELECT COUNT(*) as count FROM purchase_orders');
        const count = countRows[0]?.count || 0;
        const year = new Date().getFullYear();
        record.po_number = `PO-${year}-${String(8 + count).padStart(5, '0')}`;
      }
      else if (table === 'invoices' && (!record.invoice_number || record.invoice_number === '')) {
        const countRows = await query('SELECT COUNT(*) as count FROM invoices');
        const count = countRows[0]?.count || 0;
        const year = new Date().getFullYear();
        record.invoice_number = `INV-${year}-${String(10 + count).padStart(5, '0')}`;
      }

      const keys = Object.keys(record);
      const columns = keys.map(k => `\`${k}\``).join(', ');
      const placeholders = keys.map(() => '?').join(', ');
      const params = keys.map(k => {
        const val = record[k];
        if (typeof val === 'string' && val.includes('T') && !isNaN(Date.parse(val))) {
          return new Date(val).toISOString().slice(0, 19).replace('T', ' ');
        }
        return val;
      });

      await query(`INSERT INTO \`${table}\` (${columns}) VALUES (${placeholders})`, params);
      insertedRecords.push(record);
    }

    const responseData = single ? insertedRecords[0] : insertedRecords;
    return { data: responseData, error: null };
  }

  if (operation === 'update') {
    const { sql, params: whereParams } = buildWhere('t');
    if (!sql) {
      throw new Error('WHERE clause is required for update');
    }

    const keys = Object.keys(updateData);
    const setClauses = keys.map(k => `\`${k}\` = ?`).join(', ');
    const setParams = keys.map(k => {
      const val = updateData[k];
      if (typeof val === 'string' && val.includes('T') && !isNaN(Date.parse(val))) {
        return new Date(val).toISOString().slice(0, 19).replace('T', ' ');
      }
      return val;
    });

    const updateSql = `UPDATE \`${table}\` t SET ${setClauses} ${sql}`;
    const allParams = [...setParams, ...whereParams];

    await query(updateSql, allParams);

    return { data: updateData, error: null };
  }

  if (operation === 'upsert') {
    const record = upsertData;
    if (!record.id) {
      record.id = crypto.randomUUID();
    }

    const keys = Object.keys(record);
    const columns = keys.map(k => `\`${k}\``).join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    
    const updateClause = keys
      .filter(k => k !== 'id')
      .map(k => `\`${k}\` = VALUES(\`${k}\`)`)
      .join(', ');

    const params = keys.map(k => {
      const val = record[k];
      if (typeof val === 'string' && val.includes('T') && !isNaN(Date.parse(val))) {
        return new Date(val).toISOString().slice(0, 19).replace('T', ' ');
      }
      return val;
    });

    const upsertSql = `INSERT INTO \`${table}\` (${columns}) VALUES (${placeholders}) 
                       ON DUPLICATE KEY UPDATE ${updateClause}`;

    await query(upsertSql, params);

    return { data: record, error: null };
  }

  if (operation === 'delete') {
    const { sql, params } = buildWhere('t');
    if (!sql) {
      throw new Error('WHERE clause is required for delete');
    }

    await query(`DELETE t FROM \`${table}\` t ${sql}`, params);
    return { data: { success: true }, error: null };
  }

  throw new Error(`Unsupported operation: ${operation}`);
  } catch (err: any) {
    console.error(`Database query error for table ${table}:`, err);
    return { data: null, error: { message: err.message || 'Database query failed' } };
  }
}
