import { useEffect, useRef } from 'react'
import { useAuthStore, UserProfile } from '@/stores/useAuthStore'
import { createClient } from '@/utils/supabase/client'

const supabase = createClient()

// Fetch profile, creating it if it doesn't exist yet (handles Google OAuth race)
async function fetchOrCreateProfile(userId: string, fallbackEmail: string, fallbackName: string): Promise<UserProfile | null> {
  // 1. Try fetching existing profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, avatar_url, department')
    .eq('id', userId)
    .single()

  if (profile && !error) return profile as UserProfile

  // 2. Profile missing (Google OAuth trigger may not have fired yet) — upsert it
  const { data: upserted, error: upsertError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      full_name: fallbackName || fallbackEmail.split('@')[0],
      email: fallbackEmail,
      role: 'procurement_officer',
    }, { onConflict: 'id' })
    .select('id, full_name, email, role, avatar_url, department')
    .single()

  if (upserted && !upsertError) return upserted as UserProfile
  return null
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

        // Check bypass cookie (dev mode only)
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

        // Check existing Supabase session (handles page refresh)
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          // Google OAuth stores name as 'name', email/password uses 'full_name'
          const meta = session.user.user_metadata || {}
          const fallbackName = meta.full_name || meta.name || ''
          const fallbackEmail = session.user.email || ''
          const profile = await fetchOrCreateProfile(session.user.id, fallbackEmail, fallbackName)
          if (profile) setUser(profile)
        }
      } catch {
        // Auth unavailable — middleware handles redirect
      } finally {
        setLoading(false)
      }
    }

    bootstrap()

    // Listen for auth events — critical for OAuth redirects
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setLoading(false)
          return
        }

        // INITIAL_SESSION: fires on page load if session exists
        // SIGNED_IN: fires after OAuth callback code exchange completes
        // TOKEN_REFRESHED: fires when token auto-renews
        if (
          (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') &&
          session?.user
        ) {
          try {
            const meta = session.user.user_metadata || {}
            const fallbackName = meta.full_name || meta.name || ''
            const fallbackEmail = session.user.email || ''
            const profile = await fetchOrCreateProfile(session.user.id, fallbackEmail, fallbackName)
            if (profile) {
              setUser(profile)
            }
          } catch {
            // Profile fetch failed but session is valid
          } finally {
            setLoading(false)
          }
          return
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { user, loading, role: user?.role, logout }
}
