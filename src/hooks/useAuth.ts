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
    .select('id, full_name, email, role, avatar_url, department')
    .eq('id', userId)
    .single()

  if (profile && !error) return profile as UserProfile

  // Profile missing — upsert it (Google OAuth trigger may not have fired yet)
  const { data: upserted } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      full_name: fallbackName || fallbackEmail.split('@')[0],
      email: fallbackEmail,
      role: 'procurement_officer',
    }, { onConflict: 'id' })
    .select('id, full_name, email, role, avatar_url, department')
    .single()

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
  }
}

export function useAuth() {
  const { user, setUser, loading, setLoading, logout } = useAuthStore()
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    async function bootstrap() {
      try {
        setLoading(true)

        // Dev bypass cookie
        if (typeof window !== 'undefined') {
          const bypassCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('sb-bypass-session='))
          if (bypassCookie) {
            try {
              const raw = bypassCookie.split('=').slice(1).join('=')
              const decoded = JSON.parse(decodeURIComponent(raw))
              setUser({
                id: decoded.id || 'demo-user-id',
                full_name: decoded.full_name || 'Demo User',
                email: decoded.email || '',
                role: decoded.role || 'admin',
                avatar_url: decoded.avatar_url || null,
                department: decoded.department || null,
              })
              setLoading(false)
              return
            } catch {
              document.cookie = 'sb-bypass-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
            }
          }
        }

        // Get Supabase session
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          // ✅ KEY FIX: Set user IMMEDIATELY from session data — no DB round-trip needed.
          // This prevents the black screen when the DB profile is missing/slow.
          setUser(sessionToUser(session))
          setLoading(false)

          // Then enhance with full DB profile in background (non-blocking)
          const meta = session.user.user_metadata || {}
          fetchOrCreateProfile(
            session.user.id,
            session.user.email || '',
            meta.full_name || meta.name || '',
          ).then(profile => {
            if (profile) setUser(profile)
          }).catch(() => {/* keep session-based user — DB unavailable */})
        }
      } catch {
        // Auth unavailable — leave user null
      } finally {
        setLoading(false)
      }
    }

    bootstrap()

    // Subscribe to auth state changes (critical for OAuth redirects)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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
            if (profile) setUser(profile)
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
