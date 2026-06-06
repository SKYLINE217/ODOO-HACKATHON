'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, Mail, Lock, ShieldCheck, ArrowRight } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)

  const handleGoogleLogin = async () => {
    setErrorText(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: 'offline', prompt: 'select_account' },
        },
      })
      if (error) {
        if (error.message?.toLowerCase().includes('provider') || (error as any)?.error_code === 'validation_failed') {
          setErrorText('Google Sign-In is not yet enabled. Go to your Supabase Dashboard → Authentication → Providers → Google and enable it, then add your Google OAuth Client ID & Secret.')
        } else {
          setErrorText(error.message || 'Failed to initialize Google Sign In')
        }
        setLoading(false)
        return
      }
    } catch (err: any) {
      setErrorText(err.message || 'Failed to initialize Google Sign In')
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorText(null)

    try {
      // 1. Attempt login with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        throw error
      }

      if (data?.user) {
        // Profile will be fetched by useAuth automatically — just navigate
        router.replace('/')
        router.refresh()
      }
    } catch (err: any) {
      setErrorText(err.message?.includes('Invalid login') ? 'Incorrect email or password.' : (err.message || 'Sign-in failed. Check your credentials.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Decorative gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-500/30">
            <Building2 size={32} />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
          Sign in to VendorBridge
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Secure Procurement & Vendor Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 py-8 px-4 shadow-2xl rounded-2xl sm:px-10">
          
          {errorText && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold">
              {errorText}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Email Address
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={16} className="text-slate-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={16} className="text-slate-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-indigo-650 focus:ring-indigo-500 border-slate-800 rounded bg-slate-950"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs font-semibold text-slate-400">
                  Remember me
                </label>
              </div>

              <div className="text-xs font-semibold">
                <a href="#" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all cursor-pointer shadow-indigo-500/20"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900/40 px-2 text-slate-500 font-bold tracking-wider">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleGoogleLogin}
                type="button"
                className="w-full flex justify-center items-center gap-2.5 py-3 px-4 border border-slate-800 rounded-xl bg-slate-950/60 hover:bg-slate-900 text-sm font-semibold text-slate-350 hover:text-white transition-all cursor-pointer"
              >
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <span className="text-xs text-slate-400">
              Don't have an account?{' '}
              <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                Sign Up
              </Link>
            </span>
          </div>

          {/* Quick Demo Logins */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <div className="flex flex-col items-center justify-center mb-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Demo Login</p>
              <p className="text-[11px] text-slate-400 mt-1">Password for all accounts: <strong className="text-slate-300">Admin@123</strong></p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button" 
                onClick={() => { setEmail('admin@vendorbridge.io'); setPassword('Admin@123'); }}
                className="py-2 px-3 bg-slate-900 border border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/10 rounded-lg text-xs font-semibold text-slate-300 transition-all text-left flex flex-col gap-0.5"
              >
                <span className="text-indigo-400">Admin</span>
                <span className="text-[10px] text-slate-500 font-normal">admin@vendorbridge.io</span>
              </button>
              <button 
                type="button" 
                onClick={() => { setEmail('manager@vendorbridge.io'); setPassword('Admin@123'); }}
                className="py-2 px-3 bg-slate-900 border border-slate-700 hover:border-amber-500 hover:bg-amber-500/10 rounded-lg text-xs font-semibold text-slate-300 transition-all text-left flex flex-col gap-0.5"
              >
                <span className="text-amber-400">Manager</span>
                <span className="text-[10px] text-slate-500 font-normal">manager@vendorbridge.io</span>
              </button>
              <button 
                type="button" 
                onClick={() => { setEmail('procurement@vendorbridge.io'); setPassword('Admin@123'); }}
                className="py-2 px-3 bg-slate-900 border border-slate-700 hover:border-emerald-500 hover:bg-emerald-500/10 rounded-lg text-xs font-semibold text-slate-300 transition-all text-left flex flex-col gap-0.5"
              >
                <span className="text-emerald-400">Procurement</span>
                <span className="text-[10px] text-slate-500 font-normal">procurement@vendorbridge.io</span>
              </button>
              <button 
                type="button" 
                onClick={() => { setEmail('vendor@vendorbridge.io'); setPassword('Admin@123'); }}
                className="py-2 px-3 bg-slate-900 border border-slate-700 hover:border-sky-500 hover:bg-sky-500/10 rounded-lg text-xs font-semibold text-slate-300 transition-all text-left flex flex-col gap-0.5"
              >
                <span className="text-sky-400">Vendor</span>
                <span className="text-[10px] text-slate-500 font-normal">vendor@vendorbridge.io</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500 text-center mt-3 italic">Click a role to autofill, then click Sign In.</p>
          </div>

        </div>
      </div>
    </div>
  )
}

