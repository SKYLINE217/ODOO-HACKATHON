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
      if (onfulfilled) return onfulfilled(result);
      return result;
    } catch (error: any) {
      const errRes = { data: null, error: { message: error.message || 'Fetch error' } };
      if (onfulfilled) return onfulfilled(errRes);
      return errRes;
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
        const { data: profile } = await result.json();
        
        let finalProfile = profile;
        if (!finalProfile) {
          const registry = JSON.parse(localStorage.getItem('vb_users_registry') || '{}');
          const regUser = registry[email.toLowerCase()];
          
          finalProfile = {
            id: regUser?.id || 'usr-' + Math.random().toString(36).substring(2, 9),
            full_name: regUser?.full_name || email.split('@')[0],
            email: email,
            role: regUser?.role || (email.includes('admin') ? 'admin' : email.includes('manager') ? 'manager' : email.includes('vendor') ? 'vendor' : 'procurement_officer')
          };
          
          try {
            await fetch('/api/db', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                table: 'profiles',
                chain: [{ method: 'upsert', args: [finalProfile] }]
              })
            });
          } catch (e) {
            // ignore database write failures gracefully during demo/offline
          }
        }
        
        setCookie('sb-bypass-session', JSON.stringify(finalProfile));
        const sbUser = profileToSupabaseUser(finalProfile);
        return { data: { user: sbUser, session: { access_token: 'mock', user: sbUser } }, error: null };
      } catch (err: any) {
        const fallbackProfile = {
          id: 'usr-fallback',
          full_name: email.split('@')[0],
          email: email,
          role: email.includes('admin') ? 'admin' : email.includes('manager') ? 'manager' : email.includes('vendor') ? 'vendor' : 'procurement_officer'
        };
        setCookie('sb-bypass-session', JSON.stringify(fallbackProfile));
        const sbUser = profileToSupabaseUser(fallbackProfile);
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
        
        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'profiles',
            chain: [{ method: 'upsert', args: [profile] }]
          })
        });
        
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
