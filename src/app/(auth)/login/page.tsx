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
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Carbon fiber grid pattern background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(225,6,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(225,6,0,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[var(--accent)]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center">
        <div className="flex justify-center mb-4">
          <div className="px-4 py-1.5 bg-[var(--accent)] text-white font-mono text-xs font-bold uppercase tracking-widest rounded skew-x-[-12deg] shadow-md">
            F1 Procurement OS
          </div>
        </div>
        <div className="flex justify-center">
          <div className="p-3 bg-[var(--bg-surface)] border-t-4 border-[var(--accent)] rounded-xl shadow-md text-[var(--accent)]">
            <Building2 size={28} />
          </div>
        </div>
        <h2 className="mt-4 text-3xl font-black text-[var(--text-primary)] tracking-tight font-display uppercase skew-x-[-4deg]">
          VendorBridge
        </h2>
        <p className="text-xs font-mono text-[var(--text-secondary)] uppercase tracking-wider mt-1">
          High-Speed Procurement & Bidding Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-[var(--bg-surface)] border-t-[5px] border-t-[var(--accent)] border border-[var(--border-default)] py-8 px-4 shadow-xl rounded-xl sm:px-10 relative">
          
          {/* Subtle Speed corner stripes */}
          <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10px] right-[-10px] w-6 h-6 bg-[var(--accent)] rotate-45" />
          </div>

          {errorText && (
            <div className="mb-4 p-3 bg-rose-500/10 border-l-4 border-l-rose-600 border-rose-500/20 text-rose-600 rounded text-xs font-mono font-bold">
              {errorText}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest font-mono">
                Email Address
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={15} className="text-[var(--text-muted)]" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="block w-full pl-9 pr-3 py-2.5 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] text-sm transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest font-mono">
                Password
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={15} className="text-[var(--text-muted)]" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2.5 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] text-sm transition-all font-mono"
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
                  className="h-4 w-4 text-[var(--accent)] focus:ring-[var(--accent)] border-[var(--border-strong)] rounded bg-[var(--bg-subtle)] cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs font-semibold text-[var(--text-secondary)] cursor-pointer">
                  Remember me
                </label>
              </div>

              <div className="text-xs font-semibold">
                <a href="#" className="text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors font-mono">
                  Forgot password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded text-sm font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-all cursor-pointer font-mono uppercase tracking-widest shadow-md shadow-[var(--accent)]/10 skew-x-[-6deg]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border-default)]" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-mono">
                <span className="bg-[var(--bg-surface)] px-2 text-[var(--text-muted)] font-bold tracking-wider">Or continue with</span>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={handleGoogleLogin}
                type="button"
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-[var(--border-default)] rounded bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer font-mono uppercase tracking-wider"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google Portal Link
              </button>
            </div>
          </div>

          <div className="mt-6 text-center border-t border-[var(--border-default)] pt-4">
            <span className="text-xs text-[var(--text-secondary)]">
              Don't have a portal account?{' '}
              <Link href="/signup" className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-bold transition-colors font-mono">
                SIGN UP
              </Link>
            </span>
          </div>

          {/* Quick Constructor Team Logins */}
          <div className="mt-6 pt-5 border-t border-[var(--border-default)]">
            <div className="flex flex-col items-center justify-center mb-3">
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest font-mono">Active Constructor Teams</p>
              <p className="text-[9px] text-[var(--text-muted)] mt-0.5 font-mono">Autofill credentials</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button 
                type="button" 
                onClick={() => { setEmail('admin@vendorbridge.io'); setPassword('Admin@123'); }}
                className="py-2 px-2.5 bg-[var(--bg-subtle)] border-l-4 border-l-[#1E41FF] border border-[var(--border-default)] hover:border-[#1E41FF] rounded text-left flex flex-col gap-0.5 transition-all cursor-pointer hover:bg-[var(--bg-surface)]"
              >
                <span className="text-xs font-bold text-[#1E41FF] font-display uppercase tracking-wider">Red Bull Racing</span>
                <span className="text-[10px] font-mono text-[var(--text-primary)]">Admin principal</span>
              </button>
              <button 
                type="button" 
                onClick={() => { setEmail('manager@vendorbridge.io'); setPassword('Admin@123'); }}
                className="py-2 px-2.5 bg-[var(--bg-subtle)] border-l-4 border-l-[#E10600] border border-[var(--border-default)] hover:border-[#E10600] rounded text-left flex flex-col gap-0.5 transition-all cursor-pointer hover:bg-[var(--bg-surface)]"
              >
                <span className="text-xs font-bold text-[#E10600] font-display uppercase tracking-wider">Scuderia Ferrari</span>
                <span className="text-[10px] font-mono text-[var(--text-primary)]">Manager approval</span>
              </button>
              <button 
                type="button" 
                onClick={() => { setEmail('procurement@vendorbridge.io'); setPassword('Admin@123'); }}
                className="py-2 px-2.5 bg-[var(--bg-subtle)] border-l-4 border-l-[#00A398] border border-[var(--border-default)] hover:border-[#00A398] rounded text-left flex flex-col gap-0.5 transition-all cursor-pointer hover:bg-[var(--bg-surface)]"
              >
                <span className="text-xs font-bold text-[#00A398] font-display uppercase tracking-wider">Mercedes-AMG</span>
                <span className="text-[10px] font-mono text-[var(--text-primary)]">Procurement lead</span>
              </button>
              <button 
                type="button" 
                onClick={() => { setEmail('vendor@vendorbridge.io'); setPassword('Admin@123'); }}
                className="py-2 px-2.5 bg-[var(--bg-subtle)] border-l-4 border-l-[#FF8000] border border-[var(--border-default)] hover:border-[#FF8000] rounded text-left flex flex-col gap-0.5 transition-all cursor-pointer hover:bg-[var(--bg-surface)]"
              >
                <span className="text-xs font-bold text-[#FF8000] font-display uppercase tracking-wider">McLaren Racing</span>
                <span className="text-[10px] font-mono text-[var(--text-primary)]">Vendor partner</span>
              </button>
            </div>
            <p className="text-[9px] text-[var(--text-muted)] text-center mt-3 font-mono italic">Select constructor to stage driver log, then click Sign In.</p>
          </div>

        </div>
      </div>
    </div>
  )
}

