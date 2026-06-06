import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'

export function useAuth() {
  const { user, setUser, loading, setLoading, logout } = useAuthStore()
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    function readSession() {
      if (typeof window === 'undefined') return false

      let decoded = null

      // 1. Try localStorage first (bulletproof)
      try {
        const local = localStorage.getItem('vb_session')
        if (local) decoded = JSON.parse(local)
      } catch {}

      // 2. Try cookie fallback
      if (!decoded) {
        const bypassCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('sb-bypass-session='))
        if (bypassCookie) {
          try {
            const raw = bypassCookie.split('=').slice(1).join('=')
            decoded = JSON.parse(decodeURIComponent(raw))
          } catch {}
        }
      }

      if (decoded?.id) {
        setUser({
          id: decoded.id,
          full_name: decoded.full_name || 'Demo User',
          email: decoded.email || '',
          role: decoded.role || 'admin',
          avatar_url: decoded.avatar_url || null,
          department: decoded.department || null,
          phone: decoded.phone || null,
          onboarded: decoded.onboarded !== false,
        })
        setLoading(false)
        return true
      }

      return false
    }

    if (!readSession()) {
      setUser(null)
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { user, loading, role: user?.role, logout }
}
