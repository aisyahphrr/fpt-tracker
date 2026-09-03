'use client'

import { useState, useEffect, useMemo } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { DAFTAR_CABANG } from '@/lib/constants/cabang'
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
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// --- INTERFACES ---
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
  statusTransaksi: string
  statusStok: 'Stock' | 'Non-Stock'
}

interface LaporanStockItem {
  no: number
  kode: string
  komoditas: string
  spesifikasi: string
  cabang: string
  qtyAvailable: number
  satuan: string
  status: string
  lastUpdated: string
}

interface LaporanApprovalItem {
  no: number
  tanggal: string
  buyer: string
  permintaan: string
  spesifikasi: string
  qtyPermintaan: number
  hargaBuyer: string
  qtyTersedia: number
  hargaAkhir: string
  persentaseSelisih: string
  selisihPositive: boolean
  status: 'Menunggu' | 'Disetujui' | 'Ditolak'
}

export function LaporanCabang() {
  // Tabs: '1' = Rekap Permintaan Buyer, '2' = Rekap Stock, '3' = Rekap Approval
  const [activeTab, setActiveTab] = useState<'1' | '2' | '3'>('1')
  const [isLoading, setIsLoading] = useState(false)

  // Datasets
  const [permintaanData, setPermintaanData] = useState<LaporanPermintaanItem[]>([])
  const [stockData, setStockData] = useState<LaporanStockItem[]>([])
  const [approvalData, setApprovalData] = useState<LaporanApprovalItem[]>([])

  // Date Filters
  const [startDate, setStartDate] = useState('2026-05-01')
  const [endDate, setEndDate] = useState('2026-09-30')

  // Specific Filter States
  const [filterBuyer, setFilterBuyer] = useState('Semua Buyer')
  const [filterNegara, setFilterNegara] = useState('Semua Negara')
  const [filterKomoditas, setFilterKomoditas] = useState('Semua Komoditas')
  const [filterCabang, setFilterCabang] = useState('Semua Cabang')
  const [filterApprovalStatus, setFilterApprovalStatus] = useState('Semua Status')

  useEffect(() => {
    fetchLiveReportData()
  }, [])

  const fetchLiveReportData = async () => {
    try {
      setIsLoading(true)
      const [resP, resBarang, resAppr] = await Promise.all([
        fetch('/api/permintaan'),
        fetch('/api/barang'),
        fetch('/api/approval'),
      ])

      let rawPermintaan: any[] = []
      let rawBarang: any[] = []
      let rawApproval: any[] = []

      if (resP.ok) rawPermintaan = await resP.json()
      if (resBarang.ok) rawBarang = await resBarang.json()
      if (resAppr.ok) rawApproval = await resAppr.json()

      // 1. Build TAB 1: Rekapitulasi Permintaan Buyer (Semua status: Selesai, Pending, In-Progress)
      const tab1Rows: LaporanPermintaanItem[] = []
      if (Array.isArray(rawPermintaan)) {
        rawPermintaan.forEach((p: any) => {
          const items = p.items && p.items.length > 0 ? p.items : [{ name: p.komoditas || 'Ikan Laut', qty: p.totalQty || 1000, harga: 0 }]
          items.forEach((it: any) => {
            const rawPrice = Number(it.harga) || 0
            const curr = p.negara === 'Jepang' ? 'JPY' : p.negara === 'Indonesia' ? 'IDR' : 'USD'
            const priceStr = rawPrice > 0 ? `Rp ${new Intl.NumberFormat('id-ID').format(rawPrice)}` : '—'
            const statusLabel = p.status === 'approved' || p.status === 'completed' || p.status === 'selesai'
              ? 'Selesai'
              : p.status === 'processing' || p.status === 'proses'
              ? 'Diproses'
              : 'Menunggu / Pending'

            tab1Rows.push({
              no: tab1Rows.length + 1,
              tanggal: p.tanggal || '13/08/2026',
              buyer: p.buyer || 'Buyer',
              negara: p.negara || 'Vietnam',
              komoditas: it.name || p.komoditas || 'Ikan Laut',
              spesifikasi: it.spesifikasi || it.size || 'Grade A',
              qty: Number(it.qty) || Number(p.totalQty) || 1000,
              hargaBuyer: priceStr,
              currency: curr,
              statusTransaksi: statusLabel,
              statusStok: p.statusStok === 'Non-Stock' ? 'Non-Stock' : 'Stock',
            })
          })
        })
      }
      setPermintaanData(tab1Rows)

      // 2. Build TAB 2: Rekapitulasi Stock (Stok Gudang Real-Time dari Database)
      const tab2Rows: LaporanStockItem[] = []
      if (Array.isArray(rawBarang)) {
        rawBarang.forEach((b: any, idx: number) => {
          const avail = typeof b.stokAwal === 'number' ? b.stokAwal : 0
          tab2Rows.push({
            no: idx + 1,
            kode: b.kode || `STK-${String(idx + 1).padStart(3, '0')}`,
            komoditas: b.nama || 'Ikan',
            spesifikasi: b.kategori || 'Grade A',
            cabang: b.cabang || 'Jakarta',
            qtyAvailable: avail,
            satuan: b.satuan || 'kg',
            status: b.status || 'aktif',
            lastUpdated: b.lastUpdated || 'Hari ini',
          })
        })
      }
      setStockData(tab2Rows)

      // 3. Build TAB 3: Rekapitulasi Approval (Sesuai Struktur Persetujuan & Evaluasi)
      const tab3Rows: LaporanApprovalItem[] = []
      if (Array.isArray(rawApproval)) {
        rawApproval.forEach((appr: any, idx: number) => {
          const sumberList = appr.sumberList || []
          const approvedSources = sumberList.filter((s: any) => s.selected)
          const activeSources = approvedSources.length > 0 ? approvedSources : sumberList

          const qtyTersedia = activeSources.reduce((sum: number, s: any) => sum + (Number(s.qty) || 0), 0)
          const avgHarga = activeSources.length > 0
            ? Math.round(activeSources.reduce((sum: number, s: any) => sum + (Number(s.harga) || 0), 0) / activeSources.length)
            : 0

          const kurs = appr.kursIDR || 16200
          const hargaBuyerIDR = Math.round((appr.hargaBuyerUSD || 0) * kurs)
          const diff = avgHarga - hargaBuyerIDR
          const pct = hargaBuyerIDR > 0 ? ((diff / hargaBuyerIDR) * 100).toFixed(1) : '0'

          tab3Rows.push({
            no: idx + 1,
            tanggal: appr.tanggalRequest || '26 Mei 2026',
            buyer: appr.buyer || 'Buyer',
            permintaan: appr.komoditas || 'Komoditas',
            spesifikasi: `${appr.incoterm || 'FOB'} (Target: ${appr.targetPengiriman || 'Juni 2026'})`,
            qtyPermintaan: Number(appr.qtyPermintaan) || 0,
            hargaBuyer: appr.hargaBuyerUSD ? `USD ${appr.hargaBuyerUSD.toFixed(2)} (Rp ${new Intl.NumberFormat('id-ID').format(hargaBuyerIDR)})` : '—',
            qtyTersedia: qtyTersedia,
            hargaAkhir: avgHarga > 0 ? `Rp ${new Intl.NumberFormat('id-ID').format(avgHarga)}/kg` : '—',
            persentaseSelisih: `${diff >= 0 ? '+' : ''}${pct}%`,
            selisihPositive: diff >= 0,
            status: (appr.status as any) || 'Menunggu',
          })
        })
      }
      setApprovalData(tab3Rows)
    } catch (e) {
      console.error('Error fetching laporan data:', e)
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
    return stockData.filter((d) => {
      if (filterKomoditas !== 'Semua Komoditas' && d.komoditas !== filterKomoditas) return false
      if (filterCabang !== 'Semua Cabang' && d.cabang.toLowerCase().trim() !== filterCabang.toLowerCase().trim()) return false
      return true
    })
  }, [stockData, filterKomoditas, filterCabang])

  const filteredTab3 = useMemo(() => {
    return approvalData.filter((d) => {
      if (filterBuyer !== 'Semua Buyer' && d.buyer !== filterBuyer) return false
      if (filterKomoditas !== 'Semua Komoditas' && d.permintaan !== filterKomoditas) return false
      if (filterApprovalStatus !== 'Semua Status' && d.status !== filterApprovalStatus) return false
      return true
    })
  }, [approvalData, filterBuyer, filterKomoditas, filterApprovalStatus])

  // Options
  const buyerOptions = useMemo(() => {
    const set = new Set([...permintaanData.map((d) => d.buyer), ...approvalData.map((d) => d.buyer)].filter(Boolean))
    return ['Semua Buyer', ...Array.from(set)]
  }, [permintaanData, approvalData])

  const negaraOptions = useMemo(() => {
    const set = new Set(permintaanData.map((d) => d.negara).filter(Boolean))
    return ['Semua Negara', ...Array.from(set)]
  }, [permintaanData])

  const komoditasOptions = useMemo(() => {
    const set = new Set([
      ...permintaanData.map((d) => d.komoditas),
      ...stockData.map((d) => d.komoditas),
      ...approvalData.map((d) => d.permintaan),
    ].filter(Boolean))
    return ['Semua Komoditas', ...Array.from(set)]
  }, [permintaanData, stockData, approvalData])

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
        'Status Transaksi': d.statusTransaksi,
        'Status Stok': d.statusStok,
      }))
    } else if (activeTab === '2') {
      title = 'Rekapitulasi_Stock'
      exportData = filteredTab2.map((d, i) => ({
        No: i + 1,
        'Kode Barang': d.kode,
        Komoditas: d.komoditas,
        'Spesifikasi / Kategori': d.spesifikasi,
        'Lokasi / Cabang': d.cabang,
        'Qty Available (kg)': d.qtyAvailable,
        Satuan: d.satuan,
        Status: d.status,
        'Last Updated': d.lastUpdated,
      }))
    } else {
      title = 'Rekapitulasi_Approval'
      exportData = filteredTab3.map((d, i) => ({
        No: i + 1,
        Tanggal: d.tanggal,
        Buyer: d.buyer,
        Permintaan: d.permintaan,
        Spesifikasi: d.spesifikasi,
        'Qty Permintaan (kg)': d.qtyPermintaan,
        'Harga Buyer': d.hargaBuyer,
        'Qty Tersedia (kg)': d.qtyTersedia,
        'Harga Akhir': d.hargaAkhir,
        'Persentase Selisih': d.persentaseSelisih,
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
      headers = [['No', 'Tanggal', 'Buyer', 'Negara', 'Komoditas', 'Spesifikasi', 'Qty (kg)', 'Harga Buyer', 'Status Transaksi', 'Status Stok']]
      body = filteredTab1.map((d, i) => [
        i + 1,
        d.tanggal,
        d.buyer,
        d.negara,
        d.komoditas,
        d.spesifikasi,
        new Intl.NumberFormat('id-ID').format(d.qty),
        d.hargaBuyer,
        d.statusTransaksi,
        d.statusStok,
      ])
    } else if (activeTab === '2') {
      title = 'Rekapitulasi Stock Gudang'
      headers = [['No', 'Kode Barang', 'Komoditas', 'Spesifikasi / Size', 'Lokasi / Cabang', 'Qty Available (kg)', 'Satuan', 'Status', 'Last Updated']]
      body = filteredTab2.map((d, i) => [
        i + 1,
        d.kode,
        d.komoditas,
        d.spesifikasi,
        d.cabang,
        new Intl.NumberFormat('id-ID').format(d.qtyAvailable),
        d.satuan,
        d.status,
        d.lastUpdated,
      ])
    } else {
      title = 'Rekapitulasi Approval'
      headers = [['No', 'Tanggal', 'Buyer', 'Permintaan', 'Spesifikasi', 'Qty Permintaan (kg)', 'Harga Buyer', 'Qty Tersedia (kg)', 'Harga Akhir', 'Selisih (%)', 'Status']]
      body = filteredTab3.map((d, i) => [
        i + 1,
        d.tanggal,
        d.buyer,
        d.permintaan,
        d.spesifikasi,
        new Intl.NumberFormat('id-ID').format(d.qtyPermintaan),
        d.hargaBuyer,
        new Intl.NumberFormat('id-ID').format(d.qtyTersedia),
        d.hargaAkhir,
        d.persentaseSelisih,
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
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 2.5 },
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
              Rekapitulasi lengkap permintaan buyer, data stok gudang cabang, dan evaluasi status persetujuan (approval).
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

        {/* 1. THREE RECAPITULATION TABS AS INSTRUCTED */}
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
            2. Rekapitulasi Stock
          </button>
          <button
            onClick={() => setActiveTab('3')}
            className={`pb-2.5 px-3.5 transition-all relative cursor-pointer ${
              activeTab === '3'
                ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            3. Rekapitulasi Approval
          </button>
        </div>

        {/* 2. DYNAMIC FILTER BAR */}
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
                  Negara / Tujuan
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
                  Lokasi / Cabang
                </label>
                <select
                  value={filterCabang}
                  onChange={(e) => setFilterCabang(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                >
                  {['Semua Cabang', ...DAFTAR_CABANG].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Tab 3: Status Approval Filter */}
            {activeTab === '3' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Status Approval
                </label>
                <select
                  value={filterApprovalStatus}
                  onChange={(e) => setFilterApprovalStatus(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                >
                  {['Semua Status', 'Disetujui', 'Menunggu', 'Ditolak'].map((st) => (
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
                setFilterCabang('Semua Cabang')
                setFilterApprovalStatus('Semua Status')
              }}
              className="px-3.5 py-1.5 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          </div>
        </div>

        {/* 3. RECAPITULATION TABLES */}

        {/* TAB 1: REKAPITULASI PERMINTAAN BUYER (LENGKAP: TRANSAKSI SELESAI + BELUM SELESAI) */}
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
                    <th className="py-3 px-3 text-center">Status Transaksi</th>
                    <th className="py-3 px-3 text-center">Status Stok</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTab1.length > 0 ? (
                    filteredTab1.map((row, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3 px-3 text-center text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{row.tanggal}</td>
                        <td className="py-3 px-3 font-bold text-blue-600">{row.buyer}</td>
                        <td className="py-3 px-3 text-slate-700">{row.negara}</td>
                        <td className="py-3 px-3 font-semibold text-slate-800">{row.komoditas}</td>
                        <td className="py-3 px-3 text-slate-600">{row.spesifikasi}</td>
                        <td className="py-3 px-3 text-right font-bold text-slate-800">
                          {new Intl.NumberFormat('id-ID').format(row.qty)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-800">{row.hargaBuyer}</td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              row.statusTransaksi === 'Selesai'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : row.statusTransaksi === 'Diproses'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {row.statusTransaksi}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
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

        {/* TAB 2: REKAPITULASI STOCK */}
        {activeTab === '2' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-3 text-center w-12">No</th>
                    <th className="py-3 px-3">Kode Barang</th>
                    <th className="py-3 px-3">Komoditas</th>
                    <th className="py-3 px-3">Spesifikasi / Kategori</th>
                    <th className="py-3 px-3">Lokasi / Cabang</th>
                    <th className="py-3 px-3 text-right">Qty Available</th>
                    <th className="py-3 px-3 text-center">Satuan</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTab2.length > 0 ? (
                    filteredTab2.map((row, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3 px-3 text-center text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 font-mono font-medium text-slate-500">{row.kode}</td>
                        <td className="py-3 px-3 font-bold text-slate-800">{row.komoditas}</td>
                        <td className="py-3 px-3 text-slate-600">{row.spesifikasi}</td>
                        <td className="py-3 px-3 font-semibold text-slate-700">{row.cabang}</td>
                        <td className="py-3 px-3 text-right font-extrabold text-slate-800">
                          {new Intl.NumberFormat('id-ID').format(row.qtyAvailable)}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-500">{row.satuan}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">{row.lastUpdated}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-slate-400">
                        Tidak ada data stock gudang.
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

        {/* TAB 3: REKAPITULASI APPROVAL (PERSIS SESUAI KOLOM YANG DIMINTA USER) */}
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
                    <th className="py-3 px-3">Spesifikasi</th>
                    <th className="py-3 px-3 text-right">Qty Permintaan</th>
                    <th className="py-3 px-3 text-right">Harga Buyer</th>
                    <th className="py-3 px-3 text-right">Qty Tersedia</th>
                    <th className="py-3 px-3 text-right">Harga Akhir</th>
                    <th className="py-3 px-3 text-center">Persentase Selisih</th>
                    <th className="py-3 px-3 text-center">Status Approval</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTab3.length > 0 ? (
                    filteredTab3.map((row, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3 px-3 text-center text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{row.tanggal}</td>
                        <td className="py-3 px-3 font-bold text-blue-600">{row.buyer}</td>
                        <td className="py-3 px-3 font-bold text-slate-800">{row.permintaan}</td>
                        <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={row.spesifikasi}>
                          {row.spesifikasi}
                        </td>
                        <td className="py-3 px-3 text-right font-extrabold text-slate-800">
                          {new Intl.NumberFormat('id-ID').format(row.qtyPermintaan)} kg
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-slate-700 whitespace-nowrap">
                          {row.hargaBuyer}
                        </td>
                        <td className="py-3 px-3 text-right font-extrabold text-blue-700 whitespace-nowrap">
                          {new Intl.NumberFormat('id-ID').format(row.qtyTersedia)} kg
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                          {row.hargaAkhir}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              row.persentaseSelisih.startsWith('+')
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {row.persentaseSelisih}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              row.status === 'Disetujui'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : row.status === 'Ditolak'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={11} className="py-6 text-center text-slate-400">
                        Tidak ada data rekapitulasi approval.
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
