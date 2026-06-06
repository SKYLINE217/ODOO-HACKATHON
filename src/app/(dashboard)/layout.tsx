'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'

function LoadingSkeleton({ message }: { message: string }) {
  return (
    <div className="flex h-screen w-full bg-slate-50 items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 animate-pulse" />
        <div className="space-y-2 text-center">
          <div className="w-32 h-3 bg-slate-200 rounded animate-pulse mx-auto" />
          <div className="w-20 h-2 bg-slate-100 rounded animate-pulse mx-auto" />
        </div>
        <p className="text-xs text-slate-400 font-medium">{message}</p>
      </div>
    </div>
  )
}

// Inner component uses useSearchParams — must be inside Suspense
function DashboardGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isOAuthRedirect = searchParams.get('from') === 'oauth'

  const [oauthGrace, setOauthGrace] = useState(isOAuthRedirect)

  useEffect(() => {
    if (!isOAuthRedirect) return
    const timer = setTimeout(() => setOauthGrace(false), 3000)
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
    return <LoadingSkeleton message={oauthGrace ? 'Completing sign-in...' : 'Loading...'} />
  }

  if (!user) return null

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
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
    <Suspense fallback={<LoadingSkeleton message="Loading..." />}>
      <DashboardGuard>{children}</DashboardGuard>
    </Suspense>
  )
}
