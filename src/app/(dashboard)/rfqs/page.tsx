'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  IndianRupee, 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Users,
  Trash2,
  AlertCircle
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/hooks/useAuth'

interface RFQItem {
  item_name: string
  quantity: number
  unit: string
  description?: string
}

interface RFQ {
  id: string
  rfq_number: string
  title: string
  description: string
  status: 'draft' | 'published' | 'closed' | 'cancelled'
  deadline: string
  budget_estimate: number
  invited_vendors_count: number
  items: RFQItem[]
}

const fallbackRfqs: RFQ[] = [
  {
    id: '1',
    rfq_number: 'RFQ-2026-00042',
    title: 'Server Hardware Upgrade',
    description: 'Procurement of 5 rack servers and dual redundant UPS systems for secondary datacenter.',
    status: 'published',
    deadline: '2026-06-15',
    budget_estimate: 850000,
    invited_vendors_count: 4,
    items: [
      { item_name: 'Rack Servers (2U)', quantity: 5, unit: 'units', description: 'Xeon Silver, 128GB RAM' },
      { item_name: 'Redundant UPS 10kVA', quantity: 2, unit: 'units', description: 'Double conversion online UPS' }
    ]
  },
  {
    id: '2',
    rfq_number: 'RFQ-2026-00043',
    title: 'Office Ergonomic Chairs',
    description: 'Bulk procurement of premium ergonomic chairs with lumbar support for corporate office.',
    status: 'draft',
    deadline: '2026-06-25',
    budget_estimate: 320000,
    invited_vendors_count: 2,
    items: [
      { item_name: 'Mesh Ergonomic Chairs', quantity: 45, unit: 'units', description: 'Adjustable armrests' }
    ]
  },
  {
    id: '3',
    rfq_number: 'RFQ-2026-00044',
    title: 'Annual Pest Control Contract',
    description: 'Facility maintenance pesticide and control services across 3 warehouse locations.',
    status: 'closed',
    deadline: '2026-05-30',
    budget_estimate: 150000,
    invited_vendors_count: 3,
    items: [
      { item_name: 'Quarterly Pest Service', quantity: 4, unit: 'cycles', description: '3 warehouses' }
    ]
  }
]

const supabase = createClient()

export default function RfqsPage() {
  const { user } = useAuth()
  
  const [rfqs, setRfqs] = useState<RFQ[]>(fallbackRfqs)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [dbNotice, setDbNotice] = useState<string | null>(null)
  const [formSaving, setFormSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [budget, setBudget] = useState('')
  const [invitedCount, setInvitedCount] = useState('3')
  
  // Items array inside form
  const [formItems, setFormItems] = useState<RFQItem[]>([{ item_name: '', quantity: 1, unit: 'units', description: '' }])

  // Escape key closes modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowAddForm(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Load RFQs from Supabase on mount
  useEffect(() => {
    async function loadRfqs() {
      try {
        const { data: rfqsData, error: rfqErr } = await supabase
          .from('rfqs')
          .select('*, rfq_items(*)')
          .order('created_at', { ascending: false })

        if (rfqErr) throw rfqErr

        if (rfqsData && rfqsData.length > 0) {
          const mapped: RFQ[] = rfqsData.map((r: any) => ({
            id: r.id,
            rfq_number: r.rfq_number,
            title: r.title,
            description: r.description || '',
            status: r.status || 'draft',
            deadline: r.deadline ? r.deadline.split('T')[0] : '',
            budget_estimate: Number(r.budget_estimate) || 0,
            invited_vendors_count: 3, // mock count
            items: r.rfq_items ? r.rfq_items.map((i: any) => ({
              item_name: i.item_name,
              quantity: Number(i.quantity) || 1,
              unit: i.unit,
              description: i.description || ''
            })) : []
          }))
          setRfqs(mapped)
          setDbNotice('Synced with Supabase database')
        }
      } catch (err: any) {
        console.warn('Failed to load RFQs from Supabase, using mock local storage:', err.message)
        const stored = localStorage.getItem('vb_rfqs')
        if (stored) {
          setRfqs(JSON.parse(stored))
        }
      }
    }

    loadRfqs()
  }, [])

  const handleAddItemRow = () => {
    setFormItems([...formItems, { item_name: '', quantity: 1, unit: 'units', description: '' }])
  }

  const handleRemoveItemRow = (index: number) => {
    if (formItems.length === 1) return
    setFormItems(formItems.filter((_, i) => i !== index))
  }

  const handleItemFieldChange = (index: number, field: keyof RFQItem, value: any) => {
    const updated = [...formItems]
    updated[index] = { ...updated[index], [field]: value }
    setFormItems(updated)
  }

  const handleCreateRfq = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !deadline || !budget) return
    setFormSaving(true)
    setFormError(null)

    const newRfqId = Math.random().toString(36).substring(2, 9)
    const newRfq: RFQ = {
      id: newRfqId,
      rfq_number: `RFQ-2026-${String(1000 + rfqs.length).padStart(5, '0')}`,
      title,
      description,
      status: 'draft',
      deadline,
      budget_estimate: Number(budget),
      invited_vendors_count: Number(invitedCount),
      items: formItems.filter(item => item.item_name.trim() !== '')
    }

    try {
      const { data: rfqRecord, error: rfqErr } = await supabase
        .from('rfqs')
        .insert({
          title,
          description,
          status: 'draft',
          deadline: new Date(deadline).toISOString(),
          budget_estimate: Number(budget),
          created_by: user?.id
        })
        .select()
        .single()

      if (rfqErr) throw rfqErr

      if (rfqRecord && newRfq.items.length > 0) {
        const itemsToInsert = newRfq.items.map((item, index) => ({
          rfq_id: rfqRecord.id,
          item_name: item.item_name,
          quantity: item.quantity,
          unit: item.unit,
          description: item.description || '',
          sort_order: index
        }))
        await supabase.from('rfq_items').insert(itemsToInsert)
      }

      // Use server-generated rfq_number if available
      if (rfqRecord?.rfq_number) newRfq.rfq_number = rfqRecord.rfq_number
      if (rfqRecord?.id) newRfq.id = rfqRecord.id
      setDbNotice('RFQ created successfully in Supabase!')
    } catch (err: any) {
      setFormError(err.message || 'Could not save to database. Kept locally.')
    } finally {
      setFormSaving(false)
    }

    setRfqs([newRfq, ...rfqs])
    setShowAddForm(false)
    setTitle('')
    setDescription('')
    setDeadline('')
    setBudget('')
    setInvitedCount('3')
    setFormItems([{ item_name: '', quantity: 1, unit: 'units', description: '' }])
    setFormError(null)
  }

  const filteredRfqs = rfqs.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.rfq_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-300 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Request For Quotations (RFQs)</h2>
          <p className="text-slate-500 text-sm mt-1">Manage bidding requests, invite vendors, and compare submitted proposals.</p>
          {dbNotice && (
            <span className="inline-flex mt-2 text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100">
              {dbNotice}
            </span>
          )}
        </div>
        
        {/* Authorization check: only Admin/Procurement Officer can create RFQs */}
        {(user?.role === 'admin' || user?.role === 'procurement_officer') && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-lg shadow-indigo-600/10 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus size={16} />
            Create RFQ
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
            placeholder="Search by RFQ number, title..."
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
              <option value="all">All RFQs</option>
              <option value="draft">Draft</option>
              <option value="published">Published (Active)</option>
              <option value="closed">Closed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Create RFQ Form (Modal) */}
      {showAddForm && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddForm(false) }}
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full shadow-2xl p-6 relative my-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Create RFQ</h3>
            <p className="text-xs text-slate-500 mb-4">Create a request, add requisition items, and select vendors to send invites.</p>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg">
                {formError}
              </div>
            )}
            
            <form onSubmit={handleCreateRfq} className="space-y-6">
              {/* Basic Details */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">RFQ Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Server Hardware Upgrade"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full mt-1.5 px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Description</label>
                  <textarea
                    placeholder="Provide details about the procurement scope..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full mt-1.5 px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Deadline Date</label>
                    <input
                      type="date"
                      required
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full mt-1.5 px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Budget Estimate (₹)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 500000"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full mt-1.5 px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Vendors Invited</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 3"
                      value={invitedCount}
                      onChange={(e) => setInvitedCount(e.target.value)}
                      className="w-full mt-1.5 px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Items Section */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Line Items</h4>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    <Plus size={14} /> Add Row
                  </button>
                </div>

                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {formItems.map((item, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <div className="flex-1">
                        <input
                          type="text"
                          required
                          placeholder="Item Name"
                          value={item.item_name}
                          onChange={(e) => handleItemFieldChange(index, 'item_name', e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="w-20">
                        <input
                          type="number"
                          required
                          min={1}
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemFieldChange(index, 'quantity', Number(e.target.value))}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="w-24">
                        <input
                          type="text"
                          required
                          placeholder="Unit"
                          value={item.unit}
                          onChange={(e) => handleItemFieldChange(index, 'unit', e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(index)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg mt-0.5 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
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
                  Save Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RFQ List Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredRfqs.map((rfq) => (
          <div key={rfq.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-mono">
                      {rfq.rfq_number}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Updated 2 days ago</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg leading-tight mt-1.5">{rfq.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-normal max-w-2xl">{rfq.description}</p>
                </div>

                {/* Status */}
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  rfq.status === 'published' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                  rfq.status === 'draft' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                  'bg-rose-50 text-rose-700 border border-rose-100'
                }`}>
                  {rfq.status === 'published' && <CheckCircle2 size={12} />}
                  {rfq.status === 'draft' && <Clock size={12} />}
                  {rfq.status === 'closed' && <AlertCircle size={12} />}
                  <span className="capitalize">{rfq.status}</span>
                </span>
              </div>

              {/* Items Summary */}
              <div className="border-t border-b border-slate-50 py-3 space-y-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Requested Line Items ({rfq.items.length})</p>
                <div className="flex flex-wrap gap-2">
                  {rfq.items.map((item, idx) => (
                    <span key={idx} className="inline-flex px-2 py-1 bg-slate-50 border border-slate-150 rounded text-xs text-slate-600 font-medium">
                      {item.item_name} ({item.quantity} {item.unit})
                    </span>
                  ))}
                </div>
              </div>

              {/* Info footer */}
              <div className="flex flex-wrap gap-6 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1.5"><Calendar size={14} /> Deadline: <span className="font-semibold text-slate-700">{rfq.deadline}</span></span>
                <span className="flex items-center gap-1.5"><IndianRupee size={14} /> Budget: <span className="font-semibold text-slate-700">₹{rfq.budget_estimate.toLocaleString('en-IN')}</span></span>
                <span className="flex items-center gap-1.5"><Users size={14} /> Invited Bidders: <span className="font-semibold text-slate-700">{rfq.invited_vendors_count} vendors</span></span>
              </div>
            </div>

            {/* Actions button */}
            <div className="md:w-32 flex md:flex-col justify-end md:justify-center gap-2 md:border-l border-slate-100 pl-0 md:pl-6 pt-4 md:pt-0">
              <button className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-indigo-650 hover:bg-indigo-50/20 border border-slate-200 hover:border-indigo-100 rounded-lg transition-colors cursor-pointer">
                <Eye size={14} /> Details
              </button>
              <button className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm hover:shadow transition-colors cursor-pointer">
                <FileSpreadsheet size={14} /> Bids
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
