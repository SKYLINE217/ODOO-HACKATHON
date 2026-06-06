'use client'

import { useState, useEffect } from 'react'
import { 
  Check, 
  X, 
  Eye, 
  FileText, 
  AlertCircle,
  FileSpreadsheet, 
  ShieldAlert,
  ArrowUpRight,
  Database,
  Loader2
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

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
    entity_number: 'INV-2026-00012',
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

const supabase = createClient()

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([])
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null)
  const [isDbMode, setIsDbMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    async function loadApprovals() {
      try {
        const { data: dbApps, error } = await supabase
          .from('approvals')
          .select(`
            id,
            status,
            remarks,
            requested_at,
            quotation:quotations(
              quotation_number,
              total_amount,
              rfq:rfqs(title)
            ),
            requester:profiles!approvals_requested_by_fkey(full_name, role)
          `)
          .order('requested_at', { ascending: false })

        if (error) throw error

        if (dbApps && dbApps.length > 0) {
          const formatted: ApprovalRequest[] = dbApps.map((item: any) => {
            const requesterName = (item.requester as any)?.full_name || 'System User'
            const requesterRole = (item.requester as any)?.role ? ` (${(item.requester as any).role.replace('_', ' ')})` : ''
            
            return {
              id: item.id,
              entity_type: 'quotation', // Linked to quotations
              entity_number: (item.quotation as any)?.quotation_number || 'QUO-Manual',
              title: `Approve quotation for: ${(item.quotation as any)?.rfq?.title || 'Procurement Proposal'}`,
              requester: requesterName + requesterRole,
              amount: Number((item.quotation as any)?.total_amount || 0),
              status: item.status as any,
              date_requested: item.requested_at ? item.requested_at.split('T')[0] : 'N/A',
              remarks: item.remarks || undefined
            }
          })
          setApprovals(formatted)
          setIsDbMode(true)
        } else {
          // Fallback to local storage or initial values
          const localApps = JSON.parse(localStorage.getItem('vb_approvals_mock') || '[]')
          setApprovals([...localApps, ...initialApprovals])
          setIsDbMode(false)
        }
      } catch (err) {
        const localApps = JSON.parse(localStorage.getItem('vb_approvals_mock') || '[]')
        setApprovals([...localApps, ...initialApprovals])
        setIsDbMode(false)
      } finally {
        setLoading(false)
      }
    }
    loadApprovals()
  }, [])

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    setActionLoadingId(id)

    try {
      if (isDbMode && !id.startsWith('mock-') && id.length > 1) {
        const { error } = await supabase
          .from('approvals')
          .update({ 
            status: action,
            actioned_at: new Date().toISOString()
          })
          .eq('id', id)

        if (error) throw error

        setApprovals(approvals.map(app => {
          if (app.id === id) {
            return { ...app, status: action }
          }
          return app
        }))
      } else {
        // Mock fallback Mode
        const updated = approvals.map(app => {
          if (app.id === id) {
            return { ...app, status: action }
          }
          return app
        })
        setApprovals(updated)
        // Store only the mock/altered items in localstorage
        const onlyMocks = updated.filter(item => item.id.startsWith('mock-') || item.id.length === 1)
        localStorage.setItem('vb_approvals_mock', JSON.stringify(onlyMocks))
      }
    } catch (err: any) {
      setActionError(err?.message || 'Failed to submit approval action. Please try again.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const pendingCount = approvals.filter(a => a.status === 'pending').length

  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* Action Error Toast */}
      {actionError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 flex items-center justify-between text-xs font-semibold">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="ml-4 text-rose-400 hover:text-rose-600 font-bold cursor-pointer">✕</button>
        </div>
      )}
      {/* DB Connection Alert */}
      {!isDbMode && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl p-4 flex items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-2.5">
            <Database size={18} className="shrink-0 text-amber-400" />
            <p className="leading-relaxed">
              <strong>Running in Demo Mode:</strong> Showing local mock approval queues. Configure your Supabase schema using <code>schema.sql</code> to stream real-time manager approvals.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight font-display">Approvals Queue</h2>
          <p className="text-slate-400 text-sm mt-1">Review requisition bids, purchase orders, and vendor invoices.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25 self-start sm:self-auto">
          <AlertCircle size={14} /> {pendingCount} Pending Approvals
        </span>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={32} className="text-[var(--accent)] animate-spin" />
          <span className="text-xs text-slate-400 font-semibold">Loading approvals queue...</span>
        </div>
      ) : approvals.length === 0 ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-12 text-center shadow-sm">
          <ShieldAlert size={36} className="text-slate-650 mx-auto mb-3" />
          <h4 className="font-bold text-white text-sm">Approvals Queue Empty</h4>
          <p className="text-slate-400 text-xs mt-1.5 max-w-sm mx-auto">
            There are currently no active approval requests waiting for action.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {approvals.map((req) => (
            <div key={req.id} className="card card-hover flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-4">
                {/* Type Badge & Date */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border capitalize font-mono ${
                      req.entity_type === 'purchase_order' ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400' :
                      req.entity_type === 'invoice' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' :
                      'bg-amber-500/10 border-amber-500/25 text-amber-400'
                    }`}>
                      {req.entity_type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{req.entity_number}</span>
                  </div>
                  
                  {/* Status indicator */}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                    req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                    req.status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25' :
                    'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                  }`}>
                    {req.status}
                  </span>
                </div>

                {/* Title & Requester */}
                <div>
                  <h4 className="font-bold text-white text-base leading-snug">{req.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-normal">
                    Requested by <span className="font-semibold text-slate-200">{req.requester}</span> on {req.date_requested}
                  </p>
                  {req.remarks && (
                    <p className="text-xs text-slate-400 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg p-2.5 mt-3 leading-normal">
                      <span className="font-semibold text-slate-300 block mb-0.5">Requester Notes:</span>
                      {req.remarks}
                    </p>
                  )}
                </div>
              </div>

              {/* Valuation and Quick Action buttons */}
              <div className="md:w-56 flex flex-col justify-center items-stretch pl-0 md:pl-6 md:border-l border-[var(--border-default)] gap-3 w-full md:w-auto">
                <div className="text-left md:text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Requisition Value</span>
                  <span className="font-extrabold text-white text-xl block mt-0.5 f1-numbers">{"\u20B9"}{req.amount.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex flex-col gap-2 w-full font-mono">
                  <button 
                    onClick={() => setSelectedApproval(req)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg transition-colors cursor-pointer"
                  >
                    <Eye size={14} /> Review Details
                  </button>

                  {req.status === 'pending' && (
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => handleAction(req.id, 'rejected')}
                        disabled={actionLoadingId === req.id}
                        className="flex-1 inline-flex items-center justify-center p-1.5 text-rose-400 hover:text-white hover:bg-rose-600 border border-rose-500/20 hover:border-rose-600 rounded-lg transition-all cursor-pointer"
                        title="Reject Request"
                      >
                        {actionLoadingId === req.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <X size={14} />
                        )}
                      </button>
                      <button
                        onClick={() => handleAction(req.id, 'approved')}
                        disabled={actionLoadingId === req.id}
                        className="flex-1 inline-flex items-center justify-center p-1.5 text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] rounded-lg shadow-sm transition-all cursor-pointer"
                        title="Approve Request"
                      >
                        {actionLoadingId === req.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Check size={14} />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review/Approval Detail Modal */}
      {selectedApproval && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-[var(--border-default)] flex justify-between items-center bg-[var(--bg-elevated)]">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border capitalize font-mono ${
                    selectedApproval.entity_type === 'purchase_order' ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400' :
                    selectedApproval.entity_type === 'invoice' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' :
                    'bg-amber-500/10 border-amber-500/25 text-amber-400'
                  }`}>
                    {selectedApproval.entity_type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{selectedApproval.entity_number}</span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1.5 font-display">Approval Verification Matrix</h3>
              </div>
              <button 
                onClick={() => setSelectedApproval(null)}
                className="text-slate-400 hover:text-white text-sm font-semibold p-1 hover:bg-[var(--bg-subtle)] rounded transition-colors"
              >
                ✕ Close
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-300 custom-scrollbar">
              {/* Info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[var(--bg-subtle)] border border-[var(--border-default)] p-4 rounded-lg">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Requester Details</span>
                  <h4 className="font-bold text-white text-sm mt-1">{selectedApproval.requester}</h4>
                  <p className="text-xs text-slate-400 mt-1">Date Requested: {selectedApproval.date_requested}</p>
                </div>
                <div className="bg-[var(--bg-subtle)] border border-[var(--border-default)] p-4 rounded-lg flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Verification Status</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider mt-1.5 ${
                      selectedApproval.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                      selectedApproval.status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25' :
                      'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                    }`}>
                      {selectedApproval.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Title & Remarks */}
              <div className="space-y-2">
                <h4 className="text-white font-bold text-sm">{selectedApproval.title}</h4>
                {selectedApproval.remarks && (
                  <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] p-3 rounded-lg text-xs leading-relaxed">
                    <span className="text-slate-400 font-bold block mb-1">Requisitioner Justification Notes:</span>
                    {selectedApproval.remarks}
                  </div>
                )}
              </div>

              {/* Line items breakdown */}
              <div>
                <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-2.5">Line Items Specifications</h4>
                <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border-default)] text-slate-400">
                        <th className="p-3 font-semibold">Specification</th>
                        <th className="p-3 font-semibold text-right">Quantity</th>
                        <th className="p-3 font-semibold text-right">Est. Unit Price</th>
                        <th className="p-3 font-semibold text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedApproval.entity_number.includes('PO-2026-00009') || selectedApproval.entity_number.includes('INV-2026-00012') ? (
                        <tr className="border-b border-[var(--border-default)] hover:bg-white/5 last:border-0">
                          <td className="p-3">
                            <p className="font-bold text-white">Rack Server 2U Upgrade</p>
                            <span className="text-[10px] text-slate-400">Xeon Silver, 64GB RAM, 2TB SSD</span>
                          </td>
                          <td className="p-3 text-right">8 Units</td>
                          <td className="p-3 text-right f1-numbers">{"\u20B9"}3,43,750</td>
                          <td className="p-3 text-right f1-numbers font-bold text-white">{"\u20B9"}27,50,000</td>
                        </tr>
                      ) : selectedApproval.entity_number.includes('QUO-2026-00018') ? (
                        <>
                          <tr className="border-b border-[var(--border-default)] hover:bg-white/5 last:border-0">
                            <td className="p-3">
                              <p className="font-bold text-white">Ergonomic Mesh Chair</p>
                              <span className="text-[10px] text-slate-400">High back, lumbar support</span>
                            </td>
                            <td className="p-3 text-right">80 Chairs</td>
                            <td className="p-3 text-right f1-numbers">{"\u20B9"}3,500</td>
                            <td className="p-3 text-right f1-numbers font-bold text-white">{"\u20B9"}2,80,000</td>
                          </tr>
                          <tr className="border-b border-[var(--border-default)] hover:bg-white/5 last:border-0">
                            <td className="p-3">
                              <p className="font-bold text-white">Standing Desk</p>
                              <span className="text-[10px] text-slate-400">Dual motor, memory preset</span>
                            </td>
                            <td className="p-3 text-right">10 Units</td>
                            <td className="p-3 text-right f1-numbers">{"\u20B9"}30,000</td>
                            <td className="p-3 text-right f1-numbers font-bold text-white">{"\u20B9"}3,00,000</td>
                          </tr>
                        </>
                      ) : (
                        <tr className="border-b border-[var(--border-default)] hover:bg-white/5 last:border-0">
                          <td className="p-3">
                            <p className="font-bold text-white">General Procurement Requisition Supplies</p>
                            <span className="text-[10px] text-slate-400">Standard operational supplies matching procurement guidelines</span>
                          </td>
                          <td className="p-3 text-right">1 Lot</td>
                          <td className="p-3 text-right f1-numbers">{"\u20B9"}{selectedApproval.amount.toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right f1-numbers font-bold text-white">{"\u20B9"}{selectedApproval.amount.toLocaleString('en-IN')}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Summary */}
              <div className="bg-[var(--bg-subtle)] border border-[var(--border-default)] p-4 rounded-lg flex justify-between items-center text-xs">
                <span className="text-white font-bold text-sm">Total Value to Approve</span>
                <span className="font-extrabold text-[var(--accent)] text-lg f1-numbers">{"\u20B9"}{selectedApproval.amount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-[var(--bg-elevated)] border-t border-[var(--border-default)] flex justify-between gap-3 items-center">
              <div>
                <button 
                  onClick={() => setSelectedApproval(null)}
                  className="px-4 py-2 bg-[var(--bg-subtle)] border border-[var(--border-strong)] rounded-lg text-xs font-semibold hover:bg-[var(--bg-surface)] hover:text-white transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>

              {selectedApproval.status === 'pending' && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      handleAction(selectedApproval.id, 'rejected');
                      setSelectedApproval(null);
                    }}
                    className="px-4 py-2 bg-rose-900/40 hover:bg-rose-900 border border-rose-500/30 rounded-lg text-xs font-semibold text-rose-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Reject Requisition
                  </button>
                  <button 
                    onClick={() => {
                      handleAction(selectedApproval.id, 'approved');
                      setSelectedApproval(null);
                    }}
                    className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] rounded-lg text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer"
                  >
                    Approve & Sign PO
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

