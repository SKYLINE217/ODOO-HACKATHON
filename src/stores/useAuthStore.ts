import { create } from 'zustand'

export interface UserProfile {
  id: string
  full_name: string
  email: string
  role: 'admin' | 'procurement_officer' | 'manager' | 'vendor'
  avatar_url: string | null
  department: string | null
  phone?: string | null
  vendor_id?: string | null
  onboarded?: boolean
}

interface AuthState {
  user: UserProfile | null
  loading: boolean
  setUser: (user: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  logout: () => Promise<void>
}

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
    // Also use the new API route to clear the cookie reliably
    try {
      await fetch('/api/auth/set-session', { method: 'DELETE', credentials: 'same-origin' })
    } catch {}

    clearAllSessionCookies()

    if (typeof window !== 'undefined') {
      const keysToRemove = Object.keys(localStorage).filter(k =>
        k.startsWith('vb_') || k.startsWith('sb-') || k.includes('supabase')
      )
      keysToRemove.forEach(k => localStorage.removeItem(k))
    }

    set({ user: null, loading: false })
    
    // Hard navigate to login after logout
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }
}))
