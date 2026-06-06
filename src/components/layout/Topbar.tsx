'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, Search, CheckCircle2, Clock, AlertCircle, User, Settings, LogOut, ChevronDown, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

interface Notification {
  id: string
  title: string
  message: string
  time: string
  type: 'info' | 'success' | 'warning'
  read: boolean
}

export default function Topbar() {
  const { user, loading, logout } = useAuth()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Quotation Awarded',
      message: 'RFQ-2026-00042 has been awarded to Apex Tech Solutions.',
      time: '10 mins ago',
      type: 'success',
      read: false
    },
    {
      id: '2',
      title: 'Approval Required',
      message: 'Manager approval requested for Purchase Order PO-2026-00009.',
      time: '1 hour ago',
      type: 'warning',
      read: false
    },
    {
      id: '3',
      title: 'New Vendor Registered',
      message: 'Swift Logistics submitted their compliance documents for verification.',
      time: '3 hours ago',
      type: 'info',
      read: true
    }
  ])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false)
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-40">
      {/* Search Bar */}
      <div className="relative w-96 max-w-lg group">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search size={18} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        </span>
        <input
          type="text"
          placeholder="Search RFQs, vendors, purchase orders..."
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false) }}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-all relative cursor-pointer"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <span className="text-sm font-semibold text-slate-800">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer">
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-3 ${!notif.read ? 'bg-indigo-50/20' : ''}`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {notif.type === 'success' && <CheckCircle2 size={16} className="text-emerald-500" />}
                        {notif.type === 'warning' && <Clock size={16} className="text-amber-500" />}
                        {notif.type === 'info' && <AlertCircle size={16} className="text-blue-500" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-800">{notif.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">{notif.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">{notif.time}</span>
                      </div>
                      {!notif.read && <span className="w-2 h-2 bg-indigo-500 rounded-full shrink-0 mt-1" />}
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400">No new notifications</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Dropdown */}
        <div className="relative" ref={userMenuRef}>
          {loading ? (
            <div className="flex items-center gap-2.5 px-3 py-1.5">
              <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
              <div className="hidden sm:block space-y-1">
                <div className="w-24 h-3 bg-slate-200 rounded animate-pulse" />
                <div className="w-16 h-2 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          ) : user ? (
            <>
              <button
                onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false) }}
                className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
              >
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-8 h-8 rounded-full border border-slate-200 object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-sm">
                    {(user.full_name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-left hidden sm:block">
                  <span className="text-sm font-semibold text-slate-800 block leading-tight">{user.full_name}</span>
                  <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">{user.department || user.role?.replace('_', ' ')}</span>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <p className="text-xs font-bold text-slate-800 truncate">{user.full_name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    <span className={`inline-flex mt-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                      user.role === 'admin' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      user.role === 'manager' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      user.role === 'vendor' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}>
                      {user.role?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="py-1">
                    <Link href="/profile" onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors">
                      <User size={15} className="text-slate-400" /> View Profile
                    </Link>
                    <Link href="/profile?tab=security" onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors">
                      <Settings size={15} className="text-slate-400" /> Settings
                    </Link>
                  </div>
                  <div className="py-1 border-t border-slate-100">
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer">
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </header>
  )
}
