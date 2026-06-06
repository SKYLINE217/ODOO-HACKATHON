'use client'

import { useState, useEffect } from 'react'
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Calendar, 
  IndianRupee, 
  Download, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Truck,
  Database,
  Loader2
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useSearchStore } from '@/stores/useSearchStore'

interface PurchaseOrder {
  id: string
  po_number: string
  quotation_ref: string
  vendor_name: string
  status: 'draft' | 'issued' | 'acknowledged' | 'fulfilled' | 'cancelled'
  subtotal: number
  tax_amount: number
  total_amount: number
  delivery_date: string
  issued_at: string
}

const initialPos: PurchaseOrder[] = [
  {
    id: '1',
    po_number: 'PO-2026-00009',
    quotation_ref: 'QUO-2026-00017',
    vendor_name: 'Apex Tech Solutions',
    status: 'issued',
    subtotal: 690000,
    tax_amount: 124200,
    total_amount: 814200,
    delivery_date: '2026-06-20',
    issued_at: '2026-06-06'
  },
  {
    id: '2',
    po_number: 'PO-2026-00008',
    quotation_ref: 'QUO-2026-00014',
    vendor_name: 'Superior Office Supplies',
    status: 'fulfilled',
    subtotal: 280000,
    tax_amount: 50400,
    total_amount: 330400,
    delivery_date: '2026-06-04',
    issued_at: '2026-05-28'
  }
]

const supabase = createClient()

export default function PurchaseOrdersPage() {
  const [pos, setPos] = useState<PurchaseOrder[]>([])
  const { searchTerm, setSearchTerm, clearSearch } = useSearchStore()
  
  useEffect(() => {
    return () => clearSearch()
  }, [clearSearch])

  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null)
  
  const [isDbMode, setIsDbMode] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPurchaseOrders() {
      try {
        const { data: dbPos, error } = await supabase
          .from('purchase_orders')
          .select(`
            id,
            po_number,
            status,
            subtotal,
            tax_amount,
            total_amount,
            delivery_date,
            issued_at,
            vendor:vendors(company_name),
            quotation:quotations(quotation_number)
          `)
          .order('issued_at', { ascending: false })

        if (error) throw error

        if (dbPos && dbPos.length > 0) {
          const formatted: PurchaseOrder[] = dbPos.map((item: any) => ({
            id: item.id,
            po_number: item.po_number,
            quotation_ref: (item.quotation as any)?.quotation_number || 'QUO-Manual',
            vendor_name: (item.vendor as any)?.company_name || 'Unknown Vendor',
            status: item.status as any,
            subtotal: Number(item.subtotal),
            tax_amount: Number(item.tax_amount),
            total_amount: Number(item.total_amount),
            delivery_date: item.delivery_date ? item.delivery_date.split('T')[0] : 'N/A',
            issued_at: item.issued_at ? item.issued_at.split('T')[0] : 'N/A'
          }))
          setPos(formatted)
          setIsDbMode(true)
        } else {
          // Fallback to local storage or initial values
          const localPos = JSON.parse(localStorage.getItem('vb_purchase_orders_mock') || '[]')
          setPos([...localPos, ...initialPos])
          setIsDbMode(false)
        }
      } catch (err) {
        const localPos = JSON.parse(localStorage.getItem('vb_purchase_orders_mock') || '[]')
        setPos([...localPos, ...initialPos])
        setIsDbMode(false)
      } finally {
        setLoading(false)
      }
    }
    loadPurchaseOrders()
  }, [])

  const filteredPos = pos.filter((p) => {
    const matchesSearch = p.po_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.quotation_ref.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
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
              <strong>Running in Demo Mode:</strong> Showing local mock purchase orders. Award contracts on the Quotations page or configure your Supabase schema to enable real database PO persistence.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight font-display">Purchase Orders (POs)</h2>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Track issued POs, confirm vendor acknowledgements, and manage deliveries.</p>
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
            placeholder="Search PO number, vendor..."
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
              <option value="all" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">All POs</option>
              <option value="draft" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Draft</option>
              <option value="issued" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Issued</option>
              <option value="acknowledged" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Acknowledged</option>
              <option value="fulfilled" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Fulfilled</option>
              <option value="cancelled" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={32} className="text-[var(--accent)] animate-spin" />
          <span className="text-xs text-[var(--text-secondary)] font-semibold">Loading purchase orders...</span>
        </div>
      ) : filteredPos.length === 0 ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-12 text-center shadow-sm">
          <ShoppingBag size={36} className="text-[var(--text-muted)] mx-auto mb-3" />
          <h4 className="font-bold text-[var(--text-primary)] text-sm">No Purchase Orders Found</h4>
          <p className="text-[var(--text-secondary)] text-xs mt-1.5 max-w-sm mx-auto">
            There are no purchase orders matching your search or filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredPos.map((po) => (
            <div key={po.id} className="card card-hover flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/25 font-mono">
                        {po.po_number}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] font-medium font-mono">Quote: {po.quotation_ref}</span>
                    </div>
                    <h4 className="font-bold text-[var(--text-primary)] text-lg leading-tight mt-1.5">{po.vendor_name}</h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">Issued on {po.issued_at}</p>
                  </div>

                  {/* Status */}
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                    po.status === 'fulfilled' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                    po.status === 'issued' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25' :
                    po.status === 'acknowledged' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/25' :
                    'bg-slate-500/10 text-[var(--text-secondary)] border border-slate-500/25'
                  }`}>
                    {po.status === 'fulfilled' && <CheckCircle2 size={12} />}
                    {po.status === 'issued' && <Truck size={12} />}
                    {po.status === 'acknowledged' && <Clock size={12} />}
                    <span className="capitalize">{po.status}</span>
                  </span>
                </div>

                {/* Info footer */}
                <div className="flex flex-wrap gap-6 text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border-default)]">
                  <span className="flex items-center gap-1.5"><Calendar size={14} /> Expected Delivery: <span className="font-semibold text-[var(--text-primary)]">{po.delivery_date}</span></span>
                  <span className="flex items-center gap-1.5"><IndianRupee size={14} /> Total Value: <span className="font-bold text-[var(--text-primary)] f1-numbers">{"\u20B9"}{po.total_amount.toLocaleString('en-IN')}</span></span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="md:w-32 flex md:flex-col justify-end md:justify-center gap-2 md:border-l border-[var(--border-default)] pl-0 md:pl-6 pt-4 md:pt-0">
                <button 
                  onClick={() => setSelectedPo(po)}
                  className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg transition-colors cursor-pointer"
                >
                  View
                </button>
                <button className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] rounded-lg shadow-sm transition-colors cursor-pointer">
                  <Download size={14} /> PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedPo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-[var(--border-default)] flex justify-between items-center bg-[var(--bg-elevated)]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/25 font-mono">
                    {selectedPo.po_number}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)] font-mono">Quote: {selectedPo.quotation_ref}</span>
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mt-1.5 font-display">Purchase Order Details</h3>
              </div>
              <button 
                onClick={() => setSelectedPo(null)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-semibold p-1 hover:bg-[var(--bg-subtle)] rounded transition-colors"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-[var(--text-secondary)] custom-scrollbar">
              {/* Vendor & Status block */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[var(--bg-subtle)] border border-[var(--border-default)] p-4 rounded-lg">
                  <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider block">Vendor Details</span>
                  <h4 className="font-bold text-[var(--text-primary)] text-base mt-1">{selectedPo.vendor_name}</h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Payment Terms: Net 30 Days</p>
                  <p className="text-xs text-[var(--text-secondary)]">Shipping: Main Warehouse, Gate 3, Sector 4, Bangalore</p>
                </div>
                <div className="bg-[var(--bg-subtle)] border border-[var(--border-default)] p-4 rounded-lg flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider block">PO Status</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider mt-1.5 ${
                      selectedPo.status === 'fulfilled' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                      selectedPo.status === 'issued' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25' :
                      selectedPo.status === 'acknowledged' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/25' :
                      'bg-slate-500/10 text-[var(--text-secondary)] border border-slate-500/25'
                    }`}>
                      {selectedPo.status}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">Issued Date: {selectedPo.issued_at || '2026-06-06'}</p>
                </div>
              </div>              {/* Items Table */}
              <div>
                <h4 className="font-bold text-[var(--text-primary)] text-xs uppercase tracking-wider mb-2.5">Line Items Breakdown</h4>
                <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border-default)] text-[var(--text-muted)]">
                        <th className="p-3 font-semibold">Item & Description</th>
                        <th className="p-3 font-semibold text-right">Quantity</th>
                        <th className="p-3 font-semibold text-right">Unit Price</th>
                        <th className="p-3 font-semibold text-right">Total Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Dynamically display dummy items based on PO total / category */}
                      {selectedPo.po_number.includes('00009') || selectedPo.quotation_ref.includes('00017') ? (
                        <>
                          <tr className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-subtle)]">
                            <td className="p-3">
                              <p className="font-bold text-[var(--text-primary)]">Rack Server 2U</p>
                              <span className="text-[10px] text-[var(--text-muted)]">Xeon Silver, 64GB RAM, 2TB SSD</span>
                            </td>
                            <td className="p-3 text-right text-[var(--text-secondary)]">8 Units</td>
                            <td className="p-3 text-right f1-numbers text-[var(--text-secondary)]">{"\u20B9"}3,43,750</td>
                            <td className="p-3 text-right f1-numbers font-bold text-[var(--text-primary)]">{"\u20B9"}27,50,000</td>
                          </tr>
                        </>
                      ) : (
                        <>
                          <tr className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-subtle)]">
                            <td className="p-3">
                              <p className="font-bold text-[var(--text-primary)]">Heavy Steel Plate 12mm</p>
                              <span className="text-[10px] text-[var(--text-muted)]">Grade Fe500 structural steel</span>
                            </td>
                            <td className="p-3 text-right text-[var(--text-secondary)]">45 Tons</td>
                            <td className="p-3 text-right f1-numbers text-[var(--text-secondary)]">{"\u20B9"}80,000</td>
                            <td className="p-3 text-right f1-numbers font-bold text-[var(--text-primary)]">{"\u20B9"}36,0,000</td>
                          </tr>
                          <tr className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-subtle)]">
                            <td className="p-3">
                              <p className="font-bold text-[var(--text-primary)]">Reinforcement Bars (16mm)</p>
                              <span className="text-[10px] text-[var(--text-muted)]">Corrosion resistant steel bars</span>
                            </td>
                            <td className="p-3 text-right text-[var(--text-secondary)]">100 Units</td>
                            <td className="p-3 text-right f1-numbers text-[var(--text-secondary)]">{"\u20B9"}5,000</td>
                            <td className="p-3 text-right f1-numbers font-bold text-[var(--text-primary)]">{"\u20B9"}5,00,000</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Breakdowns */}
              <div className="bg-[var(--bg-subtle)] border border-[var(--border-default)] p-4 rounded-lg space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)] font-medium">Subtotal</span>
                  <span className="font-semibold text-[var(--text-primary)] f1-numbers">{"\u20B9"}{selectedPo.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)] font-medium">CGST / SGST (9% each) or IGST (18%)</span>
                  <span className="font-semibold text-[var(--text-primary)] f1-numbers">{"\u20B9"}{selectedPo.tax_amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="h-px bg-[var(--border-default)] my-1.5" />
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-primary)] font-bold">Grand Total (INR)</span>
                  <span className="font-extrabold text-[var(--accent)] f1-numbers">{"\u20B9"}{selectedPo.total_amount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Expected Delivery Alert */}
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg p-3 text-xs flex items-center justify-between">
                <span>⚠️ Expected Delivery is scheduled before <strong>{selectedPo.delivery_date}</strong>.</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[var(--bg-elevated)] border-t border-[var(--border-default)] flex justify-end gap-3">
              <button 
                onClick={() => setSelectedPo(null)}
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


