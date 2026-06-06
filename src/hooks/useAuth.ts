import { useEffect, useRef } from 'react'
import { useAuthStore, UserProfile } from '@/stores/useAuthStore'

export function useAuth() {
  const { user, setUser, loading, setLoading, logout } = useAuthStore()
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // ── ONLY Read bypass cookie ─────────────────────────────
    function readBypassCookie(): boolean {
      if (typeof window === 'undefined') return false
      const bypassCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('sb-bypass-session='))
      if (!bypassCookie) return false
      try {
        const raw = bypassCookie.split('=').slice(1).join('=')
        const decoded = JSON.parse(decodeURIComponent(raw))
        if (!decoded?.id) return false
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
      } catch {
        document.cookie = 'sb-bypass-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        return false
      }
    }

    if (!readBypassCookie()) {
      setUser(null)
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { user, loading, role: user?.role, logout }
}
