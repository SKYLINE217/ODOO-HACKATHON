import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'

export interface UserProfile {
  id: string
  full_name: string
  email: string
  role: 'admin' | 'procurement_officer' | 'manager' | 'vendor'
  avatar_url: string | null
  department: string | null
}

interface AuthState {
  user: UserProfile | null
  loading: boolean
  setUser: (user: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  logout: async () => {
    try {
      // Sign out from Supabase (no-op if not authenticated via Supabase)
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('Supabase signOut failed (may be using bypass mode):', err)
    }

    // Clear bypass cookie
    if (typeof window !== 'undefined') {
      document.cookie = 'sb-bypass-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'
    }

    set({ user: null })
  }
}))
