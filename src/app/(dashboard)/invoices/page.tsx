'use client'

import { useState, useEffect } from 'react'
import { 
  Receipt, 
  Search, 
  Filter, 
  Calendar, 
  IndianRupee, 
  Eye, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Database,
  Loader2
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useSearchStore } from '@/stores/useSearchStore'

interface Invoice {
  id: string
  invoice_number: string
  po_ref: string
  vendor_name: string
  status: 'sent' | 'paid' | 'overdue' | 'cancelled'
  subtotal: number
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  total_tax: number
  total_amount: number
  due_date: string
  paid_at?: string
  notes?: string
}

const initialInvoices: Invoice[] = [
  {
    id: '1',
    invoice_number: 'INV-2026-00012',
    po_ref: 'PO-2026-00009',
    vendor_name: 'Apex Tech Solutions',
    status: 'sent',
    subtotal: 690000,
    cgst_amount: 62100, // 9%
    sgst_amount: 62100, // 9%
    igst_amount: 0,
    total_tax: 124200,
    total_amount: 814200,
    due_date: '2026-07-06',
    notes: 'Billing for Rack Server systems supply.'
  },
  {
    id: '2',
    invoice_number: 'INV-2026-00010',
    po_ref: 'PO-2026-00008',
    vendor_name: 'Superior Office Supplies',
    status: 'paid',
    subtotal: 280000,
    cgst_amount: 25200, // 9%
    sgst_amount: 25200, // 9%
    igst_amount: 0,
    total_tax: 50400,
    total_amount: 330400,
    due_date: '2026-06-15',
    paid_at: '2026-06-04',
    notes: 'Chairs delivery invoice.'
  }
]

const supabase = createClient()

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const { searchTerm, setSearchTerm, clearSearch } = useSearchStore()
  
  useEffect(() => {
    return () => clearSearch()
  }, [clearSearch])

  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  
  const [isDbMode, setIsDbMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  useEffect(() => {
    async function loadInvoices() {
      try {
        const { data: dbInvs, error } = await supabase
          .from('invoices')
          .select(`
            id,
            invoice_number,
            status,
            subtotal,
            cgst_amount,
            sgst_amount,
            igst_amount,
            total_tax,
            total_amount,
            due_date,
            paid_at,
            notes,
            vendor:vendors(company_name),
            po:purchase_orders(po_number)
          `)
          .order('created_at', { ascending: false })

        if (error) throw error

        if (dbInvs && dbInvs.length > 0) {
          const formatted: Invoice[] = dbInvs.map((item: any) => ({
            id: item.id,
            invoice_number: item.invoice_number,
            po_ref: (item.po as any)?.po_number || 'PO-Manual',
            vendor_name: (item.vendor as any)?.company_name || 'Unknown Vendor',
            status: item.status as any,
            subtotal: Number(item.subtotal),
            cgst_amount: Number(item.cgst_amount),
            sgst_amount: Number(item.sgst_amount),
            igst_amount: Number(item.igst_amount),
            total_tax: Number(item.total_tax),
            total_amount: Number(item.total_amount),
            due_date: item.due_date ? item.due_date.split('T')[0] : 'N/A',
            paid_at: item.paid_at ? item.paid_at.split('T')[0] : undefined,
            notes: item.notes || undefined
          }))
          setInvoices(formatted)
          setIsDbMode(true)
        } else {
          // Fallback to local storage or initial values
          const localInvs = JSON.parse(localStorage.getItem('vb_invoices_mock') || '[]')
          setInvoices([...localInvs, ...initialInvoices])
          setIsDbMode(false)
        }
      } catch (err) {
        const localInvs = JSON.parse(localStorage.getItem('vb_invoices_mock') || '[]')
        setInvoices([...localInvs, ...initialInvoices])
        setIsDbMode(false)
      } finally {
        setLoading(false)
      }
    }
    loadInvoices()
  }, [])

  const handleMarkAsPaid = async (id: string) => {
    setActionLoadingId(id)
    const paidDate = new Date().toISOString().split('T')[0]

    try {
      if (isDbMode && !id.startsWith('mock-')) {
        const { error } = await supabase
          .from('invoices')
          .update({ 
            status: 'paid',
            paid_at: new Date().toISOString()
          })
          .eq('id', id)

        if (error) throw error

        setInvoices(invoices.map(inv => {
          if (inv.id === id) {
            return { 
              ...inv, 
              status: 'paid' as const,
              paid_at: paidDate
            }
          }
          return inv
        }))
      } else {
        // Mock fallback Mode
        const updated = invoices.map(inv => {
          if (inv.id === id) {
            return { 
              ...inv, 
              status: 'paid' as const,
              paid_at: paidDate
            }
          }
          return inv
        })
        setInvoices(updated)
        // Separate out mock and initial items for localStorage
        const onlyMocks = updated.filter(item => item.id.startsWith('mock-'))
        localStorage.setItem('vb_invoices_mock', JSON.stringify(onlyMocks))
      }
    } catch (err) {
      alert('Failed to mark invoice as paid.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const filteredInvoices = invoices.filter((i) => {
    const matchesSearch = i.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          i.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          i.po_ref.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* DB Connection Alert */}
      {!isDbMode && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl p-4 flex items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-2.5">
            <Database size={18} className="shrink-0 text-amber-400" />
            <p className="leading-relaxed">
              <strong>Running in Demo Mode:</strong> Showing local mock invoices. Deploy your database schema script `schema.sql` in Supabase to sync live vendor invoices.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight font-display">Vendor Invoices</h2>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Verify billing line items, GST splits (CGST/SGST/IGST), and process payments.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[var(--bg-surface)] border border-[var(--border-default)] p-4 rounded-xl shadow-sm">
        <div className="relative w-full md:w-96 group">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors" />
          </span>
          <input
            type="text"
            placeholder="Search invoice number, PO, vendor..."
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
              <option value="all" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">All Invoices</option>
              <option value="sent" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Sent</option>
              <option value="paid" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Paid</option>
              <option value="overdue" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Overdue</option>
              <option value="cancelled" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={32} className="text-[var(--accent)] animate-spin" />
          <span className="text-xs text-[var(--text-secondary)] font-semibold">Loading invoices list...</span>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-12 text-center shadow-sm">
          <Receipt size={36} className="text-[var(--text-muted)] mx-auto mb-3" />
          <h4 className="font-bold text-[var(--text-primary)] text-sm">No Invoices Found</h4>
          <p className="text-[var(--text-secondary)] text-xs mt-1.5 max-w-sm mx-auto">
            There are no invoices matching your filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredInvoices.map((inv) => (
            <div key={inv.id} className="card card-hover flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[var(--text-secondary)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded border border-[var(--border-default)] font-mono">
                        {inv.invoice_number}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] font-mono">PO: {inv.po_ref}</span>
                    </div>
                    <h4 className="font-bold text-[var(--text-primary)] text-lg leading-tight mt-1.5">{inv.vendor_name}</h4>
                    {inv.notes && <p className="text-xs text-[var(--text-secondary)] mt-1">{inv.notes}</p>}
                  </div>

                  {/* Status */}
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                    inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                    inv.status === 'sent' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/25' :
                    'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                  }`}>
                    {inv.status === 'paid' && <CheckCircle2 size={12} />}
                    {inv.status === 'overdue' && <AlertCircle size={12} />}
                    <span className="capitalize">{inv.status}</span>
                  </span>
                </div>

                {/* Tax Breakdowns Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg p-3 text-xs">
                  <div>
                    <span className="text-[var(--text-muted)] font-semibold block uppercase tracking-wider text-[9px]">Subtotal</span>
                    <span className="font-bold text-[var(--text-primary)] block mt-0.5 f1-numbers">{"\u20B9"}{inv.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] font-semibold block uppercase tracking-wider text-[9px]">CGST / SGST</span>
                    <span className="font-medium text-[var(--text-primary)] block mt-0.5 f1-numbers text-[11px]">
                      {"\u20B9"}{inv.cgst_amount.toLocaleString('en-IN')} / {"\u20B9"}{inv.sgst_amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {inv.igst_amount > 0 && (
                    <div>
                      <span className="text-[var(--text-muted)] font-semibold block uppercase tracking-wider text-[9px]">IGST</span>
                      <span className="font-medium text-[var(--text-primary)] block mt-0.5 f1-numbers">{"\u20B9"}{inv.igst_amount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-[var(--text-muted)] font-semibold block uppercase tracking-wider text-[9px]">Total Tax</span>
                    <span className="font-medium text-[var(--text-primary)] block mt-0.5 f1-numbers">{"\u20B9"}{inv.total_tax.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Info footer */}
                <div className="flex flex-wrap gap-6 text-xs text-[var(--text-secondary)] pt-1">
                  <span className="flex items-center gap-1.5"><Calendar size={14} /> Due Date: <span className="font-semibold text-[var(--text-primary)]">{inv.due_date}</span></span>
                  {inv.paid_at && (
                    <span className="flex items-center gap-1.5 text-emerald-400"><CheckCircle2 size={14} /> Paid on: <span className="font-semibold">{inv.paid_at}</span></span>
                  )}
                </div>
              </div>

              {/* Valuation and Mark paid */}
              <div className="md:w-48 flex flex-col justify-center items-stretch pl-0 md:pl-6 md:border-l border-[var(--border-default)] gap-3 w-full md:w-auto">
                <div className="text-left md:text-center">
                  <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider block">Invoice Total</span>
                  <span className="font-extrabold text-[var(--text-primary)] text-xl block mt-0.5 f1-numbers">{"\u20B9"}{inv.total_amount.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex flex-col gap-2 w-full">
                  <button 
                    onClick={() => setSelectedInvoice(inv)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg transition-colors cursor-pointer"
                  >
                    <Eye size={14} /> View Details
                  </button>

                  {inv.status === 'sent' && (
                    <button
                      onClick={() => handleMarkAsPaid(inv.id)}
                      disabled={actionLoadingId === inv.id}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] rounded-lg shadow-sm transition-all cursor-pointer"
                    >
                      {actionLoadingId === inv.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        'Mark Paid'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-[var(--border-default)] flex justify-between items-center bg-[var(--bg-elevated)]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded border border-[var(--border-default)] font-mono">
                    {selectedInvoice.invoice_number}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] font-mono">PO Ref: {selectedInvoice.po_ref}</span>
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mt-1.5 font-display">Invoice Details</h3>
              </div>
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-semibold p-1 hover:bg-[var(--bg-subtle)] rounded transition-colors"
              >
                ✕ Close
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-[var(--text-secondary)] custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[var(--bg-subtle)] border border-[var(--border-default)] p-4 rounded-lg">
                  <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider block">Vendor Details</span>
                  <h4 className="font-bold text-[var(--text-primary)] text-base mt-1">{selectedInvoice.vendor_name}</h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">IFSC: HDFC0000124 | A/C: ••••••••••••5024</p>
                  <p className="text-xs text-[var(--text-secondary)]">GSTIN: 27AABCA1234A1Z5</p>
                </div>
                <div className="bg-[var(--bg-subtle)] border border-[var(--border-default)] p-4 rounded-lg flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider block">Billing Status</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider mt-1.5 ${
                      selectedInvoice.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                      selectedInvoice.status === 'sent' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/25' :
                      'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                    }`}>
                      {selectedInvoice.status}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] mt-2">
                    <p>Due Date: {selectedInvoice.due_date}</p>
                    {selectedInvoice.paid_at && <p className="text-emerald-400">Paid On: {selectedInvoice.paid_at}</p>}
                  </div>
                </div>
              </div>

              {/* Items list */}
              <div>
                <h4 className="font-bold text-[var(--text-primary)] text-xs uppercase tracking-wider mb-2.5">Invoiced Line Items</h4>
                <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border-default)] text-[var(--text-muted)]">
                        <th className="p-3 font-semibold">Item & Details</th>
                        <th className="p-3 font-semibold text-right">Quantity</th>
                        <th className="p-3 font-semibold text-right">Unit Price</th>
                        <th className="p-3 font-semibold text-right">Total Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.invoice_number.includes('00012') ? (
                        <tr className="border-b border-[var(--border-default)] hover:bg-[var(--bg-subtle)] last:border-0">
                          <td className="p-3">
                            <p className="font-bold text-[var(--text-primary)]">Rack Server 2U</p>
                            <span className="text-[10px] text-[var(--text-muted)]">Xeon Silver, 64GB RAM, 2TB SSD</span>
                          </td>
                          <td className="p-3 text-right text-[var(--text-secondary)]">8 Units</td>
                          <td className="p-3 text-right f1-numbers text-[var(--text-secondary)]">{"\u20B9"}3,43,750</td>
                          <td className="p-3 text-right f1-numbers font-bold text-[var(--text-primary)]">{"\u20B9"}27,50,000</td>
                        </tr>
                      ) : selectedInvoice.invoice_number.includes('00010') ? (
                        <tr className="border-b border-[var(--border-default)] hover:bg-[var(--bg-subtle)] last:border-0">
                          <td className="p-3">
                            <p className="font-bold text-[var(--text-primary)]">Ergonomic Mesh Chair</p>
                            <span className="text-[10px] text-[var(--text-muted)]">High back, lumbar support</span>
                          </td>
                          <td className="p-3 text-right text-[var(--text-secondary)]">80 Units</td>
                          <td className="p-3 text-right f1-numbers text-[var(--text-secondary)]">{"\u20B9"}3,500</td>
                          <td className="p-3 text-right f1-numbers font-bold text-[var(--text-primary)]">{"\u20B9"}2,80,000</td>
                        </tr>
                      ) : (
                        <tr className="border-b border-[var(--border-default)] hover:bg-[var(--bg-subtle)] last:border-0">
                          <td className="p-3">
                            <p className="font-bold text-[var(--text-primary)]">Steel Plate 12mm & Reinforcement Bars</p>
                            <span className="text-[10px] text-[var(--text-muted)]">Grade Fe500 structural steel construction supplies</span>
                          </td>
                          <td className="p-3 text-right text-[var(--text-secondary)]">Bulk Lot</td>
                          <td className="p-3 text-right f1-numbers text-[var(--text-secondary)]">{"\u20B9"}{selectedInvoice.subtotal.toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right f1-numbers font-bold text-[var(--text-primary)]">{"\u20B9"}{selectedInvoice.subtotal.toLocaleString('en-IN')}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tax Splits */}
              <div className="bg-[var(--bg-subtle)] border border-[var(--border-default)] p-4 rounded-lg space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)] font-medium">Subtotal</span>
                  <span className="font-semibold text-[var(--text-primary)] f1-numbers">{"\u20B9"}{selectedInvoice.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)] font-medium">CGST (9%)</span>
                  <span className="font-semibold text-[var(--text-primary)] f1-numbers">{"\u20B9"}{selectedInvoice.cgst_amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)] font-medium">SGST (9%)</span>
                  <span className="font-semibold text-[var(--text-primary)] f1-numbers">{"\u20B9"}{selectedInvoice.sgst_amount.toLocaleString('en-IN')}</span>
                </div>
                {selectedInvoice.igst_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)] font-medium">IGST (18%)</span>
                    <span className="font-semibold text-[var(--text-primary)] f1-numbers">{"\u20B9"}{selectedInvoice.igst_amount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="h-px bg-[var(--border-default)] my-1.5" />
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-primary)] font-bold">Total Invoiced Amount</span>
                  <span className="font-extrabold text-[var(--accent)] f1-numbers">{"\u20B9"}{selectedInvoice.total_amount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-[var(--bg-elevated)] border-t border-[var(--border-default)] flex justify-between gap-3 items-center">
              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                {selectedInvoice.status === 'paid' ? 'TXN-8761254921 Verified' : 'Awaiting Settlement'}
              </span>
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 bg-[var(--bg-subtle)] border border-[var(--border-strong)] rounded-lg text-xs font-semibold hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
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


