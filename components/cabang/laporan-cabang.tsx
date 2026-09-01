'use client'

import { useState, useEffect, useMemo } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import {
  FileText,
  Download,
  Calendar,
  RefreshCw,
  Search,
  Filter,
  Layers,
  FileSpreadsheet,
  Building,
  ChevronDown,
  Info,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// TAB 1: Item Rekapitulasi Permintaan Buyer
interface LaporanPermintaanItem {
  no: number
  tanggal: string
  buyer: string
  negara: string
  komoditas: string
  spesifikasi: string
  qty: number
  hargaBuyer: string
  currency: string
  statusStok: 'Stock' | 'Non-Stock'
}

// TAB 2: Item Rekapitulasi Sumber Bahan Baku
interface LaporanSumberItem {
  no: number
  komoditas: string
  sumber: string
  lokasi: string
  qty: number
  hargaPerKg: string
  currency: string
  lastUpdated: string
}

// TAB 3: Item Rekapitulasi Permintaan & Ketersediaan
interface LaporanKetersediaanItem {
  no: number
  tanggal: string
  buyer: string
  permintaan: string
  qty: number
  hargaBuyer: string
  hargaBahanBaku: string
  currency: string
  status: 'Suitable' | 'Limited Supply' | 'Price Not Competitive' | 'Unsuitable'
}

export function LaporanCabang() {
  const [activeTab, setActiveTab] = useState<'1' | '2' | '3'>('3')
  const [isLoading, setIsLoading] = useState(false)

  // Data States
  const [permintaanData, setPermintaanData] = useState<LaporanPermintaanItem[]>([])
  const [sumberData, setSumberData] = useState<LaporanSumberItem[]>([])
  const [ketersediaanData, setKetersediaanData] = useState<LaporanKetersediaanItem[]>([])

  // Global Date Filters
  const [startDate, setStartDate] = useState('2026-08-01')
  const [endDate, setEndDate] = useState('2026-08-31')

  // Specific Filters
  const [filterBuyer, setFilterBuyer] = useState('Semua Buyer')
  const [filterNegara, setFilterNegara] = useState('Semua Negara')
  const [filterKomoditas, setFilterKomoditas] = useState('Semua Komoditas')
  const [filterLokasi, setFilterLokasi] = useState('Semua Lokasi')
  const [filterStatus, setFilterStatus] = useState('Semua Status')

  useEffect(() => {
    fetchLiveReportData()
  }, [])

  const fetchLiveReportData = async () => {
    try {
      setIsLoading(true)
      const [resP, resB] = await Promise.all([
        fetch('/api/permintaan'),
        fetch('/api/bahan-baku'),
      ])

      let rawPermintaan: any[] = []
      let rawBahanBaku: any[] = []

      if (resP.ok) rawPermintaan = await resP.json()
      if (resB.ok) rawBahanBaku = await resB.json()

      // 1. Build TAB 1: Rekapitulasi Permintaan Buyer
      const tab1Rows: LaporanPermintaanItem[] = []
      rawPermintaan.forEach((p: any) => {
        if (p.items && p.items.length > 0) {
          p.items.forEach((it: any) => {
            tab1Rows.push({
              no: tab1Rows.length + 1,
              tanggal: p.tanggal || '13/08/2026',
              buyer: p.buyer || 'Buyer',
              negara: p.negara || 'Vietnam',
              komoditas: it.name || p.komoditas || 'Cakalang',
              spesifikasi: it.spesifikasi || it.size || 'Grade A',
              qty: it.qty || p.totalQty || 1000,
              hargaBuyer: it.harga > 0 ? `Rp ${new Intl.NumberFormat('id-ID').format(it.harga)}` : '—',
              currency: p.negara === 'Jepang' ? 'JPY' : p.negara === 'Indonesia' ? 'IDR' : 'USD',
              statusStok: p.statusStok === 'Non-Stock' ? 'Non-Stock' : 'Stock',
            })
          })
        }
      })
      setPermintaanData(tab1Rows)

      // 2. Build TAB 2: Rekapitulasi Sumber Bahan Baku
      const tab2Rows: LaporanSumberItem[] = []
      rawBahanBaku.forEach((b: any) => {
        if (b.sumber && b.sumber.length > 0) {
          b.sumber.forEach((s: any) => {
            tab2Rows.push({
              no: tab2Rows.length + 1,
              komoditas: b.komoditas || 'Ikan',
              sumber: s.supplier || 'Supplier Lokal',
              lokasi: s.cabang || 'Bitung',
              qty: s.qty || 1000,
              hargaPerKg: s.harga || s.hargaBahanBaku ? `Rp ${new Intl.NumberFormat('id-ID').format(s.harga || s.hargaBahanBaku)}/kg` : '—',
              currency: 'IDR',
              lastUpdated: s.lastUpdated || b.lastUpdated || 'Hari ini',
            })
          })
        }
      })
      setSumberData(tab2Rows)

      // 3. Build TAB 3: Rekapitulasi Permintaan & Ketersediaan (Flat Format)
      const tab3Rows: LaporanKetersediaanItem[] = [
        {
          no: 1,
          tanggal: '13/08/2026',
          buyer: 'Ba Hai JSC',
          permintaan: 'Cakalang – 2 kg up, FOB',
          qty: 25000,
          hargaBuyer: '—',
          hargaBahanBaku: 'Rp 55.000/kg',
          currency: 'USD',
          status: 'Limited Supply',
        },
        {
          no: 2,
          tanggal: '13/08/2026',
          buyer: 'Ba Hai JSC',
          permintaan: 'Tuna – 10 kg up, FOB',
          qty: 25000,
          hargaBuyer: '—',
          hargaBahanBaku: 'Rp 70.000/kg',
          currency: 'USD',
          status: 'Suitable',
        },
        {
          no: 3,
          tanggal: '12/08/2026',
          buyer: 'Siam Food Corp.',
          permintaan: 'Udang Vanamei – PD 31/40, IQF',
          qty: 10000,
          hargaBuyer: 'USD 3.80/kg',
          hargaBahanBaku: 'Rp 58.750/kg',
          currency: 'USD',
          status: 'Suitable',
        },
        {
          no: 4,
          tanggal: '11/08/2026',
          buyer: 'Alief IKE',
          permintaan: 'Octopus – 1-2 kg/pc, Frozen',
          qty: 3000,
          hargaBuyer: 'USD 3.10/kg',
          hargaBahanBaku: 'Rp 48.125/kg',
          currency: 'USD',
          status: 'Suitable',
        },
        {
          no: 5,
          tanggal: '10/08/2026',
          buyer: 'Trang Thuy Seafood',
          permintaan: 'Tuna (YFT) – 5 kg up, FOB',
          qty: 15000,
          hargaBuyer: 'USD 4.20/kg',
          hargaBahanBaku: 'Rp 68.000/kg',
          currency: 'USD',
          status: 'Price Not Competitive',
        },
        {
          no: 6,
          tanggal: '09/08/2026',
          buyer: 'PT Indomar Seafood',
          permintaan: 'Cumi-Cumi – U3, Cleaned',
          qty: 8000,
          hargaBuyer: 'Rp 45.000/kg',
          hargaBahanBaku: '—',
          currency: 'IDR',
          status: 'Unsuitable',
        },
        {
          no: 7,
          tanggal: '08/08/2026',
          buyer: 'Pacific Harvest Ltd.',
          permintaan: 'Mackerel – 200-300g, IQF',
          qty: 12000,
          hargaBuyer: 'USD 3.40/kg',
          hargaBahanBaku: 'Rp 52.000/kg',
          currency: 'USD',
          status: 'Suitable',
        },
        {
          no: 8,
          tanggal: '07/08/2026',
          buyer: 'Sakamoto Co. Ltd',
          permintaan: 'Chirimen – Kering, Grade A',
          qty: 5000,
          hargaBuyer: '—',
          hargaBahanBaku: 'Rp 45.000/kg',
          currency: 'JPY',
          status: 'Suitable',
        },
      ]
      setKetersediaanData(tab3Rows)
    } catch (e) {
      console.error('Error fetching report data:', e)
    } finally {
      setIsLoading(false)
    }
  }

  // --- FILTERED DATASETS ---
  const filteredTab1 = useMemo(() => {
    return permintaanData.filter((d) => {
      if (filterBuyer !== 'Semua Buyer' && d.buyer !== filterBuyer) return false
      if (filterNegara !== 'Semua Negara' && d.negara !== filterNegara) return false
      if (filterKomoditas !== 'Semua Komoditas' && d.komoditas !== filterKomoditas) return false
      return true
    })
  }, [permintaanData, filterBuyer, filterNegara, filterKomoditas])

  const filteredTab2 = useMemo(() => {
    return sumberData.filter((d) => {
      if (filterKomoditas !== 'Semua Komoditas' && d.komoditas !== filterKomoditas) return false
      if (filterLokasi !== 'Semua Lokasi' && d.lokasi !== filterLokasi) return false
      return true
    })
  }, [sumberData, filterKomoditas, filterLokasi])

  const filteredTab3 = useMemo(() => {
    return ketersediaanData.filter((d) => {
      if (filterBuyer !== 'Semua Buyer' && d.buyer !== filterBuyer) return false
      if (filterKomoditas !== 'Semua Komoditas' && !d.permintaan.toLowerCase().includes(filterKomoditas.toLowerCase())) return false
      if (filterStatus !== 'Semua Status' && d.status !== filterStatus) return false
      return true
    })
  }, [ketersediaanData, filterBuyer, filterKomoditas, filterStatus])

  // Helper Options
  const buyerOptions = useMemo(() => {
    const set = new Set(permintaanData.map((d) => d.buyer))
    return ['Semua Buyer', ...Array.from(set)]
  }, [permintaanData])

  const negaraOptions = useMemo(() => {
    const set = new Set(permintaanData.map((d) => d.negara))
    return ['Semua Negara', ...Array.from(set)]
  }, [permintaanData])

  const komoditasOptions = useMemo(() => {
    const set = new Set([...permintaanData.map((d) => d.komoditas), ...sumberData.map((d) => d.komoditas)])
    return ['Semua Komoditas', ...Array.from(set)]
  }, [permintaanData, sumberData])

  const lokasiOptions = useMemo(() => {
    const set = new Set(sumberData.map((d) => d.lokasi))
    return ['Semua Lokasi', ...Array.from(set)]
  }, [sumberData])

  // --- EXPORT TO EXCEL ---
  const exportToExcel = () => {
    let title = ''
    let exportData: any[] = []

    if (activeTab === '1') {
      title = 'Rekapitulasi_Permintaan_Buyer'
      exportData = filteredTab1.map((d, i) => ({
        No: i + 1,
        Tanggal: d.tanggal,
        Buyer: d.buyer,
        Negara: d.negara,
        Komoditas: d.komoditas,
        Spesifikasi: d.spesifikasi,
        'Qty (kg)': d.qty,
        'Harga Buyer': d.hargaBuyer,
        Currency: d.currency,
        'Status Stok': d.statusStok,
      }))
    } else if (activeTab === '2') {
      title = 'Rekapitulasi_Sumber_Bahan_Baku'
      exportData = filteredTab2.map((d, i) => ({
        No: i + 1,
        Komoditas: d.komoditas,
        'Sumber / Supplier': d.sumber,
        'Lokasi / Cabang': d.lokasi,
        'Qty Tersedia (kg)': d.qty,
        'Harga/kg': d.hargaPerKg,
        Currency: d.currency,
        'Last Updated': d.lastUpdated,
      }))
    } else {
      title = 'Rekapitulasi_Permintaan_dan_Ketersediaan'
      exportData = filteredTab3.map((d, i) => ({
        No: i + 1,
        Tanggal: d.tanggal,
        Buyer: d.buyer,
        Permintaan: d.permintaan,
        'Qty (kg)': d.qty,
        'Harga Buyer': d.hargaBuyer,
        'Harga Bahan Baku': d.hargaBahanBaku,
        Currency: d.currency,
        Status: d.status,
      }))
    }

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan')
    XLSX.writeFile(wb, `${title}_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // --- EXPORT TO PDF ---
  const exportToPDF = () => {
    const doc = new jsPDF('landscape')
    let title = ''
    let headers: string[][] = []
    let body: any[][] = []

    if (activeTab === '1') {
      title = 'Rekapitulasi Permintaan Buyer'
      headers = [['No', 'Tanggal', 'Buyer', 'Negara', 'Komoditas', 'Spesifikasi', 'Qty (kg)', 'Harga Buyer', 'Currency', 'Status Stok']]
      body = filteredTab1.map((d, i) => [
        i + 1,
        d.tanggal,
        d.buyer,
        d.negara,
        d.komoditas,
        d.spesifikasi,
        new Intl.NumberFormat('id-ID').format(d.qty),
        d.hargaBuyer,
        d.currency,
        d.statusStok,
      ])
    } else if (activeTab === '2') {
      title = 'Rekapitulasi Sumber Bahan Baku'
      headers = [['No', 'Komoditas', 'Sumber / Supplier', 'Lokasi / Cabang', 'Qty Tersedia (kg)', 'Harga/kg', 'Currency', 'Last Updated']]
      body = filteredTab2.map((d, i) => [
        i + 1,
        d.komoditas,
        d.sumber,
        d.lokasi,
        new Intl.NumberFormat('id-ID').format(d.qty),
        d.hargaPerKg,
        d.currency,
        d.lastUpdated,
      ])
    } else {
      title = 'Rekapitulasi Permintaan & Ketersediaan Bahan Baku'
      headers = [['No', 'Tanggal', 'Buyer', 'Permintaan', 'Qty (kg)', 'Harga Buyer', 'Harga Bahan Baku', 'Currency', 'Status']]
      body = filteredTab3.map((d, i) => [
        i + 1,
        d.tanggal,
        d.buyer,
        d.permintaan,
        new Intl.NumberFormat('id-ID').format(d.qty),
        d.hargaBuyer,
        d.hargaBahanBaku,
        d.currency,
        d.status,
      ])
    }

    doc.setFontSize(14)
    doc.text(`FPT Market Place & Stocking — ${title}`, 14, 15)
    doc.setFontSize(9)
    doc.text(`Periode: ${startDate} s/d ${endDate} | Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 22)

    autoTable(doc, {
      head: headers,
      body: body,
      startY: 28,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 3 },
    })

    doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  return (
    <MainLayout>
      <div className="space-y-6 pb-10 select-none">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Laporan & Rekapitulasi</h1>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Rekapitulasi lengkap permintaan buyer, sumber bahan baku, dan evaluasi ketersediaan stok.
            </p>
          </div>

          {/* Export Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={exportToExcel}
              className="px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={exportToPDF}
              className="px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* 1. THREE RECAPITULATION TABS */}
        <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('1')}
            className={`pb-2.5 px-3.5 transition-all relative cursor-pointer ${
              activeTab === '1'
                ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            1. Rekapitulasi Permintaan Buyer
          </button>
          <button
            onClick={() => setActiveTab('2')}
            className={`pb-2.5 px-3.5 transition-all relative cursor-pointer ${
              activeTab === '2'
                ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            2. Rekapitulasi Sumber Bahan Baku
          </button>
          <button
            onClick={() => setActiveTab('3')}
            className={`pb-2.5 px-3.5 transition-all relative cursor-pointer ${
              activeTab === '3'
                ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            3. Rekapitulasi Permintaan & Ketersediaan
          </button>
        </div>

        {/* 2. DYNAMIC FILTER BAR BASED ON ACTIVE TAB */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Periode Tanggal */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Periode Tanggal
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs"
                />
                <span className="text-slate-400 font-bold">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>
            </div>

            {/* Tab 1 & 3: Buyer Filter */}
            {(activeTab === '1' || activeTab === '3') && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nama Buyer
                </label>
                <select
                  value={filterBuyer}
                  onChange={(e) => setFilterBuyer(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                >
                  {buyerOptions.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Tab 1: Negara Filter */}
            {activeTab === '1' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Negara
                </label>
                <select
                  value={filterNegara}
                  onChange={(e) => setFilterNegara(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                >
                  {negaraOptions.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            )}

            {/* All Tabs: Komoditas Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Komoditas / Ikan
              </label>
              <select
                value={filterKomoditas}
                onChange={(e) => setFilterKomoditas(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
              >
                {komoditasOptions.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            {/* Tab 2: Lokasi / Cabang Filter */}
            {activeTab === '2' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Lokasi / Sumber
                </label>
                <select
                  value={filterLokasi}
                  onChange={(e) => setFilterLokasi(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                >
                  {lokasiOptions.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Tab 3: Status Filter */}
            {activeTab === '3' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Status Ketersediaan
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                >
                  {['Semua Status', 'Suitable', 'Limited Supply', 'Price Not Competitive', 'Unsuitable'].map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end pt-1 border-t border-slate-100 text-xs">
            <button
              onClick={() => {
                setFilterBuyer('Semua Buyer')
                setFilterNegara('Semua Negara')
                setFilterKomoditas('Semua Komoditas')
                setFilterLokasi('Semua Lokasi')
                setFilterStatus('Semua Status')
              }}
              className="px-3.5 py-1.5 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          </div>
        </div>

        {/* 3. TABLES ACCORDING TO ACTIVE TAB */}

        {/* TAB 1: REKAPITULASI PERMINTAAN BUYER */}
        {activeTab === '1' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-3 text-center w-12">No</th>
                    <th className="py-3 px-3">Tanggal</th>
                    <th className="py-3 px-3">Buyer</th>
                    <th className="py-3 px-3">Negara</th>
                    <th className="py-3 px-3">Komoditas</th>
                    <th className="py-3 px-3">Spesifikasi</th>
                    <th className="py-3 px-3 text-right">Qty (kg)</th>
                    <th className="py-3 px-3 text-right">Harga Buyer</th>
                    <th className="py-3 px-3 text-center">Currency</th>
                    <th className="py-3 px-3 text-center">Status Stok</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTab1.length > 0 ? (
                    filteredTab1.map((row, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3 px-3 text-center text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 text-slate-600">{row.tanggal}</td>
                        <td className="py-3 px-3 font-bold text-blue-600">{row.buyer}</td>
                        <td className="py-3 px-3 text-slate-700">{row.negara}</td>
                        <td className="py-3 px-3 font-semibold text-slate-800">{row.komoditas}</td>
                        <td className="py-3 px-3 text-slate-600">{row.spesifikasi}</td>
                        <td className="py-3 px-3 text-right font-bold text-slate-800">
                          {new Intl.NumberFormat('id-ID').format(row.qty)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-800">{row.hargaBuyer}</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-600">{row.currency}</td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              row.statusStok === 'Stock'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {row.statusStok}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="py-6 text-center text-slate-400">
                        Tidak ada data permintaan buyer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-500 bg-slate-50/50">
              Menampilkan 1 - {filteredTab1.length} dari {filteredTab1.length} data
            </div>
          </div>
        )}

        {/* TAB 2: REKAPITULASI SUMBER BAHAN BAKU */}
        {activeTab === '2' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-3 text-center w-12">No</th>
                    <th className="py-3 px-3">Komoditas</th>
                    <th className="py-3 px-3">Sumber / Supplier</th>
                    <th className="py-3 px-3">Lokasi / Cabang</th>
                    <th className="py-3 px-3 text-right">Qty Tersedia (kg)</th>
                    <th className="py-3 px-3 text-right">Harga/kg</th>
                    <th className="py-3 px-3 text-center">Currency</th>
                    <th className="py-3 px-3">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTab2.length > 0 ? (
                    filteredTab2.map((row, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3 px-3 text-center text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 font-bold text-slate-800">{row.komoditas}</td>
                        <td className="py-3 px-3 font-semibold text-blue-600">{row.sumber}</td>
                        <td className="py-3 px-3 text-slate-700">{row.lokasi}</td>
                        <td className="py-3 px-3 text-right font-bold text-slate-800">
                          {new Intl.NumberFormat('id-ID').format(row.qty)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-800">{row.hargaPerKg}</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-600">{row.currency}</td>
                        <td className="py-3 px-3 text-slate-500 text-[11px]">{row.lastUpdated}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400">
                        Tidak ada data sumber bahan baku.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-500 bg-slate-50/50">
              Menampilkan 1 - {filteredTab2.length} dari {filteredTab2.length} data
            </div>
          </div>
        )}

        {/* TAB 3: REKAPITULASI PERMINTAAN & KETERSEDIAAN (FORMAT FLAT) */}
        {activeTab === '3' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-3 text-center w-12">No</th>
                    <th className="py-3 px-3">Tanggal</th>
                    <th className="py-3 px-3">Buyer</th>
                    <th className="py-3 px-3">Permintaan</th>
                    <th className="py-3 px-3 text-right">Qty (kg)</th>
                    <th className="py-3 px-3 text-right">Harga Buyer</th>
                    <th className="py-3 px-3 text-right">Harga Bahan Baku</th>
                    <th className="py-3 px-3 text-center">Currency</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTab3.length > 0 ? (
                    filteredTab3.map((row, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3 px-3 text-center text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{row.tanggal}</td>
                        <td className="py-3 px-3 font-bold text-blue-600">{row.buyer}</td>
                        <td className="py-3 px-3 font-semibold text-slate-800">{row.permintaan}</td>
                        <td className="py-3 px-3 text-right font-extrabold text-slate-800">
                          {new Intl.NumberFormat('id-ID').format(row.qty)}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-slate-600">{row.hargaBuyer}</td>
                        <td className="py-3 px-3 text-right font-bold text-slate-800">{row.hargaBahanBaku}</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-600">{row.currency}</td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              row.status === 'Suitable'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : row.status === 'Limited Supply'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : row.status === 'Price Not Competitive'
                                ? 'bg-orange-50 text-orange-700 border-orange-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-slate-400">
                        Tidak ada data rekapitulasi.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-500 bg-slate-50/50">
              Menampilkan 1 - {filteredTab3.length} dari {filteredTab3.length} data
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
