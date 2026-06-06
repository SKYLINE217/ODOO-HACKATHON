import { useEffect, useRef } from 'react'
import { useAuthStore, UserProfile } from '@/stores/useAuthStore'
import { createClient } from '@/utils/supabase/client'

// Singleton supabase client — avoids re-creating on every render
const supabase = createClient()

export function useAuth() {
  const { user, setUser, loading, setLoading, logout } = useAuthStore()
  const initialized = useRef(false)

  useEffect(() => {
    // Only run once
    if (initialized.current) return
    initialized.current = true

    async function fetchUser() {
      try {
        setLoading(true)
        
        // Check for bypass session cookie (dev mode)
        if (typeof window !== 'undefined') {
          const bypassCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('sb-bypass-session='))
          
          if (bypassCookie) {
            try {
              const raw = bypassCookie.split('=').slice(1).join('=') // handle = in value
              const decoded = JSON.parse(decodeURIComponent(raw))
              setUser({
                id: decoded.id || 'demo-user-id',
                full_name: decoded.full_name || 'Demo User',
                email: decoded.email || '',
                role: decoded.role || 'admin',
                avatar_url: decoded.avatar_url || null,
                department: decoded.department || null
              })
              setLoading(false)
              return
            } catch {
              // Malformed cookie — clear it and fall through
              document.cookie = 'sb-bypass-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
            }
          }
        }

        // Try real Supabase session
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, role, avatar_url, department')
            .eq('id', session.user.id)
            .single()
          
          if (profile && !error) {
            setUser({
              id: profile.id,
              full_name: profile.full_name,
              email: profile.email,
              role: profile.role,
              avatar_url: profile.avatar_url,
              department: profile.department
            })
          }
        }
      } catch (err) {
        // Auth unavailable — leave user as null so middleware handles redirect
      } finally {
        setLoading(false)
      }
    }

    fetchUser()

    // Subscribe to auth state changes (e.g. Google OAuth callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setLoading(false)
          return
        }
        if (session?.user) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, full_name, email, role, avatar_url, department')
              .eq('id', session.user.id)
              .single()
            if (profile) {
              setUser({
                id: profile.id,
                full_name: profile.full_name,
                email: profile.email,
                role: profile.role,
                avatar_url: profile.avatar_url,
                department: profile.department
              })
            }
          } catch (err) {
            // Profile fetch failed — session still valid
          }
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { user, loading, role: user?.role, logout }
}

