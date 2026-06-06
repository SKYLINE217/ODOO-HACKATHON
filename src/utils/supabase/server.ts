import { cookies } from "next/headers";
import { handleDbQuery } from "@/lib/mysqlQuery";

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

export const createClient = (cookieStore: Awaited<ReturnType<typeof cookies>>): any => {
  const auth = {
    async signInWithPassword({ email, password }: any) {
      return { error: { message: 'Not supported on server component context directly.' } };
    },

    async signUp() {
      return { error: { message: 'Not supported on server component context directly.' } };
    },

    async signOut() {
      cookieStore.delete('sb-bypass-session');
      return { error: null };
    },

    async getSession() {
      const cookie = cookieStore.get('sb-bypass-session');
      if (cookie?.value) {
        try {
          const userProfile = JSON.parse(cookie.value);
          const user = profileToSupabaseUser(userProfile);
          return { data: { session: { access_token: 'mock', user } }, error: null };
        } catch {}
      }
      return { data: { session: null }, error: null };
    },

    async getUser() {
      const cookie = cookieStore.get('sb-bypass-session');
      if (cookie?.value) {
        try {
          const userProfile = JSON.parse(cookie.value);
          const user = profileToSupabaseUser(userProfile);
          return { data: { user }, error: null };
        } catch {}
      }
      return { data: { user: null }, error: null };
    },

    onAuthStateChange() {
      return { data: { subscription: { unsubscribe() {} } } };
    },

    async signInWithOAuth() {
      return { error: null };
    },

    async updateUser() {
      return { error: null };
    },

    async exchangeCodeForSession(code: string) {
      return { data: { session: null }, error: { message: 'OAuth disabled' } };
    }
  };

  return {
    auth,
    from(tableName: string) {
      return new MockSupabaseQueryBuilder(tableName);
    }
  };
};
