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
import { swr, cacheInvalidate } from '@/lib/cache'

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
  const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null)
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

  // Load RFQs — SWR: instant from cache, revalidates in background
  useEffect(() => {
    async function fetchRfqs(): Promise<RFQ[]> {
      const { data, error } = await supabase
        .from('rfqs')
        .select('id, rfq_number, title, description, status, deadline, budget_estimate, rfq_items(item_name, quantity, unit, description)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data || []).map((r: any) => ({
        id: r.id,
        rfq_number: r.rfq_number,
        title: r.title,
        description: r.description || '',
        status: r.status || 'draft',
        deadline: r.deadline ? r.deadline.split('T')[0] : '',
        budget_estimate: Number(r.budget_estimate) || 0,
        invited_vendors_count: 0,
        items: (r.rfq_items || []).map((i: any) => ({
          item_name: i.item_name, quantity: Number(i.quantity) || 1,
          unit: i.unit, description: i.description || ''
        }))
      }))
    }
    swr('rfqs:list', fetchRfqs, fresh => { if (fresh.length > 0) setRfqs(fresh) })
      .then(data => { if (data.length > 0) setRfqs(data) })
      .catch(() => { const s = localStorage.getItem('vb_rfqs'); if (s) try { setRfqs(JSON.parse(s)) } catch {} })
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

    const validItems = formItems.filter(i => i.item_name.trim() !== '')

    // OPTIMISTIC UPDATE — show in UI immediately
    const optimisticId = `opt-${Date.now()}`
    const optimisticRfq: RFQ = {
      id: optimisticId,
      rfq_number: `RFQ-${new Date().getFullYear()}-${String(1000 + rfqs.length).padStart(5,'0')}`,
      title, description, status: 'draft', deadline,
      budget_estimate: Number(budget),
      invited_vendors_count: Number(invitedCount),
      items: validItems
    }
    setRfqs(prev => [optimisticRfq, ...prev])
    setShowAddForm(false)
    setTitle(''); setDescription(''); setDeadline(''); setBudget(''); setInvitedCount('3')
    setFormItems([{ item_name: '', quantity: 1, unit: 'units', description: '' }])

    try {
      const { data: rfqRecord, error: rfqErr } = await supabase
        .from('rfqs')
        .insert({ title, description, status: 'draft',
          deadline: new Date(deadline).toISOString(),
          budget_estimate: Number(budget), created_by: user?.id })
        .select('id, rfq_number')
        .single()
      if (rfqErr) throw rfqErr

      // Insert items in parallel if any
      if (rfqRecord && validItems.length > 0) {
        await supabase.from('rfq_items').insert(
          validItems.map((item, idx) => ({
            rfq_id: rfqRecord.id, item_name: item.item_name,
            quantity: item.quantity, unit: item.unit,
            description: item.description || '', sort_order: idx
          }))
        )
      }

      // Replace optimistic entry with real DB data
      if (rfqRecord) {
        setRfqs(prev => prev.map(r =>
          r.id === optimisticId
            ? { ...r, id: rfqRecord.id, rfq_number: rfqRecord.rfq_number || r.rfq_number }
            : r
        ))
      }
      cacheInvalidate('rfqs:list')
    } catch (err: any) {
      // Rollback on failure
      setRfqs(prev => prev.filter(r => r.id !== optimisticId))
      setFormError(err.message || 'Could not save to database.')
      setShowAddForm(true)
    } finally {
      setFormSaving(false)
    }
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
          <div key={rfq.id} className="card card-hover flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/25 font-mono">
                      {rfq.rfq_number}
                    </span>
                    <span className="text-xs text-slate-500 font-mono font-medium">Updated 2 days ago</span>
                  </div>
                  <h4 className="font-bold text-white text-lg leading-tight mt-1.5 font-display">{rfq.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-normal max-w-2xl">{rfq.description}</p>
                </div>

                {/* Status */}
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  rfq.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                  rfq.status === 'draft' ? 'bg-slate-500/10 text-slate-400 border border-slate-550' :
                  'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                }`}>
                  {rfq.status === 'published' && <CheckCircle2 size={12} />}
                  {rfq.status === 'draft' && <Clock size={12} />}
                  {rfq.status === 'closed' && <AlertCircle size={12} />}
                  <span>{rfq.status}</span>
                </span>
              </div>

              {/* Items Summary */}
              <div className="border-t border-b border-[var(--border-default)] py-3 space-y-2">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Requested Line Items ({rfq.items.length})</p>
                <div className="flex flex-wrap gap-2">
                  {rfq.items.map((item, idx) => (
                    <span key={idx} className="inline-flex px-2 py-1 bg-[var(--bg-subtle)] border border-[var(--border-strong)] rounded text-xs text-slate-300 font-medium">
                      {item.item_name} ({item.quantity} {item.unit})
                    </span>
                  ))}
                </div>
              </div>

              {/* Info footer */}
              <div className="flex flex-wrap gap-6 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1.5"><Calendar size={14} /> Deadline: <span className="font-semibold text-white">{rfq.deadline}</span></span>
                <span className="flex items-center gap-1.5"><IndianRupee size={14} /> Budget: <span className="font-bold text-white f1-numbers">{"\u20B9"}{rfq.budget_estimate.toLocaleString('en-IN')}</span></span>
                <span className="flex items-center gap-1.5"><Users size={14} /> Invited Bidders: <span className="font-semibold text-white">{rfq.invited_vendors_count || 4} vendors</span></span>
              </div>
            </div>

            {/* Actions button */}
            <div className="md:w-32 flex md:flex-col justify-end md:justify-center gap-2 md:border-l border-[var(--border-default)] pl-0 md:pl-6 pt-4 md:pt-0">
              <button 
                onClick={() => setSelectedRfq(rfq)}
                className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg transition-colors cursor-pointer"
              >
                <Eye size={14} /> Details
              </button>
              <button className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] rounded-lg shadow-sm transition-colors cursor-pointer">
                <FileSpreadsheet size={14} /> Bids
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* RFQ Detail Modal */}
      {selectedRfq && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-[var(--border-default)] flex justify-between items-center bg-[var(--bg-elevated)]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/25 font-mono">
                    {selectedRfq.rfq_number}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Procurement Requisition Matrix</span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1.5 font-display">{selectedRfq.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedRfq(null)}
                className="text-slate-400 hover:text-white text-sm font-semibold p-1 hover:bg-[var(--bg-subtle)] rounded transition-colors"
              >
                ✕ Close
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-300 custom-scrollbar">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[var(--bg-subtle)] border border-[var(--border-default)] p-4 rounded-lg text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Target Budget</span>
                  <span className="font-extrabold text-[var(--accent)] text-lg mt-1 block f1-numbers">{"\u20B9"}{selectedRfq.budget_estimate.toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-[var(--bg-subtle)] border border-[var(--border-default)] p-4 rounded-lg text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Submission Deadline</span>
                  <span className="font-bold text-white text-sm mt-1.5 block">{selectedRfq.deadline}</span>
                </div>
                <div className="bg-[var(--bg-subtle)] border border-[var(--border-default)] p-4 rounded-lg text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">RFQ Status</span>
                  <span className={`inline-block items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider mt-1.5 ${
                    selectedRfq.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                    selectedRfq.status === 'draft' ? 'bg-slate-500/10 text-slate-400 border border-slate-500/25' :
                    'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                  }`}>
                    {selectedRfq.status}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] p-4 rounded-lg">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Requisition Scope & Objective</span>
                <p className="text-xs text-slate-300 leading-relaxed">{selectedRfq.description || 'No detailed scope description provided.'}</p>
              </div>

              {/* Requested items detailed spec table */}
              <div>
                <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-2.5">Detailed Items Specifications</h4>
                <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border-default)] text-slate-400">
                        <th className="p-3 font-semibold">Item Name</th>
                        <th className="p-3 font-semibold text-right">Quantity Required</th>
                        <th className="p-3 font-semibold">Specification details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRfq.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-[var(--border-default)] hover:bg-white/5 last:border-0">
                          <td className="p-3 font-bold text-white">{item.item_name}</td>
                          <td className="p-3 text-right f1-numbers font-medium text-slate-350">{item.quantity} {item.unit}</td>
                          <td className="p-3 text-slate-400 text-[11px]">{item.description || 'Standard industry specifications apply.'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Invited bidders list */}
              <div>
                <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-2">Invited Bidders & Activity</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[var(--bg-subtle)] border border-[var(--border-default)] p-3 rounded-lg flex justify-between items-center">
                    <span className="font-semibold text-slate-300">Apex Tech Solutions</span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded font-mono">BID SUBMITTED</span>
                  </div>
                  <div className="bg-[var(--bg-subtle)] border border-[var(--border-default)] p-3 rounded-lg flex justify-between items-center">
                    <span className="font-semibold text-slate-300">Globex Supply Chain</span>
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded font-mono">DRAFT SAVED</span>
                  </div>
                  <div className="bg-[var(--bg-subtle)] border border-[var(--border-default)] p-3 rounded-lg flex justify-between items-center">
                    <span className="font-semibold text-slate-300">Pioneer Systems</span>
                    <span className="text-[10px] bg-slate-500/10 text-slate-400 border border-slate-500/25 px-2 py-0.5 rounded font-mono">INVITED</span>
                  </div>
                  <div className="bg-[var(--bg-subtle)] border border-[var(--border-default)] p-3 rounded-lg flex justify-between items-center">
                    <span className="font-semibold text-slate-300">Titan Heavy Industries</span>
                    <span className="text-[10px] bg-slate-500/10 text-slate-400 border border-slate-500/25 px-2 py-0.5 rounded font-mono">INVITED</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-[var(--bg-elevated)] border-t border-[var(--border-default)] flex justify-end gap-3">
              <button 
                onClick={() => setSelectedRfq(null)}
                className="px-4 py-2 bg-[var(--bg-subtle)] border border-[var(--border-strong)] rounded-lg text-xs font-semibold hover:bg-[var(--bg-surface)] hover:text-white transition-colors cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
