'use client'

import { useState } from 'react'
import { 
  Check, 
  X, 
  Eye, 
  FileText, 
  AlertCircle,
  FileSpreadsheet, 
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react'

interface ApprovalRequest {
  id: string
  entity_type: 'quotation' | 'purchase_order' | 'invoice'
  entity_number: string
  title: string
  requester: string
  amount: number
  status: 'pending' | 'approved' | 'rejected'
  date_requested: string
  remarks?: string
}

const initialApprovals: ApprovalRequest[] = [
  {
    id: '1',
    entity_type: 'purchase_order',
    entity_number: 'PO-2026-00009',
    title: 'Server Hardware procurement approval',
    requester: 'John Doe (Procurement Officer)',
    amount: 814200,
    status: 'pending',
    date_requested: '2026-06-05',
    remarks: 'Pricing finalized after comparison. Budget approved.'
  },
  {
    id: '2',
    entity_type: 'invoice',
    entity_number: 'INV-2026-0012',
    title: 'Consultancy and setup fees',
    requester: 'Sarah Connor (IT Manager)',
    amount: 85000,
    status: 'pending',
    date_requested: '2026-06-06',
    remarks: 'Payment due for installation milestones.'
  },
  {
    id: '3',
    entity_type: 'quotation',
    entity_number: 'QUO-2026-00018',
    title: 'Office Ergonomic Chairs proposal',
    requester: 'Sarah Connor (IT Manager)',
    amount: 320000,
    status: 'approved',
    date_requested: '2026-06-02'
  }
]

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(initialApprovals)

  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    setApprovals(approvals.map(app => {
      if (app.id === id) {
        return { ...app, status: action }
      }
      return app
    }))
  }

  const pendingCount = approvals.filter(a => a.status === 'pending').length

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Approvals Queue</h2>
          <p className="text-slate-500 text-sm mt-1">Review requisition bids, purchase orders, and vendor invoices.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-250 self-start sm:self-auto">
          <AlertCircle size={14} /> {pendingCount} Pending Approvals
        </span>
      </div>

      {/* Grid of Approvals */}
      <div className="grid grid-cols-1 gap-6">
        {approvals.map((req) => (
          <div key={req.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              {/* Type Badge & Date */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border capitalize font-mono ${
                    req.entity_type === 'purchase_order' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' :
                    req.entity_type === 'invoice' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                    'bg-amber-50 border-amber-100 text-amber-700'
                  }`}>
                    {req.entity_type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{req.entity_number}</span>
                </div>
                
                {/* Status indicator */}
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                  req.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                  req.status === 'rejected' ? 'bg-rose-50 text-rose-700' :
                  'bg-amber-50 text-amber-700'
                }`}>
                  {req.status}
                </span>
              </div>

              {/* Title & Requester */}
              <div>
                <h4 className="font-bold text-slate-800 text-base leading-snug">{req.title}</h4>
                <p className="text-xs text-slate-500 mt-1 leading-normal">
                  Requested by <span className="font-semibold text-slate-700">{req.requester}</span> on {req.date_requested}
                </p>
                {req.remarks && (
                  <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg p-2.5 mt-3 leading-normal">
                    <span className="font-semibold text-slate-600 block mb-0.5">Requester Notes:</span>
                    {req.remarks}
                  </p>
                )}
              </div>
            </div>

            {/* Valuation and Quick Action buttons */}
            <div className="md:w-56 flex flex-row md:flex-col justify-between md:justify-center items-center md:items-stretch pl-0 md:pl-6 md:border-l border-slate-100 gap-4">
              <div className="text-left md:text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Requisition Value</span>
                <span className="font-extrabold text-slate-800 text-xl block mt-0.5">₹{req.amount.toLocaleString('en-IN')}</span>
              </div>

              {req.status === 'pending' ? (
                <div className="flex gap-2 w-full md:w-auto">
                  <button
                    onClick={() => handleAction(req.id, 'rejected')}
                    className="flex-1 inline-flex items-center justify-center p-2 text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg transition-colors cursor-pointer"
                    title="Reject Request"
                  >
                    <X size={16} />
                  </button>
                  <button
                    onClick={() => handleAction(req.id, 'approved')}
                    className="flex-1 inline-flex items-center justify-center p-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm hover:shadow transition-colors cursor-pointer"
                    title="Approve Request"
                  >
                    <Check size={16} />
                  </button>
                </div>
              ) : (
                <button className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/20 border border-slate-200 hover:border-indigo-100 rounded-lg transition-colors cursor-pointer">
                  <Eye size={14} /> Review Details
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
