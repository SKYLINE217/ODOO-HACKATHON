import { useEffect, useRef } from 'react'
import { useAuthStore, UserProfile } from '@/stores/useAuthStore'
import { createClient } from '@/utils/supabase/client'

const supabase = createClient()

// Try to fetch profile from DB; upsert if missing (handles Google OAuth race)
async function fetchOrCreateProfile(
  userId: string,
  fallbackEmail: string,
  fallbackName: string,
): Promise<UserProfile | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, avatar_url, department, phone, vendor_id')
    .eq('id', userId)
    .single()

  if (profile && !error) {
    // Replicate profile in background to MySQL to ensure consistency
    if (typeof window !== 'undefined') {
      fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'profiles',
          chain: [{ method: 'upsert', args: [profile] }]
        })
      }).catch(err => console.warn('MySQL profile replication failed:', err))
    }
    return profile as UserProfile
  }

  // Profile missing — upsert it (Google OAuth trigger may not have fired yet)
  const { data: upserted } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      full_name: fallbackName || fallbackEmail.split('@')[0],
      email: fallbackEmail,
      role: 'procurement_officer',
    }, { onConflict: 'id' })
    .select('id, full_name, email, role, avatar_url, department, phone, vendor_id')
    .single()

  if (upserted && typeof window !== 'undefined') {
    fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'profiles',
        chain: [{ method: 'upsert', args: [upserted] }]
      })
    }).catch(err => console.warn('MySQL upserted profile replication failed:', err))
  }

  return (upserted as UserProfile | null) ?? null
}

// Build a minimal user object directly from the Supabase session (no DB needed)
function sessionToUser(session: any): UserProfile {
  const meta = session.user.user_metadata || {}
  return {
    id: session.user.id,
    full_name: meta.full_name || meta.name || session.user.email?.split('@')[0] || 'User',
    email: session.user.email || '',
    role: (meta.role as UserProfile['role']) || 'procurement_officer',
    avatar_url: meta.avatar_url || meta.picture || null,
    department: null,
    phone: meta.phone || null,
    vendor_id: meta.vendor_id || null,
    onboarded: !!meta.onboarded,
  }
}

export function useAuth() {
  const { user, setUser, loading, setLoading, logout } = useAuthStore()
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // ── Helper: read bypass cookie (runs regardless of Supabase state) ──────
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

    async function bootstrap() {
      try {
        setLoading(true)

        // 1. Try real Supabase session first
        let session: any = null
        try {
          const result = await supabase.auth.getSession()
          session = result.data?.session ?? null
        } catch {
          // Supabase unreachable — fall through to bypass cookie below
        }

        if (session?.user) {
          // Clear any local bypass cookie — real session takes priority
          if (typeof window !== 'undefined') {
            document.cookie = 'sb-bypass-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          }

          // Set user immediately from session so dashboard loads fast
          setUser(sessionToUser(session))
          setLoading(false)

          // Enhance with full DB profile in background (non-blocking)
          const meta = session.user.user_metadata || {}
          fetchOrCreateProfile(
            session.user.id,
            session.user.email || '',
            meta.full_name || meta.name || '',
          ).then(profile => {
            if (profile) {
              setUser({ ...profile, onboarded: !!meta.onboarded })
            }
          }).catch(() => {/* keep session-based user — DB unavailable */})
          return
        }

        // 2. No real session — try bypass cookie
        if (readBypassCookie()) return

        // 3. Truly unauthenticated
        setLoading(false)
      } catch {
        // Last resort: try bypass cookie before giving up
        if (!readBypassCookie()) {
          setLoading(false)
        }
      }
    }

    bootstrap()

    // Subscribe to auth state changes (critical for OAuth redirects)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setLoading(false)
          return
        }

        if (
          (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') &&
          session?.user
        ) {
          // ✅ Set immediately from session, then enhance from DB
          setUser(sessionToUser(session))
          setLoading(false)

          const meta = session.user.user_metadata || {}
          fetchOrCreateProfile(
            session.user.id,
            session.user.email || '',
            meta.full_name || meta.name || '',
          ).then(profile => {
            if (profile) {
              setUser({
                ...profile,
                onboarded: !!meta.onboarded
              })
            }
          }).catch(() => {})
          return
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { user, loading, role: user?.role, logout }
}
