'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      // User is not authenticated — hard redirect to login and prevent back navigation
      router.replace('/login')
    }
  }, [user, loading, router])

  // While loading, show a full-screen skeleton to prevent flashing
  if (loading) {
    return (
      <div className="flex h-screen w-full bg-slate-50 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 animate-pulse" />
          <div className="space-y-2 text-center">
            <div className="w-32 h-3 bg-slate-200 rounded animate-pulse mx-auto" />
            <div className="w-20 h-2 bg-slate-100 rounded animate-pulse mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  // If not authenticated (loading done but no user), render nothing while redirect fires
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
