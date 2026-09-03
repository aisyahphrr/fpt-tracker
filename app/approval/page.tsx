'use client'

import { useState, useEffect, useMemo } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { formatUserRoleLabel } from '@/lib/utils'
import {
  ClipboardCheck,
  CheckCircle2,
  Hourglass,
  XCircle,
  ShoppingBag,
  Search,
  Filter,
  Calendar,
  Eye,
  Edit,
  X,
  BarChart3,
  Check,
  RotateCcw,
  ChevronDown,
  Info,
} from 'lucide-react'

interface EvaluasiSumber {
  id: string
  nama: string
  asal: string
  qty: number
  harga: number
  selected: boolean
  status: 'Disetujui' | 'Ditolak' | 'Menunggu'
  notes: string
  lastUpdated?: string
}

interface ApprovalItem {
  id: string
  buyer: string
  negara: string
  komoditas: string
  qtyPermintaan: number
  incoterm: string
  hargaBuyerUSD: number
  kursIDR: number
  tanggalRequest: string
  targetPengiriman: string
  status: 'Menunggu' | 'Disetujui' | 'Ditolak'
  sumberList: EvaluasiSumber[]
}

export default function ApprovalPage() {
  const [data, setData] = useState<ApprovalItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [userName, setUserName] = useState('Aisyah (Direksi)')
  const [userRole, setUserRole] = useState<'pusat' | 'cabang'>('cabang')

  // Selected item to display on the Right Panel (null by default to show full list)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Search & Filter
  const [searchBuyer, setSearchBuyer] = useState('')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('Semua Status')
  const [selectedDateFilter, setSelectedDateFilter] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Calculation Modal State
  const [isPerhitunganModalOpen, setIsPerhitunganModalOpen] = useState(false)

  // Edit Note Modal State
  const [editingNoteSumber, setEditingNoteSumber] = useState<EvaluasiSumber | null>(null)
  const [tempNoteText, setTempNoteText] = useState('')

  useEffect(() => {
    fetchProfile()
    fetchApprovalData()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const d = await res.json()
        if (d?.name) {
          const email = (d.email || '').toLowerCase()
          const isPusat = email.includes('nailah') || email.includes('ahlan') || d.role === 'admin'
          setUserRole(isPusat ? 'pusat' : 'cabang')
          const roleLabel = formatUserRoleLabel(d.role, d.name, d.email)
          setUserName(`${d.name} (${roleLabel})`)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchApprovalData = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/approval')
      if (res.ok) {
        const json = await res.json()
        setData(json || [])
      }
    } catch (e) {
      console.error('Error fetching approval:', e)
    } finally {
      setIsLoading(false)
    }
  }

  // Active Selected Item
  const activeItem = useMemo(() => {
    if (!selectedId) return null
    return data.find((d) => d.id === selectedId) || null
  }, [data, selectedId])

  // Filtered List for Left Table
  const filteredList = useMemo(() => {
    return data.filter((item) => {
      if (selectedStatusFilter !== 'Semua Status' && item.status !== selectedStatusFilter) {
        return false
      }
      if (searchBuyer && !item.buyer.toLowerCase().includes(searchBuyer.toLowerCase())) {
        return false
      }
      return true
    })
  }, [data, selectedStatusFilter, searchBuyer])

  // Pagination for Left Table
  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredList.slice(start, start + itemsPerPage)
  }, [filteredList, currentPage])

  // KPI Calculations
  const totalBuyerAktif = data.length
  const totalDisetujui = data.filter((d) => d.status === 'Disetujui').length
  const totalMenunggu = data.filter((d) => d.status === 'Menunggu').length
  const totalDitolak = data.filter((d) => d.status === 'Ditolak').length

  // Helper flags
  const getFlag = (country: string) => {
    const c = (country || '').toLowerCase()
    if (c.includes('vietnam')) return '🇻🇳'
    if (c.includes('thailand')) return '🇹🇭'
    if (c.includes('greece') || c.includes('yunani')) return '🇬🇷'
    if (c.includes('korea')) return '🇰🇷'
    if (c.includes('jepang') || c.includes('japan')) return '🇯🇵'
    return '🌐'
  }

  // Toggle Checkbox on a Source
  const handleToggleSource = (sumberId: string) => {
    if (!activeItem) return

    const updatedSumberList = activeItem.sumberList.map((s) => {
      if (s.id === sumberId) {
        const newSelected = !s.selected
        return {
          ...s,
          selected: newSelected,
          status: (newSelected ? 'Disetujui' : 'Ditolak') as 'Disetujui' | 'Ditolak',
        }
      }
      return s
    })

    const updatedData = data.map((item) => {
      if (item.id === activeItem.id) {
        return { ...item, sumberList: updatedSumberList }
      }
      return item
    })

    setData(updatedData)
  }

  // Save Approval Decision
  const handleSaveApproval = async (statusDecision: 'Disetujui' | 'Ditolak') => {
    if (!activeItem) return

    const updatedData = data.map((item) => {
      if (item.id === activeItem.id) {
        return { ...item, status: statusDecision }
      }
      return item
    })

    setData(updatedData)

    try {
      await fetch('/api/approval', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeItem.id,
          status: statusDecision,
          sumberList: activeItem.sumberList,
        }),
      })
      alert(`Keputusan approval untuk ${activeItem.buyer} berhasil disimpan sebagai: ${statusDecision}`)
    } catch (err) {
      console.error('Error saving approval decision:', err)
    }
  }

  // Edit Note Submit
  const handleSaveNote = () => {
    if (!editingNoteSumber || !activeItem) return

    const nowStr = `oleh ${userName} — ${new Date().toLocaleDateString('id-ID')}`
    const updatedSumberList = activeItem.sumberList.map((s) => {
      if (s.id === editingNoteSumber.id) {
        return { ...s, notes: tempNoteText, lastUpdated: nowStr }
      }
      return s
    })

    const updatedData = data.map((item) => {
      if (item.id === activeItem.id) {
        return { ...item, sumberList: updatedSumberList }
      }
      return item
    })

    setData(updatedData)
    setEditingNoteSumber(null)
  }

  // Metrics for the Right Evaluation Panel
  const rightPanelMetrics = useMemo(() => {
    if (!activeItem) return { totalDisetujuiQty: 0, percentDisetujui: 0, avgHargaTerpilih: 0 }

    const approvedSources = activeItem.sumberList.filter((s) => s.selected)
    const totalDisetujuiQty = approvedSources.reduce((sum, s) => sum + s.qty, 0)
    const percentDisetujui =
      activeItem.qtyPermintaan > 0
        ? Math.round((totalDisetujuiQty / activeItem.qtyPermintaan) * 100)
        : 0

    const avgHargaTerpilih =
      approvedSources.length > 0
        ? Math.round(approvedSources.reduce((sum, s) => sum + s.harga, 0) / approvedSources.length)
        : 0

    return { totalDisetujuiQty, percentDisetujui, avgHargaTerpilih }
  }, [activeItem])

  // Metrics for "Ringkasan Perhitungan" Pop-up Modal
  const modalPerhitunganMetrics = useMemo(() => {
    if (!activeItem) return null

    const totalQtySemuaSumber = activeItem.sumberList.reduce((sum, s) => sum + s.qty, 0)
    const approvedSources = activeItem.sumberList.filter((s) => s.selected)
    const rejectedSources = activeItem.sumberList.filter((s) => !s.selected)

    const totalDisetujuiQty = approvedSources.reduce((sum, s) => sum + s.qty, 0)
    const totalDitolakQty = rejectedSources.reduce((sum, s) => sum + s.qty, 0)

    const percentDisetujui =
      activeItem.qtyPermintaan > 0 ? Math.round((totalDisetujuiQty / activeItem.qtyPermintaan) * 100) : 0
    const percentDitolak =
      activeItem.qtyPermintaan > 0 ? Math.round((totalDitolakQty / activeItem.qtyPermintaan) * 100) : 0

    const avgHargaTerpilih =
      approvedSources.length > 0
        ? Math.round(approvedSources.reduce((sum, s) => sum + s.harga, 0) / approvedSources.length)
        : 0

    const hargaBuyerIDR = Math.round(activeItem.hargaBuyerUSD * activeItem.kursIDR)
    const totalNilaiBuyerUSD = Math.round(activeItem.hargaBuyerUSD * activeItem.qtyPermintaan)
    const totalNilaiBuyerIDR = Math.round(hargaBuyerIDR * activeItem.qtyPermintaan)

    const selisihHarga = avgHargaTerpilih - hargaBuyerIDR
    const persentaseSelisih =
      hargaBuyerIDR > 0 ? ((selisihHarga / hargaBuyerIDR) * 100).toFixed(2) : '0'

    return {
      totalQtySemuaSumber,
      totalDisetujuiQty,
      totalDitolakQty,
      percentDisetujui,
      percentDitolak,
      avgHargaTerpilih,
      hargaBuyerIDR,
      totalNilaiBuyerUSD,
      totalNilaiBuyerIDR,
      selisihHarga,
      persentaseSelisih,
    }
  }, [activeItem])

  return (
    <MainLayout>
      <div className="space-y-6 pb-10 select-none">
        {/* HEADER */}
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Approval</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Pilih sumber bahan baku terbaik untuk memenuhi permintaan buyer.
          </p>
        </div>

        {/* 1. 4 KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Buyer Aktif */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Buyer Aktif</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold text-slate-800 tracking-tight">{totalBuyerAktif}</span>
                <span className="text-xs font-semibold text-slate-400">Permintaan</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Sudah Disetujui */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Sudah Disetujui</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold text-emerald-600 tracking-tight">{totalDisetujui}</span>
                <span className="text-xs font-semibold text-slate-400">Permintaan</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Menunggu Approval */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Menunggu Approval</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold text-amber-600 tracking-tight">{totalMenunggu}</span>
                <span className="text-xs font-semibold text-slate-400">Permintaan</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Hourglass className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: Ditolak */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Ditolak</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold text-rose-600 tracking-tight">{totalDitolak}</span>
                <span className="text-xs font-semibold text-slate-400">Permintaan</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 2. SPLIT VIEW: LEFT TABLE & RIGHT EVALUATION PANEL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT SIDE: DAFTAR PERMINTAAN */}
          <div className={`${activeItem ? 'lg:col-span-5' : 'lg:col-span-12'} bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3 transition-all`}>
            {/* Filter Bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama buyer..."
                  value={searchBuyer}
                  onChange={(e) => setSearchBuyer(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
              >
                <option value="Semua Status">Semua Status</option>
                <option value="Menunggu">Menunggu</option>
                <option value="Disetujui">Disetujui</option>
                <option value="Ditolak">Ditolak</option>
              </select>
            </div>

            {/* Table of Requests */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                    <th className="py-2.5 px-3">Nama Buyer</th>
                    <th className="py-2.5 px-3">Permintaan</th>
                    <th className="py-2.5 px-3">Tanggal Request</th>
                    <th className="py-2.5 px-2 text-center">Status</th>
                    <th className="py-2.5 px-2 text-center w-10">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedList.length > 0 ? (
                    paginatedList.map((item) => {
                      const isSelected = item.id === selectedId
                      return (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedId(item.id)}
                          className={`transition-colors cursor-pointer ${
                            isSelected ? 'bg-blue-50/60 ring-1 ring-blue-500/20' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-3 px-3">
                            <p className="font-bold text-blue-600">{item.buyer}</p>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <span>{getFlag(item.negara)}</span>
                              <span>{item.negara}</span>
                            </p>
                          </td>
                          <td className="py-3 px-3">
                            <p className="font-bold text-slate-800">{item.komoditas}</p>
                            <p className="text-[11px] text-slate-500">
                              {new Intl.NumberFormat('id-ID').format(item.qtyPermintaan)} kg <span className="font-semibold text-slate-700">{item.incoterm}</span>
                            </p>
                          </td>
                          <td className="py-3 px-3 text-[11px] text-slate-500">
                            {item.tanggalRequest}
                          </td>
                          <td className="py-3 px-2 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                item.status === 'Disetujui'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : item.status === 'Ditolak'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedId(item.id)
                              }}
                              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                                isSelected ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-100'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        Tidak ada permintaan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <p>Menampilkan 1 - {paginatedList.length} dari {filteredList.length} data</p>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2 py-0.5 rounded border text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setCurrentPage(pg)}
                    className={`w-6 h-6 rounded text-xs font-bold ${
                      currentPage === pg ? 'bg-blue-600 text-white' : 'border hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    {pg}
                  </button>
                ))}
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2 py-0.5 rounded border text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                >
                  ›
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: EVALUASI SUMBER BAHAN BAKU (7 COLUMNS) */}
          {activeItem && (
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
              {/* Header Info of Selected Request */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer transition-colors group"
                  >
                    <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
                    <span>Kembali ke daftar</span>
                  </button>
                  <div className="flex items-center gap-2 mt-1">
                    <h2 className="text-base font-bold text-slate-800">{activeItem.buyer}</h2>
                    <span className="text-sm">{getFlag(activeItem.negara)}</span>
                    <span className="text-xs text-slate-500 font-medium">{activeItem.negara}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs text-slate-600">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">PERMINTAAN</span>
                    <span className="font-bold text-slate-800">
                      {activeItem.komoditas}{' '}
                      <span className="font-normal text-slate-500">
                        {new Intl.NumberFormat('id-ID').format(activeItem.qtyPermintaan)} kg | {activeItem.incoterm}
                      </span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">TANGGAL REQUEST</span>
                    <span className="font-semibold text-slate-700">{activeItem.tanggalRequest}</span>
                    <span className="text-[10px] text-slate-400 block">Target: {activeItem.targetPengiriman}</span>
                  </div>
                </div>
              </div>

              {/* Title & "Lihat Ringkasan Perhitungan" Button */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Evaluasi Sumber Bahan Baku
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Pilih sumber bahan baku yang akan diambil untuk memenuhi permintaan ini.
                  </p>
                </div>

                {/* TOMBOL LIHAT RINGKASAN PERHITUNGAN */}
                <button
                  onClick={() => setIsPerhitunganModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Lihat Ringkasan Perhitungan</span>
                </button>
              </div>

              {/* Table of Evaluated Sources */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                      <th className="py-2.5 px-3 text-center w-12">Pilih</th>
                      <th className="py-2.5 px-3">Sumber / Supplier</th>
                      <th className="py-2.5 px-2">Asal Daerah</th>
                      <th className="py-2.5 px-2 text-right">Qty Tersedia (kg)</th>
                      <th className="py-2.5 px-2 text-right">Harga (Rp/kg)</th>
                      <th className="py-2.5 px-2 text-center">Status</th>
                      <th className="py-2.5 px-3">Notes (Alasan)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeItem.sumberList && activeItem.sumberList.length > 0 ? (
                      activeItem.sumberList.map((s, idx) => (
                        <tr
                          key={s.id}
                          className={`hover:bg-blue-50/30 transition-colors ${
                            s.selected ? 'bg-emerald-50/20' : ''
                          }`}
                        >
                          <td className="py-3 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={s.selected}
                              onChange={() => handleToggleSource(s.id)}
                              className="w-4 h-4 text-blue-600 rounded border-slate-300 cursor-pointer focus:ring-blue-500"
                              title="Klik untuk memilih sumber yang disetujui"
                            />
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-800">
                            <span className="text-slate-400 font-normal mr-1.5">{idx + 1}</span>
                            {s.nama}
                          </td>
                          <td className="py-3 px-2 text-slate-600">{s.asal}</td>
                          <td className="py-3 px-2 text-right font-bold text-slate-800">
                            {new Intl.NumberFormat('id-ID').format(s.qty)} kg
                          </td>
                          <td className="py-3 px-2 text-right font-bold text-slate-800">
                            {new Intl.NumberFormat('id-ID').format(s.harga)}
                          </td>
                          <td className="py-3 px-2 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                s.selected
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {s.selected ? 'Disetujui' : 'Ditolak'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-start justify-between gap-1 group">
                              <div className="text-[11px] leading-tight">
                                <p className="text-slate-700 font-medium">{s.notes || '—'}</p>
                                {s.lastUpdated && (
                                  <p className="text-[10px] text-slate-400 mt-0.5">{s.lastUpdated}</p>
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  setEditingNoteSumber(s)
                                  setTempNoteText(s.notes)
                                }}
                                className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors opacity-60 group-hover:opacity-100 cursor-pointer"
                                title="Edit Alasan"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          <p className="font-semibold text-slate-600">Belum ada penawaran sumber dari cabang</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Data permintaan ini sudah masuk dan menunggu tim cabang mengisi sumber bahan baku di menu Bahan Baku.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bottom Metrics of Right Panel */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Total Qty Permintaan</span>
                  <span className="text-sm font-bold text-slate-800">
                    {new Intl.NumberFormat('id-ID').format(activeItem.qtyPermintaan)} kg
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Total Qty Disetujui</span>
                  <span className="text-sm font-bold text-emerald-600">
                    {new Intl.NumberFormat('id-ID').format(rightPanelMetrics.totalDisetujuiQty)} kg{' '}
                    <span className="text-xs font-semibold">({rightPanelMetrics.percentDisetujui}%)</span>
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Rata-rata Harga Sumber Terpilih</span>
                  <span className="text-sm font-extrabold text-blue-700">
                    {rightPanelMetrics.avgHargaTerpilih > 0
                      ? `Rp ${new Intl.NumberFormat('id-ID').format(rightPanelMetrics.avgHargaTerpilih)} /kg`
                      : '—'}
                  </span>
                </div>
              </div>

              {/* Bottom Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                {userRole === 'cabang' ? (
                  <div className="flex items-center gap-2 text-slate-500 text-xs bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                    <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Mode Monitoring Cabang — Keputusan approval dikelola oleh Kantor Pusat</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400">Pilih sumber dan tentukan status approval.</span>
                )}

                <div className="flex items-center gap-2">
                  {userRole === 'pusat' && (
                    <>
                      <button
                        type="button"
                        onClick={() => alert('Dibatalkan')}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                      >
                        Batalkan
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveApproval('Ditolak')}
                        className="px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl cursor-pointer"
                      >
                        Tolak Permintaan
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveApproval('Disetujui')}
                        className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
                      >
                        Simpan Approval
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. MODAL POP-UP: "RINGKASAN PERHITUNGAN" */}
        {isPerhitunganModalOpen && activeItem && modalPerhitunganMetrics && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-200 my-8">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Ringkasan Perhitungan</h3>
                  <p className="text-xs text-slate-500">
                    Buyer: <span className="font-bold text-slate-800">{activeItem.buyer}</span> {getFlag(activeItem.negara)} | Permintaan: <span className="font-bold text-blue-600">{activeItem.komoditas}</span> ({new Intl.NumberFormat('id-ID').format(activeItem.qtyPermintaan)} kg {activeItem.incoterm})
                  </p>
                </div>
                <button
                  onClick={() => setIsPerhitunganModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 1. Ringkasan Permintaan Buyer */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  1. Ringkasan Permintaan Buyer
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-slate-500">Harga yang Diminta Buyer:</p>
                    <p className="font-extrabold text-slate-800 text-sm">
                      USD {activeItem.hargaBuyerUSD.toFixed(2)} /kg{' '}
                      <span className="text-xs font-semibold text-slate-500">
                        (Rp {new Intl.NumberFormat('id-ID').format(modalPerhitunganMetrics.hargaBuyerIDR)} /kg)
                      </span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500">Currency & Kurs:</p>
                    <p className="font-bold text-slate-800">
                      USD <span className="text-slate-500 font-normal">(1 USD = Rp {new Intl.NumberFormat('id-ID').format(activeItem.kursIDR)})</span>
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 text-[11px]">Total Nilai Permintaan (USD):</span>
                    <p className="font-bold text-slate-800">USD {new Intl.NumberFormat('en-US').format(modalPerhitunganMetrics.totalNilaiBuyerUSD)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Total Nilai Permintaan (IDR):</span>
                    <p className="font-bold text-blue-700">Rp {new Intl.NumberFormat('id-ID').format(modalPerhitunganMetrics.totalNilaiBuyerIDR)}</p>
                  </div>
                </div>
              </div>

              {/* 2. Ringkasan Sumber Bahan Baku */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  2. Ringkasan Sumber Bahan Baku
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                      <tr>
                        <th className="py-1.5 px-2.5">Sumber / Supplier</th>
                        <th className="py-1.5 px-2.5">Asal Daerah</th>
                        <th className="py-1.5 px-2.5 text-right">Qty Tersedia</th>
                        <th className="py-1.5 px-2.5 text-right">Harga (Rp/kg)</th>
                        <th className="py-1.5 px-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeItem.sumberList.map((s) => (
                        <tr key={s.id}>
                          <td className="py-1.5 px-2.5 font-bold text-slate-800">{s.nama}</td>
                          <td className="py-1.5 px-2.5 text-slate-600">{s.asal}</td>
                          <td className="py-1.5 px-2.5 text-right">{new Intl.NumberFormat('id-ID').format(s.qty)} kg</td>
                          <td className="py-1.5 px-2.5 text-right font-semibold">Rp {new Intl.NumberFormat('id-ID').format(s.harga)}</td>
                          <td className="py-1.5 px-2.5 text-center">
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${s.selected ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
                              {s.selected ? 'Disetujui' : 'Ditolak'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div>
                    <span className="text-slate-400 text-[10px]">Total Qty Tersedia:</span>
                    <p className="font-bold text-slate-800">{new Intl.NumberFormat('id-ID').format(modalPerhitunganMetrics.totalQtySemuaSumber)} kg</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Total Qty Disetujui:</span>
                    <p className="font-bold text-emerald-600">{new Intl.NumberFormat('id-ID').format(modalPerhitunganMetrics.totalDisetujuiQty)} kg ({modalPerhitunganMetrics.percentDisetujui}%)</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Total Qty Ditolak:</span>
                    <p className="font-bold text-rose-600">{new Intl.NumberFormat('id-ID').format(modalPerhitunganMetrics.totalDitolakQty)} kg ({modalPerhitunganMetrics.percentDitolak}%)</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Rata-rata Harga Sumber Terpilih (Disetujui):</span>
                  <span className="font-extrabold text-blue-700 text-sm">
                    Rp {new Intl.NumberFormat('id-ID').format(modalPerhitunganMetrics.avgHargaTerpilih)} /kg
                  </span>
                </div>
              </div>

              {/* 3. Perbandingan Harga */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  3. Perbandingan Harga
                </h4>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Harga yang Diminta Buyer:</span>
                    <span className="font-bold text-slate-800">
                      USD {activeItem.hargaBuyerUSD.toFixed(2)} /kg (Rp {new Intl.NumberFormat('id-ID').format(modalPerhitunganMetrics.hargaBuyerIDR)} /kg)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rata-rata Harga Sumber Terpilih:</span>
                    <span className="font-bold text-slate-800">
                      Rp {new Intl.NumberFormat('id-ID').format(modalPerhitunganMetrics.avgHargaTerpilih)} /kg
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1">
                    <span className="text-slate-500">Selisih (Sumber - Buyer):</span>
                    <span className={`font-bold ${modalPerhitunganMetrics.selisihHarga >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {modalPerhitunganMetrics.selisihHarga >= 0 ? '+' : ''}Rp {new Intl.NumberFormat('id-ID').format(modalPerhitunganMetrics.selisihHarga)} /kg
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Persentase Selisih:</span>
                    <span className={`font-bold ${Number(modalPerhitunganMetrics.persentaseSelisih) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {Number(modalPerhitunganMetrics.persentaseSelisih) >= 0 ? '+' : ''}{modalPerhitunganMetrics.persentaseSelisih}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="italic">💡 Perhitungan menggunakan harga rata-rata dari sumber yang disetujui.</span>
                <button
                  onClick={() => setIsPerhitunganModalOpen(false)}
                  className="px-5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. MODAL EDIT NOTE/ALASAN SUMBER */}
        {editingNoteSumber && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-800">Edit Alasan / Notes Sumber</h3>
                <button
                  onClick={() => setEditingNoteSumber(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <p className="text-slate-500">
                  Sumber: <span className="font-bold text-slate-800">{editingNoteSumber.nama}</span> ({editingNoteSumber.asal})
                </p>
                <textarea
                  rows={3}
                  value={tempNoteText}
                  onChange={(e) => setTempNoteText(e.target.value)}
                  placeholder="Masukkan alasan keputusan..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingNoteSumber(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Simpan Notes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
