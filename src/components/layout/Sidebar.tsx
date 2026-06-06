'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, FileText, Coins, CheckSquare,
  ShoppingBag, Receipt, Activity, BarChart3, Building2
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const NAV_MAIN = [
  { href: '/',               label: 'Dashboard',      icon: LayoutDashboard, roles: ['admin','procurement_officer','manager','vendor'] },
  { href: '/vendors',        label: 'Vendors',         icon: Users,           roles: ['admin','procurement_officer'] },
  { href: '/rfqs',           label: 'RFQs',            icon: FileText,        roles: ['admin','procurement_officer','manager','vendor'] },
  { href: '/quotations',     label: 'Quotations',      icon: Coins,           roles: ['admin','procurement_officer','manager','vendor'] },
  { href: '/approvals',      label: 'Approvals',       icon: CheckSquare,     roles: ['admin','manager'], badge: true },
  { href: '/purchase-orders',label: 'Purchase Orders', icon: ShoppingBag,     roles: ['admin','procurement_officer','manager','vendor'] },
  { href: '/invoices',       label: 'Invoices',        icon: Receipt,         roles: ['admin','procurement_officer','vendor'] },
]

const NAV_SECONDARY = [
  { href: '/reports',  label: 'Reports',      icon: BarChart3, roles: ['admin','procurement_officer','manager'] },
  { href: '/activity', label: 'Activity Log', icon: Activity,  roles: ['admin','procurement_officer','manager'] },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const role = user?.role || 'admin'

  function NavItem({ href, label, icon: Icon, badge }: { href: string, label: string, icon: any, badge?: boolean }) {
    const isActive = pathname === href
    return (
      <Link
        href={href}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '9px 12px', borderRadius: '8px',
          fontSize: '13.5px', fontWeight: isActive ? 600 : 400,
          fontFamily: 'var(--font-body)',
          color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
          background: isActive ? 'var(--accent-subtle)' : 'transparent',
          borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
          transition: 'all 150ms',
          textDecoration: 'none',
          position: 'relative',
        }}
        onMouseEnter={e => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'
            ;(e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'
          }
        }}
        onMouseLeave={e => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
            ;(e.currentTarget as HTMLElement).style.background = 'transparent'
          }
        }}
      >
        <Icon size={16} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{label}</span>
        {badge && (
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 500,
            background: 'var(--accent)', color: 'var(--text-inverse)',
            borderRadius: '99px', padding: '1px 6px', lineHeight: 1.6
          }}>!</span>
        )}
      </Link>
    )
  }

  return (
    <aside style={{
      width: '240px', minWidth: '240px', background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-default)',
      display: 'flex', flexDirection: 'column', height: '100vh',
      position: 'sticky', top: 0, flexShrink: 0,
    }}>
      {/* Brand */}
      <div style={{
        height: '64px', display: 'flex', alignItems: 'center',
        padding: '0 20px', gap: '12px',
        borderBottom: '1px solid var(--border-default)',
      }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '9px',
          background: 'var(--accent)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0,
          boxShadow: '0 0 16px rgba(245,158,11,0.3)',
        }}>
          <Building2 size={18} color="var(--text-inverse)" />
        </div>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: '16px', color: 'var(--text-primary)', lineHeight: 1.2
          }}>VendorBridge</div>
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: '10px',
            color: 'var(--text-muted)', letterSpacing: '0.08em',
            textTransform: 'uppercase', fontWeight: 500
          }}>Procurement OS</div>
        </div>
      </div>

      {/* Main Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}
        className="custom-scrollbar">
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, padding: '0 12px', marginBottom: '8px', marginTop: '4px' }}>
          Main
        </div>
        {NAV_MAIN.filter(i => i.roles.includes(role)).map(item => (
          <NavItem key={item.href} {...item} />
        ))}

        <div style={{ height: '1px', background: 'var(--border-default)', margin: '12px 0' }} />

        <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, padding: '0 12px', marginBottom: '8px' }}>
          Analytics
        </div>
        {NAV_SECONDARY.filter(i => i.roles.includes(role)).map(item => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>

      {/* User footer */}
      {user && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-default)',
          background: 'var(--bg-elevated)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--accent) 0%, #D97706 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: '13px', color: 'var(--text-inverse)',
            }}>
              {(user.full_name || 'U').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '13px',
                color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>{user.full_name}</div>
              <div style={{
                fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500
              }}>{user.role?.replace('_', ' ')}</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
