'use client'

import { useState, useEffect } from 'react'
import { 
  Building, 
  ArrowLeft, 
  Award, 
  IndianRupee, 
  CheckCircle2, 
  Eye,
  TrendingDown,
  Info,
  Database,
  Loader2,
  ChevronDown
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useAuthStore } from '@/stores/useAuthStore'

interface BidderQuotation {
  vendor_name: string
  quotation_id?: string
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

interface RFQDetail {
  id: string
  rfq_number: string
  title: string
  items: Array<{ name: string; quantity: number; unit: string }>
  quotations: BidderQuotation[]
}

const mockRfqDetail: RFQDetail = {
  id: 'mock-rfq-1',
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
  ]
}

const supabase = createClient()

export default function QuotationsPage() {
  const user = useAuthStore(state => state.user)

  const [rfqList, setRfqList] = useState<Array<{ id: string; rfq_number: string; title: string }>>([])
  const [selectedRfqId, setSelectedRfqId] = useState<string>('mock')
  const [rfqDetail, setRfqDetail] = useState<RFQDetail>(mockRfqDetail)
  
  const [isDbMode, setIsDbMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [awardedVendor, setAwardedVendor] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Fetch RFQs list on mount
  useEffect(() => {
    async function loadRFQs() {
      try {
        const { data: dbRfqs, error } = await supabase
          .from('rfqs')
          .select('id, rfq_number, title')
          .order('created_at', { ascending: false })

        if (error) throw error

        if (dbRfqs && dbRfqs.length > 0) {
          setRfqList(dbRfqs)
          setSelectedRfqId(dbRfqs[0].id)
          setIsDbMode(true)
        } else {
          // No RFQs in DB yet, fallback to mock
          setRfqList([{ id: 'mock', rfq_number: 'RFQ-2026-00042', title: 'Server Hardware Upgrade (Demo)' }])
          setSelectedRfqId('mock')
          setIsDbMode(false)
        }
      } catch (err) {
        setRfqList([{ id: 'mock', rfq_number: 'RFQ-2026-00042', title: 'Server Hardware Upgrade (Demo)' }])
        setSelectedRfqId('mock')
        setIsDbMode(false)
      } finally {
        setLoading(false)
      }
    }
    loadRFQs()
  }, [])

  // Fetch details when Selected RFQ changes
  useEffect(() => {
    if (selectedRfqId === 'mock') {
      // Load from LocalStorage if user previously awarded something, or load static mock
      const stored = localStorage.getItem('vb_rfq_comparison_mock')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setRfqDetail(parsed)
          const awarded = parsed.quotations.find((q: any) => q.status === 'awarded')
          if (awarded) setAwardedVendor(awarded.vendor_name)
        } catch {
          setRfqDetail(mockRfqDetail)
        }
      } else {
        setRfqDetail(mockRfqDetail)
        setAwardedVendor(null)
      }
      return
    }

    async function loadRfqDetails() {
      try {
        setLoading(true)
        // 1. Fetch RFQ details and its line items
        const { data: rfq, error: rfqErr } = await supabase
          .from('rfqs')
          .select('*')
          .eq('id', selectedRfqId)
          .single()

        if (rfqErr) throw rfqErr

        const { data: rfqItems, error: itemsErr } = await supabase
          .from('rfq_items')
          .select('*')
          .eq('rfq_id', selectedRfqId)
          .order('sort_order', { ascending: true })

        if (itemsErr) throw itemsErr

        // 2. Fetch quotations and quotation line items for this RFQ
        const { data: quotes, error: quotesErr } = await supabase
          .from('quotations')
          .select(`
            id,
            quotation_number,
            status,
            subtotal,
            tax_amount,
            discount_amount,
            total_amount,
            delivery_days,
            validity_days,
            payment_terms,
            notes,
            vendor:vendors(id, company_name)
          `)
          .eq('rfq_id', selectedRfqId)

        if (quotesErr) throw quotesErr

        const finalQuotations: BidderQuotation[] = []

        if (quotes && quotes.length > 0) {
          // Fetch items for each quotation
          for (const q of quotes) {
            const { data: qItems } = await supabase
              .from('quotation_items')
              .select('*')
              .eq('quotation_id', q.id)

            const itemPrices: { [key: string]: number } = {}
            if (qItems) {
              qItems.forEach((qi: any) => {
                itemPrices[qi.item_name] = Number(qi.unit_price)
              })
            }

            const vendorName = (q.vendor as any)?.company_name || 'Unknown Vendor'

            finalQuotations.push({
              quotation_id: q.id,
              vendor_name: vendorName,
              quotation_number: q.quotation_number,
              delivery_days: q.delivery_days || 0,
              validity_days: q.validity_days || 30,
              payment_terms: q.payment_terms || 'N/A',
              subtotal: Number(q.subtotal),
              tax_rate: q.subtotal > 0 ? Math.round((Number(q.tax_amount) / Number(q.subtotal)) * 100) : 18,
              tax_amount: Number(q.tax_amount),
              total_amount: Number(q.total_amount),
              status: q.status as any,
              item_prices: itemPrices
            })
          }
        }

        const formattedDetail: RFQDetail = {
          id: rfq.id,
          rfq_number: rfq.rfq_number,
          title: rfq.title,
          items: (rfqItems || []).map((ri: any) => ({
            name: ri.item_name,
            quantity: Number(ri.quantity),
            unit: ri.unit
          })),
          quotations: finalQuotations
        }

        setRfqDetail(formattedDetail)
        const awarded = finalQuotations.find(q => q.status === 'awarded')
        setAwardedVendor(awarded ? awarded.vendor_name : null)
      } catch (err) {
      } finally {
        setLoading(false)
      }
    }

    loadRfqDetails()
  }, [selectedRfqId])

  // Find lowest price for a specific item among all quotations
  const getLowestPrice = (itemName: string) => {
    if (rfqDetail.quotations.length === 0) return 0
    const prices = rfqDetail.quotations.map(q => q.item_prices[itemName]).filter(p => p !== undefined)
    return prices.length > 0 ? Math.min(...prices) : 0
  }

  // Find lowest total amount among all quotations
  const getLowestTotal = () => {
    if (rfqDetail.quotations.length === 0) return 0
    return Math.min(...rfqDetail.quotations.map(q => q.total_amount))
  }

  const handleAwardContract = async (quo: BidderQuotation) => {
    setActionLoading(true)
    const vendorName = quo.vendor_name

    try {
      if (isDbMode && selectedRfqId !== 'mock' && quo.quotation_id) {
        // 1. Get associated vendor ID
        const { data: dbQuote } = await supabase
          .from('quotations')
          .select('vendor_id')
          .eq('id', quo.quotation_id)
          .single()

        if (!dbQuote) throw new Error('Quotation not found')

        // 2. Transactionally Award Quotation
        // Update awarded quotation status
        await supabase
          .from('quotations')
          .update({ status: 'awarded' })
          .eq('id', quo.quotation_id)

        // Reject other quotations for this RFQ
        await supabase
          .from('quotations')
          .update({ status: 'rejected' })
          .eq('rfq_id', selectedRfqId)
          .neq('id', quo.quotation_id)

        // Close RFQ
        await supabase
          .from('rfqs')
          .update({ status: 'closed', closed_at: new Date().toISOString() })
          .eq('id', selectedRfqId)

        // 3. Generate Purchase Order
        const poPayload = {
          quotation_id: quo.quotation_id,
          vendor_id: dbQuote.vendor_id,
          status: 'issued',
          subtotal: quo.subtotal,
          tax_amount: quo.tax_amount,
          discount_amount: 0,
          total_amount: quo.total_amount,
          currency: 'INR',
          delivery_address: 'Main Warehouse, Gate 3, Sector 4, Bangalore',
          delivery_date: new Date(Date.now() + (quo.delivery_days || 10) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          payment_terms: quo.payment_terms,
          issued_by: user?.id || 'demo-user-id'
        }

        const { data: dbPo, error: poErr } = await supabase
          .from('purchase_orders')
          .insert(poPayload)
          .select()
          .single()

        if (poErr) throw poErr

        // 4. Log Activity
        await supabase.from('activity_logs').insert({
          entity_type: 'rfq',
          entity_id: selectedRfqId,
          action: 'awarded',
          description: `RFQ Contract awarded to ${vendorName}. Purchase Order ${dbPo?.po_number || 'issued'} generated automatically.`,
          performed_by: user?.id
        })

        // Refresh UI state
        setAwardedVendor(vendorName)
        const updatedQuotations = rfqDetail.quotations.map(q => {
          if (q.quotation_id === quo.quotation_id) {
            return { ...q, status: 'awarded' as const }
          } else {
            return { ...q, status: 'rejected' as const }
          }
        })
        setRfqDetail({ ...rfqDetail, quotations: updatedQuotations })
      } else {
        // Mock fallback Mode
        setAwardedVendor(vendorName)
        const updatedQuotations = rfqDetail.quotations.map(q => {
          if (q.vendor_name === vendorName) {
            return { ...q, status: 'awarded' as const }
          } else {
            return { ...q, status: 'rejected' as const }
          }
        })
        const updatedDetail = { ...rfqDetail, quotations: updatedQuotations }
        setRfqDetail(updatedDetail)
        localStorage.setItem('vb_rfq_comparison_mock', JSON.stringify(updatedDetail))

        // Create mock PO in local storage
        const currentPos = JSON.parse(localStorage.getItem('vb_purchase_orders_mock') || '[]')
        const newMockPo = {
          id: 'mock-po-' + Math.random().toString(36).substring(2, 9),
          po_number: 'PO-2026-' + Math.floor(10000 + Math.random() * 90000),
          quotation_ref: quo.quotation_number,
          vendor_name: vendorName,
          status: 'issued',
          subtotal: quo.subtotal,
          tax_amount: quo.tax_amount,
          total_amount: quo.total_amount,
          delivery_date: new Date(Date.now() + (quo.delivery_days || 10) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          issued_at: new Date().toISOString().split('T')[0]
        }
        localStorage.setItem('vb_purchase_orders_mock', JSON.stringify([newMockPo, ...currentPos]))
      }
    } catch (err) {
      alert('Failed to award contract. Please check database logs.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* DB Connection Alert */}
      {!isDbMode && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl p-4 flex items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-2.5">
            <Database size={18} className="shrink-0 text-amber-400" />
            <p className="leading-relaxed">
              <strong>Running in Demo Mode:</strong> Database schema tables were not found or populated. Award actions will save mock data to <code>localStorage</code> instead. Run <code>schema.sql</code> in your Supabase SQL editor to connect persistence.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-[var(--text-muted)] font-mono">QUOTATIONS</span>
            <span className="text-[var(--text-muted)] font-medium">/</span>
            <div className="relative inline-block text-left">
              <select
                value={selectedRfqId}
                onChange={(e) => setSelectedRfqId(e.target.value)}
                className="appearance-none bg-[var(--bg-subtle)] border border-[var(--border-strong)] rounded-lg pl-3 pr-8 py-1.5 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
              >
                {rfqList.map(rfq => (
                  <option key={rfq.id} value={rfq.id} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
                    {rfq.rfq_number} ({rfq.title})
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight mt-2.5 font-display">Quotation Comparison Sheet</h2>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Side-by-side analysis of bids received for "{rfqDetail.title}".</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={32} className="text-[var(--accent)] animate-spin" />
          <span className="text-xs text-[var(--text-secondary)] font-semibold font-mono">Loading comparative matrix...</span>
        </div>
      ) : rfqDetail.quotations.length === 0 ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-12 text-center shadow-sm">
          <Info size={36} className="text-[var(--text-muted)] mx-auto mb-3" />
          <h4 className="font-bold text-[var(--text-primary)] text-sm">No Quotations Received</h4>
          <p className="text-[var(--text-secondary)] text-xs mt-1.5 max-w-sm mx-auto">
            There are no submitted bids or quotes for this RFQ yet. Vendors must submit quotations to populate this comparison sheet.
          </p>
        </div>
      ) : (
        <>
          {/* Overview info box */}
          <div className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] rounded-xl p-6 shadow-lg border border-[var(--border-default)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h3 className="font-bold text-[var(--text-primary)] text-base font-display">Procurement Specification</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-xl">
                Comparing {rfqDetail.quotations.length} vendor quotations. Highlighted cells indicate the lowest submitted prices for respective line items and totals.
              </p>
            </div>
            <div className="flex gap-6 text-xs bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-lg p-3">
              <div>
                <span className="text-[var(--text-muted)] block font-semibold uppercase tracking-wider text-[10px]">Lowest Bid</span>
                <span className="text-emerald-500 font-extrabold text-sm block mt-0.5 f1-numbers">{"\u20B9"}{getLowestTotal().toLocaleString('en-IN')}</span>
              </div>
              <div className="w-px bg-[var(--border-default)]" />
              <div>
                <span className="text-[var(--text-muted)] block font-semibold uppercase tracking-wider text-[10px]">Award Status</span>
                <span className="text-[var(--text-primary)] font-extrabold text-xs block mt-1 capitalize max-w-[150px] truncate">
                  {awardedVendor ? `Awarded to ${awardedVendor}` : 'Pending Decision'}
                </span>
              </div>
            </div>
          </div>

          {/* Side-by-side Comparison Matrix */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border-default)]">
                    <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider w-64">Item Details / Specs</th>
                    {rfqDetail.quotations.map((quo, idx) => (
                      <th key={idx} className="p-4 text-center border-l border-[var(--border-default)]">
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-[var(--text-primary)] text-sm block">{quo.vendor_name}</span>
                          <span className="text-[10px] text-[var(--text-secondary)] font-mono mt-0.5">{quo.quotation_number}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Line Items Pricing comparison */}
                  {rfqDetail.items.map((item, index) => {
                    const lowestPrice = getLowestPrice(item.name)
                    return (
                      <tr key={index} className="border-b border-[var(--border-default)] hover:bg-[var(--bg-subtle)] transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-[var(--text-primary)] text-sm leading-snug">{item.name}</p>
                          <span className="text-xs text-[var(--text-secondary)] font-medium">Quantity: {item.quantity} {item.unit}</span>
                        </td>
                        {rfqDetail.quotations.map((quo, qidx) => {
                          const price = quo.item_prices[item.name] || 0
                          const isLowest = price > 0 && price === lowestPrice
                          const totalItemPrice = price * item.quantity
                          return (
                            <td key={qidx} className="p-4 text-center border-l border-[var(--border-default)]">
                              <div className={`p-3 rounded-lg inline-block w-40 ${
                                isLowest ? 'bg-emerald-500/10 border border-emerald-500/25' : 'bg-[var(--bg-subtle)] border border-[var(--border-strong)]'
                              }`}>
                                <span className={`text-xs font-bold block f1-numbers ${isLowest ? 'text-emerald-500' : 'text-[var(--text-primary)]'}`}>
                                  Unit: {"\u20B9"}{price.toLocaleString('en-IN')}
                                </span>
                                <span className="text-[10px] text-[var(--text-secondary)] font-semibold block mt-0.5 f1-numbers">
                                  Total: {"\u20B9"}{totalItemPrice.toLocaleString('en-IN')}
                                </span>
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}

                  {/* Delivery and Validity Terms */}
                  <tr className="border-b border-[var(--border-default)] bg-[var(--bg-subtle)]/50">
                    <td className="p-4 font-bold text-[var(--text-secondary)] text-xs uppercase tracking-wider font-mono">Delivery Time</td>
                    {rfqDetail.quotations.map((quo, idx) => (
                      <td key={idx} className="p-4 text-center border-l border-[var(--border-default)] text-xs font-bold text-[var(--text-primary)]">
                        {quo.delivery_days} days
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-[var(--border-default)]">
                    <td className="p-4 font-bold text-[var(--text-secondary)] text-xs uppercase tracking-wider font-mono">Payment Terms</td>
                    {rfqDetail.quotations.map((quo, idx) => (
                      <td key={idx} className="p-4 text-center border-l border-[var(--border-default)] text-xs font-bold text-[var(--text-primary)]">
                        {quo.payment_terms}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-[var(--border-default)] bg-[var(--bg-subtle)]/50">
                    <td className="p-4 font-bold text-[var(--text-secondary)] text-xs uppercase tracking-wider font-mono">Validity Period</td>
                    {rfqDetail.quotations.map((quo, idx) => (
                      <td key={idx} className="p-4 text-center border-l border-[var(--border-default)] text-xs font-bold text-[var(--text-primary)]">
                        {quo.validity_days} days
                      </td>
                    ))}
                  </tr>

                  {/* Totals Summary */}
                  <tr className="border-b border-[var(--border-default)] bg-[var(--bg-subtle)]">
                    <td className="p-4">
                      <span className="font-bold text-[var(--text-primary)] text-xs uppercase tracking-wider font-mono">Subtotal</span>
                    </td>
                    {rfqDetail.quotations.map((quo, idx) => (
                      <td key={idx} className="p-4 text-center border-l border-[var(--border-default)] font-bold text-[var(--text-primary)] text-xs f1-numbers">
                        {"\u20B9"}{quo.subtotal.toLocaleString('en-IN')}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-[var(--border-default)] bg-[var(--bg-subtle)]">
                    <td className="p-4">
                      <span className="font-extrabold text-[var(--text-primary)] text-sm uppercase tracking-wider font-mono">Total (incl. GST)</span>
                    </td>
                    {rfqDetail.quotations.map((quo, idx) => {
                      const isLowestTotal = quo.total_amount === getLowestTotal()
                      return (
                        <td key={idx} className={`p-4 text-center border-l border-[var(--border-default)] font-extrabold text-sm ${
                          isLowestTotal ? 'text-emerald-500 bg-emerald-500/10' : 'text-[var(--text-primary)]'
                        }`}>
                          <span className="block f1-numbers">{"\u20B9"}{quo.total_amount.toLocaleString('en-IN')}</span>
                          {isLowestTotal && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 px-1.5 py-0.2 rounded mt-1 font-mono uppercase">
                              <TrendingDown size={10} /> Lowest Offer
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>

                  {/* Award Action Rows */}
                  <tr>
                    <td className="p-4 font-bold text-[var(--text-secondary)] text-xs font-mono">Award Contract</td>
                    {rfqDetail.quotations.map((quo, idx) => (
                      <td key={idx} className="p-4 text-center border-l border-[var(--border-default)]">
                        {quo.status === 'awarded' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 text-xs font-bold font-mono">
                            <CheckCircle2 size={14} /> Awarded
                          </span>
                        ) : quo.status === 'rejected' ? (
                          <span className="text-xs text-[var(--text-muted)] font-semibold italic">Rejected</span>
                        ) : (
                          <button
                            onClick={() => handleAwardContract(quo)}
                            disabled={awardedVendor !== null || actionLoading}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all border cursor-pointer font-mono ${
                              awardedVendor !== null || actionLoading
                                ? 'bg-[var(--bg-subtle)] border-[var(--border-default)] text-[var(--text-muted)] pointer-events-none'
                                : 'bg-[var(--bg-subtle)] hover:bg-[var(--accent)] border-[var(--border-strong)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-white'
                            }`}
                          >
                            {actionLoading ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <>
                                <Award size={14} /> Award
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}


