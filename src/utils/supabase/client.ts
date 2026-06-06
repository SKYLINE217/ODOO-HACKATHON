import { INITIAL_SEEDS } from './seeds';

function getLocalTable(tableName: string): any[] {
  if (typeof window === 'undefined') return [];
  
  // Database version check to auto-clear outdated cache
  const CURRENT_DB_VERSION = 'v2_expanded';
  const savedVersion = localStorage.getItem('vb_db_seed_version');
  if (savedVersion !== CURRENT_DB_VERSION) {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('vb_db_')) {
        localStorage.removeItem(key);
      }
    }
    localStorage.setItem('vb_db_seed_version', CURRENT_DB_VERSION);
  }

  const stored = localStorage.getItem(`vb_db_${tableName}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }
  const seed = INITIAL_SEEDS[tableName] || [];
  localStorage.setItem(`vb_db_${tableName}`, JSON.stringify(seed));
  return seed;
}

function saveLocalTable(tableName: string, data: any[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`vb_db_${tableName}`, JSON.stringify(data));
}

function runLocalQuery(tableName: string, chain: Array<{ method: string; args: any[] }>) {
  let list = [...getLocalTable(tableName)];

  let operation: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
  const eqFilters: { column: string; value: any }[] = [];
  const neqFilters: { column: string; value: any }[] = [];
  let orderBy: { column: string; ascending: boolean } | null = null;
  let limitVal: number | null = null;
  let single = false;
  let insertData: any = null;
  let updateData: any = null;
  let upsertData: any = null;

  for (const call of chain) {
    if (call.method === 'select') {
      operation = 'select';
    } else if (call.method === 'eq') {
      eqFilters.push({ column: call.args[0], value: call.args[1] });
    } else if (call.method === 'neq') {
      neqFilters.push({ column: call.args[0], value: call.args[1] });
    } else if (call.method === 'order') {
      orderBy = { column: call.args[0], ascending: call.args[1]?.ascending !== false };
    } else if (call.method === 'limit') {
      limitVal = parseInt(call.args[0], 10);
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

  const matches = (row: any) => {
    for (const f of eqFilters) {
      if (row[f.column] !== f.value) return false;
    }
    for (const f of neqFilters) {
      if (row[f.column] === f.value) return false;
    }
    return true;
  };

  if (operation === 'select') {
    let data = list.filter(matches);

    if (tableName === 'vendors') {
      const categories = getLocalTable('vendor_categories');
      data = data.map(v => ({
        ...v,
        vendor_categories: categories.find(c => c.id === v.category_id) || null
      }));
    } else if (tableName === 'rfqs') {
      const profiles = getLocalTable('profiles');
      const items = getLocalTable('rfq_items');
      data = data.map(r => ({
        ...r,
        profiles: profiles.find(p => p.id === r.created_by) || null,
        rfq_items: items.filter(item => item.rfq_id === r.id)
      }));
    } else if (tableName === 'quotations') {
      const vendors = getLocalTable('vendors');
      data = data.map(q => ({
        ...q,
        vendor: vendors.find(v => v.id === q.vendor_id) || null
      }));
    } else if (tableName === 'approvals') {
      const quotations = getLocalTable('quotations');
      const rfqs = getLocalTable('rfqs');
      const profiles = getLocalTable('profiles');
      data = data.map(a => {
        const quotation = quotations.find(q => q.id === a.quotation_id);
        const rfq = quotation ? rfqs.find(r => r.id === quotation.rfq_id) : null;
        return {
          ...a,
          quotation: quotation ? {
            quotation_number: quotation.quotation_number,
            total_amount: quotation.total_amount,
            rfq: rfq ? { title: rfq.title } : null
          } : null,
          requester: profiles.find(p => p.id === a.requested_by) || null
        };
      });
    } else if (tableName === 'purchase_orders') {
      const vendors = getLocalTable('vendors');
      data = data.map(po => ({
        ...po,
        vendor: vendors.find(v => v.id === po.vendor_id) || null
      }));
    } else if (tableName === 'invoices') {
      const vendors = getLocalTable('vendors');
      data = data.map(inv => ({
        ...inv,
        vendor: vendors.find(v => v.id === inv.vendor_id) || null
      }));
    } else if (tableName === 'activity_logs') {
      const profiles = getLocalTable('profiles');
      data = data.map(act => ({
        ...act,
        performer: profiles.find(p => p.id === act.performed_by) || null
      }));
    }

    if (orderBy) {
      const col = orderBy.column;
      const asc = orderBy.ascending;
      data.sort((a, b) => {
        if (a[col] < b[col]) return asc ? -1 : 1;
        if (a[col] > b[col]) return asc ? 1 : -1;
        return 0;
      });
    }

    if (limitVal !== null) {
      data = data.slice(0, limitVal);
    }

    if (single) {
      return { data: data.length > 0 ? data[0] : null, error: null };
    }
    return { data, error: null };
  }

  if (operation === 'insert') {
    const records = Array.isArray(insertData) ? insertData : [insertData];
    const inserted: any[] = [];
    for (const record of records) {
      const newRec = { ...record };
      if (!newRec.id) newRec.id = 'loc-' + Math.random().toString(36).substring(2, 9);
      
      if (tableName === 'rfqs' && !newRec.rfq_number) {
        newRec.rfq_number = `RFQ-2026-${String(42 + list.length).padStart(5, '0')}`;
      } else if (tableName === 'quotations' && !newRec.quotation_number) {
        newRec.quotation_number = `QUO-2026-${String(17 + list.length).padStart(5, '0')}`;
      } else if (tableName === 'purchase_orders' && !newRec.po_number) {
        newRec.po_number = `PO-2026-${String(8 + list.length).padStart(5, '0')}`;
      } else if (tableName === 'invoices' && !newRec.invoice_number) {
        newRec.invoice_number = `INV-2026-${String(10 + list.length).padStart(5, '0')}`;
      }

      list.push(newRec);
      inserted.push(newRec);
    }
    saveLocalTable(tableName, list);
    return { data: single ? inserted[0] : inserted, error: null };
  }

  if (operation === 'update') {
    let updated: any[] = [];
    list = list.map(row => {
      if (matches(row)) {
        const merged = { ...row, ...updateData };
        updated.push(merged);
        return merged;
      }
      return row;
    });
    saveLocalTable(tableName, list);
    return { data: single ? updated[0] : updated, error: null };
  }

  if (operation === 'upsert') {
    const record = upsertData;
    const recId = record.id || 'loc-' + Math.random().toString(36).substring(2, 9);
    const existingIdx = list.findIndex(r => r.id === recId);
    const newRec = { ...record, id: recId };
    if (existingIdx > -1) {
      list[existingIdx] = { ...list[existingIdx], ...newRec };
    } else {
      list.push(newRec);
    }
    saveLocalTable(tableName, list);
    return { data: newRec, error: null };
  }

  if (operation === 'delete') {
    const remaining = list.filter(row => !matches(row));
    saveLocalTable(tableName, remaining);
    return { data: { success: true }, error: null };
  }

  return { data: null, error: { message: 'Unsupported local operation' } };
}

class MockSupabaseQueryBuilder {
  private tableName: string;
  private chain: Array<{ method: string; args: any[] }> = [];

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(...args: any[]) { this.chain.push({ method: 'select', args }); return this; }
  eq(...args: any[]) { this.chain.push({ method: 'eq', args }); return this; }
  neq(...args: any[]) { this.chain.push({ method: 'neq', args }); return this; }
  order(...args: any[]) { this.chain.push({ method: 'order', args }); return this; }
  limit(...args: any[]) { this.chain.push({ method: 'limit', args }); return this; }
  single(...args: any[]) { this.chain.push({ method: 'single', args }); return this; }
  insert(...args: any[]) { this.chain.push({ method: 'insert', args }); return this; }
  update(...args: any[]) { this.chain.push({ method: 'update', args }); return this; }
  upsert(...args: any[]) { this.chain.push({ method: 'upsert', args }); return this; }
  delete(...args: any[]) { this.chain.push({ method: 'delete', args }); return this; }

  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    try {
      const response = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: this.tableName, chain: this.chain }),
      });
      const result = await response.json();
      
      if (result.error && (result.error.message.includes('ECONNREFUSED') || result.error.message.includes('connection') || result.error.message.includes('offline'))) {
        const localResult = runLocalQuery(this.tableName, this.chain);
        if (onfulfilled) return onfulfilled(localResult);
        return localResult;
      }
      
      if (onfulfilled) return onfulfilled(result);
      return result;
    } catch (error: any) {
      const localResult = runLocalQuery(this.tableName, this.chain);
      if (onfulfilled) return onfulfilled(localResult);
      return localResult;
    }
  }
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop()!.split(';').shift() || '');
  return null;
}

function setCookie(name: string, value: string, maxAge = 86400) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}`;
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

function profileToSupabaseUser(profile: any) {
  if (!profile) return null;
  return {
    id: profile.id,
    email: profile.email,
    user_metadata: {
      full_name: profile.full_name,
      role: profile.role,
      avatar_url: profile.avatar_url,
      department: profile.department
    }
  };
}

export const createClient = (): any => {
  const auth = {
    async signInWithPassword({ email, password }: any) {
      try {
        const result = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'profiles',
            chain: [
              { method: 'select', args: ['*'] },
              { method: 'eq', args: ['email', email] },
              { method: 'single', args: [] }
            ]
          })
        });
        const payload = await result.json();
        let profile = payload?.data;
        const apiError = payload?.error;
        
        if (!profile || (apiError && (apiError.message.includes('ECONNREFUSED') || apiError.message.includes('offline')))) {
          const localProfiles = getLocalTable('profiles');
          profile = localProfiles.find(p => p.email.toLowerCase() === email.toLowerCase());
          
          if (!profile) {
            const registry = JSON.parse(localStorage.getItem('vb_users_registry') || '{}');
            const regUser = registry[email.toLowerCase()];
            
            profile = {
              id: regUser?.id || 'usr-' + Math.random().toString(36).substring(2, 9),
              full_name: regUser?.full_name || email.split('@')[0],
              email: email,
              role: regUser?.role || (email.includes('admin') ? 'admin' : email.includes('manager') ? 'manager' : email.includes('vendor') ? 'vendor' : 'procurement_officer')
            };
            
            localProfiles.push(profile);
            saveLocalTable('profiles', localProfiles);
          }
        }
        
        setCookie('sb-bypass-session', JSON.stringify(profile));
        const sbUser = profileToSupabaseUser(profile);
        return { data: { user: sbUser, session: { access_token: 'mock', user: sbUser } }, error: null };
      } catch (err: any) {
        const localProfiles = getLocalTable('profiles');
        let profile = localProfiles.find(p => p.email.toLowerCase() === email.toLowerCase());
        if (!profile) {
          profile = {
            id: 'usr-fallback',
            full_name: email.split('@')[0],
            email: email,
            role: email.includes('admin') ? 'admin' : email.includes('manager') ? 'manager' : email.includes('vendor') ? 'vendor' : 'procurement_officer'
          };
        }
        setCookie('sb-bypass-session', JSON.stringify(profile));
        const sbUser = profileToSupabaseUser(profile);
        return { data: { user: sbUser, session: { access_token: 'mock', user: sbUser } }, error: null };
      }
    },

    async signUp({ email, password, options }: any) {
      try {
        const profile = {
          id: 'usr-' + Math.random().toString(36).substring(2, 9),
          full_name: options?.data?.full_name || email.split('@')[0],
          email: email,
          role: options?.data?.role || 'procurement_officer'
        };
        
        const response = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'profiles',
            chain: [{ method: 'upsert', args: [profile] }]
          })
        });
        const result = await response.json();
        
        if (result.error && (result.error.message.includes('ECONNREFUSED') || result.error.message.includes('offline'))) {
          const localProfiles = getLocalTable('profiles');
          localProfiles.push(profile);
          saveLocalTable('profiles', localProfiles);
        }
        
        setCookie('sb-bypass-session', JSON.stringify(profile));
        const sbUser = profileToSupabaseUser(profile);
        return { data: { user: sbUser, session: { access_token: 'mock', user: sbUser } }, error: null };
      } catch (err: any) {
        const profile = {
          id: 'usr-' + Math.random().toString(36).substring(2, 9),
          full_name: options?.data?.full_name || email.split('@')[0],
          email: email,
          role: options?.data?.role || 'procurement_officer'
        };
        const localProfiles = getLocalTable('profiles');
        localProfiles.push(profile);
        saveLocalTable('profiles', localProfiles);
        
        setCookie('sb-bypass-session', JSON.stringify(profile));
        const sbUser = profileToSupabaseUser(profile);
        return { data: { user: sbUser, session: { access_token: 'mock', user: sbUser } }, error: null };
      }
    },

    async signOut() {
      deleteCookie('sb-bypass-session');
      return { error: null };
    },

    async getSession() {
      const cookieStr = getCookie('sb-bypass-session');
      if (cookieStr) {
        try {
          const userProfile = JSON.parse(cookieStr);
          const user = profileToSupabaseUser(userProfile);
          return { data: { session: { access_token: 'mock', user } }, error: null };
        } catch {
          // ignore
        }
      }
      return { data: { session: null }, error: null };
    },

    async getUser() {
      const cookieStr = getCookie('sb-bypass-session');
      if (cookieStr) {
        try {
          const userProfile = JSON.parse(cookieStr);
          const user = profileToSupabaseUser(userProfile);
          return { data: { user }, error: null };
        } catch {
          // ignore
        }
      }
      return { data: { user: null }, error: null };
    },

    onAuthStateChange(callback: any) {
      const cookieStr = getCookie('sb-bypass-session');
      let session = null;
      if (cookieStr) {
        try {
          const userProfile = JSON.parse(cookieStr);
          const user = profileToSupabaseUser(userProfile);
          session = { access_token: 'mock', user };
        } catch {}
      }
      callback('INITIAL_SESSION', session);
      return { data: { subscription: { unsubscribe() {} } } };
    },

    async signInWithOAuth({ provider, options }: any) {
      return { error: { message: 'Google Sign-In is not enabled. Please log in with password.' } };
    },

    async updateUser({ password }: any) {
      return { error: null };
    }
  };

  return {
    auth,
    from(tableName: string) {
      return new MockSupabaseQueryBuilder(tableName);
    }
  };
};
