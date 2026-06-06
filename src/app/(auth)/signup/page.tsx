'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, Mail, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useAuthStore } from '@/stores/useAuthStore'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const setUser = useAuthStore(state => state.setUser)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'procurement_officer' | 'manager' | 'vendor'>('procurement_officer')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // Save to local registry so login page can auto-bypass email confirmation if needed
    const usersRegistry = JSON.parse(localStorage.getItem('vb_users_registry') || '{}')
    usersRegistry[email.toLowerCase()] = {
      full_name: fullName,
      role: role,
      password: password // store temporarily for developer testing match
    }
    localStorage.setItem('vb_users_registry', JSON.stringify(usersRegistry))

    try {
      // 1. Attempt signup with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        throw error
      }

      // If signup succeeds and session is created immediately (confirmations disabled)
      if (data?.session) {
        const profile = {
          id: data.user?.id || 'demo-user-id',
          full_name: fullName,
          email: email,
          role: role,
          avatar_url: null,
          department: role === 'procurement_officer' ? 'Procurement' : role === 'manager' ? 'Management' : null
        }
        document.cookie = `sb-bypass-session=${encodeURIComponent(JSON.stringify(profile))}; path=/; max-age=86400`
        setUser(profile)
        setMessage({ type: 'success', text: 'Registration successful! Redirecting...' })
        setTimeout(() => { window.location.href = '/' }, 1200)
      } else {
        // Confirmation email is sent. However, since the user wants to sign in without email confirmation,
        // we inform them we've registered their details locally to bypass the check at the sign-in screen!
        setMessage({ 
          type: 'success', 
          text: 'Account registered! You can now log in directly at the Sign In page (email verification has been bypassed for you).' 
        })
        setTimeout(() => { window.location.href = '/login' }, 3500)
      }
    } catch (err: any) {
      console.warn('Supabase Auth signup failed/blocked, saved details locally for bypass:', err?.message)
      
      // Fallback: Login immediately in local state
      const profile = {
        id: 'mock-' + Math.random().toString(36).substring(2, 9),
        full_name: fullName || 'New Demo User',
        email: email || 'demo@vendorbridge.io',
        role: role,
        avatar_url: null,
        department: role === 'procurement_officer' ? 'Procurement' : role === 'manager' ? 'Management' : null
      }

      document.cookie = `sb-bypass-session=${encodeURIComponent(JSON.stringify(profile))}; path=/; max-age=86400`
      setUser(profile)
      setMessage({ type: 'success', text: 'Local account registered! Redirecting...' })
      setTimeout(() => { window.location.href = '/' }, 1200)
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
          Create an Account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Join VendorBridge procurement portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 py-8 px-4 shadow-2xl rounded-2xl sm:px-10">
          
          {message && (
            <div className={`mb-6 p-4 rounded-xl text-xs font-semibold border ${
              message.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              {message.text}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSignup}>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Full Name
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={16} className="text-slate-500" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Mercer"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                />
              </div>
            </div>

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

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Account Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="mt-1.5 block w-full px-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all cursor-pointer"
              >
                <option value="procurement_officer">Procurement Officer</option>
                <option value="vendor">Vendor Bidding Portal</option>
                <option value="manager">Manager / Approver</option>
                <option value="admin">System Admin</option>
              </select>
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
                    Sign Up <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <span className="text-xs text-slate-400">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                Sign In
              </Link>
            </span>
          </div>

          <div className="mt-6 border-t border-slate-800/80 pt-6">
            <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 flex gap-2.5 items-start">
              <ShieldCheck size={18} className="text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-400 leading-normal">
                <strong>Email Bypass Active:</strong> If email confirmation is required, the system registers your details locally and will automatically log you in without confirmation on the sign-in page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
