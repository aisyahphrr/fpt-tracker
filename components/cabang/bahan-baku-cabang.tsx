'use client'

import { useState, useEffect, useMemo } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { DAFTAR_CABANG } from '@/lib/constants/cabang'
import { formatUserRoleLabel } from '@/lib/utils'
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
  Eye,
  Info,
  Download,
} from 'lucide-react'

interface SumberDetailSize {
  size: string
  qty: number
  hargaBB: number
  hargaProses: number
  hargaLogistik: number
  hargaAkhir: number
}

interface SumberItem {
  _id?: string
  cabang: string
  supplier?: string
  qty: number
  spesifikasi?: string
  sizes?: SumberDetailSize[]
  hargaBahanBaku?: number
  hargaProses?: number
  hargaLogistik?: number
  harga?: number // Harga Akhir per Kg = BB + Proses + Logistik
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
  allowedSizes?: Array<{ size: string; qty?: number; harga?: number; currency?: string }>
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

  // Supplier Detail Popup Modal
  const [selectedSupplierDetail, setSelectedSupplierDetail] = useState<SumberItem | null>(null)

  // Multi-Size Form State for Tambah Sumber
  interface SumberSizeRowState {
    size: string
    qty: string
    hargaBB: string
    hargaProses: string
  }
  const [sumberSizeRows, setSumberSizeRows] = useState<SumberSizeRowState[]>([])
  const [biayaLogistik, setBiayaLogistik] = useState('')

  const [formSumber, setFormSumber] = useState({
    cabang: 'Kantor Pusat',
    supplier: '',
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
          const roleLabel = formatUserRoleLabel(d.role, d.name, d.email)
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

  // Available size options matching specific buyer request
  const availableSizeOptions = useMemo(() => {
    if (!selectedBahanBaku) return []
    if (selectedBahanBaku.allowedSizes && selectedBahanBaku.allowedSizes.length > 0) {
      return selectedBahanBaku.allowedSizes.map((s) => s.size).filter(Boolean)
    }
    const k = (selectedBahanBaku.komoditas || '').toLowerCase()
    if (k.includes('cuttlefish') || k.includes('squid') || k.includes('cumi') || k.includes('sotong')) {
      return ['300 - 500 g', '500 - 700 g', '700 - 1.000 g', '1.000 g Up']
    }
    if (k.includes('cakalang') || k.includes('skipjack')) {
      return ['Size 1 kg', 'Size 1 - 2 kg', 'Size 2 - 4 kg', 'Size 4 kg Up']
    }
    return ['Size 1 - 2 kg', 'Size 2 - 4 kg', 'Size 4 kg Up', 'All Size']
  }, [selectedBahanBaku])

  // Open Add Sumber Modal for a specific row
  const handleOpenAddSumber = (row: BahanBakuRow) => {
    setSelectedBahanBaku(row)
    setShowSuccessAdded(false)
    setFormSumber({
      cabang: 'Kantor Pusat',
      supplier: '',
      catatan: '',
      lampiranName: '',
    })
    setBiayaLogistik('')

    const allowed =
      row.allowedSizes && row.allowedSizes.length > 0
        ? row.allowedSizes.map((s) => s.size).filter(Boolean)
        : []

    if (allowed.length > 0) {
      setSumberSizeRows(
        allowed.map((sz) => ({
          size: sz,
          qty: '',
          hargaBB: '',
          hargaProses: '',
        }))
      )
    } else {
      const k = (row.komoditas || '').toLowerCase()
      if (k.includes('cuttlefish') || k.includes('squid') || k.includes('cumi') || k.includes('sotong')) {
        setSumberSizeRows([
          { size: '300 - 500 g', qty: '', hargaBB: '', hargaProses: '' },
          { size: '500 - 700 g', qty: '', hargaBB: '', hargaProses: '' },
          { size: '700 - 1.000 g', qty: '', hargaBB: '', hargaProses: '' },
        ])
      } else if (k.includes('cakalang') || k.includes('skipjack')) {
        setSumberSizeRows([
          { size: 'Size 1 kg', qty: '', hargaBB: '', hargaProses: '' },
          { size: 'Size 1 - 2 kg', qty: '', hargaBB: '', hargaProses: '' },
          { size: 'Size 2 - 4 kg', qty: '', hargaBB: '', hargaProses: '' },
        ])
      } else {
        setSumberSizeRows([
          { size: 'Size 1 - 2 kg', qty: '', hargaBB: '', hargaProses: '' },
          { size: 'Size 2 - 4 kg', qty: '', hargaBB: '', hargaProses: '' },
        ])
      }
    }
    setIsAddSumberModalOpen(true)
  }

  // Open Detail Modal for a specific row
  const handleOpenDetail = (row: BahanBakuRow) => {
    setSelectedBahanBaku(row)
    setSearchSumberQuery('')
    setIsDetailSumberModalOpen(true)
  }

  const handleAddSumberSizeRow = () => {
    const unselected =
      availableSizeOptions.find((opt) => !sumberSizeRows.some((r) => r.size === opt)) ||
      availableSizeOptions[0] ||
      ''
    setSumberSizeRows((prev) => [
      ...prev,
      { size: unselected, qty: '', hargaBB: '', hargaProses: '' },
    ])
  }

  const handleRemoveSumberSizeRow = (idx: number) => {
    setSumberSizeRows((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleUpdateSumberSizeRow = (idx: number, field: string, val: string) => {
    setSumberSizeRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: val } : r))
    )
  }

  // Calculate live multi-size metrics
  const sumberMetrics = useMemo(() => {
    let totalQty = 0
    let totalValue = 0
    let validRowsCount = 0
    const logistikNum = Number(biayaLogistik) || 0

    const computed = sumberSizeRows.map((r) => {
      const q = Number(r.qty) || 0
      const bb = Number(r.hargaBB) || 0
      const hp = Number(r.hargaProses) || 0
      const akhir = bb + hp + logistikNum
      totalQty += q
      if (akhir > 0) {
        validRowsCount++
        totalValue += q > 0 ? q * akhir : akhir
      }
      return {
        ...r,
        numericBB: bb,
        numericProses: hp,
        numericLogistik: logistikNum,
        numericAkhir: akhir,
      }
    })

    const avgHargaAkhir =
      totalQty > 0
        ? Math.round(totalValue / totalQty)
        : validRowsCount > 0
        ? Math.round(totalValue / validRowsCount)
        : 0

    return { totalQty, avgHargaAkhir, computed }
  }, [sumberSizeRows, biayaLogistik])

  // Submit Tambah Sumber
  const handleSubmitSumber = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBahanBaku) return
    if (!formSumber.cabang) {
      alert('Mohon pilih Cabang / Lokasi.')
      return
    }

    if (sumberMetrics.totalQty <= 0) {
      alert('Mohon isi minimal satu baris kuantitas (Qty Tersedia) untuk size.')
      return
    }

    const now = new Date()
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB by ${userName}`

    const finalSizes: SumberDetailSize[] = sumberMetrics.computed
      .filter((r) => r.size.trim() !== '')
      .map((r) => ({
        size: r.size.trim(),
        qty: Number(r.qty) || 0,
        hargaBB: r.numericBB,
        hargaProses: r.numericProses,
        hargaLogistik: r.numericLogistik,
        hargaAkhir: r.numericAkhir,
      }))

    const newSumberObj: SumberItem = {
      _id: `src-${Date.now()}`,
      cabang: formSumber.cabang,
      supplier: formSumber.supplier || 'Supplier Lokal',
      qty: sumberMetrics.totalQty,
      spesifikasi: `${finalSizes.length} Size terdaftar`,
      sizes: finalSizes,
      hargaBahanBaku: finalSizes.length > 0 ? finalSizes[0].hargaBB : undefined,
      hargaProses: finalSizes.length > 0 ? finalSizes[0].hargaProses : undefined,
      hargaLogistik: Number(biayaLogistik) || undefined,
      harga: sumberMetrics.avgHargaAkhir > 0 ? sumberMetrics.avgHargaAkhir : undefined,
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
      qty: sumberMetrics.totalQty,
      hargaAkhir:
        sumberMetrics.avgHargaAkhir > 0
          ? `Rp ${new Intl.NumberFormat('id-ID').format(sumberMetrics.avgHargaAkhir)}/kg (Rata-rata)`
          : 'Belum tersedia',
      jumlahSumber: (selectedBahanBaku.sumber?.length || 0) + 1,
    })
    setShowSuccessAdded(true)

    // Sync to Backend via PUT /api/bahan-baku
    try {
      const res = await fetch('/api/bahan-baku', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedBahanBaku._id,
          newSumber: newSumberObj,
        }),
      })
      if (res.ok) {
        await fetchBahanBakuData()
      } else {
        const errJson = await res.json()
        console.error('Error saving new sumber:', errJson)
      }
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
      const res = await fetch('/api/bahan-baku', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedBahanBaku._id,
          sumber: newSumberList,
        }),
      })
      if (res.ok) {
        await fetchBahanBakuData()
      }
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
                  <th className="py-3 px-3 text-center w-16">Aksi</th>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-200 my-6 max-h-[92vh] overflow-y-auto">
              {!showSuccessAdded ? (
                <>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">
                        Tambah Sumber Bahan Baku — <span className="text-blue-600">{selectedBahanBaku.komoditas}</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Input penawaran bahan baku untuk memenuhi permintaan {selectedBahanBaku.buyer}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsAddSumberModalOpen(false)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Header Summary Bar */}
                  <div className="flex items-center justify-between bg-slate-50/80 p-3 rounded-xl border border-slate-200 text-xs">
                    <div className="grid grid-cols-3 gap-6 flex-1">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Buyer</span>
                        <span className="font-bold text-slate-800 text-xs mt-0.5 block">{selectedBahanBaku.buyer}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Negara / Tujuan</span>
                        <span className="font-medium text-slate-700 text-xs mt-0.5 block">{selectedBahanBaku.negara || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Komoditas</span>
                        <span className="font-bold text-blue-600 text-xs mt-0.5 block">{selectedBahanBaku.komoditas}</span>
                      </div>
                    </div>

                    <div className="border-l border-slate-200 pl-6 text-right">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Total Permintaan</span>
                      <span className="font-extrabold text-slate-800 text-sm mt-0.5 block">
                        {new Intl.NumberFormat('id-ID').format(selectedBahanBaku.qtyPermintaan)} kg
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleSubmitSumber} className="space-y-4 text-xs">
                    {/* 2 COLUMNS LAYOUT LIKE CANVA MOCKUP */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                      
                      {/* LEFT COLUMN (COL-SPAN-8): CABANG, SUPPLIER, SIZE TABLE, BIAYA LOGISTIK */}
                      <div className="lg:col-span-8 space-y-3.5">
                        
                        {/* Cabang & Supplier Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">
                              Cabang / Lokasi <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <select
                                required
                                value={formSumber.cabang}
                                onChange={(e) => setFormSumber({ ...formSumber, cabang: e.target.value })}
                                className="w-full appearance-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer text-xs pr-8"
                              >
                                {DAFTAR_CABANG.map((c) => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 mb-1">
                              Supplier <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Contoh: PT Suri Tani Pemuka"
                              value={formSumber.supplier}
                              onChange={(e) => setFormSumber({ ...formSumber, supplier: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-semibold text-xs"
                            />
                          </div>
                        </div>

                        {/* Detail Size & Harga Header */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700">
                              Detail Size & Harga <span className="font-normal text-slate-400">(mengikuti permintaan buyer)</span>
                            </span>
                          </div>

                          {/* Dynamic Size Table */}
                          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[10px]">
                                <tr>
                                  <th className="py-2 px-2 text-center w-8">No</th>
                                  <th className="py-2 px-2.5">Size *</th>
                                  <th className="py-2 px-2 text-right">Qty Tersedia (kg) *</th>
                                  <th className="py-2 px-2 text-right">Harga BB (IDR/kg) *</th>
                                  <th className="py-2 px-2 text-right">Harga Proses (IDR/kg)</th>
                                  <th className="py-2 px-2.5 text-right font-extrabold text-blue-900">Harga Akhir (IDR/kg)</th>
                                  <th className="py-2 px-1 text-center w-7"></th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {sumberSizeRows.map((row, idx) => {
                                  const bb = Number(row.hargaBB) || 0
                                  const hp = Number(row.hargaProses) || 0
                                  const logistikNum = Number(biayaLogistik) || 0
                                  const akhir = bb + hp + logistikNum

                                  return (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="py-1.5 px-2 text-center text-slate-400 font-medium text-[11px]">
                                        {idx + 1}
                                      </td>
                                      <td className="py-1.5 px-2">
                                        <div className="relative">
                                          <select
                                            value={row.size}
                                            onChange={(e) => handleUpdateSumberSizeRow(idx, 'size', e.target.value)}
                                            className="w-full appearance-none px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 font-semibold text-xs cursor-pointer pr-6"
                                          >
                                            {availableSizeOptions.map((opt) => (
                                              <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                          </select>
                                          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                      </td>
                                      <td className="py-1.5 px-2">
                                        <input
                                          type="number"
                                          min={0}
                                          required
                                          placeholder="0"
                                          value={row.qty}
                                          onChange={(e) => handleUpdateSumberSizeRow(idx, 'qty', e.target.value)}
                                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold text-xs text-right text-slate-800"
                                        />
                                      </td>
                                      <td className="py-1.5 px-2">
                                        <input
                                          type="number"
                                          min={0}
                                          required
                                          placeholder="0"
                                          value={row.hargaBB}
                                          onChange={(e) => handleUpdateSumberSizeRow(idx, 'hargaBB', e.target.value)}
                                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-xs text-right"
                                        />
                                      </td>
                                      <td className="py-1.5 px-2">
                                        <input
                                          type="number"
                                          min={0}
                                          placeholder="0"
                                          value={row.hargaProses}
                                          onChange={(e) => handleUpdateSumberSizeRow(idx, 'hargaProses', e.target.value)}
                                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-xs text-right"
                                        />
                                      </td>
                                      <td className="py-1.5 px-2.5 text-right font-extrabold text-slate-800 whitespace-nowrap">
                                        {akhir > 0 ? new Intl.NumberFormat('id-ID').format(akhir) : '—'}
                                      </td>
                                      <td className="py-1.5 px-1 text-center">
                                        {sumberSizeRows.length > 1 && (
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveSumberSizeRow(idx)}
                                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                            title="Hapus baris size"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>

                          <div className="pt-0.5">
                            <button
                              type="button"
                              onClick={handleAddSumberSizeRow}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Tambah Size</span>
                            </button>
                          </div>
                        </div>

                        {/* Biaya Logistik (Berlaku untuk semua size) */}
                        <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3 space-y-1">
                          <span className="text-[11px] font-bold text-slate-700 block">
                            Biaya Logistik <span className="font-normal text-slate-400">(berlaku untuk semua size)</span>
                          </span>
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-xs text-slate-600 font-medium">Harga Logistik (Opsional)</span>
                            <div className="flex items-center gap-1.5 w-36">
                              <input
                                type="number"
                                min={0}
                                placeholder="0"
                                value={biayaLogistik}
                                onChange={(e) => setBiayaLogistik(e.target.value)}
                                className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold text-xs text-right"
                              />
                              <span className="text-slate-500 font-medium text-xs whitespace-nowrap">/ kg</span>
                            </div>
                            <span className="text-[10px] text-slate-400 italic ml-2">
                              Berlaku untuk seluruh size dalam sumber ini.
                            </span>
                          </div>
                        </div>

                      </div>

                      {/* RIGHT COLUMN (COL-SPAN-4): FILE PERHITUNGAN & CATATAN & ACTIONS */}
                      <div className="lg:col-span-4 space-y-3.5 flex flex-col justify-between h-full">
                        
                        {/* Input File Perhitungan */}
                        <div className="space-y-1">
                          <label className="block font-bold text-slate-700">
                            Input File Perhitungan <span className="font-normal text-slate-400">(Opsional)</span>
                          </label>
                          <label className="border border-dashed border-blue-200 hover:border-blue-400 rounded-xl p-4 text-center bg-blue-50/40 hover:bg-blue-50/70 cursor-pointer transition-all flex flex-col items-center justify-center min-h-[120px] group block">
                            <Upload className="w-6 h-6 text-blue-500 mb-1.5 group-hover:scale-110 transition-transform" />
                            <p className="text-xs text-blue-700 font-bold">Upload File (Excel/PDF)</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Drag & drop File atau klik untuk memilih</p>
                            <p className="text-[9px] text-slate-400">Maks. 10 MB</p>
                            <input
                              type="file"
                              accept=".xlsx,.xls,.pdf"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setFormSumber({ ...formSumber, lampiranName: e.target.files[0].name })
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                          {formSumber.lampiranName && (
                            <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                              <span className="truncate font-semibold">{formSumber.lampiranName}</span>
                              <button
                                type="button"
                                onClick={() => setFormSumber({ ...formSumber, lampiranName: '' })}
                                className="text-emerald-700 hover:text-emerald-900 ml-2"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Catatan (Opsional) */}
                        <div className="space-y-1">
                          <label className="block font-bold text-slate-700">
                            Catatan <span className="font-normal text-slate-400">(Opsional)</span>
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Tambahkan catatan..."
                            value={formSumber.catatan}
                            onChange={(e) => setFormSumber({ ...formSumber, catatan: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs resize-none h-20 transition-all"
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setIsAddSumberModalOpen(false)}
                            className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer transition-all hover:shadow-sm"
                          >
                            Simpan Sumber
                          </button>
                        </div>

                      </div>

                    </div>

                    {/* Bottom Info Banner */}
                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-blue-50/90 border border-blue-200 text-blue-900 text-[11px] font-medium">
                      <Info className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>
                        Harga proses, harga logistik, dan file perhitungan tidak wajib diisi. Jika dikosongkan, harga akhir hanya menggunakan harga bahan baku.
                      </span>
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
                        fetchBahanBakuData()
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
                  <span>Tambah Sumber</span>
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
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-slate-800">{s.supplier || '—'}</span>
                              {s.sizes && s.sizes.length > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedSupplierDetail(s)}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <span>{s.sizes.length} Size</span>
                                  <ChevronDown className="w-2.5 h-2.5" />
                                </button>
                              ) : (
                                s.spesifikasi && (
                                  <span className="text-[10px] text-slate-400">({s.spesifikasi})</span>
                                )
                              )}
                            </div>
                          </td>
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
                            <div className="flex items-center justify-center gap-1">
                              {s.sizes && s.sizes.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedSupplierDetail(s)}
                                  className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  title="Lihat Detail Size Supplier"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteSumber(s._id, idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Sumber"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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

              {/* Detail Size Sub-table (Panel 5 Ilustrasi Mentor) */}
              {filteredSumberList.some((s) => s.sizes && s.sizes.length > 0) && (
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  {filteredSumberList
                    .filter((s) => s.sizes && s.sizes.length > 0)
                    .map((s, sIdx) => {
                      const totalSubQty = (s.sizes || []).reduce((sum, sz) => sum + (sz.qty || 0), 0)
                      const avgSubBB =
                        (s.sizes || []).reduce((sum, sz) => sum + (sz.hargaBB || 0), 0) /
                        ((s.sizes || []).length || 1)
                      const avgSubProses =
                        (s.sizes || []).reduce((sum, sz) => sum + (sz.hargaProses || 0), 0) /
                        ((s.sizes || []).length || 1)
                      const avgSubLogistik =
                        (s.sizes || []).reduce((sum, sz) => sum + (sz.hargaLogistik || 0), 0) /
                        ((s.sizes || []).length || 1)

                      return (
                        <div key={sIdx} className="space-y-2">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                            Detail Size dari {s.supplier || s.cabang}
                          </h4>

                          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[10px]">
                                <tr>
                                  <th className="py-2 px-3 text-center w-10">No</th>
                                  <th className="py-2 px-3">Size</th>
                                  <th className="py-2 px-3 text-right">Qty Tersedia</th>
                                  <th className="py-2 px-3 text-right">Harga BB</th>
                                  <th className="py-2 px-3 text-right">Harga Proses</th>
                                  <th className="py-2 px-3 text-right">Harga Logistik</th>
                                  <th className="py-2 px-3 text-right font-extrabold text-blue-900">Harga Akhir</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {(s.sizes || []).map((sz, szIdx) => (
                                  <tr key={szIdx} className="hover:bg-blue-50/20 transition-colors">
                                    <td className="py-2 px-3 text-center text-slate-400">{szIdx + 1}</td>
                                    <td className="py-2 px-3 font-bold text-slate-800">{sz.size}</td>
                                    <td className="py-2 px-3 text-right font-semibold text-slate-700">
                                      {new Intl.NumberFormat('id-ID').format(sz.qty)} kg
                                    </td>
                                    <td className="py-2 px-3 text-right text-slate-600">
                                      {new Intl.NumberFormat('id-ID').format(sz.hargaBB || 0)}
                                    </td>
                                    <td className="py-2 px-3 text-right text-slate-600">
                                      {new Intl.NumberFormat('id-ID').format(sz.hargaProses || 0)}
                                    </td>
                                    <td className="py-2 px-3 text-right text-slate-600">
                                      {new Intl.NumberFormat('id-ID').format(sz.hargaLogistik || 0)}
                                    </td>
                                    <td className="py-2 px-3 text-right font-extrabold text-blue-700">
                                      {new Intl.NumberFormat('id-ID').format(sz.hargaAkhir || 0)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="bg-slate-50/90 border-t border-slate-200 font-bold text-[11px] text-slate-800">
                                <tr>
                                  <td colSpan={2} className="py-2 px-3">
                                    Total ({s.sizes?.[0]?.size} - {s.sizes?.[s.sizes.length - 1]?.size}):
                                  </td>
                                  <td className="py-2 px-3 text-right text-blue-700">
                                    {new Intl.NumberFormat('id-ID').format(totalSubQty)} kg
                                  </td>
                                  <td className="py-2 px-3 text-right text-slate-600 font-normal">
                                    avg {new Intl.NumberFormat('id-ID').format(Math.round(avgSubBB))}
                                  </td>
                                  <td className="py-2 px-3 text-right text-slate-600 font-normal">
                                    avg {new Intl.NumberFormat('id-ID').format(Math.round(avgSubProses))}
                                  </td>
                                  <td className="py-2 px-3 text-right text-slate-600 font-normal">
                                    {new Intl.NumberFormat('id-ID').format(Math.round(avgSubLogistik))}
                                  </td>
                                  <td className="py-2 px-3 text-right font-extrabold text-emerald-700">
                                    avg {new Intl.NumberFormat('id-ID').format(s.harga || 0)}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      )
                    })}

                  {/* File Perhitungan Download Box */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                        XLS
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-800">
                          {selectedBahanBaku.filePerhitungan || `Perhitungan_${selectedBahanBaku.komoditas}_PSTP.xlsx`}
                        </p>
                        <p className="text-[10px] text-slate-400">245 KB • Lampiran Perhitungan Biaya</p>
                      </div>
                    </div>
                    <button
                      onClick={() => alert(`Mengunduh file ${selectedBahanBaku.filePerhitungan || 'Perhitungan_Biaya.xlsx'}...`)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-600" />
                      <span>Download File</span>
                    </button>
                  </div>
                </div>
              )}

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
                  💡 Rumus: Harga Akhir = Harga Bahan Baku + Harga Proses + Harga Logistik
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

        {/* 6. MODAL DETAIL SIZE DARI SUPPLIER */}
        {selectedSupplierDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-200 my-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      Rincian Size Supplier — {selectedSupplierDetail.supplier || selectedSupplierDetail.cabang}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Cabang: {selectedSupplierDetail.cabang} • Update: {selectedSupplierDetail.lastUpdated || 'Hari ini'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSupplierDetail(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Breakdown Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-10">No</th>
                      <th className="py-2.5 px-3">Size / Ukuran</th>
                      <th className="py-2.5 px-3 text-right">Qty (kg)</th>
                      <th className="py-2.5 px-3 text-right">Harga BB (Rp)</th>
                      <th className="py-2.5 px-3 text-right">Proses (Rp)</th>
                      <th className="py-2.5 px-3 text-right">Logistik (Rp)</th>
                      <th className="py-2.5 px-3 text-right font-extrabold text-blue-900">Harga Akhir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedSupplierDetail.sizes && selectedSupplierDetail.sizes.length > 0 ? (
                      selectedSupplierDetail.sizes.map((sz, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/20 transition-colors">
                          <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-800">{sz.size}</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-slate-700">
                            {new Intl.NumberFormat('id-ID').format(sz.qty)} kg
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600">
                            Rp {new Intl.NumberFormat('id-ID').format(sz.hargaBB || 0)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600">
                            Rp {new Intl.NumberFormat('id-ID').format(sz.hargaProses || 0)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600">
                            Rp {new Intl.NumberFormat('id-ID').format(sz.hargaLogistik || 0)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-extrabold text-blue-700">
                            Rp {new Intl.NumberFormat('id-ID').format(sz.hargaAkhir || 0)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-2.5 px-3 text-center text-slate-400">1</td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">All Size</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-700">
                          {new Intl.NumberFormat('id-ID').format(selectedSupplierDetail.qty)} kg
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600">
                          Rp {new Intl.NumberFormat('id-ID').format(selectedSupplierDetail.hargaBahanBaku || 0)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600">
                          Rp {new Intl.NumberFormat('id-ID').format(selectedSupplierDetail.hargaProses || 0)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600">
                          Rp {new Intl.NumberFormat('id-ID').format(selectedSupplierDetail.hargaLogistik || 0)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-blue-700">
                          Rp {new Intl.NumberFormat('id-ID').format(selectedSupplierDetail.harga || 0)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-800">
                    <tr>
                      <td colSpan={2} className="py-2.5 px-3 text-right">Total:</td>
                      <td className="py-2.5 px-3 text-right text-blue-700">
                        {new Intl.NumberFormat('id-ID').format(selectedSupplierDetail.qty)} kg
                      </td>
                      <td colSpan={3} className="py-2.5 px-3 text-right text-[11px] text-slate-500 font-normal">
                        Rata-rata Harga Akhir:
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-emerald-700">
                        Rp {new Intl.NumberFormat('id-ID').format(selectedSupplierDetail.harga || 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {selectedSupplierDetail.catatan && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Catatan Supplier:</span>
                  <p className="text-slate-700">{selectedSupplierDetail.catatan}</p>
                </div>
              )}

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
