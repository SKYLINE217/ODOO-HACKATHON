import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { handleDbQuery } from "@/lib/mysqlQuery";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gbfjkjtcjtbuwdvsscpy.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_e4hPTz57aT4LfWyAwpAwQg_b5WrNSX8";

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
  single(...args: any[]) { this.chain.push({ method: 'single', args }); return this; return this; }
  insert(...args: any[]) { this.chain.push({ method: 'insert', args }); return this; }
  update(...args: any[]) { this.chain.push({ method: 'update', args }); return this; }
  upsert(...args: any[]) { this.chain.push({ method: 'upsert', args }); return this; }
  delete(...args: any[]) { this.chain.push({ method: 'delete', args }); return this; }

  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    try {
      const result = await handleDbQuery(this.tableName, this.chain);
      if (onfulfilled) return onfulfilled(result);
      return result;
    } catch (error: any) {
      const errRes = { data: null, error: { message: error.message || 'Database error' } };
      if (onfulfilled) return onfulfilled(errRes);
      return errRes;
    }
  }
}

export const createClient = (cookieStore: Awaited<ReturnType<typeof cookies>>): any => {
  const realClient = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );

  return new Proxy(realClient, {
    get(target, prop, receiver) {
      if (prop === 'from') {
        return (tableName: string) => new MockSupabaseQueryBuilder(tableName);
      }
      return Reflect.get(target, prop, receiver);
    }
  }) as any;
};
