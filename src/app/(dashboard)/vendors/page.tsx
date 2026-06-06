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

export default function VendorsPage() {
  const supabase = createClient()
  const { user } = useAuth()
  
  const [vendors, setVendors] = useState<Vendor[]>(fallbackVendors)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [dbNotice, setDbNotice] = useState<string | null>(null)

  // Form states
  const [companyName, setCompanyName] = useState('')
  const [category, setCategory] = useState('IT & Software')
  const [contactPerson, setContactPerson] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [gstNumber, setGstNumber] = useState('')

  // Load vendors from Supabase on mount
  useEffect(() => {
    async function loadVendors() {
      try {
        const { data, error } = await supabase
          .from('vendors')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        
        if (data && data.length > 0) {
          // Map database structure to local interface
          const mapped: Vendor[] = data.map((v: any) => ({
            id: v.id,
            company_name: v.company_name,
            category: v.notes || 'IT & Software', // using notes or fallback for name
            status: v.status || 'pending',
            contact_person: v.contact_person,
            email: v.email,
            phone: v.phone,
            gst_number: v.gst_number || 'N/A',
            rating: Number(v.rating) || 0,
            total_orders: v.total_orders || 0
          }))
          setVendors(mapped)
          setDbNotice('Synced with Supabase database')
        }
      } catch (err: any) {
        console.warn('Failed to load vendors from Supabase, using mock local storage:', err.message)
        // Check localStorage
        const stored = localStorage.getItem('vb_vendors')
        if (stored) {
          setVendors(JSON.parse(stored))
        }
      }
    }

    loadVendors()
  }, [supabase])

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyName || !contactPerson || !email) return

    const newVendor: Vendor = {
      id: Math.random().toString(36).substring(2, 9),
      company_name: companyName,
      category,
      status: 'pending',
      contact_person: contactPerson,
      email,
      phone,
      gst_number: gstNumber || 'N/A',
      rating: 0.0,
      total_orders: 0
    }

    try {
      // Try to save to Supabase
      const { error } = await supabase
        .from('vendors')
        .insert({
          company_name: companyName,
          status: 'pending',
          contact_person: contactPerson,
          email,
          phone,
          gst_number: gstNumber || null,
          notes: category, // store category string in notes for simple mapping
          created_by: user?.id || 'demo-user-id'
        })

      if (error) throw error

      setDbNotice('Vendor saved to Supabase!')
    } catch (err: any) {
      console.warn('Could not save vendor to Supabase, saving to local session storage:', err.message)
    }

    // Always update local UI state
    const updated = [newVendor, ...vendors]
    setVendors(updated)
    localStorage.setItem('vb_vendors', JSON.stringify(updated))

    setShowAddForm(false)
    // Reset form fields
    setCompanyName('')
    setContactPerson('')
    setEmail('')
    setPhone('')
    setGstNumber('')
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
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Vendor Management</h2>
          <p className="text-slate-500 text-sm mt-1">Register, monitor compliance, and track performance of all vendors.</p>
          {dbNotice && (
            <span className="inline-flex mt-2 text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100">
              {dbNotice}
            </span>
          )}
        </div>
        
        {/* Authorization check: only Admin/Procurement Officer can register vendors */}
        {(user?.role === 'admin' || user?.role === 'procurement_officer') && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-lg shadow-indigo-600/10 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus size={16} />
            Register Vendor
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        <div className="relative w-full md:w-96 group">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </span>
          <input
            type="text"
            placeholder="Search by company, contact, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-full md:w-auto">
            <Filter size={16} className="text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-sm text-slate-600 focus:outline-none cursor-pointer w-full font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending Verification</option>
              <option value="suspended">Suspended</option>
              <option value="blacklisted">Blacklisted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add Vendor Form (Modal) */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Register New Vendor</h3>
            <p className="text-xs text-slate-500 mb-6">Enter compliance and contact information to register this vendor.</p>
            
            <form onSubmit={handleAddVendor} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Tech Solutions"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full mt-1.5 px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full mt-1.5 px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  >
                    <option>IT & Software</option>
                    <option>Logistics</option>
                    <option>Office Supplies</option>
                    <option>Maintenance</option>
                    <option>Marketing</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">GST Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 27AAAAA1111A1Z1"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    className="w-full mt-1.5 px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Contact Person</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full mt-1.5 px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. contact@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full mt-1.5 px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full mt-1.5 px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors"
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
          <div key={vendor.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6 relative">
            <div className="flex-1 space-y-4">
              {/* Profile/Category Title */}
              <div className="flex items-start justify-between">
                <div className="flex gap-3 items-center">
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-600">
                    <Building size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-base leading-snug">{vendor.company_name}</h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200/50 mt-1">
                      {vendor.category}
                    </span>
                  </div>
                </div>
                {/* Status Badge */}
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  vendor.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                  vendor.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                  'bg-rose-50 text-rose-700 border border-rose-100'
                }`}>
                  {vendor.status === 'active' && <CheckCircle size={12} />}
                  {vendor.status === 'pending' && <AlertTriangle size={12} />}
                  {(vendor.status === 'suspended' || vendor.status === 'blacklisted') && <XCircle size={12} />}
                  <span className="capitalize">{vendor.status.replace('_', ' ')}</span>
                </span>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <p className="text-slate-400 font-semibold uppercase tracking-wider">Contact</p>
                  <p className="font-bold text-slate-700">{vendor.contact_person}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-slate-400 font-semibold uppercase tracking-wider">GSTIN</p>
                  <code className="px-1.5 py-0.5 bg-slate-50 rounded text-slate-600 font-mono border border-slate-100">{vendor.gst_number}</code>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><Mail size={14} /> {vendor.email}</span>
                <span className="hidden sm:inline text-slate-300">|</span>
                <span className="flex items-center gap-1.5"><Phone size={14} /> {vendor.phone}</span>
              </div>
            </div>

            {/* Performance Stats column */}
            <div className="md:w-36 flex flex-row md:flex-col justify-between md:justify-center items-center md:border-l border-slate-100 pl-0 md:pl-6 pt-4 md:pt-0 gap-4">
              <div className="text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rating</p>
                <div className="flex items-center gap-1 justify-center mt-1 text-amber-500 font-bold text-lg">
                  <Star size={18} fill="currentColor" />
                  <span>{vendor.rating > 0 ? vendor.rating.toFixed(1) : 'N/A'}</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Orders</p>
                <span className="text-slate-700 font-extrabold text-lg block mt-0.5">{vendor.total_orders}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
