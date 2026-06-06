'use client'

import { useState, useEffect } from 'react'
import {
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  Camera,
  Save,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  Bell,
  Palette,
  Globe,
  Key,
  LogOut
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/utils/supabase/client'
import { useAuthStore } from '@/stores/useAuthStore'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
]

export default function ProfileSettingsPage() {
  const supabase = createClient()
  const { user, logout } = useAuth()
  const setUser = useAuthStore(state => state.setUser)

  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Profile fields
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [department, setDepartment] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  // Security fields
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  // Notification preferences
  const [notifApprovals, setNotifApprovals] = useState(true)
  const [notifRFQs, setNotifRFQs] = useState(true)
  const [notifInvoices, setNotifInvoices] = useState(false)
  const [notifVendors, setNotifVendors] = useState(true)

  // Appearance
  const [compactMode, setCompactMode] = useState(false)

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '')
      setPhone('')
      setDepartment(user.department || '')
      setAvatarUrl(user.avatar_url || '')
    }
  }, [user])

  // Also pull extended profile data from Supabase
  useEffect(() => {
    async function loadProfile() {
      if (!user?.id || user.id.startsWith('demo') || user.id.startsWith('mock')) return
      const { data } = await supabase
        .from('profiles')
        .select('phone, department, avatar_url')
        .eq('id', user.id)
        .single()
      if (data) {
        setPhone(data.phone || '')
        setDepartment(data.department || '')
        if (data.avatar_url) setAvatarUrl(data.avatar_url)
      }
    }
    loadProfile()
  }, [user?.id])

  const showFeedback = (msg: string, isError = false) => {
    if (isError) setError(msg)
    else setSuccess(msg)
    setTimeout(() => { setSuccess(null); setError(null) }, 4000)
  }

  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)
    try {
      const updates = { full_name: fullName, phone, department, avatar_url: avatarUrl || null, updated_at: new Date().toISOString() }
      
      if (!user.id.startsWith('demo') && !user.id.startsWith('mock')) {
        const { error: dbErr } = await supabase.from('profiles').update(updates).eq('id', user.id)
        if (dbErr) throw dbErr
      }

      // Update local store
      setUser({ ...user, full_name: fullName, department: department || null, avatar_url: avatarUrl || null })

      // Update bypass cookie if present
      if (typeof window !== 'undefined') {
        const existing = document.cookie.split('; ').find(r => r.startsWith('sb-bypass-session='))
        if (existing) {
          const profile = { ...user, full_name: fullName, department: department || null, avatar_url: avatarUrl || null }
          document.cookie = `sb-bypass-session=${encodeURIComponent(JSON.stringify(profile))}; path=/; max-age=86400`
        }
      }

      showFeedback('Profile updated successfully.')
    } catch (err: any) {
      showFeedback(err.message || 'Failed to update profile.', true)
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      showFeedback('New passwords do not match.', true)
      return
    }
    if (newPassword.length < 8) {
      showFeedback('Password must be at least 8 characters.', true)
      return
    }
    setSaving(true)
    try {
      const { error: pwErr } = await supabase.auth.updateUser({ password: newPassword })
      if (pwErr) throw pwErr
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      showFeedback('Password changed successfully.')
    } catch (err: any) {
      showFeedback(err.message || 'Failed to change password.', true)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-rose-50 text-rose-700 border-rose-200',
    manager: 'bg-amber-50 text-amber-700 border-amber-200',
    procurement_officer: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    vendor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Profile & Settings</h2>
        <p className="text-slate-500 text-sm mt-1">Manage your account preferences, security, and notifications.</p>
      </div>

      {/* Feedback Banners */}
      {success && (
        <div className="flex items-center gap-2.5 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-semibold animate-in fade-in">
          <CheckCircle2 size={18} /> {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2.5 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-semibold animate-in fade-in">
          <Shield size={18} /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Profile Card + Tabs */}
        <div className="space-y-4">
          {/* Avatar card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-center">
            <div className="relative inline-block">
              {avatarUrl ? (
                <img src={avatarUrl} alt={fullName} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md mx-auto" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-extrabold text-2xl mx-auto shadow-md">
                  {(fullName || user?.full_name || 'U').charAt(0)}
                </div>
              )}
              <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-md hover:bg-indigo-700 transition-colors cursor-pointer">
                <Camera size={13} />
              </button>
            </div>
            <h3 className="font-bold text-slate-800 mt-3 text-base">{user?.full_name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
            <span className={`inline-flex items-center mt-2 px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${roleColors[user?.role || 'admin']}`}>
              {(user?.role || 'admin').replace('_', ' ')}
            </span>
          </div>

          {/* Tabs */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {TABS.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors text-left cursor-pointer border-b border-slate-100 last:border-b-0 ${
                    activeTab === tab.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={16} /> {tab.label}
                </button>
              )
            })}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-xl transition-all cursor-pointer"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        {/* Right: Tab Content */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
              <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3">Personal Information</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Full Name</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-100 rounded-lg text-sm text-slate-400 bg-slate-50 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Email cannot be changed directly. Contact support.</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Phone</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Department</label>
                  <div className="relative">
                    <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      placeholder="e.g. Procurement & Logistics"
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Avatar URL</label>
                  <div className="relative">
                    <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="url"
                      value={avatarUrl}
                      onChange={e => setAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">System Role</label>
                <div className="flex items-center gap-2">
                  <Shield size={15} className="text-slate-400" />
                  <span className={`px-2.5 py-1 rounded-lg border text-xs font-bold ${roleColors[user?.role || 'admin']}`}>
                    {(user?.role || 'admin').replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-400">Role changes require admin authorization.</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-sm shadow-indigo-500/20 transition-all cursor-pointer"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
              <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3">Change Password</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Current Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-9 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                    <button onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                      {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">New Password</label>
                  <div className="relative">
                    <Key size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="w-full pl-9 pr-9 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                    <button onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                      {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <Key size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-rose-500 mt-1 font-semibold">Passwords do not match</p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={handleChangePassword}
                  disabled={saving || !newPassword || !confirmPassword}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                  Update Password
                </button>
              </div>

              {/* Sessions Info */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <h4 className="font-bold text-slate-700 text-sm mb-3">Active Session</h4>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Current Device</p>
                    <p className="text-[11px] text-slate-400">Signed in now · Browser session</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse block" />
                    Active
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
              <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3">Notification Preferences</h3>

              <div className="space-y-4">
                {[
                  { label: 'Approval Requests', desc: 'Get notified when a requisition requires your approval', value: notifApprovals, set: setNotifApprovals },
                  { label: 'RFQ Updates', desc: 'New RFQ publications, deadline alerts, and closures', value: notifRFQs, set: setNotifRFQs },
                  { label: 'Invoice Alerts', desc: 'Payment due dates, overdue, and processed invoices', value: notifInvoices, set: setNotifInvoices },
                  { label: 'Vendor Registrations', desc: 'New vendor applications pending verification', value: notifVendors, set: setNotifVendors },
                ].map(pref => (
                  <div key={pref.label} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{pref.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{pref.desc}</p>
                    </div>
                    <button
                      onClick={() => pref.set(!pref.value)}
                      className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 cursor-pointer flex-shrink-0 ${pref.value ? 'bg-indigo-600' : 'bg-slate-300'}`}
                      style={{ width: '42px', height: '22px' }}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform duration-200 block`}
                        style={{
                          width: '18px',
                          height: '18px',
                          transform: pref.value ? 'translateX(20px)' : 'translateX(0)'
                        }}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => showFeedback('Notification preferences saved.')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <Save size={16} /> Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
              <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3">Display Settings</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Compact Mode</p>
                    <p className="text-xs text-slate-400 mt-0.5">Reduce padding and spacing in the dashboard for denser information view</p>
                  </div>
                  <button
                    onClick={() => setCompactMode(!compactMode)}
                    className={`relative rounded-full transition-colors duration-200 cursor-pointer flex-shrink-0 ${compactMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    style={{ width: '42px', height: '22px' }}
                  >
                    <span
                      className="absolute top-0.5 left-0.5 bg-white rounded-full shadow transition-transform duration-200 block"
                      style={{
                        width: '18px',
                        height: '18px',
                        transform: compactMode ? 'translateX(20px)' : 'translateX(0)'
                      }}
                    />
                  </button>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <p className="text-sm font-semibold text-slate-700 mb-3">Color Theme</p>
                  <div className="flex gap-2.5">
                    {[
                      { color: 'bg-indigo-600', label: 'Indigo (Default)' },
                      { color: 'bg-violet-600', label: 'Violet' },
                      { color: 'bg-blue-600', label: 'Blue' },
                      { color: 'bg-emerald-600', label: 'Emerald' },
                      { color: 'bg-rose-600', label: 'Rose' },
                    ].map(t => (
                      <button
                        key={t.color}
                        title={t.label}
                        className={`w-8 h-8 rounded-full ${t.color} border-2 border-white shadow-md hover:scale-110 transition-transform cursor-pointer ring-2 ${t.color === 'bg-indigo-600' ? 'ring-indigo-600 ring-offset-2' : 'ring-transparent'}`}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">Full theme customization coming soon.</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => showFeedback('Appearance settings saved.')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <Save size={16} /> Apply Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

