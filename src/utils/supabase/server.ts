import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { handleDbQuery } from "@/lib/mysqlQuery";

class MockSupabaseQueryBuilder {
  private tableName: string;
  private chain: Array<{ method: string; args: any[] }> = [];
  private realSupabase: any;

  constructor(tableName: string, realSupabase: any) {
    this.tableName = tableName;
    this.realSupabase = realSupabase;
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
      let sbQuery = this.realSupabase.from(this.tableName);
      let isMutation = false;

      for (const call of this.chain) {
        if (['insert', 'update', 'upsert', 'delete'].includes(call.method)) {
          isMutation = true;
        }
        sbQuery = sbQuery[call.method](...call.args);
      }

      const sbResult = await sbQuery;

      if (isMutation && !sbResult.error) {
        // Run MySQL sync mutation directly (since we are on server side)
        handleDbQuery(this.tableName, this.chain).catch(err => 
          console.warn('MySQL sync server-side mutation failed:', err)
        );
      }

      if (!sbResult.error) {
        if (onfulfilled) return onfulfilled(sbResult);
        return sbResult;
      }

      throw sbResult.error;
    } catch (error: any) {
      // Fallback directly to handleDbQuery (MySQL)
      try {
        const result = await handleDbQuery(this.tableName, this.chain);
        if (onfulfilled) return onfulfilled(result);
        return result;
      } catch (err) {
        const errRes = { data: null, error: { message: error.message || 'Database error' } };
        if (onfulfilled) return onfulfilled(errRes);
        return errRes;
      }
    }
  }
}

export const createClient = (cookieStore: Awaited<ReturnType<typeof cookies>>): any => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const realSupabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          // Ignored if called in Server Component context
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch (error) {
          // Ignored if called in Server Component context
        }
      },
    },
  });

  return {
    auth: realSupabase.auth,
    from(tableName: string) {
      return new MockSupabaseQueryBuilder(tableName, realSupabase);
    }
  };
};
