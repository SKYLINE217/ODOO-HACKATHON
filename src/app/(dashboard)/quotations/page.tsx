'use client'

import { useState } from 'react'
import { 
  Building, 
  ArrowLeft, 
  Award, 
  IndianRupee, 
  CheckCircle2, 
  Eye,
  TrendingDown,
  Info
} from 'lucide-react'

interface BidderQuotation {
  vendor_name: string
  quotation_number: string
  delivery_days: number
  validity_days: number
  payment_terms: string
  subtotal: number
  tax_rate: number // %
  tax_amount: number
  total_amount: number
  status: 'submitted' | 'awarded' | 'under_review' | 'rejected'
  item_prices: {
    [key: string]: number // item_name -> unit_price
  }
}

const comparisonData = {
  rfq_number: 'RFQ-2026-00042',
  title: 'Server Hardware Upgrade',
  items: [
    { name: 'Rack Servers (2U)', quantity: 5, unit: 'units' },
    { name: 'Redundant UPS 10kVA', quantity: 2, unit: 'units' }
  ],
  quotations: [
    {
      vendor_name: 'Apex Tech Solutions',
      quotation_number: 'QUO-2026-00017',
      delivery_days: 10,
      validity_days: 30,
      payment_terms: 'Net 30',
      status: 'under_review',
      item_prices: {
        'Rack Servers (2U)': 120000,
        'Redundant UPS 10kVA': 45000
      },
      subtotal: 690000,
      tax_rate: 18,
      tax_amount: 124200,
      total_amount: 814200
    },
    {
      vendor_name: 'Zenith Systems Corp',
      quotation_number: 'QUO-2026-00018',
      delivery_days: 7,
      validity_days: 60,
      payment_terms: 'Net 15',
      status: 'under_review',
      item_prices: {
        'Rack Servers (2U)': 115000,
        'Redundant UPS 10kVA': 48000
      },
      subtotal: 671000,
      tax_rate: 18,
      tax_amount: 120780,
      total_amount: 791780
    },
    {
      vendor_name: 'Delta Digital Ltd',
      quotation_number: 'QUO-2026-00019',
      delivery_days: 15,
      validity_days: 45,
      payment_terms: '50% Advance',
      status: 'under_review',
      item_prices: {
        'Rack Servers (2U)': 125000,
        'Redundant UPS 10kVA': 42000
      },
      subtotal: 709000,
      tax_rate: 18,
      tax_amount: 127620,
      total_amount: 836620
    }
  ] as BidderQuotation[]
}

export default function QuotationsPage() {
  const [rfqComparison, setRfqComparison] = useState(comparisonData)
  const [awardedVendor, setAwardedVendor] = useState<string | null>(null)

  // Find lowest price for a specific item among all quotations
  const getLowestPrice = (itemName: string) => {
    return Math.min(...rfqComparison.quotations.map(q => q.item_prices[itemName]))
  }

  // Find lowest total amount among all quotations
  const getLowestTotal = () => {
    return Math.min(...rfqComparison.quotations.map(q => q.total_amount))
  }

  const handleAwardContract = (vendorName: string) => {
    setAwardedVendor(vendorName)
    const updatedQuotations = rfqComparison.quotations.map(q => {
      if (q.vendor_name === vendorName) {
        return { ...q, status: 'awarded' as const }
      } else {
        return { ...q, status: 'rejected' as const }
      }
    })
    setRfqComparison({ ...rfqComparison, quotations: updatedQuotations })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Quotations</span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-mono">
              {rfqComparison.rfq_number}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight mt-1.5">Quotation Comparison Sheet</h2>
          <p className="text-slate-500 text-sm mt-1">Side-by-side analysis of bids received for "{rfqComparison.title}".</p>
        </div>
      </div>

      {/* Overview info box */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-xl p-6 shadow-lg border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h3 className="font-bold text-base">Procurement Specification</h3>
          <p className="text-xs text-indigo-200 mt-1 max-w-xl">
            Comparing 3 vendor quotations. Green highlights indicate the lowest submitted prices for respective line items and totals.
          </p>
        </div>
        <div className="flex gap-6 text-xs bg-white/10 backdrop-blur border border-white/10 rounded-lg p-3">
          <div>
            <span className="text-indigo-200 block font-semibold uppercase tracking-wider text-[10px]">Lowest Bid</span>
            <span className="text-emerald-400 font-extrabold text-sm block mt-0.5">₹{getLowestTotal().toLocaleString('en-IN')}</span>
          </div>
          <div className="w-px bg-white/20" />
          <div>
            <span className="text-indigo-200 block font-semibold uppercase tracking-wider text-[10px]">Award Status</span>
            <span className="text-white font-extrabold text-xs block mt-1 capitalize">
              {awardedVendor ? `Awarded to ${awardedVendor}` : 'Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Side-by-side Comparison Matrix */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-64">Item Details / Specs</th>
                {rfqComparison.quotations.map((quo, idx) => (
                  <th key={idx} className="p-4 text-center border-l border-slate-200/50">
                    <div className="flex flex-col items-center">
                      <span className="font-extrabold text-slate-850 text-sm block">{quo.vendor_name}</span>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5">{quo.quotation_number}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Line Items Pricing comparison */}
              {rfqComparison.items.map((item, index) => {
                const lowestPrice = getLowestPrice(item.name)
                return (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-800 text-sm leading-snug">{item.name}</p>
                      <span className="text-xs text-slate-400 font-medium">Quantity: {item.quantity} {item.unit}</span>
                    </td>
                    {rfqComparison.quotations.map((quo, qidx) => {
                      const price = quo.item_prices[item.name]
                      const isLowest = price === lowestPrice
                      const totalItemPrice = price * item.quantity
                      return (
                        <td key={qidx} className="p-4 text-center border-l border-slate-200/50">
                          <div className={`p-3 rounded-lg inline-block w-40 ${
                            isLowest ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50/50'
                          }`}>
                            <span className={`text-xs font-bold block ${isLowest ? 'text-emerald-700' : 'text-slate-500'}`}>
                              Unit: ₹{price.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                              Total: ₹{totalItemPrice.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}

              {/* Delivery and Validity Terms */}
              <tr className="border-b border-slate-100 bg-slate-50/30">
                <td className="p-4 font-bold text-slate-700 text-xs uppercase tracking-wider">Delivery Time</td>
                {rfqComparison.quotations.map((quo, idx) => (
                  <td key={idx} className="p-4 text-center border-l border-slate-200/50 text-xs font-bold text-slate-700">
                    {quo.delivery_days} days
                  </td>
                ))}
              </tr>
              <tr className="border-b border-slate-100">
                <td className="p-4 font-bold text-slate-700 text-xs uppercase tracking-wider">Payment Terms</td>
                {rfqComparison.quotations.map((quo, idx) => (
                  <td key={idx} className="p-4 text-center border-l border-slate-200/50 text-xs font-bold text-slate-700">
                    {quo.payment_terms}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-slate-100 bg-slate-50/30">
                <td className="p-4 font-bold text-slate-700 text-xs uppercase tracking-wider">Validity Period</td>
                {rfqComparison.quotations.map((quo, idx) => (
                  <td key={idx} className="p-4 text-center border-l border-slate-200/50 text-xs font-bold text-slate-700">
                    {quo.validity_days} days
                  </td>
                ))}
              </tr>

              {/* Totals Summary */}
              <tr className="border-b border-slate-200 bg-slate-50">
                <td className="p-4">
                  <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Subtotal</span>
                </td>
                {rfqComparison.quotations.map((quo, idx) => (
                  <td key={idx} className="p-4 text-center border-l border-slate-200/50 font-bold text-slate-600 text-xs">
                    ₹{quo.subtotal.toLocaleString('en-IN')}
                  </td>
                ))}
              </tr>
              <tr className="border-b-2 border-slate-300 bg-indigo-50/30">
                <td className="p-4">
                  <span className="font-extrabold text-indigo-900 text-sm uppercase tracking-wider">Total (incl. {rfqComparison.quotations[0].tax_rate}% GST)</span>
                </td>
                {rfqComparison.quotations.map((quo, idx) => {
                  const isLowestTotal = quo.total_amount === getLowestTotal()
                  return (
                    <td key={idx} className={`p-4 text-center border-l border-slate-200/50 font-extrabold text-sm ${
                      isLowestTotal ? 'text-emerald-700 bg-emerald-50/50' : 'text-slate-800'
                    }`}>
                      <span className="block">₹{quo.total_amount.toLocaleString('en-IN')}</span>
                      {isLowestTotal && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded mt-1">
                          <TrendingDown size={10} /> Lowest Offer
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>

              {/* Award Action Rows */}
              <tr>
                <td className="p-4 font-bold text-slate-600 text-xs">Award Contract</td>
                {rfqComparison.quotations.map((quo, idx) => (
                  <td key={idx} className="p-4 text-center border-l border-slate-200/50">
                    {quo.status === 'awarded' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                        <CheckCircle2 size={14} /> Awarded
                      </span>
                    ) : quo.status === 'rejected' ? (
                      <span className="text-xs text-slate-400 font-semibold italic">Rejected</span>
                    ) : (
                      <button
                        onClick={() => handleAwardContract(quo.vendor_name)}
                        disabled={awardedVendor !== null}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all border cursor-pointer ${
                          awardedVendor !== null
                            ? 'bg-slate-50 border-slate-100 text-slate-400 pointer-events-none'
                            : 'bg-white hover:bg-indigo-600 border-indigo-200 hover:border-indigo-600 text-indigo-600 hover:text-white'
                        }`}
                      >
                        <Award size={14} /> Award
                      </button>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
