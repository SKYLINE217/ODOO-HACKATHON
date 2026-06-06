'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'

function LoadingSkeleton({ message = 'Loading…' }: { message?: string }) {
  return (
    <div style={{
      display: 'flex', height: '100vh', width: '100%',
      background: 'var(--bg-base)',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        {/* Amber logo mark */}
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
          boxShadow: '0 0 24px rgba(245,158,11,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0A0D14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        {/* Skeleton lines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <div className="skeleton" style={{ width: '120px', height: '10px' }} />
          <div className="skeleton" style={{ width: '80px', height: '8px', opacity: 0.6 }} />
        </div>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: '12px',
          color: 'var(--text-muted)', fontWeight: 500,
          letterSpacing: '0.02em',
        }}>{message}</p>
      </div>
    </div>
  )
}

function DashboardGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isOAuthRedirect = searchParams.get('from') === 'oauth'

  // Short grace period for OAuth — user is now set immediately from session
  // so 1.5s is more than enough (vs the old 3s)
  const [oauthGrace, setOauthGrace] = useState(isOAuthRedirect)

  useEffect(() => {
    if (!isOAuthRedirect) return
    const timer = setTimeout(() => setOauthGrace(false), 1500)
    return () => clearTimeout(timer)
  }, [isOAuthRedirect])

  // Stop grace period as soon as user is confirmed
  useEffect(() => {
    if (user) setOauthGrace(false)
  }, [user])

  // Redirect to login only after loading/grace period is done and user is null
  useEffect(() => {
    if (loading || oauthGrace) return
    if (!user) router.replace('/login')
  }, [user, loading, oauthGrace, router])

  if (loading || oauthGrace) {
    return <LoadingSkeleton message={oauthGrace ? 'Completing sign-in…' : 'Loading…'} />
  }

  if (!user) return null

  return (
    <div style={{
      display: 'flex', height: '100vh', width: '100%',
      background: 'var(--bg-base)', overflow: 'hidden',
      fontFamily: 'var(--font-body)',
    }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <Topbar />
        <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }} className="custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <DashboardGuard>{children}</DashboardGuard>
    </Suspense>
  )
}
