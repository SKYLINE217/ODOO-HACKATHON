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
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Reports & Analytics</h2>
          <p className="text-slate-500 text-sm mt-1">Generate spending charts, track performance scorecards, and export audits.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-lg shadow-indigo-600/10 transition-all cursor-pointer">
          <Download size={16} /> Export Consolidated PDF
        </button>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <IndianRupee size={22} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">YTD Procurement Spend</span>
            <span className="font-extrabold text-slate-800 text-lg block mt-0.5">₹48,50,000</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Users size={22} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Avg. Bid Response Count</span>
            <span className="font-extrabold text-slate-800 text-lg block mt-0.5">3.8 bidders</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <ShieldCheck size={22} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Compliance Rating</span>
            <span className="font-extrabold text-slate-800 text-lg block mt-0.5">94.2%</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Spend by category chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">Spending Distribution by Category</h3>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>IT & Software</span>
                <span>₹8,14,200 (57%)</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full" style={{ width: '57%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>Office supplies</span>
                <span>₹3,30,400 (23%)</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '23%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>Logistics</span>
                <span>₹1,85,000 (13%)</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '13%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>Maintenance</span>
                <span>₹99,400 (7%)</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: '7%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Bid lead time trend */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">Average Bid Response Times (Days)</h3>
          
          {/* Custom SVG Bar Chart */}
          <div className="h-48 flex items-end justify-between px-4 pt-4 border-b border-slate-150 relative">
            {/* Grid Line */}
            <div className="absolute top-12 left-0 right-0 border-t border-slate-100 border-dashed" />
            <div className="absolute top-24 left-0 right-0 border-t border-slate-100 border-dashed" />
            
            {/* Bars */}
            <div className="flex flex-col items-center gap-2 w-12">
              <div className="w-8 bg-indigo-500 hover:bg-indigo-600 rounded-t-lg transition-all" style={{ height: '120px' }}>
                <span className="text-[10px] font-bold text-white text-center block pt-1.5">6.2d</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">Q1</span>
            </div>

            <div className="flex flex-col items-center gap-2 w-12">
              <div className="w-8 bg-indigo-500 hover:bg-indigo-600 rounded-t-lg transition-all" style={{ height: '98px' }}>
                <span className="text-[10px] font-bold text-white text-center block pt-1.5">5.1d</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">Q2</span>
            </div>

            <div className="flex flex-col items-center gap-2 w-12">
              <div className="w-8 bg-indigo-500 hover:bg-indigo-600 rounded-t-lg transition-all" style={{ height: '70px' }}>
                <span className="text-[10px] font-bold text-white text-center block pt-1.5">3.8d</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">Q3</span>
            </div>

            <div className="flex flex-col items-center gap-2 w-12">
              <div className="w-8 bg-emerald-500 hover:bg-emerald-600 rounded-t-lg transition-all" style={{ height: '54px' }}>
                <span className="text-[10px] font-bold text-white text-center block pt-1.5">2.9d</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">Q4</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4 font-semibold text-center flex items-center justify-center gap-1.5">
            <TrendingUp size={14} className="text-emerald-500" /> Response speed improved by 53% YoY.
          </p>
        </div>
      </div>
    </div>
  )
}
