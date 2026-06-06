'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 350, damping: 26 } }
}
import { 
  FilePlus, UserPlus, CheckSquare, ArrowUpRight, ArrowDownRight,
  Activity, CheckCircle2, AlertCircle, ReceiptText, Coins, Loader2
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

const ACTION_STYLE: Record<string, { bg: string, text: string, border: string }> = {
  CREATE:  { bg: 'rgba(99, 102, 241, 0.1)', text: '#818CF8', border: 'rgba(99, 102, 241, 0.2)' },
  PUBLISH: { bg: 'rgba(139, 92, 246, 0.1)', text: '#A78BFA', border: 'rgba(139, 92, 246, 0.2)' },
  APPROVE: { bg: 'rgba(16, 185, 129, 0.1)', text: '#34D399', border: 'rgba(16, 185, 129, 0.2)' },
  REJECT:  { bg: 'rgba(244, 63, 94, 0.1)',  text: '#FB7185', border: 'rgba(244, 63, 94, 0.2)' },
  PAY:     { bg: 'rgba(34, 197, 94, 0.1)',  text: '#4ADE80', border: 'rgba(34, 197, 94, 0.2)' },
  SUBMIT:  { bg: 'rgba(245, 158, 11, 0.1)', text: '#FBBF24', border: 'rgba(245, 158, 11, 0.2)' },
  FULFILL: { bg: 'rgba(20, 184, 166, 0.1)', text: '#2DD4BF', border: 'rgba(20, 184, 166, 0.2)' },
  SUSPEND: { bg: 'rgba(249, 115, 22, 0.1)', text: '#FB923C', border: 'rgba(249, 115, 22, 0.2)' },
  RECEIVE: { bg: 'rgba(59, 130, 246, 0.1)', text: '#60A5FA', border: 'rgba(59, 130, 246, 0.2)' },
  ISSUE:   { bg: 'rgba(14, 165, 233, 0.1)', text: '#38BDF8', border: 'rgba(14, 165, 233, 0.2)' },
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

      // Data extraction with safe fallbacks
      const rfqs = rfqRes.data || []
      const activeRfqs = rfqs.filter((r: any) => r.status === 'published').length
      const draftRfqs = rfqs.filter((r: any) => r.status === 'draft').length

      const vendors = vendorRes.data || []
      const activeVendors = vendors.filter((v: any) => v.status === 'active').length
      const pendingVendors = vendors.filter((v: any) => v.status === 'pending').length

      const approvalCount = approvalRes.data?.length || 0

      const invoices = spendRes.data || []
      const totalSpend = invoices.filter((i: any) => i.status === 'paid').reduce((s: any, i: any) => s + (Number(i.total_amount) || 0), 0)
      const totalCommitted = invoices.reduce((s: any, i: any) => s + (Number(i.total_amount) || 0), 0)

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

      setActivities((activityRes.data || []).map((a: any) => ({
        id: a.id,
        action: a.action,
        description: a.description,
        entity_type: a.entity_type,
        performed_by_name: a.performer?.full_name || 'System',
        performed_at: a.performed_at,
      })))

      setPendingApprovals(approvalRes.data || [])
      setRecentInvoices(invoiceRes.data || [])

    } catch (err) {
      console.error("Dashboard Data Fetch Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const kpiColorMap = {
    indigo:  { bg: 'rgba(99, 102, 241, 0.1)', icon: '#818CF8' },
    amber:   { bg: 'var(--accent-subtle)',    icon: 'var(--accent)' },
    emerald: { bg: 'rgba(16, 185, 129, 0.1)', icon: '#34D399' },
    rose:    { bg: 'rgba(244, 63, 94, 0.1)',  icon: '#FB7185' },
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card">
              <div className="skeleton" style={{ width: '80px', height: '12px', marginBottom: '16px' }} />
              <div className="skeleton" style={{ width: '60px', height: '32px', marginBottom: '8px' }} />
              <div className="skeleton" style={{ width: '120px', height: '10px' }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div className="page-enter" variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Greeting */}
      <motion.div variants={itemVariants}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.full_name?.split(' ')[0]} 👋
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Here's what's happening across your procurement operations today.
        </p>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        {kpis.map((kpi) => {
          const colors = kpiColorMap[kpi.color]
          const Icon = kpi.icon
          return (
            <motion.div key={kpi.title} whileHover={{ y: -4, scale: 1.01 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }} className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span className="label" style={{ marginBottom: 0 }}>{kpi.title}</span>
                <div style={{ padding: '8px', borderRadius: '8px', background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} color={colors.icon} />
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: '6px' }}>
                {kpi.value}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {kpi.isUp ? <ArrowUpRight size={14} color="#34D399" /> : <ArrowDownRight size={14} color="#FB7185" />}
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: kpi.isUp ? '#34D399' : '#FB7185' }}>{kpi.change}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)' }}>{kpi.subtext}</span>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Main Grid */}
      <motion.div variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Activity Feed */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} color="var(--accent)" />
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Live Activity Feed</h3>
            </div>
            <Link href="/activity" style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: 'var(--accent)' }}>
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {activities.length === 0 ? (
              <div style={{ padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Activity size={28} color="var(--text-muted)" />
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-secondary)' }}>No activity yet. Start by creating an RFQ.</p>
              </div>
            ) : (
              activities.map((item, idx) => {
                const style = ACTION_STYLE[item.action] || { bg: 'var(--bg-elevated)', text: 'var(--text-secondary)', border: 'var(--border-strong)' }
                return (
                  <div key={item.id} style={{
                    padding: '14px 24px',
                    borderBottom: idx === activities.length - 1 ? 'none' : '1px solid var(--border-default)',
                    display: 'flex', alignItems: 'flex-start', gap: '16px',
                    transition: 'background 150ms', cursor: 'default'
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <span style={{
                      marginTop: '2px', flexShrink: 0, fontSize: '9px', fontWeight: 700, padding: '2px 6px',
                      borderRadius: '4px', border: `1px solid ${style.border}`, background: style.bg, color: style.text,
                      fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em'
                    }}>
                      {item.action}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.4 }}>{item.description}</p>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        by <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.performed_by_name}</span>
                      </p>
                    </div>
                    <span style={{ flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {timeAgo(item.performed_at)}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Pending Approvals */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={15} color="#FBBF24" />
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Needs Approval</h3>
              </div>
              <Link href="/approvals" style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: 'var(--accent)' }}>
                All <ArrowUpRight size={12} />
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {pendingApprovals.length === 0 ? (
                <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={24} color="#34D399" />
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-secondary)' }}>All caught up! No pending approvals.</p>
                </div>
              ) : (
                pendingApprovals.map((a: any, idx) => (
                  <div key={a.id} style={{
                    padding: '12px 20px',
                    borderBottom: idx === pendingApprovals.length - 1 ? 'none' : '1px solid var(--border-default)',
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px',
                    transition: 'background 150ms'
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent-subtle)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {(a.quotation as any)?.rfq?.title || 'Procurement Approval'}
                      </p>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {(a.quotation as any)?.quotation_number} · by {(a.requester as any)?.full_name}
                      </p>
                    </div>
                    <span style={{
                      flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600,
                      color: 'var(--accent)', background: 'var(--accent-subtle)', padding: '2px 6px', borderRadius: '4px',
                      border: '1px solid rgba(245, 158, 11, 0.2)'
                    }}>
                      {formatINR(Number((a.quotation as any)?.total_amount) || 0)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ReceiptText size={15} color="#FB7185" />
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Recent Invoices</h3>
              </div>
              <Link href="/invoices" style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: 'var(--accent)' }}>
                All <ArrowUpRight size={12} />
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {recentInvoices.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center' }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-secondary)' }}>No invoices yet.</p>
                </div>
              ) : (
                recentInvoices.map((inv: any, idx) => (
                  <div key={inv.id} style={{
                    padding: '12px 20px',
                    borderBottom: idx === recentInvoices.length - 1 ? 'none' : '1px solid var(--border-default)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                    transition: 'background 150ms'
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{inv.invoice_number}</p>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inv.vendor?.company_name}</p>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {formatINR(Number(inv.total_amount) || 0)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
