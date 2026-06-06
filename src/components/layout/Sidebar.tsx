'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Coins, 
  CheckSquare, 
  ShoppingBag, 
  Receipt, 
  Activity, 
  BarChart3,
  LogOut,
  Building2
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, allowedRoles: ['admin', 'procurement_officer', 'manager', 'vendor'] },
  { href: '/vendors', label: 'Vendors', icon: Users, allowedRoles: ['admin', 'procurement_officer'] },
  { href: '/rfqs', label: 'RFQs', icon: FileText, allowedRoles: ['admin', 'procurement_officer', 'manager', 'vendor'] },
  { href: '/quotations', label: 'Quotations', icon: Coins, allowedRoles: ['admin', 'procurement_officer', 'manager', 'vendor'] },
  { href: '/approvals', label: 'Approvals', icon: CheckSquare, allowedRoles: ['admin', 'manager'] },
  { href: '/purchase-orders', label: 'Purchase Orders', icon: ShoppingBag, allowedRoles: ['admin', 'procurement_officer', 'manager', 'vendor'] },
  { href: '/invoices', label: 'Invoices', icon: Receipt, allowedRoles: ['admin', 'procurement_officer', 'vendor'] },
  { href: '/activity', label: 'Activity Log', icon: Activity, allowedRoles: ['admin', 'procurement_officer', 'manager'] },
  { href: '/reports', label: 'Reports', icon: BarChart3, allowedRoles: ['admin', 'procurement_officer', 'manager'] },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const userRole = user?.role || 'admin' // default fallback to admin for testing

  const filteredNavItems = navItems.filter((item) => item.allowedRoles.includes(userRole))

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen border-r border-slate-800 shrink-0 sticky top-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-500/30">
          <Building2 size={22} className="animate-pulse" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-wide bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
            VendorBridge
          </h1>
          <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">ProcureTech</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
        {filteredNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <Icon 
                size={18} 
                className={`transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                }`} 
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User profile footer */}
      {user && (
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-3">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500/20"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                {user.full_name.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">{user.full_name}</p>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 capitalize mt-0.5">
                {user.role.replace('_', ' ')}
              </span>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors duration-200"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      )}
    </aside>
  )
}
