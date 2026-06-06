'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import { ShieldAlert, LogOut, ArrowLeft } from 'lucide-react'

// Define strict access control permissions per page path
const ROUTE_PERMISSIONS: Record<string, string[]> = {
  '/': ['admin', 'procurement_officer', 'manager', 'vendor'],
  '/vendors': ['admin', 'procurement_officer'],
  '/rfqs': ['admin', 'procurement_officer', 'manager', 'vendor'],
  '/quotations': ['admin', 'procurement_officer', 'manager', 'vendor'],
  '/approvals': ['admin', 'manager'],
  '/purchase-orders': ['admin', 'procurement_officer', 'manager', 'vendor'],
  '/invoices': ['admin', 'procurement_officer', 'vendor'],
  '/reports': ['admin', 'procurement_officer', 'manager'],
  '/activity': ['admin', 'procurement_officer', 'manager'],
  '/profile': ['admin', 'procurement_officer', 'manager', 'vendor']
}

function LoadingSkeleton({ message = 'Loading…' }: { message?: string }) {
  return (
    <div style={{
      display: 'flex', height: '100vh', width: '100%',
      background: 'var(--bg-base)',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
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

function AccessDeniedView({ role, pathname }: { role: string; pathname: string }) {
  const router = useRouter()
  const { logout } = useAuth()

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Red accent warning overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(225,6,0,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(225,6,0,0.015)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full bg-[var(--bg-surface)] border-t-[5px] border-t-rose-600 border border-[var(--border-default)] rounded-xl shadow-2xl p-8 relative z-10 text-center">
        {/* Speed stripes */}
        <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10px] right-[-10px] w-6 h-6 bg-rose-600 rotate-45" />
        </div>

        {/* Warning Icon Badge */}
        <div className="mx-auto w-14 h-14 bg-rose-500/10 border border-rose-500/25 rounded-full flex items-center justify-center text-rose-500 mb-6 animate-pulse">
          <ShieldAlert size={28} />
        </div>

        {/* Warning Title */}
        <div className="inline-block px-3 py-1 bg-rose-600 text-white font-mono text-[10px] font-extrabold uppercase tracking-widest rounded skew-x-[-10deg] mb-3">
          Black Flag: Access Disqualified
        </div>

        <h3 className="text-xl font-black text-[var(--text-primary)] font-display uppercase tracking-wide skew-x-[-3deg]">
          Paddock Restrict Zone
        </h3>

        <p className="text-xs text-[var(--text-secondary)] mt-3 leading-relaxed">
          Your current driver permissions level (<span className="font-bold text-[var(--accent)] font-mono uppercase">{role}</span>) is not cleared to access <span className="font-mono text-rose-500 font-bold">{pathname}</span>.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={() => router.replace('/')}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all cursor-pointer font-mono uppercase tracking-wider skew-x-[-6deg] shadow-md shadow-rose-600/15"
          >
            <ArrowLeft size={14} /> Return to Garage
          </button>
          
          <button
            onClick={async () => {
              await logout()
              router.replace('/login')
            }}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-[var(--border-default)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface)] rounded text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer font-mono uppercase tracking-wider skew-x-[-6deg]"
          >
            <LogOut size={14} /> Log Out Account
          </button>
        </div>
      </div>
    </div>
  )
}

function DashboardGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isOAuthRedirect = searchParams.get('from') === 'oauth'

  const [oauthGrace, setOauthGrace] = useState(isOAuthRedirect)

  useEffect(() => {
    if (!isOAuthRedirect) return
    const timer = setTimeout(() => setOauthGrace(false), 1500)
    return () => clearTimeout(timer)
  }, [isOAuthRedirect])

  useEffect(() => {
    if (user) setOauthGrace(false)
  }, [user])

  useEffect(() => {
    if (loading || oauthGrace) return
    if (!user) router.replace('/login')
  }, [user, loading, oauthGrace, router])

  if (loading || oauthGrace) {
    return <LoadingSkeleton message={oauthGrace ? 'Completing sign-in…' : 'Loading…'} />
  }

  if (!user) return null

  // Verify path authorization
  const allowedRoles = ROUTE_PERMISSIONS[pathname]
  const isAuthorized = !allowedRoles || allowedRoles.includes(user.role)

  if (!isAuthorized) {
    return <AccessDeniedView role={user.role} pathname={pathname} />
  }

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
