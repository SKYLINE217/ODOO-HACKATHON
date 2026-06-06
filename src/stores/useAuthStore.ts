import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'

export interface UserProfile {
  id: string
  full_name: string
  email: string
  role: 'admin' | 'procurement_officer' | 'manager' | 'vendor'
  avatar_url: string | null
  department: string | null
  phone?: string | null
  vendor_id?: string | null
}

interface AuthState {
  user: UserProfile | null
  loading: boolean
  setUser: (user: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  logout: () => Promise<void>
}

// Clear ALL session-related cookies — Supabase SSR tokens, bypass cookie
function clearAllSessionCookies() {
  if (typeof window === 'undefined') return
  const cookiesToClear = [
    'sb-bypass-session',
    'sb-access-token',
    'sb-refresh-token',
  ]
  cookiesToClear.forEach(name => {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
    document.cookie = `${name}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
  })
  // Also wipe any sb-* Supabase auth cookies by scanning all cookies
  document.cookie.split(';').forEach(c => {
    const name = c.trim().split('=')[0]
    if (name.startsWith('sb-')) {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
    }
  })
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  logout: async () => {
    // 1. Sign out from Supabase server-side first
    try {
      const supabase = createClient()
      await supabase.auth.signOut({ scope: 'global' })
    } catch { /* ignore — may be in bypass mode */ }

    // 2. Clear all session cookies
    clearAllSessionCookies()

    // 3. Clear localStorage of any cached data
    if (typeof window !== 'undefined') {
      const keysToRemove = Object.keys(localStorage).filter(k =>
        k.startsWith('vb_') || k.startsWith('sb-') || k.includes('supabase')
      )
      keysToRemove.forEach(k => localStorage.removeItem(k))
    }

    // 4. Reset store state
    set({ user: null, loading: false })
  }
}))
