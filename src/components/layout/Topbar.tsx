'use client'

import { useState } from 'react'
import { Bell, Search, User, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface Notification {
  id: string
  title: string
  message: string
  time: string
  type: 'info' | 'success' | 'warning'
  read: boolean
}

export default function Topbar() {
  const { user } = useAuth()
  const [showNotifications, setShowNotifications] = useState(false)
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
      <div className="flex items-center gap-6">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-all relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <span className="text-sm font-semibold text-slate-800">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-3 ${
                        !notif.read ? 'bg-indigo-50/20' : ''
                      }`}
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
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400">No new notifications</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-sm font-semibold text-slate-800 block leading-tight">{user?.full_name}</span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">{user?.department}</span>
          </div>
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name}
              className="w-8 h-8 rounded-full border border-slate-200 object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              <User size={16} />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
