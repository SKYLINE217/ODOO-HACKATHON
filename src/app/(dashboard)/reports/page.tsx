'use client'

import { useState } from 'react'
import { 
  BarChart3, 
  Download, 
  Calendar, 
  TrendingUp, 
  ShieldCheck, 
  Users, 
  IndianRupee 
} from 'lucide-react'

export default function ReportsPage() {
  const [reportRange, setReportRange] = useState('Quarter 1')

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight font-display">Reports & Analytics</h2>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Generate spending charts, track performance scorecards, and export audits.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg text-sm font-semibold shadow-lg transition-all cursor-pointer">
          <Download size={16} /> Export Consolidated PDF
        </button>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card card-hover flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <IndianRupee size={22} />
          </div>
          <div>
            <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider block">YTD Procurement Spend</span>
            <span className="font-extrabold text-[var(--text-primary)] text-lg block mt-0.5 f1-numbers">{"\u20B9"}48,50,000</span>
          </div>
        </div>

        <div className="card card-hover flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Users size={22} />
          </div>
          <div>
            <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider block">Avg. Bid Response Count</span>
            <span className="font-extrabold text-[var(--text-primary)] text-lg block mt-0.5 f1-numbers">3.8 bidders</span>
          </div>
        </div>

        <div className="card card-hover flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <ShieldCheck size={22} />
          </div>
          <div>
            <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider block">Compliance Rating</span>
            <span className="font-extrabold text-[var(--text-primary)] text-lg block mt-0.5 f1-numbers">94.2%</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Spend by category chart */}
        <div className="card">
          <h3 className="font-bold text-[var(--text-primary)] mb-6 font-display">Spending Distribution by Category</h3>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                <span>IT & Software</span>
                <span className="f1-numbers">{"\u20B9"}8,14,200 (57%)</span>
              </div>
              <div className="w-full h-3 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '57%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                <span>Office supplies</span>
                <span className="f1-numbers">{"\u20B9"}3,30,400 (23%)</span>
              </div>
              <div className="w-full h-3 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '23%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                <span>Logistics</span>
                <span className="f1-numbers">{"\u20B9"}1,85,000 (13%)</span>
              </div>
              <div className="w-full h-3 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '13%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                <span>Maintenance</span>
                <span className="f1-numbers">{"\u20B9"}99,400 (7%)</span>
              </div>
              <div className="w-full h-3 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: '7%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Bid lead time trend */}
        <div className="card">
          <h3 className="font-bold text-[var(--text-primary)] mb-6 font-display">Average Bid Response Times (Days)</h3>
          
          {/* Custom SVG Bar Chart */}
          <div className="h-48 flex items-end justify-between px-4 pt-4 border-b border-[var(--border-default)] relative">
            {/* Grid Line */}
            <div className="absolute top-12 left-0 right-0 border-t border-[var(--border-default)] border-dashed" />
            <div className="absolute top-24 left-0 right-0 border-t border-[var(--border-default)] border-dashed" />
            
            {/* Bars */}
            <div className="flex flex-col items-center gap-2 w-12">
              <div className="w-8 bg-indigo-500 hover:bg-indigo-600 rounded-t transition-all" style={{ height: '120px' }}>
                <span className="text-[10px] font-bold text-white text-center block pt-1.5 f1-numbers">6.2d</span>
              </div>
              <span className="text-[10px] text-[var(--text-muted)] font-semibold f1-numbers">Q1</span>
            </div>

            <div className="flex flex-col items-center gap-2 w-12">
              <div className="w-8 bg-indigo-500 hover:bg-indigo-600 rounded-t transition-all" style={{ height: '98px' }}>
                <span className="text-[10px] font-bold text-white text-center block pt-1.5 f1-numbers">5.1d</span>
              </div>
              <span className="text-[10px] text-[var(--text-muted)] font-semibold f1-numbers">Q2</span>
            </div>

            <div className="flex flex-col items-center gap-2 w-12">
              <div className="w-8 bg-indigo-500 hover:bg-indigo-600 rounded-t transition-all" style={{ height: '70px' }}>
                <span className="text-[10px] font-bold text-white text-center block pt-1.5 f1-numbers">3.8d</span>
              </div>
              <span className="text-[10px] text-[var(--text-muted)] font-semibold f1-numbers">Q3</span>
            </div>

            <div className="flex flex-col items-center gap-2 w-12">
              <div className="w-8 bg-emerald-500 hover:bg-emerald-600 rounded-t transition-all" style={{ height: '54px' }}>
                <span className="text-[10px] font-bold text-white text-center block pt-1.5 f1-numbers">2.9d</span>
              </div>
              <span className="text-[10px] text-[var(--text-muted)] font-semibold f1-numbers">Q4</span>
            </div>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-4 font-semibold text-center flex items-center justify-center gap-1.5">
            <TrendingUp size={14} className="text-emerald-500" /> Response speed improved by 53% YoY.
          </p>
        </div>
      </div>
    </div>
  )
}


