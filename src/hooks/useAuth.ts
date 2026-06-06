import { useEffect } from 'react'
import { useAuthStore, UserProfile } from '@/stores/useAuthStore'
import { createClient } from '@/utils/supabase/client'

export function useAuth() {
  const { user, setUser, loading, setLoading, logout } = useAuthStore()
  const supabase = createClient()

  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true)
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
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
        console.warn('Supabase Auth connection failed, using demo account:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
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
            console.error('Error fetching auth user profile:', err)
          }
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [setUser, setLoading, supabase])

  return { user, loading, role: user?.role, logout }
}
