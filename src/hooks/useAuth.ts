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
    if (typeof window !== 'undefined') {
      fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'profiles', chain: [{ method: 'upsert', args: [profile] }] })
      }).catch(err => console.warn('MySQL profile replication failed:', err))
    }
    return profile as UserProfile
  }

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
      body: JSON.stringify({ table: 'profiles', chain: [{ method: 'upsert', args: [upserted] }] })
    }).catch(err => console.warn('MySQL upserted profile replication failed:', err))
  }

  return (upserted as UserProfile | null) ?? null
}

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

    // ── STEP 1: Read bypass cookie SYNCHRONOUSLY ─────────────────────────────
    // Must happen before any async Supabase call to prevent the race where
    // onAuthStateChange fires INITIAL_SESSION+null and triggers a /login redirect
    // before the cookie is read.
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

    // If bypass cookie found → user is set immediately, skip all Supabase checks
    if (readBypassCookie()) {
      // Still subscribe so logout() properly handles SIGNED_OUT events
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any) => {
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setLoading(false)
        }
      })
      return () => subscription.unsubscribe()
    }

    // ── STEP 2: No bypass cookie — check real Supabase session ───────────────
    async function bootstrap() {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          setUser(sessionToUser(session))
          setLoading(false)

          const meta = session.user.user_metadata || {}
          fetchOrCreateProfile(
            session.user.id,
            session.user.email || '',
            meta.full_name || meta.name || '',
          ).then(profile => {
            if (profile) setUser({ ...profile, onboarded: !!meta.onboarded })
          }).catch(() => {})
        } else {
          setUser(null)
          setLoading(false)
        }
      } catch {
        setUser(null)
        setLoading(false)
      }
    }

    bootstrap()

    // Subscribe to auth state changes (for real Supabase OAuth sign-in)
    // NOTE: INITIAL_SESSION is NOT handled to avoid the loading race condition.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setLoading(false)
          return
        }

        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          setUser(sessionToUser(session))
          setLoading(false)

          const meta = session.user.user_metadata || {}
          fetchOrCreateProfile(
            session.user.id,
            session.user.email || '',
            meta.full_name || meta.name || '',
          ).then(profile => {
            if (profile) setUser({ ...profile, onboarded: !!meta.onboarded })
          }).catch(() => {})
        }
      }
    )

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { user, loading, role: user?.role, logout }
}
