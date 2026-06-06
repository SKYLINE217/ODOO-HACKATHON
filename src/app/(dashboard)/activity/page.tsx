'use client'

import { useState } from 'react'
import { 
  Activity, 
  Search, 
  Filter, 
  User, 
  Terminal, 
  FileText, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react'

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
    description: 'Approved purchase order value ₹8,14,200',
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

export default function ActivityLogPage() {
  const [logs] = useState<ActivityLog[]>(mockLogs)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredLogs = logs.filter(log => 
    log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.performed_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entity_id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Audit & Activity Logs</h2>
        <p className="text-slate-500 text-sm mt-1">Full audit trail tracking entity state alterations, creator details, and timestamps.</p>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-md group">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search size={18} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        </span>
        <input
          type="text"
          placeholder="Filter audit logs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
        />
      </div>

      {/* Audit Log Timeline */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2 text-slate-500">
          <Terminal size={16} />
          <span className="text-xs font-bold uppercase tracking-wider">System Event Stream</span>
        </div>
        
        <div className="divide-y divide-slate-100">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex gap-4 items-start">
                  <div className="p-2.5 bg-slate-50 border border-slate-100 text-slate-600 rounded-lg shrink-0">
                    <Activity size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-850">{log.description}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5"><User size={13} /> {log.performed_by}</span>
                      <span className="hidden sm:inline">|</span>
                      <span>IP: <code className="font-mono bg-slate-50 px-1 rounded text-slate-600">{log.ip_address}</code></span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs text-slate-400 block font-medium">{log.performed_at}</span>
                  <span className="inline-flex mt-1 text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded font-mono uppercase">
                    {log.action}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-sm text-slate-400">No logs found matching filter</div>
          )}
        </div>
      </div>
    </div>
  )
}
