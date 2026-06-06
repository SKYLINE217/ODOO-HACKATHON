'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, Search, CheckCircle2, Clock, AlertCircle, User, Settings, LogOut, ChevronDown, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Notification {
  id: string
  type: 'success' | 'warning' | 'info'
  title: string
  message: string
  time: string
  read: boolean
}

export default function Topbar() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [notifications] = useState<Notification[]>([
    { id: '1', type: 'warning', title: 'Approval Required', message: 'QUO-2026-00021 from MetroSoft awaiting L2 approval.', time: '5m ago', read: false },
    { id: '2', type: 'success', title: 'PO Fulfilled', message: 'PO-2026-00010 (Office Furniture) marked fulfilled.', time: '2h ago', read: false },
    { id: '3', type: 'info', title: 'RFQ Deadline Soon', message: 'RFQ-2026-00044 closes in 12 days.', time: '4h ago', read: true },
  ])
  const notifRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false)
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setShowNotifications(false); setShowUserMenu(false) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    setShowUserMenu(false)
    await logout()
    window.location.href = '/login'
  }

  const unread = notifications.filter(n => !n.read).length
  const notifIcon = { success: CheckCircle2, warning: AlertCircle, info: Clock }
  const notifColor = {
    success: { icon: 'var(--success)', bg: 'var(--success-subtle)' },
    warning: { icon: 'var(--warning)', bg: 'var(--warning-subtle)' },
    info:    { icon: 'var(--info)',    bg: 'var(--info-subtle)' },
  }

  return (
    <header style={{
      height: '64px', display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: '16px',
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-default)',
      flexShrink: 0, position: 'sticky', top: 0, zIndex: 40,
    }}>
      {/* Search */}
      <div style={{ position: 'relative', width: '320px' }}>
        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <input
          placeholder="Search vendors, RFQs, orders…"
          style={{
            width: '100%', height: '36px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: '8px', padding: '0 12px 0 34px',
            fontFamily: 'var(--font-body)', fontSize: '13px',
            color: 'var(--text-primary)', outline: 'none',
            transition: 'border-color 150ms',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
        />
      </div>

      <div style={{ flex: 1 }} />

      {/* Notifications */}
      <div ref={notifRef} style={{ position: 'relative' }}>
        <button
          onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false) }}
          style={{
            width: '36px', height: '36px', borderRadius: '8px',
            background: showNotifications ? 'var(--bg-elevated)' : 'transparent',
            border: '1px solid',
            borderColor: showNotifications ? 'var(--border-strong)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', position: 'relative', transition: 'all 150ms',
            color: 'var(--text-secondary)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)' }}
          onMouseLeave={e => { if (!showNotifications) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          <Bell size={16} />
          {unread > 0 && (
            <span style={{
              position: 'absolute', top: '6px', right: '6px',
              width: '8px', height: '8px', borderRadius: '50%',
              background: 'var(--accent)',
              boxShadow: '0 0 6px rgba(245,158,11,0.5)',
            }} />
          )}
        </button>

        {showNotifications && (
          <div className="modal-enter" style={{
            position: 'absolute', right: 0, top: 'calc(100% + 8px)',
            width: '340px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden', zIndex: 50,
          }}>
            <div style={{
              padding: '14px 16px', borderBottom: '1px solid var(--border-default)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>Notifications</span>
              {unread > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500, color: 'var(--accent)', background: 'var(--accent-subtle)', borderRadius: '99px', padding: '2px 8px' }}>{unread} new</span>}
            </div>
            <div style={{ maxHeight: '280px', overflowY: 'auto' }} className="custom-scrollbar">
              {notifications.map(n => {
                const Icon = notifIcon[n.type]
                const c = notifColor[n.type]
                return (
                  <div key={n.id} style={{
                    padding: '12px 16px', borderBottom: '1px solid var(--border-default)',
                    display: 'flex', gap: '12px', alignItems: 'flex-start',
                    background: n.read ? 'transparent' : 'var(--accent-subtle)',
                    transition: 'background 150ms', cursor: 'pointer',
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = n.read ? 'transparent' : 'var(--accent-subtle)'}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={13} style={{ color: c.icon }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)' }}>{n.title}</div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>{n.message}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>{n.time}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* User Menu */}
      <div ref={userMenuRef} style={{ position: 'relative' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px' }}>
            <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            <div className="skeleton" style={{ width: '80px', height: '12px', borderRadius: '4px' }} />
          </div>
        ) : user ? (
          <>
            <button
              onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '6px 10px 6px 6px', borderRadius: '10px',
                background: showUserMenu ? 'var(--bg-elevated)' : 'transparent',
                border: '1px solid',
                borderColor: showUserMenu ? 'var(--border-strong)' : 'transparent',
                cursor: 'pointer', transition: 'all 150ms',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)' }}
              onMouseLeave={e => { if (!showUserMenu) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = 'transparent' } }}
            >
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-strong)' }} />
              ) : (
                <div style={{
                  width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--accent) 0%, #D97706 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '12px',
                  color: 'var(--text-inverse)',
                }}>
                  {(user.full_name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.2 }}>{user.full_name}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{user.role?.replace('_', ' ')}</div>
              </div>
              <ChevronDown size={12} style={{ color: 'var(--text-muted)', transform: showUserMenu ? 'rotate(180deg)' : 'none', transition: 'transform 200ms', marginLeft: '2px' }} />
            </button>

            {showUserMenu && (
              <div className="modal-enter" style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                width: '220px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-strong)',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-lg)',
                overflow: 'hidden', zIndex: 50,
              }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-elevated)' }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.full_name}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                  <span style={{
                    display: 'inline-flex', marginTop: '6px',
                    fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    padding: '2px 7px', borderRadius: '99px',
                    background: user.role === 'admin' ? 'rgba(239,68,68,0.1)' : user.role === 'manager' ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)',
                    color: user.role === 'admin' ? '#F87171' : user.role === 'manager' ? '#FBBF24' : '#60A5FA',
                    border: '1px solid',
                    borderColor: user.role === 'admin' ? 'rgba(239,68,68,0.2)' : user.role === 'manager' ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.2)',
                  }}>{user.role?.replace('_', ' ')}</span>
                </div>
                {[
                  { href: '/profile', icon: User, label: 'View Profile' },
                  { href: '/profile?tab=security', icon: Settings, label: 'Settings' },
                ].map(item => (
                  <Link key={item.href} href={item.href} onClick={() => setShowUserMenu(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 16px', textDecoration: 'none',
                      fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500,
                      color: 'var(--text-secondary)', transition: 'all 150ms',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)' }}
                  >
                    <item.icon size={14} />
                    {item.label}
                  </Link>
                ))}
                <div style={{ borderTop: '1px solid var(--border-default)' }}>
                  <button onClick={handleLogout} disabled={loggingOut}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 16px', border: 'none', background: 'transparent',
                      fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600,
                      color: 'var(--danger)', cursor: loggingOut ? 'not-allowed' : 'pointer',
                      opacity: loggingOut ? 0.6 : 1, transition: 'background 150ms',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--danger-subtle)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    {loggingOut ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <LogOut size={14} />}
                    {loggingOut ? 'Signing out…' : 'Sign Out'}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </header>
  )
}
