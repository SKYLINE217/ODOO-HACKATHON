'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Building2, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft,
  User, 
  Building,
  Phone,
  Briefcase,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useAuthStore } from '@/stores/useAuthStore'

interface VendorCompany {
  id: string
  company_name: string
}

const FALLBACK_VENDORS: VendorCompany[] = [
  { id: 'vid-apex', company_name: 'Apex Technology Solutions' },
  { id: 'vid-swift', company_name: 'Swift Cargo & Logistics' },
  { id: 'vid-supe', company_name: 'Superior Office Furnishings' },
  { id: 'vid-zenith', company_name: 'Zenith Systems Corp' },
  { id: 'vid-oracle', company_name: 'Oracle Builders' }
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const { user, setUser } = useAuthStore()

  // State Management
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [successText, setSuccessText] = useState<string | null>(null)

  // Form Fields
  const [selectedRole, setSelectedRole] = useState<'manager' | 'procurement_officer' | 'vendor' | null>(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [department, setDepartment] = useState('')
  const [vendorId, setVendorId] = useState('')
  
  // Available vendors loaded from DB
  const [vendorsList, setVendorsList] = useState<VendorCompany[]>(FALLBACK_VENDORS)

  // Load user data and vendors list
  useEffect(() => {
    async function loadOnboardingData() {
      // Get current auth session user
      const { data: { session } } = await supabase.auth.getSession()
      const activeUser = session?.user || user

      if (!activeUser) {
        router.replace('/login')
        return
      }

      setFullName(activeUser.user_metadata?.full_name || activeUser.user_metadata?.name || activeUser.email?.split('@')[0] || '')

      // Fetch vendors list for Step 2
      try {
        const { data, error } = await supabase
          .from('vendors')
          .select('id, company_name')
          .order('company_name')
        
        if (data && data.length > 0 && !error) {
          setVendorsList(data)
          setVendorId(data[0].id)
        } else {
          setVendorId(FALLBACK_VENDORS[0].id)
        }
      } catch (err) {
        setVendorId(FALLBACK_VENDORS[0].id)
      }
    }

    loadOnboardingData()
  }, [user, supabase])

  const handleNextStep = () => {
    setErrorText(null)
    if (step === 1) {
      if (!selectedRole) {
        setErrorText('Please select an account role to continue.')
        return
      }
      setStep(2)
    } else if (step === 2) {
      if (!fullName.trim()) {
        setErrorText('Full Name is required.')
        return
      }
      if (selectedRole === 'manager' && !department.trim()) {
        setErrorText('Please enter your approval department.')
        return
      }
      if (selectedRole === 'procurement_officer' && !department.trim()) {
        setErrorText('Please enter your procurement division.')
        return
      }
      if (selectedRole === 'vendor' && !vendorId) {
        setErrorText('Please select your representing company.')
        return
      }
      setStep(3)
    }
  }

  const handlePrevStep = () => {
    setErrorText(null)
    setStep(prev => Math.max(1, prev - 1))
  }

  const handleCompleteSetup = async () => {
    setErrorText(null)
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const activeUser = session?.user

      const finalRole = selectedRole || 'procurement_officer'
      const finalDept = selectedRole === 'vendor' ? null : department
      const finalVendorId = selectedRole === 'vendor' ? vendorId : null

      if (activeUser) {
        // 1. Update user metadata in Supabase Auth
        const { error: authErr } = await supabase.auth.updateUser({
          data: {
            full_name: fullName,
            role: finalRole,
            vendor_id: finalVendorId,
            onboarded: true
          }
        })
        if (authErr) throw authErr

        // 2. Update profiles table
        const { error: dbErr } = await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            role: finalRole,
            phone: phone || null,
            department: finalDept,
            updated_at: new Date().toISOString()
          })
          .eq('id', activeUser.id)

        if (dbErr) {
          console.warn('Could not update DB profiles table directly (might be demo mode):', dbErr.message)
        }

        // 3. If vendor role, link profiles to vendor in DB
        if (finalRole === 'vendor' && finalVendorId) {
          const { error: vendorLinkErr } = await supabase
            .from('profiles')
            .update({ vendor_id: finalVendorId })
            .eq('id', activeUser.id)
          if (vendorLinkErr) console.warn('Could not link profile to vendor:', vendorLinkErr.message)
        }
      }

      // Update local storage and stores for instant session update
      const updatedProfile = {
        id: activeUser?.id || 'demo-user-id',
        full_name: fullName,
        email: activeUser?.email || user?.email || '',
        role: finalRole,
        avatar_url: activeUser?.user_metadata?.avatar_url || null,
        department: finalDept,
        phone: phone || null,
        vendor_id: finalVendorId || undefined
      }

      document.cookie = `sb-bypass-session=${encodeURIComponent(JSON.stringify(updatedProfile))}; path=/; max-age=86400`
      setUser(updatedProfile)

      setSuccessText('Configuration saved successfully! Welcoming you to the dashboard...')
      setTimeout(() => {
        router.replace('/')
        router.refresh()
      }, 1500)

    } catch (err: any) {
      setErrorText(err.message || 'Failed to complete registration setup.')
      setLoading(false)
    }
  }

  // Get name of selected vendor
  const getSelectedVendorName = () => {
    return vendorsList.find(v => v.id === vendorId)?.company_name || 'Selected Vendor'
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Grid Pattern Decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(225,6,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(225,6,0,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[var(--accent)]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl z-10 text-center">
        <div className="flex justify-center mb-4">
          <div className="px-4 py-1.5 bg-[var(--accent)] text-white font-mono text-xs font-bold uppercase tracking-widest rounded skew-x-[-12deg] shadow-md">
            VendorBridge Team Onboarding
          </div>
        </div>
        <h2 className="mt-4 text-3xl font-black text-[var(--text-primary)] tracking-tight font-display uppercase skew-x-[-4deg]">
          Complete Setup
        </h2>
        <p className="text-xs font-mono text-[var(--text-secondary)] uppercase tracking-wider mt-1">
          Define your driver profile & roles in the procurement system
        </p>
      </div>

      {/* Main Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl z-10 px-4">
        <div className="bg-[var(--bg-surface)] border-t-[5px] border-t-[var(--accent)] border border-[var(--border-default)] py-8 px-6 shadow-xl rounded-xl sm:px-10 relative">
          
          {/* Stepper Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[
                { number: 1, label: 'Select Role' },
                { number: 2, label: 'Driver Details' },
                { number: 3, label: 'Finish Grid Setup' }
              ].map((s, idx) => (
                <div key={s.number} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center relative z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all border ${
                      step >= s.number
                        ? 'bg-[var(--accent)] border-[var(--accent)] text-white shadow-md'
                        : 'bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--text-muted)]'
                    }`}>
                      {step > s.number ? <Check size={14} /> : s.number}
                    </div>
                    <span className={`text-[10px] uppercase font-bold tracking-wider mt-2 font-mono ${
                      step >= s.number ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                  {idx < 2 && (
                    <div className="flex-1 h-0.5 mx-2 bg-[var(--border-default)] relative -top-3">
                      <div className="absolute top-0 left-0 h-full bg-[var(--accent)] transition-all duration-300" 
                        style={{ width: step > s.number ? '100%' : '0%' }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Feedback Banners */}
          {errorText && (
            <div className="mb-6 p-3 bg-rose-500/10 border-l-4 border-l-rose-600 border-rose-500/20 text-rose-600 rounded text-xs font-mono font-bold flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{errorText}</span>
            </div>
          )}
          {successText && (
            <div className="mb-6 p-3 bg-emerald-500/10 border-l-4 border-l-emerald-600 border-emerald-500/20 text-emerald-600 rounded text-xs font-mono font-bold flex items-center gap-2">
              <CheckCircle2 size={15} />
              <span>{successText}</span>
            </div>
          )}

          {/* STEP 1: Role Selection */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h3 className="font-bold text-base text-[var(--text-primary)] font-display uppercase tracking-wide">Select Your Account Role</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Pick a role type to match your workspace responsibilities.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {[
                  {
                    id: 'manager' as const,
                    title: 'Manager Approval',
                    badge: 'Operations & IT',
                    color: 'border-rose-500/30 hover:border-rose-600',
                    activeColor: 'border-rose-600 bg-rose-500/5 ring-1 ring-rose-500/30',
                    features: ['Review RFQs & Tender details', 'Approve quotations & vendor proposals', 'Release Purchase Orders & Budgets']
                  },
                  {
                    id: 'procurement_officer' as const,
                    title: 'Procurement Lead',
                    badge: 'Sourcing & Contracts',
                    color: 'border-emerald-500/30 hover:border-emerald-600',
                    activeColor: 'border-emerald-600 bg-emerald-500/5 ring-1 ring-emerald-500/30',
                    features: ['Draft and publish RFQs', 'Invite and register suppliers', 'Compare incoming bids & award deals']
                  },
                  {
                    id: 'vendor' as const,
                    title: 'Vendor Partner',
                    badge: 'Supplier Fulfillment',
                    color: 'border-amber-500/30 hover:border-amber-600',
                    activeColor: 'border-amber-600 bg-amber-500/5 ring-1 ring-amber-500/30',
                    features: ['Submit prices for pending RFQs', 'Track quotation review statuses', 'Access and confirm Purchase Orders']
                  }
                ].map(r => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRole(r.id)}
                    type="button"
                    className={`text-left p-4 rounded-xl border transition-all cursor-pointer relative group ${
                      selectedRole === r.id ? r.activeColor : `bg-[var(--bg-subtle)] ${r.color}`
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded ${
                          r.id === 'manager' ? 'bg-rose-500/10 text-rose-500' : r.id === 'procurement_officer' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {r.badge}
                        </span>
                        <h4 className="font-extrabold text-[var(--text-primary)] text-base mt-2 font-display group-hover:text-[var(--accent)] transition-colors">
                          {r.title}
                        </h4>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        selectedRole === r.id ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'border-[var(--border-strong)]'
                      }`}>
                        {selectedRole === r.id && <Check size={12} />}
                      </div>
                    </div>

                    <ul className="mt-3.5 space-y-1 text-xs text-[var(--text-secondary)] pl-1">
                      {r.features.map((feat, fidx) => (
                        <li key={fidx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Driver Details */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h3 className="font-bold text-base text-[var(--text-primary)] font-display uppercase tracking-wide">Enter Profile Details</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Configure name, contact info, and department context.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest font-mono">
                    Full Name
                  </label>
                  <div className="mt-1.5 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={15} className="text-[var(--text-muted)]" />
                    </div>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Lewis Hamilton"
                      className="block w-full pl-9 pr-3 py-2.5 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] text-sm transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest font-mono">
                    Phone Number
                  </label>
                  <div className="mt-1.5 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone size={15} className="text-[var(--text-muted)]" />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="block w-full pl-9 pr-3 py-2.5 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] text-sm transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Conditional Field: Department (Manager / Procurement Officer) */}
                {(selectedRole === 'manager' || selectedRole === 'procurement_officer') && (
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest font-mono">
                      {selectedRole === 'manager' ? 'Approval Department' : 'Procurement Division'}
                    </label>
                    <div className="mt-1.5 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Briefcase size={15} className="text-[var(--text-muted)]" />
                      </div>
                      <input
                        type="text"
                        required
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder={selectedRole === 'manager' ? 'e.g. Finance & Control' : 'e.g. Direct Infrastructure Sourcing'}
                        className="block w-full pl-9 pr-3 py-2.5 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] text-sm transition-all font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Conditional Field: Vendor Company Selector (Vendor Partner) */}
                {selectedRole === 'vendor' && (
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest font-mono">
                      Representing Company
                    </label>
                    <div className="mt-1.5 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building size={15} className="text-[var(--text-muted)]" />
                      </div>
                      <select
                        value={vendorId}
                        onChange={(e) => setVendorId(e.target.value)}
                        className="block w-full pl-9 pr-3 py-2.5 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] text-sm transition-all cursor-pointer font-mono"
                      >
                        {vendorsList.map(vendor => (
                          <option key={vendor.id} value={vendor.id}>
                            {vendor.company_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Finish Setup */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h3 className="font-bold text-base text-[var(--text-primary)] font-display uppercase tracking-wide">Review Driver Details</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Review the grid configuration before publishing to DB.</p>
              </div>

              <div className="bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-xl p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-[var(--text-muted)] block uppercase font-bold tracking-wider text-[10px]">Driver Name</span>
                    <span className="text-[var(--text-primary)] font-extrabold text-sm block mt-1">{fullName}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block uppercase font-bold tracking-wider text-[10px]">Account Role</span>
                    <span className="text-[var(--accent)] font-extrabold text-sm block mt-1 uppercase">
                      {selectedRole === 'manager' ? 'Manager Approval' : selectedRole === 'procurement_officer' ? 'Procurement Lead' : 'Vendor Partner'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block uppercase font-bold tracking-wider text-[10px]">Contact Phone</span>
                    <span className="text-[var(--text-primary)] font-semibold text-xs block mt-1">{phone || 'Not Specified'}</span>
                  </div>
                  
                  {selectedRole !== 'vendor' ? (
                    <div>
                      <span className="text-[var(--text-muted)] block uppercase font-bold tracking-wider text-[10px]">Department</span>
                      <span className="text-[var(--text-primary)] font-semibold text-xs block mt-1">{department}</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[var(--text-muted)] block uppercase font-bold tracking-wider text-[10px]">Vendor Association</span>
                      <span className="text-[var(--text-primary)] font-semibold text-xs block mt-1">{getSelectedVendorName()}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-[var(--border-default)] pt-4">
                  <p className="text-[10px] text-[var(--text-muted)] italic font-mono">
                    By completing onboarding, your driver permissions and notification routing will immediately update.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="mt-8 flex justify-between gap-4 border-t border-[var(--border-default)] pt-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2.5 border border-[var(--border-default)] rounded text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface)] transition-all cursor-pointer font-mono uppercase tracking-wider skew-x-[-6deg]"
              >
                <ArrowLeft size={14} /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded text-xs font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-all cursor-pointer font-mono uppercase tracking-widest shadow-md shadow-[var(--accent)]/10 skew-x-[-6deg]"
              >
                Continue <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCompleteSetup}
                disabled={loading}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all cursor-pointer font-mono uppercase tracking-widest shadow-md shadow-emerald-600/10 skew-x-[-6deg]"
              >
                {loading ? (
                  <>
                    Saving Config <Loader2 size={14} className="animate-spin" />
                  </>
                ) : (
                  <>
                    Finish Grid Setup <ShieldCheck size={14} />
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
