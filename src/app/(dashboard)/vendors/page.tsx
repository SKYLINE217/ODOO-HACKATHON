'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  Star, 
  Mail, 
  Phone, 
  CheckCircle, 
  AlertTriangle,
  XCircle,
  Building
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { swr, cacheInvalidate } from '@/lib/cache'
import { useSearchStore } from '@/stores/useSearchStore'

interface Vendor {
  id: string
  company_name: string
  category: string
  status: 'active' | 'pending' | 'suspended' | 'blacklisted'
  contact_person: string
  email: string
  phone: string
  gst_number: string
  rating: number
  total_orders: number
}

const fallbackVendors: Vendor[] = [
  {
    id: '1',
    company_name: 'Apex Tech Solutions',
    category: 'IT & Software',
    status: 'active',
    contact_person: 'John Doe',
    email: 'john.doe@apextech.com',
    phone: '+91 98765 43210',
    gst_number: '27AAAAA1111A1Z1',
    rating: 4.8,
    total_orders: 14
  },
  {
    id: '2',
    company_name: 'Swift Logistics Inc.',
    category: 'Logistics',
    status: 'pending',
    contact_person: 'Jane Smith',
    email: 'contact@swiftlogistics.in',
    phone: '+91 99887 76655',
    gst_number: '27BBBBB2222B2Z2',
    rating: 0.0,
    total_orders: 0
  },
  {
    id: '3',
    company_name: 'Superior Office Supplies',
    category: 'Office Supplies',
    status: 'active',
    contact_person: 'Robert Lang',
    email: 'sales@superiorsupplies.com',
    phone: '+91 97766 55443',
    gst_number: '27CCCCC3333C3Z3',
    rating: 4.2,
    total_orders: 28
  },
  {
    id: '4',
    company_name: 'Delta Facility Services',
    category: 'Maintenance',
    status: 'suspended',
    contact_person: 'Vikram Rao',
    email: 'support@deltafacility.co.in',
    phone: '+91 96655 44332',
    gst_number: '27DDDDD4444D4Z4',
    rating: 3.5,
    total_orders: 8
  }
]

const supabase = createClient()

export default function VendorsPage() {
  const { user } = useAuth()
  
  const [vendors, setVendors] = useState<Vendor[]>(fallbackVendors)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const { searchTerm, setSearchTerm, clearSearch } = useSearchStore()
  
  useEffect(() => {
    return () => clearSearch()
  }, [clearSearch])

  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [dbNotice, setDbNotice] = useState<string | null>(null)
  const [formSaving, setFormSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Form states
  const [companyName, setCompanyName] = useState('')
  const [category, setCategory] = useState('IT & Software')
  const [contactPerson, setContactPerson] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [gstNumber, setGstNumber] = useState('')

  // Close modal on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowAddForm(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Load vendors — SWR: returns cached data instantly, then revalidates in background
  useEffect(() => {
    if (!user) return
    async function fetchVendors(): Promise<Vendor[]> {
      let query = supabase
        .from('vendors')
        .select('id, company_name, status, contact_person, email, phone, gst_number, rating, total_orders, vendor_categories(name)')

      if (user?.role === 'vendor') {
        const activeVendorId = (user as any)?.vendor_id || '00000000-0000-0000-0000-000000000000'
        query = query.eq('id', activeVendorId)
      }

      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      return (data || []).map((v: any) => ({
        id: v.id,
        company_name: v.company_name,
        category: v.vendor_categories?.name || 'General',
        status: v.status || 'pending',
        contact_person: v.contact_person,
        email: v.email,
        phone: v.phone,
        gst_number: v.gst_number || 'N/A',
        rating: Number(v.rating) || 0,
        total_orders: v.total_orders || 0,
      }))
    }

    const cacheKey = `vendors:list:${user.role}`
    swr(cacheKey, fetchVendors, (fresh) => {
      if (fresh.length > 0) setVendors(fresh)
    }).then(data => {
      if (data.length > 0) setVendors(data)
    }).catch(() => {
      const stored = localStorage.getItem('vb_vendors')
      if (stored) try { setVendors(JSON.parse(stored)) } catch { }
    })
  }, [user])

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyName || !contactPerson || !email) return
    setFormSaving(true)
    setFormError(null)

    // OPTIMISTIC UPDATE — show new vendor in UI immediately
    const optimisticId = `opt-${Date.now()}`
    const optimisticVendor: Vendor = {
      id: optimisticId,
      company_name: companyName,
      category,
      status: 'pending',
      contact_person: contactPerson,
      email,
      phone,
      gst_number: gstNumber || 'N/A',
      rating: 0,
      total_orders: 0,
    }
    setVendors(prev => [optimisticVendor, ...prev])
    setShowAddForm(false)
    setCompanyName(''); setContactPerson(''); setEmail(''); setPhone(''); setGstNumber('')

    try {
      // Run category lookup and insert in parallel where possible
      const [catResult, insertResult] = await Promise.allSettled([
        supabase.from('vendor_categories').select('id').eq('name', category).single(),
        Promise.resolve(null) // placeholder
      ])
      const catId = catResult.status === 'fulfilled' ? catResult.value.data?.id : null

      const { data: inserted, error } = await supabase
        .from('vendors')
        .insert({ company_name: companyName, category_id: catId, status: 'pending',
          contact_person: contactPerson, email, phone,
          gst_number: gstNumber || null, created_by: user?.id || null })
        .select('id')
        .single()

      if (error) throw error

      // Replace optimistic entry with real DB id
      if (inserted?.id) {
        setVendors(prev => prev.map(v => v.id === optimisticId ? { ...v, id: inserted.id } : v))
      }
      cacheInvalidate('vendors:list')
    } catch (err: any) {
      // Rollback optimistic update on failure
      setVendors(prev => prev.filter(v => v.id !== optimisticId))
      setFormError(err.message?.includes('duplicate') ? 'A vendor with this email already exists.' : (err.message || 'Failed to save.'))
      setShowAddForm(true)
    } finally {
      setFormSaving(false)
    }
  }

  const filteredVendors = vendors.filter((v) => {
    const matchesSearch = v.company_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-300 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Vendor Management</h2>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Register, monitor compliance, and track performance of all vendors.</p>
          {dbNotice && (
            <span className="inline-flex mt-2 text-[10px] font-bold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/25">
              {dbNotice}
            </span>
          )}
        </div>
        
        {/* Authorization check: only Admin/Procurement Officer can register vendors */}
        {(user?.role === 'admin' || user?.role === 'procurement_officer') && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg text-sm font-semibold shadow-lg transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus size={16} />
            Register Vendor
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[var(--bg-surface)] border border-[var(--border-default)] p-4 rounded-xl shadow-sm">
        <div className="relative w-full md:w-96 group">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors" />
          </span>
          <input
            type="text"
            placeholder="Search by company, contact, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-all"
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-lg px-3 py-1.5 w-full md:w-auto">
            <Filter size={16} className="text-[var(--text-secondary)]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-sm text-[var(--text-secondary)] focus:outline-none cursor-pointer w-full font-medium"
            >
              <option value="all" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">All Statuses</option>
              <option value="active" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Active</option>
              <option value="pending" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Pending Verification</option>
              <option value="suspended" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Suspended</option>
              <option value="blacklisted" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Blacklisted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add Vendor Form (Modal) */}
      {showAddForm && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddForm(false) }}
        >
          <div className="bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-xl max-w-lg w-full shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 font-display">Register New Vendor</h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4">Enter compliance and contact information to register this vendor.</p>

            {formError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-semibold rounded-lg">
                {formError}
              </div>
            )}
            
            <form onSubmit={handleAddVendor} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Tech Solutions"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full mt-1.5 px-3.5 py-2 bg-[var(--bg-subtle)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full mt-1.5 px-3.5 py-2 bg-[var(--bg-subtle)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                  >
                    <option className="bg-[var(--bg-surface)] text-[var(--text-primary)]">IT & Software</option>
                    <option className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Logistics</option>
                    <option className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Office Supplies</option>
                    <option className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Maintenance</option>
                    <option className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Marketing</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide">GST Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 27AAAAA1111A1Z1"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    className="w-full mt-1.5 px-3.5 py-2 bg-[var(--bg-subtle)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide">Contact Person</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full mt-1.5 px-3.5 py-2 bg-[var(--bg-subtle)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. contact@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full mt-1.5 px-3.5 py-2 bg-[var(--bg-subtle)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide">Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full mt-1.5 px-3.5 py-2 bg-[var(--bg-subtle)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-[var(--bg-subtle)] border border-[var(--border-strong)] text-[var(--text-secondary)] rounded-lg text-sm font-semibold hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredVendors.map((vendor) => (
          <div key={vendor.id} className="card card-hover flex flex-col md:flex-row gap-6 relative">
            <div className="flex-1 space-y-4">
              {/* Profile/Category Title */}
              <div className="flex items-start justify-between">
                <div className="flex gap-3 items-center">
                  <div className="p-2.5 bg-[var(--bg-subtle)] border border-[var(--border-strong)] rounded-lg text-[var(--text-muted)]">
                    <Building size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--text-primary)] text-base leading-snug font-display">{vendor.company_name}</h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-default)] mt-1 font-mono">
                      {vendor.category}
                    </span>
                  </div>
                </div>
                {/* Status Badge */}
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  vendor.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                  vendor.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
                  'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                }`}>
                  {vendor.status === 'active' && <CheckCircle size={12} />}
                  {vendor.status === 'pending' && <AlertTriangle size={12} />}
                  {(vendor.status === 'suspended' || vendor.status === 'blacklisted') && <XCircle size={12} />}
                  <span>{vendor.status}</span>
                </span>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="space-y-1">
                  <p className="text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[9px]">Contact</p>
                  <p className="font-bold text-[var(--text-primary)]">{vendor.contact_person}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[9px]">GSTIN</p>
                  <code className="px-1.5 py-0.5 bg-[var(--bg-subtle)] rounded text-[var(--text-secondary)] border border-[var(--border-strong)]">{vendor.gst_number}</code>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2 text-xs text-[var(--text-secondary)] font-mono">
                <span className="flex items-center gap-1.5"><Mail size={14} /> {vendor.email}</span>
                <span className="hidden sm:inline text-[var(--text-muted)]">|</span>
                <span className="flex items-center gap-1.5"><Phone size={14} /> {vendor.phone}</span>
              </div>
            </div>

            {/* Performance Stats column */}
            <div className="md:w-36 flex flex-row md:flex-col justify-between md:justify-center items-center md:border-l border-[var(--border-default)] pl-0 md:pl-6 pt-4 md:pt-0 gap-4">
              <div className="flex flex-row md:flex-col gap-4 w-full justify-around md:justify-center">
                <div className="text-center">
                  <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Rating</p>
                  <div className="flex items-center gap-1 justify-center mt-1 text-amber-400 font-bold text-base f1-numbers">
                    <Star size={14} fill="currentColor" />
                    <span>{vendor.rating > 0 ? vendor.rating.toFixed(1) : 'N/A'}</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Orders</p>
                  <span className="text-[var(--text-primary)] font-extrabold text-base block mt-0.5 f1-numbers">{vendor.total_orders}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedVendor(vendor)}
                className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg transition-colors cursor-pointer"
              >
                View Profile
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Vendor Profile Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-[var(--border-default)] flex justify-between items-center bg-[var(--bg-elevated)]">
              <div className="flex gap-3 items-center">
                <div className="p-3 bg-[var(--bg-subtle)] border border-[var(--border-strong)] rounded-lg text-[var(--accent)]">
                  <Building size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded border border-[var(--border-default)] font-mono">
                      ID: {selectedVendor.id}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] font-mono font-medium">{selectedVendor.category}</span>
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mt-1 font-display">{selectedVendor.company_name}</h3>
                </div>
              </div>
              <button 
                onClick={() => setSelectedVendor(null)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-semibold p-1 hover:bg-[var(--bg-subtle)] rounded transition-colors"
              >
                ✕ Close
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-[var(--text-secondary)] custom-scrollbar">
              {/* Profile stats & reliability */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[var(--bg-subtle)] border border-[var(--border-default)] p-3 rounded-lg text-center">
                  <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider block">Rating Score</span>
                  <div className="flex items-center gap-1 justify-center mt-1 text-amber-400 font-bold text-base f1-numbers">
                    <Star size={14} fill="currentColor" />
                    <span>{selectedVendor.rating > 0 ? selectedVendor.rating.toFixed(1) : 'N/A'}</span>
                  </div>
                </div>
                <div className="bg-[var(--bg-subtle)] border border-[var(--border-default)] p-3 rounded-lg text-center">
                  <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider block">Completed Orders</span>
                  <span className="font-extrabold text-[var(--text-primary)] text-base block mt-1 f1-numbers">{selectedVendor.total_orders}</span>
                </div>
                <div className="bg-[var(--bg-subtle)] border border-[var(--border-default)] p-3 rounded-lg text-center">
                  <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider block">Fulfillment Rate</span>
                  <span className="font-bold text-emerald-400 text-sm mt-1.5 block font-mono">98.6%</span>
                </div>
                <div className="bg-[var(--bg-subtle)] border border-[var(--border-default)] p-3 rounded-lg text-center">
                  <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider block">Avg. Response Time</span>
                  <span className="font-bold text-indigo-400 text-sm mt-1.5 block font-mono">1.2 Days</span>
                </div>
              </div>

              {/* Contact Information block */}
              <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] p-4 rounded-lg space-y-3">
                <h4 className="text-[var(--text-primary)] font-bold text-xs uppercase tracking-wider border-b border-[var(--border-default)] pb-2 mb-2">Corporate Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[var(--text-muted)] block font-semibold">Primary Representative:</span>
                    <span className="text-[var(--text-primary)] font-medium block mt-0.5">{selectedVendor.contact_person}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block font-semibold">GSTIN / Registration:</span>
                    <span className="text-[var(--text-primary)] font-mono block mt-0.5">{selectedVendor.gst_number}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block font-semibold">Business Email:</span>
                    <span className="text-[var(--text-primary)] font-mono block mt-0.5">{selectedVendor.email}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block font-semibold">Corporate Phone:</span>
                    <span className="text-[var(--text-primary)] font-mono block mt-0.5">{selectedVendor.phone}</span>
                  </div>
                </div>
                <div className="pt-2 text-xs border-t border-[var(--border-default)]">
                  <span className="text-[var(--text-muted)] block font-semibold">Registered Headquarters Office:</span>
                  <p className="text-[var(--text-secondary)] mt-1">104, Tech Park Boulevard, Sector 4, Bangalore, Karnataka, 560001</p>
                </div>
              </div>

              {/* Recent Bids and Activity */}
              <div>
                <h4 className="font-bold text-[var(--text-primary)] text-xs uppercase tracking-wider mb-2.5">Associated Procurements & Active Bids</h4>
                <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border-default)] text-[var(--text-muted)]">
                        <th className="p-3 font-semibold">Requisition Ref</th>
                        <th className="p-3 font-semibold">Title</th>
                        <th className="p-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-[var(--border-default)] hover:bg-[var(--bg-subtle)] last:border-0">
                        <td className="p-3 font-mono text-indigo-400">RFQ-2026-00042</td>
                        <td className="p-3 text-[var(--text-secondary)]">Server Hardware Upgrade</td>
                        <td className="p-3">
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded font-mono">SUBMITTED</span>
                        </td>
                      </tr>
                      <tr className="border-b border-[var(--border-default)] hover:bg-[var(--bg-subtle)] last:border-0">
                        <td className="p-3 font-mono text-indigo-400">RFQ-2026-00043</td>
                        <td className="p-3 text-[var(--text-secondary)]">Office Ergonomic Chairs</td>
                        <td className="p-3">
                          <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded font-mono">DRAFT BID</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-[var(--bg-elevated)] border-t border-[var(--border-default)] flex justify-between gap-3 items-center">
              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                Verified Vendor Partner since 2024
              </span>
              <button 
                onClick={() => setSelectedVendor(null)}
                className="px-4 py-2 bg-[var(--bg-subtle)] border border-[var(--border-strong)] rounded-lg text-xs font-semibold hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
