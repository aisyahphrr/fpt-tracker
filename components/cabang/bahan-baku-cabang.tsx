'use client'

import { useState, useEffect, useMemo } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import {
  Plus,
  Search,
  Layers,
  HelpCircle,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Upload,
  Calendar,
  Filter,
  RefreshCw,
  ChevronDown,
  ExternalLink,
  MoreVertical,
} from 'lucide-react'

interface SumberItem {
  _id?: string
  cabang: string
  supplier?: string
  qty: number
  spesifikasi?: string
  hargaBahanBaku?: number
  hargaProses?: number
  harga?: number // Harga Akhir per Kg
  lampiran?: string
  catatan?: string
  lastUpdated?: string
}

interface BahanBakuRow {
  _id: string
  noRequest?: string
  buyer: string
  negara: string
  komoditas: string
  qtyPermintaan: number
  hargaBuyer?: number // Target price per kg
  lastUpdated: string
  sumber: SumberItem[]
  filePerhitungan?: string
}

export function BahanBakuCabang() {
  const [data, setData] = useState<BahanBakuRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [userName, setUserName] = useState('Aisyah (Direksi)')

  // Currency / Kurs States
  const [selectedCurrency, setSelectedCurrency] = useState<'IDR' | 'USD' | 'JPY'>('IDR')
  const [rates, setRates] = useState({
    USD: 16200,
    JPY: 109.85,
  })
  const [isKursModalOpen, setIsKursModalOpen] = useState(false)
  const [tempRates, setTempRates] = useState({ USD: 16200, JPY: 109.85 })
  const [kursLastUpdated, setKursLastUpdated] = useState('Last Updated: 30 Mei 2026, 14:30 by Nailah (Admin)')

  // Filters
  const [selectedBuyer, setSelectedBuyer] = useState('Semua Buyer')
  const [selectedNegara, setSelectedNegara] = useState('Semua Negara')
  const [selectedIkan, setSelectedIkan] = useState('Semua Ikan')
  const [selectedPeriod, setSelectedPeriod] = useState('01/08/2026 - 30/08/2026')

  // Modals
  const [isAddSumberModalOpen, setIsAddSumberModalOpen] = useState(false)
  const [isDetailSumberModalOpen, setIsDetailSumberModalOpen] = useState(false)
  const [selectedBahanBaku, setSelectedBahanBaku] = useState<BahanBakuRow | null>(null)
  const [showSuccessAdded, setShowSuccessAdded] = useState(false)
  const [addedSummary, setAddedSummary] = useState<any>(null)

  // Search inside Detail Modal
  const [searchSumberQuery, setSearchSumberQuery] = useState('')

  // Form State for Tambah Sumber
  const [formSumber, setFormSumber] = useState({
    cabang: 'Manado',
    qty: '',
    supplier: '',
    spesifikasi: '',
    hargaBahanBaku: '',
    hargaProses: '',
    catatan: '',
    lampiranName: '',
  })

  useEffect(() => {
    fetchProfile()
    fetchKursData()
    fetchBahanBakuData()
  }, [])

  const fetchKursData = async () => {
    try {
      const res = await fetch('/api/kurs')
      if (res.ok) {
        const d = await res.json()
        if (d?.USD && d?.JPY) {
          setRates({ USD: d.USD, JPY: d.JPY })
          setTempRates({ USD: d.USD, JPY: d.JPY })
          if (d.selectedCurrency) setSelectedCurrency(d.selectedCurrency)
          if (d.lastUpdated) setKursLastUpdated(d.lastUpdated)
        }
      }
    } catch (e) {
      console.error('Error fetching kurs:', e)
    }
  }

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const d = await res.json()
        if (d?.name) {
          const roleLabel = d.role === 'direksi' ? 'Direksi' : 'Staff Cabang'
          setUserName(`${d.name} (${roleLabel})`)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchBahanBakuData = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/bahan-baku')
      if (res.ok) {
        const json = await res.json()
        setData(json || [])
      }
    } catch (e) {
      console.error('Error loading Bahan Baku Cabang data:', e)
    } finally {
      setIsLoading(false)
    }
  }

  // --- CALCULATE STATUS OTOMATIS ---
  const calculateStatus = (row: BahanBakuRow) => {
    const sumberArr = row.sumber || []
    if (sumberArr.length === 0) {
      return {
        label: 'Belum Ada Sumber',
        colorClass: 'bg-slate-100 text-slate-700 border-slate-300',
        dotColor: 'bg-slate-400',
      }
    }

    const totalQty = sumberArr.reduce((sum, s) => sum + (s.qty || 0), 0)
    const validPrices = sumberArr.filter((s) => (s.harga || s.hargaBahanBaku || 0) > 0)

    if (validPrices.length === 0) {
      return {
        label: 'Limited Info',
        colorClass: 'bg-blue-50 text-blue-700 border-blue-200',
        dotColor: 'bg-blue-500',
      }
    }

    const avgPrice =
      validPrices.reduce((sum, s) => sum + (s.harga || s.hargaBahanBaku || 0), 0) / validPrices.length

    const targetPrice = row.hargaBuyer || 70000
    const isQtyEnough = totalQty >= (row.qtyPermintaan || 1)
    const isPriceMatch = avgPrice <= targetPrice

    if (isQtyEnough && isPriceMatch) {
      return {
        label: 'Suitable',
        colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotColor: 'bg-emerald-500',
      }
    }
    if (!isQtyEnough && isPriceMatch) {
      return {
        label: 'Limited Supply',
        colorClass: 'bg-amber-50 text-amber-700 border-amber-200',
        dotColor: 'bg-amber-500',
      }
    }
    if (isQtyEnough && !isPriceMatch) {
      return {
        label: 'Price Not Competitive',
        colorClass: 'bg-orange-50 text-orange-700 border-orange-200',
        dotColor: 'bg-orange-500',
      }
    }
    return {
      label: 'Unsuitable',
      colorClass: 'bg-rose-50 text-rose-700 border-rose-200',
      dotColor: 'bg-rose-500',
    }
  }

  // --- CURRENCY CONVERSION HELPER ---
  const formatPrice = (priceIdr: number | undefined) => {
    if (!priceIdr || priceIdr <= 0) {
      return <span className="text-slate-400 font-medium">—</span>
    }

    if (selectedCurrency === 'USD') {
      const converted = priceIdr / rates.USD
      return (
        <span className="font-semibold text-slate-800">
          $ {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(converted)}/kg
        </span>
      )
    }

    if (selectedCurrency === 'JPY') {
      const converted = priceIdr / rates.JPY
      return (
        <span className="font-semibold text-slate-800">
          ¥ {new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 0 }).format(converted)}/kg
        </span>
      )
    }

    return (
      <span className="font-semibold text-slate-800">
        Rp {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.round(priceIdr))}/kg
      </span>
    )
  }

  // Flag helper
  const getFlag = (country: string) => {
    const c = (country || '').toLowerCase()
    if (c.includes('vietnam')) return '🇻🇳'
    if (c.includes('thailand')) return '🇹🇭'
    if (c.includes('jepang') || c.includes('japan')) return '🇯🇵'
    if (c.includes('korea')) return '🇰🇷'
    if (c.includes('indonesia')) return '🇮🇩'
    if (c.includes('china')) return '🇨🇳'
    return '🌐'
  }

  // --- FILTERED ROWS ---
  const filteredRows = useMemo(() => {
    return data.filter((row) => {
      if (selectedBuyer !== 'Semua Buyer' && row.buyer !== selectedBuyer) return false
      if (selectedNegara !== 'Semua Negara' && row.negara !== selectedNegara) return false
      if (selectedIkan !== 'Semua Ikan' && row.komoditas !== selectedIkan) return false
      return true
    })
  }, [data, selectedBuyer, selectedNegara, selectedIkan])

  // Filter Dropdown Options
  const buyerOptions = useMemo(() => {
    const set = new Set(data.map((d) => d.buyer).filter(Boolean))
    return ['Semua Buyer', ...Array.from(set)]
  }, [data])

  const negaraOptions = useMemo(() => {
    const set = new Set(data.map((d) => d.negara).filter(Boolean))
    return ['Semua Negara', ...Array.from(set)]
  }, [data])

  const ikanOptions = useMemo(() => {
    const set = new Set(data.map((d) => d.komoditas).filter(Boolean))
    return ['Semua Ikan', ...Array.from(set)]
  }, [data])

  // Open Add Sumber Modal for a specific row
  const handleOpenAddSumber = (row: BahanBakuRow) => {
    setSelectedBahanBaku(row)
    setShowSuccessAdded(false)
    setFormSumber({
      cabang: 'Manado',
      qty: '',
      supplier: '',
      spesifikasi: '',
      hargaBahanBaku: '',
      hargaProses: '',
      catatan: '',
      lampiranName: '',
    })
    setIsAddSumberModalOpen(true)
  }

  // Open Detail Modal for a specific row
  const handleOpenDetail = (row: BahanBakuRow) => {
    setSelectedBahanBaku(row)
    setSearchSumberQuery('')
    setIsDetailSumberModalOpen(true)
  }

  // Calculate Harga Akhir live on Form input
  const liveHargaAkhir = useMemo(() => {
    const hb = parseFloat(formSumber.hargaBahanBaku) || 0
    const hp = parseFloat(formSumber.hargaProses) || 0
    return hb + hp
  }, [formSumber.hargaBahanBaku, formSumber.hargaProses])

  // Submit Tambah Sumber
  const handleSubmitSumber = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBahanBaku) return
    if (!formSumber.cabang || !formSumber.qty || Number(formSumber.qty) <= 0) {
      alert('Mohon lengkapi Cabang / Lokasi dan Qty Tersedia.')
      return
    }

    const now = new Date()
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB by ${userName}`

    const newSumberObj: SumberItem = {
      _id: `src-${Date.now()}`,
      cabang: formSumber.cabang,
      supplier: formSumber.supplier || 'Supplier Lokal',
      qty: Number(formSumber.qty),
      spesifikasi: formSumber.spesifikasi || 'Grade A',
      hargaBahanBaku: formSumber.hargaBahanBaku ? Number(formSumber.hargaBahanBaku) : undefined,
      hargaProses: formSumber.hargaProses ? Number(formSumber.hargaProses) : undefined,
      harga: liveHargaAkhir > 0 ? liveHargaAkhir : undefined,
      catatan: formSumber.catatan,
      lampiran: formSumber.lampiranName,
      lastUpdated: formattedDate,
    }

    // Optimistic UI Update
    const updatedData = data.map((item) => {
      if (item._id === selectedBahanBaku._id) {
        const newSumberList = [...(item.sumber || []), newSumberObj]
        return {
          ...item,
          sumber: newSumberList,
          lastUpdated: formattedDate,
        }
      }
      return item
    })

    setData(updatedData)
    const updatedSelectedItem = updatedData.find((d) => d._id === selectedBahanBaku._id)
    if (updatedSelectedItem) setSelectedBahanBaku(updatedSelectedItem)

    // Show Success State inside Modal
    setAddedSummary({
      cabang: formSumber.cabang,
      qty: Number(formSumber.qty),
      hargaAkhir: liveHargaAkhir > 0 ? `Rp ${new Intl.NumberFormat('id-ID').format(liveHargaAkhir)}/kg` : 'Belum tersedia',
      jumlahSumber: (selectedBahanBaku.sumber?.length || 0) + 1,
    })
    setShowSuccessAdded(true)

    // Sync to Backend via PUT /api/bahan-baku
    try {
      await fetch('/api/bahan-baku', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedBahanBaku._id,
          newSumber: newSumberObj,
        }),
      })
    } catch (err) {
      console.error('Error saving new sumber to database:', err)
    }
  }

  // Delete a specific source inside Detail modal
  const handleDeleteSumber = async (sumberId: string | undefined, index: number) => {
    if (!selectedBahanBaku) return
    if (!confirm('Apakah kamu yakin ingin menghapus sumber bahan baku ini?')) return

    const newSumberList = (selectedBahanBaku.sumber || []).filter((_, idx) => idx !== index)

    const updatedData = data.map((item) => {
      if (item._id === selectedBahanBaku._id) {
        return { ...item, sumber: newSumberList }
      }
      return item
    })

    setData(updatedData)
    setSelectedBahanBaku({ ...selectedBahanBaku, sumber: newSumberList })

    // Save to Backend
    try {
      await fetch('/api/bahan-baku', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedBahanBaku._id,
          sumber: newSumberList,
        }),
      })
    } catch (err) {
      console.error('Error deleting sumber:', err)
    }
  }

  // Helper calculation for Detail Modal
  const detailModalMetrics = useMemo(() => {
    if (!selectedBahanBaku) return null
    const sumberArr = selectedBahanBaku.sumber || []
    const totalQty = sumberArr.reduce((sum, s) => sum + (s.qty || 0), 0)
    const validPrices = sumberArr.filter((s) => (s.harga || s.hargaBahanBaku || 0) > 0)
    const avgPrice =
      validPrices.length > 0
        ? validPrices.reduce((sum, s) => sum + (s.harga || s.hargaBahanBaku || 0), 0) / validPrices.length
        : 0

    const statusObj = calculateStatus(selectedBahanBaku)
    const targetPrice = selectedBahanBaku.hargaBuyer || 70000

    return {
      totalQty,
      jumlahSumber: sumberArr.length,
      avgPrice,
      statusObj,
      targetPrice,
    }
  }, [selectedBahanBaku])

  const filteredSumberList = useMemo(() => {
    if (!selectedBahanBaku) return []
    const list = selectedBahanBaku.sumber || []
    if (!searchSumberQuery) return list
    return list.filter(
      (s) =>
        s.cabang?.toLowerCase().includes(searchSumberQuery.toLowerCase()) ||
        s.supplier?.toLowerCase().includes(searchSumberQuery.toLowerCase())
    )
  }, [selectedBahanBaku, searchSumberQuery])

  return (
    <MainLayout>
      <div className="space-y-6 pb-10 select-none">
        {/* HEADER SECTION WITH MANUAL KURS WIDGET */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <Layers className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Bahan Baku</h1>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Kelola semua penawaran bahan baku dari supplier untuk memenuhi permintaan buyer
            </p>
          </div>

          {/* KURS MANUAL CARD (TOP RIGHT) */}
          <div className="flex items-center gap-4 shrink-0 flex-wrap">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">KURS AKTIF (IDR)</span>
                  <HelpCircle className="w-3 h-3 text-slate-400" />
                </div>
                {/* Currency Buttons */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg mt-1 gap-0.5">
                  {(['IDR', 'USD', 'JPY'] as const).map((curr) => (
                    <button
                      key={curr}
                      onClick={async () => {
                        setSelectedCurrency(curr)
                        try {
                          await fetch('/api/kurs', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              USD: rates.USD,
                              JPY: rates.JPY,
                              selectedCurrency: curr,
                              user: userName,
                            }),
                          })
                        } catch (err) {
                          console.error(err)
                        }
                      }}
                      className={`px-2 py-0.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        selectedCurrency === curr
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-7 w-px bg-slate-200" />

              {/* Rates Display */}
              <div className="text-xs font-medium text-slate-600 space-y-0.5">
                <p>1 USD = <span className="font-bold text-slate-800">{new Intl.NumberFormat('id-ID').format(rates.USD)}</span></p>
                <p>1 JPY = <span className="font-bold text-slate-800">{rates.JPY.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span></p>
              </div>

              {/* Edit Kurs Button */}
              <button
                onClick={() => {
                  setTempRates({ ...rates })
                  setIsKursModalOpen(true)
                }}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                title="Ubah Nilai Kurs"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <span>{kursLastUpdated}</span>
              <button
                onClick={() => fetchBahanBakuData()}
                className="p-1 hover:text-slate-600 transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* 1. FILTER BAR */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Buyer */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Buyer
              </label>
              <div className="relative">
                <select
                  value={selectedBuyer}
                  onChange={(e) => setSelectedBuyer(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
                >
                  {buyerOptions.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Negara / Tujuan */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Negara / Tujuan
              </label>
              <div className="relative">
                <select
                  value={selectedNegara}
                  onChange={(e) => setSelectedNegara(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
                >
                  {negaraOptions.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Ikan (Item) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Ikan (Item)
              </label>
              <div className="relative">
                <select
                  value={selectedIkan}
                  onChange={(e) => setSelectedIkan(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
                >
                  {ikanOptions.map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Periode Tanggal */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Periode Tanggal
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
            <button
              onClick={() => {
                setSelectedBuyer('Semua Buyer')
                setSelectedNegara('Semua Negara')
                setSelectedIkan('Semua Ikan')
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter Lainnya</span>
            </button>

            <button
              onClick={() => {
                setSelectedBuyer('Semua Buyer')
                setSelectedNegara('Semua Negara')
                setSelectedIkan('Semua Ikan')
              }}
              className="px-4 py-1.5 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* 2. MAIN BAHAN BAKU TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3 text-center w-12">No</th>
                  <th className="py-3 px-3">Buyer</th>
                  <th className="py-3 px-3">Negara</th>
                  <th className="py-3 px-3">Komoditas</th>
                  <th className="py-3 px-3 text-right">Qty Permintaan</th>
                  <th className="py-3 px-3 text-right">Total Qty Tersedia</th>
                  <th className="py-3 px-3 text-center">Jumlah Sumber</th>
                  <th className="py-3 px-3 text-right">Harga Rata-rata (Harga Akhir)</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3">Last Updated</th>
                  <th className="py-3 px-3 text-center w-16">+</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.length > 0 ? (
                  filteredRows.map((row, index) => {
                    const sumberList = row.sumber || []
                    const totalQtyTersedia = sumberList.reduce((sum, s) => sum + (s.qty || 0), 0)
                    const validPrices = sumberList.filter((s) => (s.harga || s.hargaBahanBaku || 0) > 0)
                    const avgPrice =
                      validPrices.length > 0
                        ? validPrices.reduce((sum, s) => sum + (s.harga || s.hargaBahanBaku || 0), 0) / validPrices.length
                        : undefined

                    const statusObj = calculateStatus(row)

                    return (
                      <tr key={row._id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3.5 px-3 text-center text-slate-400 font-medium">
                          {index + 1}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-blue-600 hover:underline cursor-pointer">
                          {row.buyer}
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className="mr-1.5">{getFlag(row.negara)}</span>
                          <span className="font-medium text-slate-700">{row.negara}</span>
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-slate-800">
                          {row.komoditas}
                        </td>
                        <td className="py-3.5 px-3 text-right font-bold text-slate-800 whitespace-nowrap">
                          {new Intl.NumberFormat('id-ID').format(row.qtyPermintaan)} kg
                        </td>
                        <td className="py-3.5 px-3 text-right font-bold text-slate-800 whitespace-nowrap">
                          {totalQtyTersedia > 0 ? `${new Intl.NumberFormat('id-ID').format(totalQtyTersedia)} kg` : '—'}
                        </td>
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          {/* BADGE KLIK POPUP DETAIL SUMBER */}
                          <button
                            onClick={() => handleOpenDetail(row)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors shadow-2xs cursor-pointer"
                            title="Klik untuk melihat detail seluruh sumber"
                          >
                            <span>{sumberList.length} Sumber</span>
                          </button>
                        </td>
                        <td className="py-3.5 px-3 text-right whitespace-nowrap">
                          {formatPrice(avgPrice)}
                        </td>
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusObj.colorClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusObj.dotColor}`} />
                            {statusObj.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                          {row.lastUpdated}
                        </td>
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            {/* TOMBOL + TAMBAH SUMBER */}
                            <button
                              onClick={() => handleOpenAddSumber(row)}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 transition-all shadow-2xs cursor-pointer"
                              title="Tambah Sumber untuk komoditas ini"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenDetail(row)}
                              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Menu Opsi"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400">
                      Tidak ada data bahan baku yang sesuai filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-500 bg-slate-50/50 flex justify-between items-center">
            <p>Menampilkan 1 - {filteredRows.length} dari {filteredRows.length} data</p>
          </div>
        </div>

        {/* 3. MODAL FORM TAMBAH SUMBER (TRIGGER DARI TOMBOL +) */}
        {isAddSumberModalOpen && selectedBahanBaku && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-200 my-8">
              {!showSuccessAdded ? (
                <>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">
                        Tambah Sumber — {selectedBahanBaku.komoditas} ({selectedBahanBaku.buyer})
                      </h3>
                      <p className="text-xs text-slate-500">
                        Input penawaran sumber bahan baku untuk permintaan ini
                      </p>
                    </div>
                    <button
                      onClick={() => setIsAddSumberModalOpen(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Header Summary Box */}
                  <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-xs text-slate-600">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">BUYER</span>
                      <span className="font-bold text-slate-800 truncate block">{selectedBahanBaku.buyer}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">NEGARA / TUJUAN</span>
                      <span className="font-semibold text-slate-800 truncate block">{selectedBahanBaku.negara}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">KOMODITAS</span>
                      <span className="font-bold text-blue-600 truncate block">{selectedBahanBaku.komoditas}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">QTY PERMINTAAN</span>
                      <span className="font-bold text-slate-800 truncate block">
                        {new Intl.NumberFormat('id-ID').format(selectedBahanBaku.qtyPermintaan)} kg
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleSubmitSumber} className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Cabang / Lokasi <span className="text-rose-500">*</span>
                        </label>
                        <select
                          required
                          value={formSumber.cabang}
                          onChange={(e) => setFormSumber({ ...formSumber, cabang: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                          {['Manado', 'Bitung', 'Ternate', 'Ambon', 'Makassar', 'Kendari', 'Bau-Bau', 'Jakarta', 'Bali', 'Banyuwangi', 'Surabaya', 'Sorong'].map(
                            (c) => (
                              <option key={c} value={c}>{c}</option>
                            )
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Qty Tersedia (kg) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          min={1}
                          placeholder="Contoh: 2000"
                          value={formSumber.qty}
                          onChange={(e) => setFormSumber({ ...formSumber, qty: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Supplier <span className="font-normal text-slate-400">(Opsional)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Pilih / input supplier..."
                          value={formSumber.supplier}
                          onChange={(e) => setFormSumber({ ...formSumber, supplier: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Spesifikasi <span className="font-normal text-slate-400">(Opsional)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Size, grade, kondisi, dll."
                          value={formSumber.spesifikasi}
                          onChange={(e) => setFormSumber({ ...formSumber, spesifikasi: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Harga Bahan Baku <span className="font-normal text-slate-400">(IDR/kg)</span>
                        </label>
                        <input
                          type="number"
                          placeholder="Rp / kg"
                          value={formSumber.hargaBahanBaku}
                          onChange={(e) => setFormSumber({ ...formSumber, hargaBahanBaku: e.target.value })}
                          className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Harga Proses <span className="font-normal text-slate-400">(IDR/kg)</span>
                        </label>
                        <input
                          type="number"
                          placeholder="Rp / kg"
                          value={formSumber.hargaProses}
                          onChange={(e) => setFormSumber({ ...formSumber, hargaProses: e.target.value })}
                          className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Harga Akhir <span className="font-normal text-slate-400">(IDR/kg)</span>
                        </label>
                        <div className="w-full px-2.5 py-2 bg-blue-50 border border-blue-200 rounded-xl font-bold text-blue-700 truncate">
                          {liveHargaAkhir > 0
                            ? `Rp ${new Intl.NumberFormat('id-ID').format(liveHargaAkhir)}`
                            : 'Otomatis terhitung'}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Lampiran Perhitungan <span className="font-normal text-slate-400">(Opsional)</span>
                        </label>
                        <div className="border border-dashed border-slate-300 rounded-xl p-2.5 text-center bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
                          <Upload className="w-4 h-4 mx-auto text-slate-400 mb-1" />
                          <p className="text-[10px] text-slate-500 font-medium">Upload Excel atau PDF (Max. 10 MB)</p>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Catatan <span className="font-normal text-slate-400">(Opsional)</span>
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Masukkan catatan..."
                          value={formSumber.catatan}
                          onChange={(e) => setFormSumber({ ...formSumber, catatan: e.target.value })}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <p className="text-[11px] text-slate-400">
                        <span className="text-rose-500">*</span> Wajib diisi
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAddSumberModalOpen(false)}
                          className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
                        >
                          Simpan Sumber
                        </button>
                      </div>
                    </div>
                  </form>
                </>
              ) : (
                /* SUCCESS CONFIRMATION BOX */
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Sumber berhasil ditambahkan!</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Data sumber {selectedBahanBaku.komoditas} untuk {selectedBahanBaku.buyer} telah berhasil disimpan ke database.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-xs mx-auto text-left text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cabang / Lokasi:</span>
                      <span className="font-bold text-slate-800">{addedSummary?.cabang}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Qty Tersedia:</span>
                      <span className="font-bold text-slate-800">{new Intl.NumberFormat('id-ID').format(addedSummary?.qty)} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Harga Akhir:</span>
                      <span className="font-bold text-slate-800">{addedSummary?.hargaAkhir}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Jumlah Sumber:</span>
                      <span className="font-bold text-blue-600">{addedSummary?.jumlahSumber} Sumber</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setIsAddSumberModalOpen(false)
                        setShowSuccessAdded(false)
                      }}
                      className="px-6 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-blue-700 cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. MODAL POP-UP DETAIL SUMBER (TRIGGER DARI KLIK "7 Sumber", "5 Sumber") */}
        {isDetailSumberModalOpen && selectedBahanBaku && detailModalMetrics && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-200 my-8">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Detail Sumber — {selectedBahanBaku.komoditas} ({selectedBahanBaku.buyer})
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                    <span>Negara: <span className="font-semibold text-slate-800">{selectedBahanBaku.negara}</span></span>
                    <span>Permintaan: <span className="font-bold text-slate-800">{new Intl.NumberFormat('id-ID').format(selectedBahanBaku.qtyPermintaan)} kg</span></span>
                    <span>Target Buyer: <span className="font-bold text-blue-600">Rp {new Intl.NumberFormat('id-ID').format(detailModalMetrics.targetPrice)}/kg</span></span>
                  </div>
                </div>
                <button
                  onClick={() => setIsDetailSumberModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 4 Summary Metric Cards Top */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Qty Tersedia</p>
                  <p className="text-base font-bold text-slate-800 mt-1">
                    {new Intl.NumberFormat('id-ID').format(detailModalMetrics.totalQty)} kg
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jumlah Sumber</p>
                  <p className="text-base font-bold text-blue-600 mt-1">
                    {detailModalMetrics.jumlahSumber} Sumber
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Harga Rata-rata (Akhir)</p>
                  <p className="text-base font-bold text-slate-800 mt-1">
                    {detailModalMetrics.avgPrice > 0 ? `Rp ${new Intl.NumberFormat('id-ID').format(detailModalMetrics.avgPrice)}/kg` : '—'}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
                  <div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${detailModalMetrics.statusObj.colorClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${detailModalMetrics.statusObj.dotColor}`} />
                      {detailModalMetrics.statusObj.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Bar inside Modal */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari cabang, supplier, atau lokasi..."
                    value={searchSumberQuery}
                    onChange={(e) => setSearchSumberQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={() => {
                    setIsDetailSumberModalOpen(false)
                    handleOpenAddSumber(selectedBahanBaku)
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tambah Sumber</span>
                </button>
              </div>

              {/* Table of Sources */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-10">No</th>
                      <th className="py-2.5 px-3">Cabang / Lokasi</th>
                      <th className="py-2.5 px-3">Supplier</th>
                      <th className="py-2.5 px-3 text-right">Qty Tersedia</th>
                      <th className="py-2.5 px-3 text-right">Harga Akhir (IDR/kg)</th>
                      <th className="py-2.5 px-3">Last Updated</th>
                      <th className="py-2.5 px-3 text-center w-16">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSumberList.length > 0 ? (
                      filteredSumberList.map((s, idx) => (
                        <tr key={s._id || idx} className="hover:bg-blue-50/30 transition-colors">
                          <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-800">{s.cabang}</td>
                          <td className="py-2.5 px-3 text-slate-600">{s.supplier || '—'}</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                            {new Intl.NumberFormat('id-ID').format(s.qty)} kg
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                            {s.harga || s.hargaBahanBaku
                              ? `Rp ${new Intl.NumberFormat('id-ID').format(s.harga || s.hargaBahanBaku || 0)}`
                              : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-500">{s.lastUpdated || 'Hari ini'}</td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => handleDeleteSumber(s._id, idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Sumber"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400">
                          Belum ada sumber bahan baku untuk komoditas ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Box Ringkasan Perhitungan */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xs text-slate-600">
                <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-1">
                  Ringkasan Perhitungan
                </p>
                <div className="flex justify-between">
                  <span>Total Qty Tersedia:</span>
                  <span className="font-bold text-slate-800">{new Intl.NumberFormat('id-ID').format(detailModalMetrics.totalQty)} kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Rata-rata Harga Akhir:</span>
                  <span className="font-bold text-slate-800">
                    {detailModalMetrics.avgPrice > 0 ? `Rp ${new Intl.NumberFormat('id-ID').format(detailModalMetrics.avgPrice)}/kg` : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Perbandingan dengan Target Buyer:</span>
                  <span className="font-bold text-slate-800">
                    Rp {new Intl.NumberFormat('id-ID').format(detailModalMetrics.avgPrice)} / Rp {new Intl.NumberFormat('id-ID').format(detailModalMetrics.targetPrice)}
                    <span className={detailModalMetrics.avgPrice <= detailModalMetrics.targetPrice ? ' text-emerald-600 ml-1' : ' text-rose-600 ml-1'}>
                      ({detailModalMetrics.avgPrice <= detailModalMetrics.targetPrice ? 'Memenuhi Target' : 'Di atas Target'})
                    </span>
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1">
                  <span>Evaluasi:</span>
                  <span className="font-bold text-slate-800">{detailModalMetrics.statusObj.label}</span>
                </div>
                <p className="text-[10px] text-slate-400 italic pt-1">
                  💡 Harga Akhir = Harga Bahan Baku + Harga Proses
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setIsDetailSumberModalOpen(false)}
                  className="px-5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. MODAL UBAH KURS MANUAL */}
        {isKursModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800">Ubah Kurs Manual</h3>
                <button
                  onClick={() => setIsKursModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">1 USD (dalam IDR)</label>
                  <input
                    type="number"
                    value={tempRates.USD}
                    onChange={(e) => setTempRates({ ...tempRates, USD: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">1 JPY (dalam IDR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={tempRates.JPY}
                    onChange={(e) => setTempRates({ ...tempRates, JPY: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setIsKursModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={async () => {
                    setRates({ ...tempRates })
                    const now = new Date()
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
                    const formattedDate = `Last Updated: ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} by ${userName}`
                    setKursLastUpdated(formattedDate)
                    setIsKursModalOpen(false)

                    try {
                      await fetch('/api/kurs', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          USD: tempRates.USD,
                          JPY: tempRates.JPY,
                          selectedCurrency,
                          user: userName,
                        }),
                      })
                    } catch (err) {
                      console.error('Error saving kurs from bahan baku:', err)
                    }
                  }}
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Simpan Kurs
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
