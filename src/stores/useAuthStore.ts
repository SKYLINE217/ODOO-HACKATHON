import { create } from 'zustand'

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
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: {
    id: 'demo-user-id',
    full_name: 'Alex Mercer',
    email: 'alex.mercer@vendorbridge.io',
    role: 'admin',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    department: 'Procurement & Logistics'
  },
  loading: false,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  logout: () => {
    if (typeof window !== 'undefined') {
      document.cookie = 'sb-bypass-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
    set({ user: null })
  }
}))
