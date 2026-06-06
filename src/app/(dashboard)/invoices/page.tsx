'use client'

import { useState } from 'react'
import { 
  Receipt, 
  Search, 
  Filter, 
  Calendar, 
  IndianRupee, 
  Eye, 
  CheckCircle2, 
  AlertCircle,
  FileText
} from 'lucide-react'

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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const handleMarkAsPaid = (id: string) => {
    setInvoices(invoices.map(inv => {
      if (inv.id === id) {
        return { 
          ...inv, 
          status: 'paid' as const,
          paid_at: new Date().toISOString().split('T')[0]
        }
      }
      return inv
    }))
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Vendor Invoices</h2>
          <p className="text-slate-500 text-sm mt-1">Verify billing line items, GST splits (CGST/SGST/IGST), and process payments.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        <div className="relative w-full md:w-96 group">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </span>
          <input
            type="text"
            placeholder="Search invoice number, PO, vendor..."
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
              <option value="all">All Invoices</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredInvoices.map((inv) => (
          <div key={inv.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono">
                      {inv.invoice_number}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">PO: {inv.po_ref}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg leading-tight mt-1.5">{inv.vendor_name}</h4>
                  {inv.notes && <p className="text-xs text-slate-400 mt-1">{inv.notes}</p>}
                </div>

                {/* Status */}
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                  inv.status === 'sent' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                  'bg-rose-50 text-rose-700 border border-rose-100'
                }`}>
                  {inv.status === 'paid' && <CheckCircle2 size={12} />}
                  {inv.status === 'overdue' && <AlertCircle size={12} />}
                  <span className="capitalize">{inv.status}</span>
                </span>
              </div>

              {/* Tax Breakdowns Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50/50 border border-slate-100 rounded-lg p-3 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[9px]">Subtotal</span>
                  <span className="font-bold text-slate-700 block mt-0.5">₹{inv.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[9px]">CGST / SGST</span>
                  <span className="font-medium text-slate-700 block mt-0.5">
                    ₹{inv.cgst_amount.toLocaleString('en-IN')} / ₹{inv.sgst_amount.toLocaleString('en-IN')}
                  </span>
                </div>
                {inv.igst_amount > 0 && (
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[9px]">IGST</span>
                    <span className="font-medium text-slate-700 block mt-0.5">₹{inv.igst_amount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[9px]">Total Tax</span>
                  <span className="font-medium text-slate-700 block mt-0.5">₹{inv.total_tax.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Info footer */}
              <div className="flex flex-wrap gap-6 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1.5"><Calendar size={14} /> Due Date: <span className="font-semibold text-slate-700">{inv.due_date}</span></span>
                {inv.paid_at && (
                  <span className="flex items-center gap-1.5 text-emerald-600"><CheckCircle2 size={14} /> Paid on: <span className="font-semibold">{inv.paid_at}</span></span>
                )}
              </div>
            </div>

            {/* Valuation and Mark paid */}
            <div className="md:w-48 flex flex-row md:flex-col justify-between md:justify-center items-center md:items-stretch pl-0 md:pl-6 md:border-l border-slate-100 gap-4">
              <div className="text-left md:text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Invoice Total</span>
                <span className="font-extrabold text-slate-800 text-xl block mt-0.5">₹{inv.total_amount.toLocaleString('en-IN')}</span>
              </div>

              {inv.status === 'sent' ? (
                <button
                  onClick={() => handleMarkAsPaid(inv.id)}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
                >
                  Mark Paid
                </button>
              ) : (
                <button className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-indigo-650 hover:bg-indigo-50/20 border border-slate-200 rounded-lg transition-colors cursor-pointer">
                  <Eye size={14} /> View Details
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
