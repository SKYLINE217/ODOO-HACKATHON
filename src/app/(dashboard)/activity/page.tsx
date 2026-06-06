'use client'

import { useState, useEffect } from 'react'
import { 
  Activity, 
  Search, 
  Filter, 
  User, 
  Terminal, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Database,
  Loader2
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useSearchStore } from '@/stores/useSearchStore'
import { useAuthStore } from '@/stores/useAuthStore'

interface ActivityLog {
  id: string
  entity_type: string
  entity_id: string
  action: string
  description: string
  performed_by: string
  performed_at: string
  ip_address: string
}

const mockLogs: ActivityLog[] = [
  {
    id: '1',
    entity_type: 'rfq',
    entity_id: 'RFQ-2026-00045',
    action: 'CREATE',
    description: 'Created draft RFQ "Server Hardware Upgrade"',
    performed_by: 'Alex Mercer',
    performed_at: '2026-06-06 08:58:12',
    ip_address: '192.168.1.104'
  },
  {
    id: '2',
    entity_type: 'purchase_order',
    entity_id: 'PO-2026-00009',
    action: 'APPROVE',
    description: 'Approved purchase order value \u20B98,14,200',
    performed_by: 'Sarah Connor (Manager)',
    performed_at: '2026-06-06 08:20:45',
    ip_address: '192.168.1.50'
  },
  {
    id: '3',
    entity_type: 'vendor',
    entity_id: 'VND-00014',
    action: 'REGISTER',
    description: 'Registered vendor Swift Logistics Inc. compliance docs pending',
    performed_by: 'Alex Mercer',
    performed_at: '2026-06-06 06:15:30',
    ip_address: '192.168.1.104'
  },
  {
    id: '4',
    entity_type: 'invoice',
    entity_id: 'INV-2026-00010',
    action: 'PAYMENT_CONFIRM',
    description: 'Marked invoice INV-2026-00010 as paid',
    performed_by: 'Alex Mercer',
    performed_at: '2026-06-04 14:30:22',
    ip_address: '192.168.1.104'
  }
]

const supabase = createClient()

export default function ActivityLogPage() {
  const user = useAuthStore(state => state.user)
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const { searchTerm, setSearchTerm, clearSearch } = useSearchStore()
  
  useEffect(() => {
    return () => clearSearch()
  }, [clearSearch])
  
  const [isDbMode, setIsDbMode] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function loadLogs() {
      try {
        let query = supabase
          .from('activity_logs')
          .select(`
            id,
            entity_type,
            entity_id,
            action,
            description,
            performed_at,
            ip_address,
            performed_by_profile:profiles!activity_logs_performed_by_fkey(full_name)
          `)

        if (user?.role === 'vendor') {
          const activeVendorId = (user as any)?.vendor_id || '00000000-0000-0000-0000-000000000000'
          const { data: vendorProfiles } = await supabase
            .from('profiles')
            .select('id')
            .eq('vendor_id', activeVendorId)
          const profileIds = (vendorProfiles || []).map((p: any) => p.id)
          if (profileIds.length === 0) profileIds.push(user.id)
          
          query = query.in('performed_by', profileIds)
        }

        const { data: dbLogs, error } = await query.order('performed_at', { ascending: false })

        if (error) throw error

        if (dbLogs && dbLogs.length > 0) {
          const formatted: ActivityLog[] = dbLogs.map((item: any) => ({
            id: item.id,
            entity_type: item.entity_type,
            entity_id: item.entity_id,
            action: item.action,
            description: item.description,
            performed_by: (item.performed_by_profile as any)?.full_name || 'System Operator',
            performed_at: item.performed_at ? item.performed_at.replace('T', ' ').substring(0, 19) : 'N/A',
            ip_address: item.ip_address || '127.0.0.1'
          }))
          setLogs(formatted)
          setIsDbMode(true)
        } else {
          setLogs(mockLogs)
          setIsDbMode(false)
        }
      } catch (err) {
        setLogs(mockLogs)
        setIsDbMode(false)
      } finally {
        setLoading(false)
      }
    }
    loadLogs()
  }, [user])

  const filteredLogs = logs.filter(log => 
    log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.performed_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entity_id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* DB Connection Alert */}
      {!isDbMode && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl p-4 flex items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-2.5">
            <Database size={18} className="shrink-0 text-amber-400" />
            <p className="leading-relaxed">
              <strong>Running in Demo Mode:</strong> Showing system mock event logs. Run the <code>schema.sql</code> script on Supabase to connect PostgreSQL and stream real audit events.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight font-display">Audit & Activity Logs</h2>
        <p className="text-[var(--text-secondary)] text-sm mt-1">Full audit trail tracking entity state alterations, creator details, and timestamps.</p>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-md group">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search size={18} className="text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors" />
        </span>
        <input
          type="text"
          placeholder="Filter audit logs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-[var(--bg-subtle)] border border-[var(--border-strong)] rounded-lg text-sm placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)] font-mono"
        />
      </div>

      {/* Audit Log Timeline */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 bg-[var(--bg-elevated)] border-b border-[var(--border-default)] flex items-center gap-2 text-[var(--text-secondary)]">
          <Terminal size={16} />
          <span className="text-xs font-bold uppercase tracking-wider font-mono">System Event Stream</span>
        </div>
        
        <div className="divide-y divide-[var(--border-default)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 size={32} className="text-[var(--accent)] animate-spin" />
              <span className="text-xs text-[var(--text-secondary)] font-semibold font-mono">Loading audit logs...</span>
            </div>
          ) : filteredLogs.length > 0 ? (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-6 hover:bg-[var(--bg-subtle)] transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex gap-4 items-start">
                  <div className="p-2.5 bg-[var(--bg-subtle)] border border-[var(--border-strong)] text-[var(--text-muted)] rounded-lg shrink-0">
                    <Activity size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{log.description}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-[var(--text-secondary)] font-mono">
                      <span className="flex items-center gap-1.5"><User size={13} /> {log.performed_by}</span>
                      <span className="hidden sm:inline text-[var(--border-default)]">|</span>
                      <span>IP: <code className="px-1.5 py-0.5 bg-[var(--bg-subtle)] rounded text-[var(--text-secondary)] border border-[var(--border-strong)]">{log.ip_address}</code></span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 font-mono">
                  <span className="text-xs text-[var(--text-muted)] block font-medium">{log.performed_at}</span>
                  <span className="inline-flex mt-1 text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 px-1.5 py-0.5 rounded uppercase">
                    {log.action}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-sm text-[var(--text-muted)] font-mono">No logs found matching filter</div>
          )}
        </div>
      </div>
    </div>
  )
}


