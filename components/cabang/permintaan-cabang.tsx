'use client'

import { useState, useEffect, useMemo } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import {
  ShoppingCart,
  ShoppingBag,
  Layers,
  Plus,
  Search,
  Calendar,
  Filter,
  RefreshCw,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Pencil,
  ChevronDown,
  FileText,
} from 'lucide-react'

interface PermintaanRow {
  _id: string
  noRequest: string
  tanggal: string
  buyer: string
  negara: string
  tujuan?: string
  komoditas: string
  spesifikasi: string
  size?: string
  qty: number
  hargaBuyer: number // in base IDR, 0 = Not Available
  statusStok: 'Stock' | 'Non-Stock'
  lastUpdated: string
  catatan?: string
  fileQuotation?: string
}

// Initial flat seed records matching the revision guide
const INITIAL_CABANG_PERMINTAAN: PermintaanRow[] = [
  {
    _id: 'inq-1',
    noRequest: 'INQ-2026-001',
    tanggal: '13/08/2026',
    buyer: 'Ba Hai JSC',
    negara: 'Vietnam',
    tujuan: 'Ho Chi Minh Port, Vietnam',
    komoditas: 'Cakalang',
    spesifikasi: '2 kg up, FOB, Grade A',
    qty: 25000,
    hargaBuyer: 405000000,
    statusStok: 'Stock',
    lastUpdated: '30/08/2026 oleh Nailah (Pusat)',
  },
  {
    _id: 'inq-2',
    noRequest: 'INQ-2026-002',
    tanggal: '13/08/2026',
    buyer: 'Ba Hai JSC',
    negara: 'Vietnam',
    tujuan: 'Ho Chi Minh Port, Vietnam',
    komoditas: 'Tuna',
    spesifikasi: '10 kg up, FOB, Mix grade',
    qty: 25000,
    hargaBuyer: 405000000,
    statusStok: 'Non-Stock',
    lastUpdated: '30/08/2026 oleh Roberto (Pusat)',
  },
  {
    _id: 'inq-3',
    noRequest: 'INQ-2026-003',
    tanggal: '12/08/2026',
    buyer: 'Siam Food Corp.',
    negara: 'Thailand',
    tujuan: 'Bangkok Port, Thailand',
    komoditas: 'Udang Vanamei',
    spesifikasi: 'PD 31/40, IQF',
    qty: 10000,
    hargaBuyer: 162000000,
    statusStok: 'Stock',
    lastUpdated: '29/08/2026 oleh Tami (Pusat)',
  },
  {
    _id: 'inq-4',
    noRequest: 'INQ-2026-004',
    tanggal: '11/08/2026',
    buyer: 'Alief IKE',
    negara: 'Jepang',
    tujuan: 'Tokyo Port, Japan',
    komoditas: 'Octopus',
    spesifikasi: '1-2 kg/pc, Frozen',
    qty: 3000,
    hargaBuyer: 109620000,
    statusStok: 'Stock',
    lastUpdated: '29/08/2026 oleh Nailah (Pusat)',
  },
  {
    _id: 'inq-5',
    noRequest: 'INQ-2026-005',
    tanggal: '10/08/2026',
    buyer: 'Trang Thuy Seafood',
    negara: 'Vietnam',
    tujuan: 'Da Nang Port, Vietnam',
    komoditas: 'Tuna (YFT)',
    spesifikasi: '5 kg up, FOB, Grade A',
    qty: 15000,
    hargaBuyer: 243000000,
    statusStok: 'Stock',
    lastUpdated: '28/08/2026 oleh Roberto (Pusat)',
  },
  {
    _id: 'inq-6',
    noRequest: 'INQ-2026-006',
    tanggal: '09/08/2026',
    buyer: 'PT Indomar Seafood',
    negara: 'Indonesia',
    tujuan: 'Tanjung Priok, Indonesia',
    komoditas: 'Cumi-Cumi',
    spesifikasi: 'U3, IQF, Cleaned',
    qty: 8000,
    hargaBuyer: 128000000,
    statusStok: 'Non-Stock',
    lastUpdated: '28/08/2026 oleh Nailah (Pusat)',
  },
  {
    _id: 'inq-7',
    noRequest: 'INQ-2026-007',
    tanggal: '08/08/2026',
    buyer: 'Pacific Harvest Ltd.',
    negara: 'Korea Selatan',
    tujuan: 'Busan Port, South Korea',
    komoditas: 'Mackerel',
    spesifikasi: '200-300 g/pc, IQF',
    qty: 12000,
    hargaBuyer: 194400000,
    statusStok: 'Stock',
    lastUpdated: '27/08/2026 oleh Tami (Pusat)',
  },
  {
    _id: 'inq-8',
    noRequest: 'INQ-2026-008',
    tanggal: '07/08/2026',
    buyer: 'Sakamoto Co. Ltd',
    negara: 'Jepang',
    tujuan: 'Osaka Port, Japan',
    komoditas: 'Chirimen',
    spesifikasi: 'Kering, Grade A, 1-2 cm',
    qty: 5000,
    hargaBuyer: 0, // Not Available demo
    statusStok: 'Stock',
    lastUpdated: '26/08/2026 oleh Aisyah (Direksi)',
  },
]

export function PermintaanCabang() {
  const [data, setData] = useState<PermintaanRow[]>(INITIAL_CABANG_PERMINTAAN)
  const [barangList, setBarangList] = useState<any[]>([])
  const [bahanBakuList, setBahanBakuList] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [userName, setUserName] = useState('Aisyah (Direksi)')

  // Currency / Kurs states
  const [selectedCurrency, setSelectedCurrency] = useState<'IDR' | 'USD' | 'JPY'>('IDR')
  const [rates, setRates] = useState({
    USD: 16200,
    JPY: 109.85,
  })
  const [isKursModalOpen, setIsKursModalOpen] = useState(false)
  const [tempRates, setTempRates] = useState({ USD: 16200, JPY: 109.85 })
  const [kursLastUpdated, setKursLastUpdated] = useState('Aktif per 30 Mei 2026, 14:30')

  // Filters
  const [searchBuyer, setSearchBuyer] = useState('')
  const [selectedNegara, setSelectedNegara] = useState('Pilih negara...')
  const [selectedKomoditas, setSelectedKomoditas] = useState('Pilih komoditas...')
  const [selectedPeriod, setSelectedPeriod] = useState('01/08/2026 - 30/08/2026')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<PermintaanRow | null>(null)

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    buyer: '',
    negara: 'Vietnam',
    tujuan: '',
    komoditas: '',
    spesifikasi: '',
    qty: 0,
    hargaBuyer: '', // String to allow empty / Not Available
    catatan: '',
  })

  useEffect(() => {
    fetchProfile()
    fetchKursData()
    fetchRealData()
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

  const fetchRealData = async () => {
    try {
      setIsLoading(true)
      const [resP, resB, resBarang] = await Promise.all([
        fetch('/api/permintaan'),
        fetch('/api/bahan-baku'),
        fetch('/api/barang'),
      ])

      let realBarang: any[] = []
      let realBahanBaku: any[] = []

      if (resBarang.ok) {
        realBarang = await resBarang.json()
        setBarangList(realBarang || [])
      }
      if (resB.ok) {
        realBahanBaku = await resB.json()
        setBahanBakuList(realBahanBaku || [])
      }

      if (resP.ok) {
        const rawPermintaan = await resP.json()
        if (rawPermintaan && rawPermintaan.length > 0) {
          const flatRows: PermintaanRow[] = []
          rawPermintaan.forEach((p: any) => {
            if (p.items && p.items.length > 0) {
              p.items.forEach((it: any, idx: number) => {
                // Determine automatic stock availability
                const komoditasName = it.name || p.komoditas || 'Ikan'
                const inBarang = realBarang.some((b) =>
                  b.nama?.toLowerCase().includes(komoditasName.toLowerCase())
                )
                const inBahanBaku = realBahanBaku.some((bb) =>
                  (bb.komoditas || bb.barang || '')
                    ?.toLowerCase()
                    .includes(komoditasName.toLowerCase()) && (bb.sumber?.length || 0) > 0
                )

                const autoStatus = (p.statusStok === 'Stock' || p.statusStok === 'Non-Stock') 
                  ? p.statusStok 
                  : (inBarang || inBahanBaku ? 'Stock' : 'Non-Stock')

                flatRows.push({
                  _id: `${p._id}-${idx}`,
                  noRequest: p.noRequest || `INQ-2026-${String(flatRows.length + 1).padStart(3, '0')}`,
                  tanggal: p.tanggal || '13/08/2026',
                  buyer: p.buyer || 'Buyer',
                  negara: p.negara || 'Vietnam',
                  tujuan: p.tujuan || p.negara || 'Vietnam',
                  komoditas: komoditasName,
                  spesifikasi: it.spesifikasi || it.size || 'Grade A',
                  size: it.size || '',
                  qty: it.qty || p.totalQty || 1000,
                  hargaBuyer: it.harga || p.hargaBuyer || 0,
                  statusStok: autoStatus,
                  lastUpdated: p.lastUpdated || 'Hari ini oleh Staff',
                  catatan: p.catatan || '',
                  fileQuotation: p.fileQuotation || '',
                })
              })
            } else {
              flatRows.push({
                _id: p._id,
                noRequest: p.noRequest || `INQ-2026-001`,
                tanggal: p.tanggal || '13/08/2026',
                buyer: p.buyer || 'Buyer',
                negara: p.negara || 'Vietnam',
                tujuan: p.tujuan || p.negara || 'Vietnam',
                komoditas: p.komoditas || 'Cakalang',
                spesifikasi: p.spesifikasi || 'Grade A',
                qty: p.totalQty || p.qty || 1000,
                hargaBuyer: p.hargaBuyer || 0,
                statusStok: p.statusStok || 'Stock',
                lastUpdated: p.lastUpdated || 'Hari ini oleh Staff',
                catatan: p.catatan || '',
                fileQuotation: p.fileQuotation || '',
              })
            }
          })
          setData(flatRows)
        }
      }
    } catch (e) {
      console.error('Error loading Permintaan Cabang data:', e)
    } finally {
      setIsLoading(false)
    }
  }

  // --- CONVERSION LOGIC ---
  const formatPrice = (baseIdr: number) => {
    if (!baseIdr || baseIdr <= 0) {
      return <span className="text-slate-400 italic font-medium">Not Available</span>
    }

    if (selectedCurrency === 'USD') {
      const converted = baseIdr / rates.USD
      return (
        <span className="font-semibold text-slate-800">
          $ {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(converted)}
        </span>
      )
    }

    if (selectedCurrency === 'JPY') {
      const converted = baseIdr / rates.JPY
      return (
        <span className="font-semibold text-slate-800">
          ¥ {new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 0 }).format(converted)}
        </span>
      )
    }

    // Default IDR
    return (
      <span className="font-semibold text-slate-800">
        Rp {new Intl.NumberFormat('id-ID').format(baseIdr)}
      </span>
    )
  }

  // --- FILTER OPTIONS ---
  const negaraOptions = useMemo(() => {
    const set = new Set<string>()
    data.forEach((d) => {
      if (d.negara) set.add(d.negara)
    })
    return ['Pilih negara...', ...Array.from(set)]
  }, [data])

  const komoditasOptions = useMemo(() => {
    const set = new Set<string>()
    data.forEach((d) => {
      if (d.komoditas) set.add(d.komoditas)
    })
    return ['Pilih komoditas...', ...Array.from(set)]
  }, [data])

  // --- FILTERED DATA ---
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (searchBuyer && !item.buyer.toLowerCase().includes(searchBuyer.toLowerCase())) {
        return false
      }
      if (selectedNegara !== 'Pilih negara...' && item.negara !== selectedNegara) {
        return false
      }
      if (selectedKomoditas !== 'Pilih komoditas...' && item.komoditas !== selectedKomoditas) {
        return false
      }
      return true
    })
  }, [data, searchBuyer, selectedNegara, selectedKomoditas])

  // --- KPI CALCULATIONS ---
  const totalPermintaan = filteredData.length
  const totalQtyPermintaan = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + (item.qty || 0), 0)
  }, [filteredData])

  const totalJenisKomoditas = useMemo(() => {
    return new Set(filteredData.map((d) => d.komoditas)).size
  }, [filteredData])

  const totalStockCount = useMemo(() => {
    return filteredData.filter((d) => d.statusStok === 'Stock').length
  }, [filteredData])

  const totalNonStockCount = totalPermintaan - totalStockCount

  const stockPct = totalPermintaan > 0 ? ((totalStockCount / totalPermintaan) * 100).toFixed(1) : '0'
  const nonStockPct = totalPermintaan > 0 ? ((totalNonStockCount / totalPermintaan) * 100).toFixed(1) : '0'

  // --- PAGINATION ---
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredData.slice(start, start + itemsPerPage)
  }, [filteredData, currentPage])

  // Flag helper
  const getFlag = (country: string) => {
    const c = country.toLowerCase()
    if (c.includes('vietnam')) return '🇻🇳'
    if (c.includes('thailand')) return '🇹🇭'
    if (c.includes('jepang') || c.includes('japan')) return '🇯🇵'
    if (c.includes('korea')) return '🇰🇷'
    if (c.includes('indonesia')) return '🇮🇩'
    if (c.includes('china')) return '🇨🇳'
    if (c.includes('malaysia')) return '🇲🇾'
    if (c.includes('singapore')) return '🇸🇬'
    if (c.includes('usa') || c.includes('amerika')) return '🇺🇸'
    return '🌐'
  }

  // Handle Add New Permintaan
  const handleSavePermintaan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.buyer || !formData.komoditas || formData.qty <= 0) {
      alert('Mohon lengkapi Nama Buyer, Komoditas, dan Kuantitas (Qty).')
      return
    }

    const numericPrice = formData.hargaBuyer ? parseFloat(formData.hargaBuyer) : 0

    // Automatic matching with stocks/suppliers
    const inBarang = barangList.some((b) =>
      b.nama?.toLowerCase().includes(formData.komoditas.toLowerCase())
    )
    const inBahanBaku = bahanBakuList.some((bb) =>
      (bb.komoditas || bb.barang || '')?.toLowerCase().includes(formData.komoditas.toLowerCase()) &&
      (bb.sumber?.length || 0) > 0
    )
    const autoStatusStok: 'Stock' | 'Non-Stock' = inBarang || inBahanBaku ? 'Stock' : 'Non-Stock'

    let formattedDate = ''
    if (formData.tanggal) {
      const parts = formData.tanggal.split('-')
      if (parts.length === 3) {
        formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`
      } else {
        formattedDate = formData.tanggal
      }
    } else {
      const now = new Date()
      formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`
    }

    const currentYear = new Date().getFullYear()

    const newRow: PermintaanRow = {
      _id: `inq-${Date.now()}`,
      noRequest: `INQ-${currentYear}-${String(data.length + 1).padStart(3, '0')}`,
      tanggal: formattedDate,
      buyer: formData.buyer,
      negara: formData.negara,
      tujuan: formData.tujuan || formData.negara,
      komoditas: formData.komoditas,
      spesifikasi: formData.spesifikasi || 'Grade A',
      qty: Number(formData.qty),
      hargaBuyer: numericPrice,
      statusStok: autoStatusStok,
      lastUpdated: `${formattedDate} oleh ${userName}`,
      catatan: formData.catatan,
    }

    // Optimistically update state
    setData([newRow, ...data])
    setIsAddModalOpen(false)

    // Save to Backend API
    try {
      await fetch('/api/permintaan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggal: formattedDate,
          buyer: formData.buyer,
          negara: formData.negara,
          tujuan: formData.tujuan,
          items: [
            {
              name: formData.komoditas,
              spesifikasi: formData.spesifikasi,
              qty: Number(formData.qty),
              harga: numericPrice,
            },
          ],
          statusStok: autoStatusStok,
          catatan: formData.catatan,
        }),
      })
    } catch (err) {
      console.error('Error saving to API:', err)
    }

    // Reset Form
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      buyer: '',
      negara: 'Vietnam',
      tujuan: '',
      komoditas: '',
      spesifikasi: '',
      qty: 0,
      hargaBuyer: '',
      catatan: '',
    })
  }

  // Handle Save Kurs Manual
  const handleSaveKurs = async () => {
    setRates({ ...tempRates })
    const now = new Date()
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    const formattedDate = `Aktif per ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
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
      console.error('Error saving kurs to backend:', err)
    }
  }

  const handleCurrencyChange = async (curr: 'IDR' | 'USD' | 'JPY') => {
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
  }

  const handleResetFilter = () => {
    setSearchBuyer('')
    setSelectedNegara('Pilih negara...')
    setSelectedKomoditas('Pilih komoditas...')
    setCurrentPage(1)
  }

  return (
    <MainLayout>
      <div className="space-y-6 pb-10 select-none">
        {/* HEADER SECTION WITH MANUAL KURS WIDGET */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Permintaan Buyer</h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Kelola semua permintaan dari buyer dan dokumen quotation PDF
            </p>
          </div>

          {/* KURS MANUAL CARD (TOP RIGHT) */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">KURS MANUAL</span>
                  <HelpCircle className="w-3 h-3 text-slate-400" />
                </div>
                {/* Currency Buttons */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg mt-1 gap-0.5">
                  {(['IDR', 'USD', 'JPY'] as const).map((curr) => (
                    <button
                      key={curr}
                      onClick={() => handleCurrencyChange(curr)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
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
            </div>

            <div className="h-8 w-px bg-slate-200 hidden sm:block" />

            {/* Rates Display */}
            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
              <div className="text-left text-xs font-medium text-slate-600 space-y-0.5">
                <p>1 USD = <span className="font-bold text-slate-800">{new Intl.NumberFormat('id-ID').format(rates.USD)}</span></p>
                <p>1 JPY = <span className="font-bold text-slate-800">{rates.JPY.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span></p>
              </div>

              {/* Edit Kurs Button */}
              <button
                onClick={() => {
                  setTempRates({ ...rates })
                  setIsKursModalOpen(true)
                }}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                title="Ubah Nilai Kurs Manual"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[10px] text-slate-400 font-medium pl-1 hidden xl:block">
              {kursLastUpdated}
            </div>
          </div>
        </div>

        {/* 1. ROW 1: 5 SUMMARY KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Total Permintaan */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-500 leading-tight">Total Permintaan</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-800 tracking-tight">{totalPermintaan}</span>
                <span className="text-xs font-semibold text-slate-400">Permintaan</span>
              </div>
              <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                + 15% vs 7 hari lalu
              </p>
            </div>
          </div>

          {/* Card 2: Total Qty Permintaan */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-500 leading-tight">Total Qty Permintaan</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-800 tracking-tight">
                  {new Intl.NumberFormat('id-ID').format(totalQtyPermintaan)}
                </span>
                <span className="text-xs font-semibold text-slate-400">kg</span>
              </div>
              <p className="text-[11px] font-medium text-slate-400">
                Total Keseluruhan <span className="font-semibold text-emerald-600 ml-1">+ 18% vs 7 hari</span>
              </p>
            </div>
          </div>

          {/* Card 3: Komoditas Diminta */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-500 leading-tight">Komoditas Diminta</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-800 tracking-tight">{totalJenisKomoditas}</span>
                <span className="text-xs font-semibold text-slate-400">Jenis Ikan</span>
              </div>
              <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                + 8% vs 7 hari lalu
              </p>
            </div>
          </div>

          {/* Card 4: Stock (Tersedia) */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <span className="w-4 h-4 rounded-full bg-emerald-500" />
              </div>
              <p className="text-xs font-medium text-slate-500 leading-tight">Stock (Tersedia)</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-800 tracking-tight">{totalStockCount}</span>
                <span className="text-xs font-semibold text-slate-400">Permintaan</span>
              </div>
              <p className="text-[11px] font-semibold text-emerald-600">
                {stockPct}% dari total
              </p>
            </div>
          </div>

          {/* Card 5: Non-stock */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <span className="w-4 h-4 rounded-full bg-rose-500" />
              </div>
              <p className="text-xs font-medium text-slate-500 leading-tight">Non-stock</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-800 tracking-tight">{totalNonStockCount}</span>
                <span className="text-xs font-semibold text-slate-400">Permintaan</span>
              </div>
              <p className="text-[11px] font-semibold text-rose-600">
                {nonStockPct}% dari total
              </p>
            </div>
          </div>
        </div>

        {/* 2. FILTER & ACTION BAR */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Filter 1: Nama Buyer */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Nama Buyer
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama buyer..."
                  value={searchBuyer}
                  onChange={(e) => setSearchBuyer(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Filter 2: Negara / Tujuan */}
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

            {/* Filter 3: Komoditas / Ikan */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Komoditas / Ikan
              </label>
              <div className="relative">
                <select
                  value={selectedKomoditas}
                  onChange={(e) => setSelectedKomoditas(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
                >
                  {komoditasOptions.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Filter 4: Periode Tanggal */}
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

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
            <button
              onClick={() => handleResetFilter()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter Lainnya</span>
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={handleResetFilter}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Reset
              </button>
              <button
                onClick={() => setCurrentPage(1)}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Terapkan Filter</span>
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Permintaan</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. FLAT PERMINTAAN TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3 text-center w-12">No</th>
                  <th className="py-3 px-3">Tanggal</th>
                  <th className="py-3 px-3">Nama Buyer</th>
                  <th className="py-3 px-3">Negara / Tujuan</th>
                  <th className="py-3 px-3">Komoditas</th>
                  <th className="py-3 px-3">Spesifikasi</th>
                  <th className="py-3 px-3 text-right">Qty</th>
                  <th className="py-3 px-3 text-right">
                    Harga Buyer ({selectedCurrency}) <HelpCircle className="w-3 h-3 inline text-slate-400 ml-0.5" />
                  </th>
                  <th className="py-3 px-3 text-center">Status Stok</th>
                  <th className="py-3 px-3">Last Updated</th>
                  <th className="py-3 px-3 text-center w-16">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedData.length > 0 ? (
                  paginatedData.map((row, index) => {
                    const rowNumber = (currentPage - 1) * itemsPerPage + index + 1

                    return (
                      <tr key={row._id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3 px-3 text-center text-slate-400 font-medium">
                          {rowNumber}
                        </td>
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                          {row.tanggal}
                        </td>
                        <td className="py-3 px-3 font-bold text-blue-600 hover:underline cursor-pointer">
                          {row.buyer}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="mr-1.5">{getFlag(row.negara)}</span>
                          <span className="font-medium text-slate-700">{row.negara}</span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {row.komoditas}
                        </td>
                        <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={row.spesifikasi}>
                          {row.spesifikasi}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-800 whitespace-nowrap">
                          {new Intl.NumberFormat('id-ID').format(row.qty)} kg
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          {formatPrice(row.hargaBuyer)}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {row.statusStok === 'Stock' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Non-stock
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                          {row.lastUpdated}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedItem(row)
                              setIsDetailModalOpen(true)
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Lihat Detail Permintaan"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400">
                      Tidak ada data permintaan buyer yang sesuai filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* TABLE FOOTER / PAGINATION */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 text-xs text-slate-500 bg-slate-50/50">
            <p>
              Menampilkan {filteredData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} -{' '}
              {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} data
            </p>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setCurrentPage(pg)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currentPage === pg
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {pg}
                </button>
              ))}
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                ›
              </button>
            </div>
          </div>
        </div>

        {/* MODAL 1: TAMBAH PERMINTAAN BUYER */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800">Tambah Permintaan Buyer Baru</h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePermintaan} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Tanggal Permintaan * <span className="text-blue-600 font-normal">(Pilih dari kalender)</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.tanggal}
                      onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Buyer *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Ba Hai JSC"
                      value={formData.buyer}
                      onChange={(e) => setFormData({ ...formData, buyer: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Negara / Tujuan *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Vietnam"
                      value={formData.negara}
                      onChange={(e) => setFormData({ ...formData, negara: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Komoditas / Ikan *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Cakalang / Tuna"
                      value={formData.komoditas}
                      onChange={(e) => setFormData({ ...formData, komoditas: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kuantitas (kg) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="Contoh: 25000"
                      value={formData.qty || ''}
                      onChange={(e) => setFormData({ ...formData, qty: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Harga Buyer (IDR) <span className="font-normal text-slate-400">(Opsional)</span>
                    </label>
                    <input
                      type="number"
                      placeholder="Contoh: 405000000"
                      value={formData.hargaBuyer}
                      onChange={(e) => setFormData({ ...formData, hargaBuyer: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Spesifikasi</label>
                  <input
                    type="text"
                    placeholder="Contoh: 2 kg up, FOB, Grade A"
                    value={formData.spesifikasi}
                    onChange={(e) => setFormData({ ...formData, spesifikasi: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan</label>
                  <textarea
                    rows={2}
                    placeholder="Catatan khusus transaksi..."
                    value={formData.catatan}
                    onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
                  >
                    Simpan Permintaan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: DETAIL PERMINTAAN */}
        {isDetailModalOpen && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-800">{selectedItem.noRequest}</h3>
                  <p className="text-xs text-slate-400">Detail Permintaan Buyer</p>
                </div>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Nama Buyer:</span>
                  <span className="font-bold text-slate-800">{selectedItem.buyer}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Negara / Tujuan:</span>
                  <span className="font-semibold text-slate-800">{getFlag(selectedItem.negara)} {selectedItem.negara}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Komoditas:</span>
                  <span className="font-bold text-blue-600">{selectedItem.komoditas}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Spesifikasi:</span>
                  <span className="font-medium text-slate-700">{selectedItem.spesifikasi}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Kuantitas:</span>
                  <span className="font-bold text-slate-800">{new Intl.NumberFormat('id-ID').format(selectedItem.qty)} kg</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Harga Buyer ({selectedCurrency}):</span>
                  <span>{formatPrice(selectedItem.hargaBuyer)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Status Stok:</span>
                  <span>
                    {selectedItem.statusStok === 'Stock' ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Stock (Tersedia)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        Non-stock
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Last Updated:</span>
                  <span className="text-slate-600">{selectedItem.lastUpdated}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: UBAH KURS MANUAL */}
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
                  onClick={handleSaveKurs}
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
