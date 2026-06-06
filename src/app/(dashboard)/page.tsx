'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  FilePlus, UserPlus, CheckSquare, ArrowUpRight, ArrowDownRight,
  TrendingUp, Clock, Activity, CheckCircle2, XCircle, FileText,
  Coins, Loader2, AlertCircle, Package, ReceiptText
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/utils/supabase/client'

const supabase = createClient()

interface KPI {
  title: string
  value: string
  change: string
  isUp: boolean
  subtext: string
  color: 'indigo' | 'amber' | 'emerald' | 'rose'
  icon: React.ElementType
}

interface ActivityItem {
  id: string
  action: string
  description: string
  entity_type: string
  performed_by_name: string
  performed_at: string
}

const ACTION_STYLE: Record<string, string> = {
  CREATE:  'text-indigo-600 bg-indigo-50 border-indigo-100',
  PUBLISH: 'text-violet-600 bg-violet-50 border-violet-100',
  APPROVE: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  REJECT:  'text-rose-600 bg-rose-50 border-rose-100',
  PAY:     'text-green-600 bg-green-50 border-green-100',
  SUBMIT:  'text-amber-600 bg-amber-50 border-amber-100',
  FULFILL: 'text-teal-600 bg-teal-50 border-teal-100',
  SUSPEND: 'text-orange-600 bg-orange-50 border-orange-100',
  RECEIVE: 'text-blue-600 bg-blue-50 border-blue-100',
  ISSUE:   'text-sky-600 bg-sky-50 border-sky-100',
}

function timeAgo(dateStr: string) {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function formatINR(amount: number) {
  return '₹' + amount.toLocaleString('en-IN')
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [kpis, setKpis] = useState<KPI[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([])
  const [recentInvoices, setRecentInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    loadDashboardData()
  }, [user])

  async function loadDashboardData() {
    setLoading(true)
    try {
      // Run all queries in parallel
      const [rfqRes, vendorRes, approvalRes, spendRes, activityRes, invoiceRes] = await Promise.all([
        supabase.from('rfqs').select('id, status').order('created_at', { ascending: false }),
        supabase.from('vendors').select('id, status').order('created_at', { ascending: false }),
        supabase.from('approvals').select(`
          id, status, requested_at,
          quotation:quotations(quotation_number, total_amount, rfq:rfqs(title)),
          requester:profiles!approvals_requested_by_fkey(full_name)
        `).eq('status', 'pending').order('requested_at', { ascending: false }).limit(5),
        supabase.from('invoices').select('total_amount, status').neq('status', 'cancelled'),
        supabase.from('activity_logs').select(`
          id, action, description, entity_type, performed_at,
          performer:profiles!activity_logs_performed_by_fkey(full_name)
        `).order('performed_at', { ascending: false }).limit(12),
        supabase.from('invoices').select(`
          id, invoice_number, status, total_amount, due_date,
          vendor:vendors(company_name)
        `).order('created_at', { ascending: false }).limit(5),
      ])

      // KPI: Active RFQs
      const rfqs = rfqRes.data || []
      const activeRfqs = rfqs.filter(r => r.status === 'published').length
      const draftRfqs = rfqs.filter(r => r.status === 'draft').length

      // KPI: Vendors
      const vendors = vendorRes.data || []
      const activeVendors = vendors.filter(v => v.status === 'active').length
      const pendingVendors = vendors.filter(v => v.status === 'pending').length

      // KPI: Pending approvals
      const approvalCount = approvalRes.data?.length || 0

      // KPI: Total spend (paid invoices)
      const invoices = spendRes.data || []
      const totalSpend = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (Number(i.total_amount) || 0), 0)
      const totalCommitted = invoices.reduce((s, i) => s + (Number(i.total_amount) || 0), 0)

      setKpis([
        {
          title: 'Active RFQs',
          value: String(activeRfqs),
          change: `${draftRfqs} in draft`,
          isUp: activeRfqs > 0,
          subtext: `${rfqs.length} total this cycle`,
          color: 'indigo',
          icon: FilePlus
        },
        {
          title: 'Pending Approvals',
          value: String(approvalCount),
          change: approvalCount > 2 ? 'Urgent' : 'On track',
          isUp: false,
          subtext: 'Requires action',
          color: 'amber',
          icon: CheckSquare
        },
        {
          title: 'Active Vendors',
          value: String(activeVendors),
          change: `+${pendingVendors} pending`,
          isUp: true,
          subtext: `${vendors.length} registered total`,
          color: 'emerald',
          icon: UserPlus
        },
        {
          title: 'Total Spend (Paid)',
          value: formatINR(totalSpend),
          change: `${formatINR(totalCommitted)} committed`,
          isUp: true,
          subtext: 'Including all taxes',
          color: 'rose',
          icon: Coins
        }
      ])

      // Activity feed
      const acts = (activityRes.data || []).map((a: any) => ({
        id: a.id,
        action: a.action,
        description: a.description,
        entity_type: a.entity_type,
        performed_by_name: a.performer?.full_name || 'System',
        performed_at: a.performed_at,
      }))
      setActivities(acts)

      // Pending approvals detail
      setPendingApprovals(approvalRes.data || [])

      // Recent invoices
      setRecentInvoices(invoiceRes.data || [])

    } catch (err) {
      // Supabase unavailable — leave empty (UI handles empty state gracefully)
    } finally {
      setLoading(false)
    }
  }

  const kpiColorMap = {
    indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', badge: 'bg-indigo-600' },
    amber:  { bg: 'bg-amber-50',  icon: 'text-amber-600',  badge: 'bg-amber-600' },
    emerald:{ bg: 'bg-emerald-50',icon: 'text-emerald-600',badge: 'bg-emerald-600' },
    rose:   { bg: 'bg-rose-50',   icon: 'text-rose-600',   badge: 'bg-rose-600' },
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="w-20 h-3 bg-slate-200 rounded animate-pulse mb-4" />
              <div className="w-16 h-8 bg-slate-200 rounded animate-pulse mb-2" />
              <div className="w-28 h-2 bg-slate-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="text-indigo-600 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">Here's what's happening across your procurement operations today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {kpis.map((kpi) => {
          const colors = kpiColorMap[kpi.color]
          const Icon = kpi.icon
          return (
            <div key={kpi.title} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{kpi.title}</span>
                <div className={`p-2 rounded-lg ${colors.bg} ${colors.icon} group-hover:scale-110 transition-transform`}>
                  <Icon size={16} />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-800 tracking-tight mb-1">{kpi.value}</div>
              <div className="flex items-center gap-1.5 text-xs">
                {kpi.isUp
                  ? <ArrowUpRight size={13} className="text-emerald-500" />
                  : <ArrowDownRight size={13} className="text-rose-400" />
                }
                <span className={kpi.isUp ? 'text-emerald-600 font-semibold' : 'text-rose-500 font-semibold'}>{kpi.change}</span>
                <span className="text-slate-400">{kpi.subtext}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Activity Feed — 2/3 width */}
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-sm">Live Activity Feed</h3>
            </div>
            <Link href="/activity" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Activity size={28} className="text-slate-300" />
                <p className="text-sm text-slate-400">No activity yet. Start by creating an RFQ.</p>
              </div>
            ) : (
              activities.map((item) => {
                const style = ACTION_STYLE[item.action] || 'text-slate-600 bg-slate-50 border-slate-100'
                return (
                  <div key={item.id} className="px-6 py-3.5 flex items-start gap-4 hover:bg-slate-50/60 transition-colors">
                    <span className={`mt-0.5 shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide ${style}`}>
                      {item.action}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-700 leading-snug">{item.description}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">by <span className="font-semibold text-slate-600">{item.performed_by_name}</span></p>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 mt-0.5 font-mono">{timeAgo(item.performed_at)}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">

          {/* Pending Approvals */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} className="text-amber-500" />
                <h3 className="font-bold text-slate-800 text-sm">Needs Approval</h3>
              </div>
              <Link href="/approvals" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                All <ArrowUpRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {pendingApprovals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <CheckCircle2 size={24} className="text-emerald-400" />
                  <p className="text-xs text-slate-400">All caught up! No pending approvals.</p>
                </div>
              ) : (
                pendingApprovals.map((a: any) => (
                  <div key={a.id} className="px-5 py-3 hover:bg-amber-50/40 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {(a.quotation as any)?.rfq?.title || 'Procurement Approval'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {(a.quotation as any)?.quotation_number} · by {(a.requester as any)?.full_name}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                        {formatINR(Number((a.quotation as any)?.total_amount) || 0)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ReceiptText size={15} className="text-rose-500" />
                <h3 className="font-bold text-slate-800 text-sm">Recent Invoices</h3>
              </div>
              <Link href="/invoices" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                All <ArrowUpRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {recentInvoices.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No invoices yet.</p>
              ) : (
                recentInvoices.map((inv: any) => (
                  <div key={inv.id} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-700 font-mono">{inv.invoice_number}</p>
                      <p className="text-[11px] text-slate-400 truncate">{inv.vendor?.company_name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-slate-800">{formatINR(Number(inv.total_amount) || 0)}</p>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        inv.status === 'paid' ? 'text-emerald-700 bg-emerald-50' :
                        inv.status === 'overdue' ? 'text-rose-700 bg-rose-50' :
                        'text-amber-700 bg-amber-50'
                      }`}>{inv.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Quick Action Bar */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-indigo-500/20">
        <div>
          <h4 className="text-white font-bold">Ready to start a new procurement?</h4>
          <p className="text-indigo-200 text-sm mt-0.5">Create an RFQ, invite vendors, and track bids in one place.</p>
        </div>
        <div className="flex gap-3 shrink-0">
          {(user?.role === 'admin' || user?.role === 'procurement_officer') && (
            <Link href="/rfqs" className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-colors shadow-sm">
              <FilePlus size={15} /> New RFQ
            </Link>
          )}
          {(user?.role === 'admin' || user?.role === 'procurement_officer') && (
            <Link href="/vendors" className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 text-white border border-white/20 rounded-lg text-sm font-bold hover:bg-white/20 transition-colors">
              <UserPlus size={15} /> Add Vendor
            </Link>
          )}
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <Link href="/approvals" className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 text-white border border-white/20 rounded-lg text-sm font-bold hover:bg-white/20 transition-colors">
              <CheckSquare size={15} /> Approvals
            </Link>
          )}
        </div>
      </div>

    </div>
  )
}
