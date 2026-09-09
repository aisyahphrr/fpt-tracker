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
  FileSpreadsheet,
  Download,
} from 'lucide-react'

interface EvaluasiSumberDetailSize {
  size: string
  qty: number
  hargaBB?: number
  hargaProses?: number
  hargaLogistik?: number
  hargaAkhir?: number
}

interface EvaluasiSumber {
  id: string
  nama: string
  asal: string
  qty: number
  harga: number
  sizes?: EvaluasiSumberDetailSize[]
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
  const itemsPerPage = 10

  // Calculation Modal State
  const [isPerhitunganModalOpen, setIsPerhitunganModalOpen] = useState(false)

  // Supplier Detail Modal State
  const [selectedSupplierDetail, setSelectedSupplierDetail] = useState<EvaluasiSumber | null>(null)

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
          const isPusat = d.role === 'admin' || (d.canSwitchPortal && d.portalMode !== 'cabang')
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
    if (!activeItem || userRole === 'cabang') return

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

    const hasBothPrices = hargaBuyerIDR > 0 && avgHargaTerpilih > 0
    const selisihHarga = hasBothPrices ? (hargaBuyerIDR - avgHargaTerpilih) : 0
    const persentaseSelisih =
      hasBothPrices ? ((selisihHarga / hargaBuyerIDR) * 100).toFixed(2) : '0'

    const totalDisetujuiCount = approvedSources.length
    const totalNilaiTerpilih = approvedSources.reduce((sum, s) => {
      const srcTotal = s.sizes && s.sizes.length > 0
        ? s.sizes.reduce((acc, sz) => acc + (sz.qty * (sz.hargaAkhir || s.harga)), 0)
        : s.qty * s.harga
      return sum + srcTotal
    }, 0)

    return {
      totalQtySemuaSumber,
      totalDisetujuiCount,
      totalDisetujuiQty,
      totalDitolakQty,
      percentDisetujui,
      percentDitolak,
      avgHargaTerpilih,
      totalNilaiTerpilih,
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
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                    {!activeItem && <th className="py-3 px-3 text-center w-12">No</th>}
                    <th className="py-3 px-4">Nama Buyer</th>
                    <th className="py-3 px-4">Komoditas & Incoterm</th>
                    <th className="py-3 px-4 text-right">Kuantitas</th>
                    {!activeItem && <th className="py-3 px-4 text-right">Harga Diminta</th>}
                    {!activeItem && <th className="py-3 px-4 text-center">Sumber Cabang</th>}
                    <th className="py-3 px-4 text-center">Tanggal Request</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedList.length > 0 ? (
                    paginatedList.map((item, index) => {
                      const isSelected = item.id === selectedId
                      const globalIndex = (currentPage - 1) * itemsPerPage + index + 1
                      const approvedCount = (item.sumberList || []).filter((s) => s.status === 'Disetujui').length
                      const totalSumber = (item.sumberList || []).length

                      return (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedId(item.id)}
                          className={`transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50/80 ring-1 ring-blue-500/30'
                              : index % 2 === 0
                              ? 'bg-white hover:bg-slate-50/80'
                              : 'bg-slate-50/30 hover:bg-slate-50/80'
                          }`}
                        >
                          {!activeItem && (
                            <td className="py-3.5 px-3 text-center font-bold text-slate-400">
                              {globalIndex}
                            </td>
                          )}
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-blue-700 text-[13px]">{item.buyer}</p>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
                              <span>{getFlag(item.negara)}</span>
                              <span>{item.negara}</span>
                            </p>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-slate-800 text-[12px]">{item.komoditas}</p>
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold">
                              {item.incoterm || 'FOB'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="font-extrabold text-slate-800 text-[12px]">
                              {new Intl.NumberFormat('id-ID').format(item.qtyPermintaan)}
                            </span>{' '}
                            <span className="text-slate-500 font-semibold text-[11px]">kg</span>
                          </td>
                          {!activeItem && (
                            <td className="py-3.5 px-4 text-right">
                              {item.hargaBuyerUSD > 0 ? (
                                <div>
                                  <p className="font-bold text-slate-800">
                                    USD {item.hargaBuyerUSD.toFixed(2)} /kg
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    ≈ Rp {new Intl.NumberFormat('id-ID').format(Math.round(item.hargaBuyerUSD * (item.kursIDR || 16200)))} /kg
                                  </p>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic font-medium">Belum diisi</span>
                              )}
                            </td>
                          )}
                          {!activeItem && (
                            <td className="py-3.5 px-4 text-center">
                              {totalSumber > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  <span>{totalSumber} Sumber</span>
                                  {approvedCount > 0 && (
                                    <span className="text-emerald-600">({approvedCount} Disetujui)</span>
                                  )}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                                  0 Sumber
                                </span>
                              )}
                            </td>
                          )}
                          <td className="py-3.5 px-4 text-center text-slate-600 text-[11px] font-medium whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1 text-slate-500">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{item.tanggalRequest}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${
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
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedId(item.id)
                              }}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                                isSelected
                                  ? 'bg-blue-600 text-white shadow-blue-600/20'
                                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Evaluasi</span>
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={!activeItem ? 9 : 6} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <p className="font-semibold text-slate-600 text-sm">Tidak ada data permintaan</p>
                          <p className="text-xs text-slate-400">Silakan ubah filter atau kata kunci pencarian Anda.</p>
                        </div>
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
                              disabled={userRole === 'cabang'}
                              onChange={() => userRole !== 'cabang' && handleToggleSource(s.id)}
                              className={`w-4 h-4 rounded border-slate-300 ${
                                userRole === 'cabang'
                                  ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                                  : 'text-blue-600 cursor-pointer focus:ring-blue-500'
                              }`}
                              title={
                                userRole === 'cabang'
                                  ? 'Role Cabang hanya melihat (Keputusan approval dikelola Pusat)'
                                  : 'Klik untuk memilih sumber yang disetujui'
                              }
                            />
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-800">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-slate-400 font-normal mr-0.5">{idx + 1}</span>
                              <span>{s.nama}</span>
                              {s.sizes && s.sizes.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedSupplierDetail(s)}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <span>{s.sizes.length} Size</span>
                                  <ChevronDown className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
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
                              <div className="flex items-center gap-1">
                                {s.sizes && s.sizes.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedSupplierDetail(s)}
                                    className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                                    title="Lihat Detail Size Supplier"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {userRole === 'pusat' && (
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
                                )}
                              </div>
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
        {isPerhitunganModalOpen && activeItem && modalPerhitunganMetrics && (() => {
          const approvedSources = activeItem.sumberList.filter(s => s.selected)
          const displaySources = approvedSources.length > 0 ? approvedSources : activeItem.sumberList

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-200 my-6">
                {/* Modal Header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Ringkasan Perhitungan</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Buyer: <span className="font-bold text-slate-800">{activeItem.buyer}</span> {getFlag(activeItem.negara)} | SK: <span className="font-medium text-slate-700">{activeItem.buyer.split(' ')[0]}, {activeItem.negara}</span> | Komoditas: <span className="font-bold text-blue-600">{activeItem.komoditas}</span> | Total Permintaan: <span className="font-bold text-slate-800">{new Intl.NumberFormat('id-ID').format(activeItem.qtyPermintaan)} kg {activeItem.incoterm || 'FOB'}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setIsPerhitunganModalOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* 1. Ringkasan Permintaan Buyer */}
                <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-800 text-[11px]">
                    1. Ringkasan Permintaan Buyer
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-slate-400 text-[10px] block font-medium">Harga Buyer (USD/kg)</span>
                      <span className="font-bold text-slate-800 text-xs">
                        USD {activeItem.hargaBuyerUSD.toFixed(2)}
                      </span>
                      <span className="text-slate-500 text-[10px] block mt-0.5">
                        (= Rp {new Intl.NumberFormat('id-ID').format(modalPerhitunganMetrics.hargaBuyerIDR)}/kg)
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Kurs 1 USD = Rp {new Intl.NumberFormat('id-ID').format(activeItem.kursIDR || 16200)}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] block font-medium">Total Nilai Permintaan (USD)</span>
                      <span className="font-bold text-slate-800 text-xs">
                        USD {new Intl.NumberFormat('en-US').format(modalPerhitunganMetrics.totalNilaiBuyerUSD)}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] block font-medium">Total Nilai Permintaan (IDR)</span>
                      <span className="font-extrabold text-blue-700 text-xs">
                        Rp {new Intl.NumberFormat('id-ID').format(modalPerhitunganMetrics.totalNilaiBuyerIDR)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Ringkasan Sumber Terpilih */}
                <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-800 text-[11px]">
                    2. Ringkasan Sumber Terpilih
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <span className="text-slate-400 text-[10px] block font-medium">Jumlah Supplier Dipilih</span>
                      <span className="font-bold text-slate-800 text-xs">
                        {modalPerhitunganMetrics.totalDisetujuiCount || 1} Supplier
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] block font-medium">Total Qty Disetujui</span>
                      <span className="font-bold text-emerald-600 text-xs">
                        {new Intl.NumberFormat('id-ID').format(modalPerhitunganMetrics.totalDisetujuiQty)} kg ({modalPerhitunganMetrics.percentDisetujui}%)
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] block font-medium">Rata-rata Harga Sumber</span>
                      <span className="font-bold text-blue-700 text-xs">
                        Rp {new Intl.NumberFormat('id-ID').format(modalPerhitunganMetrics.avgHargaTerpilih)}/kg
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] block font-medium">Total Nilai Sumber (IDR)</span>
                      <span className="font-extrabold text-blue-700 text-xs">
                        Rp {new Intl.NumberFormat('id-ID').format(modalPerhitunganMetrics.totalNilaiTerpilih)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Detail Supplier yang Dipilih */}
                <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-800 text-[11px]">
                    3. Detail Supplier yang Dipilih
                  </h4>
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-semibold text-[10px]">
                        <tr>
                          <th className="py-2 px-2.5 text-center w-8">No</th>
                          <th className="py-2 px-3">Supplier</th>
                          <th className="py-2 px-2.5">Asal Daerah</th>
                          <th className="py-2 px-2.5 text-right">Qty Disetujui (kg)</th>
                          <th className="py-2 px-2.5 text-right">Harga Rata-rata (Rp/kg)</th>
                          <th className="py-2 px-2.5 text-right font-bold text-slate-700">Nilai (IDR)</th>
                          <th className="py-2 px-2.5 text-center w-24">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {displaySources.map((s, idx) => {
                          const totalNilai = s.sizes && s.sizes.length > 0
                            ? s.sizes.reduce((acc, sz) => acc + (sz.qty * (sz.hargaAkhir || sz.hargaBB || 0)), 0)
                            : s.qty * s.harga

                          return (
                            <tr key={s.id} className="hover:bg-blue-50/20 transition-colors">
                              <td className="py-2 px-2.5 text-slate-400 text-center">{idx + 1}</td>
                              <td className="py-2 px-3 font-bold text-slate-800">{s.nama}</td>
                              <td className="py-2 px-2.5 text-slate-600">{s.asal}</td>
                              <td className="py-2 px-2.5 text-right font-semibold text-slate-700">
                                {new Intl.NumberFormat('id-ID').format(s.qty)}
                              </td>
                              <td className="py-2 px-2.5 text-right text-slate-700 font-medium">
                                {new Intl.NumberFormat('id-ID').format(s.harga)}
                              </td>
                              <td className="py-2 px-2.5 text-right font-bold text-slate-800">
                                {new Intl.NumberFormat('id-ID').format(totalNilai)}
                              </td>
                              <td className="py-2 px-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => setSelectedSupplierDetail(s)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer shadow-2xs"
                                  title="Lihat Detail Size Supplier"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Lihat Detail</span>
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. Perbandingan Harga (Rata-rata tertimbang) */}
                <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-800 text-[11px]">
                    4. Perbandingan Harga (Rata-rata tertimbang)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-0.5">
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-slate-400 text-[10px] block font-medium">Rata-rata Harga Buyer</span>
                      <span className="font-bold text-slate-800 text-xs">
                        Rp {new Intl.NumberFormat('id-ID').format(modalPerhitunganMetrics.hargaBuyerIDR)}/kg
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">(USD {activeItem.hargaBuyerUSD.toFixed(2)})</span>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-slate-400 text-[10px] block font-medium">Rata-rata Harga Sumber</span>
                      <span className="font-bold text-slate-800 text-xs">
                        Rp {new Intl.NumberFormat('id-ID').format(modalPerhitunganMetrics.avgHargaTerpilih)}/kg
                      </span>
                    </div>

                    <div className={`p-2.5 rounded-xl border shadow-2xs ${modalPerhitunganMetrics.selisihHarga >= 0 ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800' : 'bg-rose-50/70 border-rose-200 text-rose-800'}`}>
                      <span className="text-[10px] block font-medium">Estimasi Margin</span>
                      <span className="font-black text-xs block mt-0.5">
                        {modalPerhitunganMetrics.selisihHarga >= 0 ? '+ ' : ''}Rp {new Intl.NumberFormat('id-ID').format(modalPerhitunganMetrics.selisihHarga)}/kg ({modalPerhitunganMetrics.selisihHarga >= 0 ? '+' : ''}{modalPerhitunganMetrics.persentaseSelisih}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. Status Pemenuhan */}
                <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5 text-xs">
                  <h4 className="font-bold text-slate-800 text-[11px]">
                    5. Status Pemenuhan
                  </h4>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-700">
                        {new Intl.NumberFormat('id-ID').format(modalPerhitunganMetrics.totalDisetujuiQty)} / {new Intl.NumberFormat('id-ID').format(activeItem.qtyPermintaan)} kg
                      </span>
                      <span className="font-bold text-emerald-600">
                        {modalPerhitunganMetrics.percentDisetujui}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, modalPerhitunganMetrics.percentDisetujui)}%` }}
                      />
                    </div>
                  </div>

                  {/* Warning / Info Box */}
                  <div className="flex items-start gap-2 p-2.5 bg-blue-50 border border-blue-200/80 rounded-xl text-[11px] text-blue-900">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      {modalPerhitunganMetrics.percentDisetujui >= 100
                        ? 'Semua target kuantitas permintaan buyer telah berhasil dipenuhi oleh supplier terpilih.'
                        : `Masih terdapat kekurangan ${new Intl.NumberFormat('id-ID').format(Math.max(0, activeItem.qtyPermintaan - modalPerhitunganMetrics.totalDisetujuiQty))} kg (${100 - modalPerhitunganMetrics.percentDisetujui}%). Anda dapat memilih supplier lain sebagai tambahan sumber.`}
                    </span>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span className="text-amber-500">💡</span>
                    <span>Perhitungan menggunakan harga rata-rata tertimbang dari supplier yang dipilih</span>
                  </div>
                  <button
                    onClick={() => setIsPerhitunganModalOpen(false)}
                    className="px-5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )
        })()}

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

        {/* 5. MODAL DETAIL SUPPLIER (RINCIAN PER SIZE) */}
        {selectedSupplierDetail && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-200 my-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-800">
                      Detail Supplier
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-extrabold text-sm text-slate-900">{selectedSupplierDetail.nama}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedSupplierDetail.selected
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {selectedSupplierDetail.selected ? 'Dipilih' : 'Tidak Dipilih'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedSupplierDetail.asal}</p>
                </div>
                <button
                  onClick={() => setSelectedSupplierDetail(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Info Supplier Box */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3 space-y-1.5 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Informasi Supplier
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Asal Daerah:</span>
                    <span className="font-semibold text-slate-800">{selectedSupplierDetail.asal}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Total Qty Tersedia:</span>
                    <span className="font-bold text-slate-800">{new Intl.NumberFormat('id-ID').format(selectedSupplierDetail.qty)} kg</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Harga Rata-rata:</span>
                    <span className="font-bold text-blue-700">Rp {new Intl.NumberFormat('id-ID').format(selectedSupplierDetail.harga)}/kg</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Status:</span>
                    <span className={`font-bold ${selectedSupplierDetail.selected ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {selectedSupplierDetail.selected ? 'Dipilih' : 'Tidak Dipilih'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rincian per Size Table */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700 block">
                  Rincian per Size
                </span>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[10px]">
                      <tr>
                        <th className="py-2 px-2 text-center w-8">No</th>
                        <th className="py-2 px-2.5">Size</th>
                        <th className="py-2 px-2 text-right">Qty (kg)</th>
                        <th className="py-2 px-2 text-right">Harga (Rp/kg)</th>
                        <th className="py-2 px-2.5 text-right font-extrabold text-blue-900">Nilai (IDR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedSupplierDetail.sizes && selectedSupplierDetail.sizes.length > 0 ? (
                        selectedSupplierDetail.sizes.map((sz, idx) => {
                          const unitPrice = sz.hargaAkhir || sz.hargaBB || selectedSupplierDetail.harga
                          const totalVal = sz.qty * unitPrice

                          return (
                            <tr key={idx} className="hover:bg-blue-50/20 transition-colors">
                              <td className="py-2 px-2 text-center text-slate-400 font-medium">{idx + 1}</td>
                              <td className="py-2 px-2.5 font-bold text-slate-800">{sz.size}</td>
                              <td className="py-2 px-2 text-right font-semibold text-slate-700">
                                {new Intl.NumberFormat('id-ID').format(sz.qty)}
                              </td>
                              <td className="py-2 px-2 text-right text-slate-700 font-medium">
                                {new Intl.NumberFormat('id-ID').format(unitPrice)}
                              </td>
                              <td className="py-2 px-2.5 text-right font-bold text-blue-700">
                                {new Intl.NumberFormat('id-ID').format(totalVal)}
                              </td>
                            </tr>
                          )
                        })
                      ) : (
                        <tr>
                          <td className="py-2 px-2 text-center text-slate-400">1</td>
                          <td className="py-2 px-2.5 font-bold text-slate-800">All Size</td>
                          <td className="py-2 px-2 text-right font-semibold text-slate-700">
                            {new Intl.NumberFormat('id-ID').format(selectedSupplierDetail.qty)}
                          </td>
                          <td className="py-2 px-2 text-right text-slate-700 font-medium">
                            {new Intl.NumberFormat('id-ID').format(selectedSupplierDetail.harga)}
                          </td>
                          <td className="py-2 px-2.5 text-right font-bold text-blue-700">
                            {new Intl.NumberFormat('id-ID').format(selectedSupplierDetail.qty * selectedSupplierDetail.harga)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-800 text-xs">
                      <tr>
                        <td colSpan={2} className="py-2 px-2 text-right">Total:</td>
                        <td className="py-2 px-2 text-right text-blue-700">
                          {new Intl.NumberFormat('id-ID').format(selectedSupplierDetail.qty)}
                        </td>
                        <td className="py-2 px-2 text-right font-bold text-slate-700">
                          {new Intl.NumberFormat('id-ID').format(selectedSupplierDetail.harga)}
                        </td>
                        <td className="py-2 px-2.5 text-right font-extrabold text-emerald-700">
                          {new Intl.NumberFormat('id-ID').format(
                            selectedSupplierDetail.sizes && selectedSupplierDetail.sizes.length > 0
                              ? selectedSupplierDetail.sizes.reduce((acc, sz) => acc + (sz.qty * (sz.hargaAkhir || sz.hargaBB || selectedSupplierDetail.harga)), 0)
                              : selectedSupplierDetail.qty * selectedSupplierDetail.harga
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Catatan */}
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80 text-xs space-y-1">
                <span className="text-[10px] text-blue-700 font-bold uppercase block">Catatan:</span>
                <p className="text-slate-700 leading-relaxed">
                  {selectedSupplierDetail.notes || 'Tersedia semua size sesuai permintaan. Kualitas baik, pengiriman dari kantor pusat.'}
                </p>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedSupplierDetail(null)}
                  className="px-5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
