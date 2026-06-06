'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  FilePlus, 
  UserPlus, 
  CheckSquare, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  Clock, 
  Activity, 
  CheckCircle2, 
  XCircle,
  FileText
} from 'lucide-react'

// Mock Data
const kpis = [
  {
    title: 'Total Active RFQs',
    value: '24',
    change: '+12%',
    isUp: true,
    subtext: '4 published this week',
    color: 'indigo'
  },
  {
    title: 'Pending Approvals',
    value: '5',
    change: '-2',
    isUp: false,
    subtext: 'Requires immediate action',
    color: 'amber'
  },
  {
    title: 'Registered Vendors',
    value: '18',
    change: '+3',
    isUp: true,
    subtext: '12 active, 6 pending verification',
    color: 'emerald'
  },
  {
    title: 'Procurement Spend',
    value: '₹14,20,500',
    change: '+18.4%',
    isUp: true,
    subtext: 'Includes CGST/SGST details',
    color: 'rose'
  }
]

const recentActivities = [
  {
    id: '1',
    user: 'Alex Mercer',
    action: 'published RFQ',
    target: 'RFQ-2026-00045 (Server Hardware)',
    time: '12 mins ago',
    icon: FileText,
    iconColor: 'text-indigo-600 bg-indigo-50'
  },
  {
    id: '2',
    user: 'Sarah Connor',
    action: 'approved Purchase Order',
    target: 'PO-2026-00009 for office furniture',
    time: '45 mins ago',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600 bg-emerald-50'
  },
  {
    id: '3',
    user: 'Apex Tech Solutions',
    action: 'submitted quotation',
    target: 'QUO-2026-00017 (₹4,12,000)',
    time: '2 hours ago',
    icon: Activity,
    iconColor: 'text-blue-600 bg-blue-50'
  },
  {
    id: '4',
    user: 'Admin',
    action: 'suspended vendor',
    target: 'Global Logistics (compliance failure)',
    time: '1 day ago',
    icon: XCircle,
    iconColor: 'text-rose-600 bg-rose-50'
  }
]

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'month' | 'quarter'>('month')

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Overview</h2>
          <p className="text-slate-500 text-sm mt-1">Real-time monitoring of procurement cycles and vendor engagement.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('month')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'month'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setActiveTab('quarter')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'quarter'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Quarterly
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <div key={index} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group">
            {/* Top decorative accent */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-${kpi.color}-500`} />
            
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{kpi.title}</span>
              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-bold ${
                kpi.isUp 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'bg-rose-50 text-rose-700'
              }`}>
                {kpi.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {kpi.change}
              </span>
            </div>

            <div className="mt-4">
              <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{kpi.value}</span>
              <p className="text-xs text-slate-500 mt-1 font-medium">{kpi.subtext}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Graphs and Timeline Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Analytics Graph */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-800">Spend Overview</h3>
              <p className="text-xs text-slate-500 mt-0.5">Analysis of items and materials spending.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 block" /> Spend Amount
              </span>
            </div>
          </div>

          {/* Custom Responsive SVG Chart */}
          <div className="h-64 w-full flex items-end relative pt-4">
            <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Background Grid Lines */}
              <line x1="0" y1="50" x2="500" y2="50" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="200" x2="500" y2="200" stroke="#e2e8f0" strokeWidth="1" />

              {/* Area */}
              <path
                d="M 0 170 C 50 160, 100 120, 150 140 C 200 160, 250 80, 300 70 C 350 60, 400 40, 450 30 C 480 25, 500 15, 500 15 L 500 200 L 0 200 Z"
                fill="url(#spendGrad)"
              />

              {/* Line */}
              <path
                d="M 0 170 C 50 160, 100 120, 150 140 C 200 160, 250 80, 300 70 C 350 60, 400 40, 450 30 C 480 25, 500 15, 500 15"
                fill="none"
                stroke="#6366f1"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Highlight Nodes */}
              <circle cx="150" cy="140" r="5" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
              <circle cx="300" cy="70" r="5" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
              <circle cx="450" cy="30" r="5" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
            </svg>

            {/* X-Axis Labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-bold bg-white">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-3 gap-4">
              <Link 
                href="/rfqs"
                className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 group transition-all text-center"
              >
                <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600 group-hover:scale-110 transition-transform">
                  <FilePlus size={20} />
                </div>
                <span className="text-[11px] font-bold text-slate-600 mt-2 block">Create RFQ</span>
              </Link>
              <Link 
                href="/vendors"
                className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-100 hover:border-emerald-100 hover:bg-emerald-50/30 group transition-all text-center"
              >
                <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600 group-hover:scale-110 transition-transform">
                  <UserPlus size={20} />
                </div>
                <span className="text-[11px] font-bold text-slate-600 mt-2 block">Add Vendor</span>
              </Link>
              <Link 
                href="/approvals"
                className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-100 hover:border-amber-100 hover:bg-amber-50/30 group transition-all text-center"
              >
                <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600 group-hover:scale-110 transition-transform">
                  <CheckSquare size={20} />
                </div>
                <span className="text-[11px] font-bold text-slate-600 mt-2 block">Approvals</span>
              </Link>
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">Recent Activity</h3>
              <Link href="/activity" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">View All</Link>
            </div>
            <div className="space-y-4">
              {recentActivities.map((act) => {
                const Icon = act.icon
                return (
                  <div key={act.id} className="flex gap-3 items-start">
                    <div className={`p-2 rounded-lg shrink-0 ${act.iconColor}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-700 leading-normal">
                        <span className="font-semibold text-slate-850">{act.user}</span> {act.action}{' '}
                        <span className="font-medium text-slate-600">{act.target}</span>
                      </p>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{act.time}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
