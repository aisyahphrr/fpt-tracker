'use client'

import { useState, useEffect, useMemo } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import {
  Package,
  Building2,
  Layers,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit,
  Eye,
  X,
  Upload,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  Calendar,
  Building,
  CheckCircle2,
} from 'lucide-react'

interface StokItemRow {
  _id: string
  komoditas: string
  spesifikasi: string
  cabang: string
  qtyAvailable: number
  satuan: string
  lastUpdated: string
  keterangan?: string
}

// Initial realistic dataset matching the revision guide mockup
const INITIAL_STOK_GUDANG: StokItemRow[] = [
  {
    _id: 'stok-1',
    komoditas: 'Yellowfin Tuna (YFT)',
    spesifikasi: 'Whole Round 2-4 kg up',
    cabang: 'Jakarta (Kamal)',
    qtyAvailable: 12500,
    satuan: 'kg',
    lastUpdated: '30/05/2026 10:15 oleh Tami (Sales)',
  },
  {
    _id: 'stok-2',
    komoditas: 'Skipjack Tuna',
    spesifikasi: 'Whole Round 1 kg up',
    cabang: 'Bitung',
    qtyAvailable: 18000,
    satuan: 'kg',
    lastUpdated: '30/05/2026 09:40 oleh Rian (Cab. Bitung)',
  },
  {
    _id: 'stok-3',
    komoditas: 'Squid Loligo',
    spesifikasi: 'Whole 50/100',
    cabang: 'Surabaya (Perak)',
    qtyAvailable: 6750,
    satuan: 'kg',
    lastUpdated: '29/05/2026 16:20 oleh Dini (Cab. Surabaya)',
  },
  {
    _id: 'stok-4',
    komoditas: 'Mackerel',
    spesifikasi: 'Whole 300-500 g',
    cabang: 'Ambon',
    qtyAvailable: 9200,
    satuan: 'kg',
    lastUpdated: '30/05/2026 11:05 oleh Rizky (Cab. Ambon)',
  },
  {
    _id: 'stok-5',
    komoditas: 'Octopus',
    spesifikasi: 'Flower Type 1-2 kg',
    cabang: 'Jakarta (Kamal)',
    qtyAvailable: 2300,
    satuan: 'kg',
    lastUpdated: '30/05/2026 08:50 oleh Tami (Sales)',
  },
  {
    _id: 'stok-6',
    komoditas: 'Vannamei Shrimp (PD)',
    spesifikasi: 'Size 30/40',
    cabang: 'Makassar',
    qtyAvailable: 7500,
    satuan: 'kg',
    lastUpdated: '29/05/2026 14:10 oleh Andi (Cab. Makassar)',
  },
  {
    _id: 'stok-7',
    komoditas: 'Cumi-Cumi',
    spesifikasi: 'Ring',
    cabang: 'Bitung',
    qtyAvailable: 4100,
    satuan: 'kg',
    lastUpdated: '29/05/2026 09:30 oleh Rian (Cab. Bitung)',
  },
  {
    _id: 'stok-8',
    komoditas: 'Milkfish (Bawal)',
    spesifikasi: 'Whole 600-800 g',
    cabang: 'Pekalongan',
    qtyAvailable: 5000,
    satuan: 'kg',
    lastUpdated: '28/05/2026 17:45 oleh Siti (Cab. Pekalongan)',
  },
  {
    _id: 'stok-9',
    komoditas: 'Cakalang',
    spesifikasi: '2 kg up, Grade A',
    cabang: 'Manado',
    qtyAvailable: 15000,
    satuan: 'kg',
    lastUpdated: '28/05/2026 15:20 oleh Tami (Sales)',
  },
  {
    _id: 'stok-10',
    komoditas: 'Chirimen',
    spesifikasi: 'Kering 1-2 cm',
    cabang: 'Ternate',
    qtyAvailable: 6500,
    satuan: 'kg',
    lastUpdated: '27/05/2026 11:30 oleh Rian (Cab. Bitung)',
  },
  {
    _id: 'stok-11',
    komoditas: 'Tuna Albacore',
    spesifikasi: '5 kg up, FOB',
    cabang: 'Bali',
    qtyAvailable: 8600,
    satuan: 'kg',
    lastUpdated: '27/05/2026 10:15 oleh Aisyah (Direksi)',
  },
  {
    _id: 'stok-12',
    komoditas: 'Udang Vaname',
    spesifikasi: '40/50 HLSO',
    cabang: 'Banyuwangi',
    qtyAvailable: 9000,
    satuan: 'kg',
    lastUpdated: '26/05/2026 16:00 oleh Dini (Cab. Surabaya)',
  },
  {
    _id: 'stok-13',
    komoditas: 'Kakap Merah',
    spesifikasi: 'Fillet Skin-on',
    cabang: 'Kupang',
    qtyAvailable: 4500,
    satuan: 'kg',
    lastUpdated: '26/05/2026 14:10 oleh Rizky (Cab. Ambon)',
  },
  {
    _id: 'stok-14',
    komoditas: 'Kerapu',
    spesifikasi: 'Whole 1 kg up',
    cabang: 'Bau-Bau',
    qtyAvailable: 3500,
    satuan: 'kg',
    lastUpdated: '25/05/2026 09:30 oleh Andi (Cab. Makassar)',
  },
  {
    _id: 'stok-15',
    komoditas: 'Tenggiri',
    spesifikasi: 'Steak Frozen',
    cabang: 'Kendari',
    qtyAvailable: 4200,
    satuan: 'kg',
    lastUpdated: '25/05/2026 08:45 oleh Andi (Cab. Makassar)',
  },
  {
    _id: 'stok-16',
    komoditas: 'Tongkol',
    spesifikasi: 'Whole 500-1000g',
    cabang: 'Sorong',
    qtyAvailable: 7800,
    satuan: 'kg',
    lastUpdated: '24/05/2026 13:20 oleh Rizky (Cab. Ambon)',
  },
  {
    _id: 'stok-17',
    komoditas: 'Layur',
    spesifikasi: 'Whole 300-500g',
    cabang: 'Belawan',
    qtyAvailable: 5000,
    satuan: 'kg',
    lastUpdated: '24/05/2026 11:00 oleh Siti (Cab. Pekalongan)',
  },
  {
    _id: 'stok-18',
    komoditas: 'Gurita Ball Type',
    spesifikasi: '500g up',
    cabang: 'Makassar',
    qtyAvailable: 3500,
    satuan: 'kg',
    lastUpdated: '23/05/2026 15:30 oleh Andi (Cab. Makassar)',
  },
]

export function StokCabang() {
  const [data, setData] = useState<StokItemRow[]>(INITIAL_STOK_GUDANG)
  const [isLoading, setIsLoading] = useState(false)
  const [userName, setUserName] = useState('AISYAH (Direksi)')
  const [headerLastUpdated, setHeaderLastUpdated] = useState('Last Updated: 1 Sep 2026, 21:30 WIB')

  // Active Tab
  const [activeTab, setActiveTab] = useState<'multi' | 'per_cabang' | 'rekapan'>('multi')

  // Filters
  const [selectedKomoditas, setSelectedKomoditas] = useState('Semua Komoditas')
  const [selectedSpesifikasi, setSelectedSpesifikasi] = useState('Semua Spesifikasi')
  const [selectedCabang, setSelectedCabang] = useState('Semua Cabang')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Slide-over Drawer / Modal State
  const [isUpdateDrawerOpen, setIsUpdateDrawerOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<StokItemRow | null>(null)

  // Form State for Update Stok (Masuk / Keluar)
  const [updateType, setUpdateType] = useState<'masuk' | 'keluar'>('masuk')
  const [updateForm, setUpdateForm] = useState({
    komoditas: 'Yellowfin Tuna (YFT)',
    spesifikasi: 'Whole Round 2-4 kg up',
    cabang: 'Jakarta (Kamal)',
    tanggal: new Date().toISOString().split('T')[0],
    qty: '',
    satuan: 'kg',
    keterangan: '',
    lampiranName: '',
  })

  useEffect(() => {
    fetchProfile()
    fetchRealBarangData()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const d = await res.json()
        if (d?.name) {
          const emailClean = (d.email || '').toLowerCase()
          const isDireksi = d.role === 'direksi' || emailClean.includes('aisyah')
          const roleLabel = isDireksi ? 'Direksi' : 'Staff Cabang'
          setUserName(`${d.name.toUpperCase()} (${roleLabel})`)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchRealBarangData = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/barang')
      if (res.ok) {
        const json = await res.json()
        if (json && json.length > 0) {
          const mapped: StokItemRow[] = json.map((b: any, idx: number) => {
            const avail = (b.stokAwal || 0) + (b.barangMasuk || 0) - (b.barangKeluar || 0)
            const upDate = b.updatedAt ? new Date(b.updatedAt) : new Date()
            const dateFmt = `${upDate.getDate()}/${upDate.getMonth() + 1}/${upDate.getFullYear()}`
            return {
              _id: b._id || `stok-${idx}`,
              komoditas: b.nama || 'Ikan',
              spesifikasi: b.kategori || 'Grade A',
              cabang: b.cabang || 'Jakarta (Kamal)',
              qtyAvailable: avail > 0 ? avail : 1000,
              satuan: 'kg',
              lastUpdated: b.lastUpdated || `${dateFmt} oleh ${userName}`,
            }
          })
          setData(mapped)

          const now = new Date()
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
          setHeaderLastUpdated(`Last Updated: ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`)
        }
      }
    } catch (e) {
      console.error('Error fetching barang data:', e)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter Dropdown Options
  const komoditasOptions = useMemo(() => {
    const set = new Set(data.map((d) => d.komoditas).filter(Boolean))
    return ['Semua Komoditas', ...Array.from(set)]
  }, [data])

  const spesifikasiOptions = useMemo(() => {
    const set = new Set(data.map((d) => d.spesifikasi).filter(Boolean))
    return ['Semua Spesifikasi', ...Array.from(set)]
  }, [data])

  const cabangOptions = useMemo(() => {
    const set = new Set(data.map((d) => d.cabang).filter(Boolean))
    return ['Semua Cabang', ...Array.from(set)]
  }, [data])

  // Filtered Rows
  const filteredRows = useMemo(() => {
    return data.filter((row) => {
      if (selectedKomoditas !== 'Semua Komoditas' && row.komoditas !== selectedKomoditas) {
        return false
      }
      if (selectedSpesifikasi !== 'Semua Spesifikasi' && row.spesifikasi !== selectedSpesifikasi) {
        return false
      }
      if (selectedCabang !== 'Semua Cabang' && row.cabang !== selectedCabang) {
        return false
      }
      return true
    })
  }, [data, selectedKomoditas, selectedSpesifikasi, selectedCabang])

  // KPI Calculations
  const totalKomoditasCount = useMemo(() => {
    return new Set(data.map((d) => d.komoditas)).size
  }, [data])

  const totalQtyAvailable = useMemo(() => {
    return data.reduce((sum, d) => sum + (d.qtyAvailable || 0), 0)
  }, [data])

  const totalCabangCount = useMemo(() => {
    return new Set(data.map((d) => d.cabang)).size
  }, [data])

  // Pagination
  const totalPages = Math.ceil(filteredRows.length / itemsPerPage) || 1
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredRows.slice(start, start + itemsPerPage)
  }, [filteredRows, currentPage])

  // Handle Save Update Stok (Stok Masuk / Stok Keluar)
  const handleSaveUpdateStok = async (e: React.FormEvent) => {
    e.preventDefault()
    const numericQty = parseFloat(updateForm.qty) || 0
    if (numericQty <= 0) {
      alert('Mohon masukkan jumlah kuantitas yang valid.')
      return
    }

    const now = new Date()
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB oleh ${userName}`

    // Find existing matching row or create new
    const existingIndex = data.findIndex(
      (d) =>
        d.komoditas.toLowerCase() === updateForm.komoditas.toLowerCase() &&
        d.cabang.toLowerCase() === updateForm.cabang.toLowerCase()
    )

    let updatedData = [...data]
    if (existingIndex >= 0) {
      const existing = updatedData[existingIndex]
      const delta = updateType === 'masuk' ? numericQty : -numericQty
      const newAvail = Math.max(0, existing.qtyAvailable + delta)

      updatedData[existingIndex] = {
        ...existing,
        qtyAvailable: newAvail,
        spesifikasi: updateForm.spesifikasi || existing.spesifikasi,
        lastUpdated: formattedDate,
      }
    } else {
      const newRow: StokItemRow = {
        _id: `stok-${Date.now()}`,
        komoditas: updateForm.komoditas,
        spesifikasi: updateForm.spesifikasi || 'Grade A',
        cabang: updateForm.cabang,
        qtyAvailable: updateType === 'masuk' ? numericQty : 0,
        satuan: 'kg',
        lastUpdated: formattedDate,
      }
      updatedData = [newRow, ...updatedData]
    }

    setData(updatedData)
    setIsUpdateDrawerOpen(false)

    // Save to Backend Database (POST mutasi / update barang)
    try {
      await fetch('/api/barang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: updateForm.komoditas,
          kategori: updateForm.spesifikasi,
          cabang: updateForm.cabang,
          stokAwal: updateType === 'masuk' ? numericQty : 0,
          barangMasuk: updateType === 'masuk' ? numericQty : 0,
          barangKeluar: updateType === 'keluar' ? numericQty : 0,
        }),
      })
    } catch (err) {
      console.error('Error saving stock to backend:', err)
    }

    // Reset Form
    setUpdateForm({
      komoditas: 'Yellowfin Tuna (YFT)',
      spesifikasi: 'Whole Round 2-4 kg up',
      cabang: 'Jakarta (Kamal)',
      tanggal: new Date().toISOString().split('T')[0],
      qty: '',
      satuan: 'kg',
      keterangan: '',
      lampiranName: '',
    })
  }

  const handleResetFilters = () => {
    setSelectedKomoditas('Semua Komoditas')
    setSelectedSpesifikasi('Semua Spesifikasi')
    setSelectedCabang('Semua Cabang')
    setCurrentPage(1)
  }

  return (
    <MainLayout>
      <div className="space-y-6 pb-10 select-none">
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Stok Gudang</h1>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Lihat ketersediaan stok ikan di seluruh cabang.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <span>{headerLastUpdated}</span>
              <button
                onClick={() => fetchRealBarangData()}
                className="p-1 hover:text-slate-600 transition-colors cursor-pointer"
                title="Refresh Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            </div>

            {/* BUTTON + UPDATE STOK */}
            <button
              onClick={() => setIsUpdateDrawerOpen(true)}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Update Stok</span>
            </button>
          </div>
        </div>

        {/* 1. 3 KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Total Komoditas */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Komoditas</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold text-slate-800 tracking-tight">{totalKomoditasCount}</span>
                <span className="text-xs font-semibold text-slate-400">jenis</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Total Qty Available */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Qty Available</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold text-slate-800 tracking-tight">
                  {new Intl.NumberFormat('id-ID').format(totalQtyAvailable)}
                </span>
                <span className="text-xs font-semibold text-slate-400">kg</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Total Cabang */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Cabang</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold text-slate-800 tracking-tight">{totalCabangCount}</span>
                <span className="text-xs font-semibold text-slate-400">cabang</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Building className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 2. TAB PILIHAN (STOK MULTI-CABANG / PER CABANG / REKAPAN) */}
        <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('multi')}
            className={`pb-2.5 px-3 transition-all relative cursor-pointer ${
              activeTab === 'multi'
                ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Stok Multi-Cabang
          </button>
          <button
            onClick={() => setActiveTab('per_cabang')}
            className={`pb-2.5 px-3 transition-all relative cursor-pointer ${
              activeTab === 'per_cabang'
                ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Stok Per Cabang
          </button>
          <button
            onClick={() => setActiveTab('rekapan')}
            className={`pb-2.5 px-3 transition-all relative cursor-pointer ${
              activeTab === 'rekapan'
                ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Rekapan Stok
          </button>
        </div>

        {/* 3. FILTER BAR */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Komoditas */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Komoditas
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

            {/* Spesifikasi / Size */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Spesifikasi / Size
              </label>
              <div className="relative">
                <select
                  value={selectedSpesifikasi}
                  onChange={(e) => setSelectedSpesifikasi(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
                >
                  {spesifikasiOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Lokasi / Cabang */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Lokasi / Cabang
              </label>
              <div className="relative">
                <select
                  value={selectedCabang}
                  onChange={(e) => setSelectedCabang(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
                >
                  {cabangOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 text-xs">
            <button
              onClick={handleResetFilters}
              className="px-4 py-1.5 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
            <button
              onClick={() => setCurrentPage(1)}
              className="px-4 py-1.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* 4. MAIN STOK GUDANG TABLE / VIEWS */}
        {activeTab === 'multi' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-3.5 px-3 text-center w-12">No</th>
                    <th className="py-3.5 px-3">Komoditas</th>
                    <th className="py-3.5 px-3">Spesifikasi / Size</th>
                    <th className="py-3.5 px-3">Lokasi / Cabang</th>
                    <th className="py-3.5 px-3 text-right">Qty Available</th>
                    <th className="py-3.5 px-3 text-center">Satuan</th>
                    <th className="py-3.5 px-3">Last Updated</th>
                    <th className="py-3.5 px-3 text-center w-20">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRows.length > 0 ? (
                    paginatedRows.map((row, index) => {
                      const rowNumber = (currentPage - 1) * itemsPerPage + index + 1

                      return (
                        <tr key={row._id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="py-3.5 px-3 text-center text-slate-400 font-medium">
                            {rowNumber}
                          </td>
                          <td className="py-3.5 px-3 font-bold text-slate-800">
                            {row.komoditas}
                          </td>
                          <td className="py-3.5 px-3 text-slate-600">
                            {row.spesifikasi}
                          </td>
                          <td className="py-3.5 px-3 font-semibold text-slate-700">
                            {row.cabang}
                          </td>
                          <td className="py-3.5 px-3 text-right font-extrabold text-slate-800 whitespace-nowrap">
                            {new Intl.NumberFormat('id-ID').format(row.qtyAvailable)}
                          </td>
                          <td className="py-3.5 px-3 text-center text-slate-500 font-medium">
                            {row.satuan}
                          </td>
                          <td className="py-3.5 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                            {row.lastUpdated}
                          </td>
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setSelectedItem(row)
                                  setIsEditModalOpen(true)
                                }}
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Data Stok"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedItem(row)
                                  setIsDetailModalOpen(true)
                                }}
                                className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Lihat Detail Riwayat"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Tidak ada data stok gudang yang sesuai filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer / Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 text-xs text-slate-500 bg-slate-50/50">
              <p>
                Menampilkan {filteredRows.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} -{' '}
                {Math.min(currentPage * itemsPerPage, filteredRows.length)} dari {filteredRows.length} data
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
        )}

        {/* VIEW TAB 2: STOK PER CABANG */}
        {activeTab === 'per_cabang' && (
          <div className="space-y-4">
            {(() => {
              const matchedCabangs = cabangOptions
                .filter((c) => c !== 'Semua Cabang')
                .filter((c) => selectedCabang === 'Semua Cabang' || c.toLowerCase().trim() === selectedCabang.toLowerCase().trim())
                .filter((cab) => filteredRows.some((d) => d.cabang.toLowerCase().trim() === cab.toLowerCase().trim()))

              if (matchedCabangs.length === 0) {
                return (
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400">
                    Tidak ada data stok gudang untuk cabang/filter yang dipilih.
                  </div>
                )
              }

              return matchedCabangs.map((cab) => {
                const cabRows = filteredRows.filter((d) => d.cabang.toLowerCase().trim() === cab.toLowerCase().trim())
                const totalCabQty = cabRows.reduce((sum, r) => sum + r.qtyAvailable, 0)

                return (
                  <div key={cab} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        <h3 className="font-bold text-slate-800 text-sm">Cabang {cab}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
                          {cabRows.length} Komoditas
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-700">
                        Total Stok Cabang: <span className="text-emerald-600 font-extrabold">{new Intl.NumberFormat('id-ID').format(totalCabQty)} kg</span>
                      </p>
                    </div>
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold text-[10px] uppercase">
                          <th className="py-2.5 px-4">Komoditas</th>
                          <th className="py-2.5 px-4">Spesifikasi / Size</th>
                          <th className="py-2.5 px-4 text-right">Qty Available</th>
                          <th className="py-2.5 px-4">Last Updated</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {cabRows.map((r) => (
                          <tr key={r._id} className="hover:bg-blue-50/30">
                            <td className="py-2.5 px-4 font-bold text-slate-800">{r.komoditas}</td>
                            <td className="py-2.5 px-4 text-slate-600">{r.spesifikasi}</td>
                            <td className="py-2.5 px-4 text-right font-extrabold text-slate-800">
                              {new Intl.NumberFormat('id-ID').format(r.qtyAvailable)} kg
                            </td>
                            <td className="py-2.5 px-4 text-[11px] text-slate-500">{r.lastUpdated}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              })
            })()}
          </div>
        )}

        {/* VIEW TAB 3: REKAPAN STOK (AGREGASI PER KOMODITAS) */}
        {activeTab === 'rekapan' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Rekapitulasi Total Stok Nasional per Komoditas</h3>
              <span className="text-xs font-semibold text-slate-500">
                Akumulasi seluruh cabang
              </span>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase">
                  <th className="py-3 px-4 text-center w-12">No</th>
                  <th className="py-3 px-4">Komoditas</th>
                  <th className="py-3 px-4 text-center">Jumlah Lokasi Cabang</th>
                  <th className="py-3 px-4 text-right">Total Stok Nasional</th>
                  <th className="py-3 px-4 text-center">Porsi (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {komoditasOptions
                  .filter((k) => k !== 'Semua Komoditas')
                  .filter((k) => filteredRows.some((d) => d.komoditas === k))
                  .map((kom, idx) => {
                    const komRows = filteredRows.filter((d) => d.komoditas === kom)
                    const totalKomQty = komRows.reduce((sum, r) => sum + r.qtyAvailable, 0)
                    const branches = Array.from(new Set(komRows.map((r) => r.cabang))).join(', ')
                    const percentage = totalQtyAvailable > 0 ? ((totalKomQty / totalQtyAvailable) * 100).toFixed(1) : '0'

                    return (
                      <tr key={kom} className="hover:bg-blue-50/30">
                        <td className="py-3 px-4 text-center text-slate-400 font-medium">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {kom}
                          <span className="block text-[11px] text-slate-400 font-normal">Tersedia di: {branches || 'Semua Cabang'}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                            {komRows.length} Cabang
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-slate-800 text-sm">
                          {new Intl.NumberFormat('id-ID').format(totalKomQty)} kg
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-600">
                          {percentage}%
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. SLIDE-OVER DRAWER / MODAL: "+ UPDATE STOK" */}
        {isUpdateDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white h-full max-w-md w-full p-6 shadow-2xl border-l border-slate-200 space-y-4 animate-in slide-in-from-right duration-200 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Update Stok</h3>
                    <p className="text-xs text-slate-500">
                      Pilih tipe transaksi untuk menambah atau mengurangi stok.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsUpdateDrawerOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Toggle Type: Stok Masuk vs Stok Keluar */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUpdateType('masuk')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      updateType === 'masuk'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <ArrowDownLeft className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Stok Masuk</p>
                      <p className="text-[10px] text-slate-400">(Tambah Stok)</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUpdateType('keluar')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      updateType === 'keluar'
                        ? 'border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Stok Keluar</p>
                      <p className="text-[10px] text-slate-400">(Kurangi Stok)</p>
                    </div>
                  </button>
                </div>

                <form onSubmit={handleSaveUpdateStok} id="updateStokForm" className="space-y-3 text-xs">
                  {/* Komoditas */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Komoditas <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={updateForm.komoditas}
                      onChange={(e) => setUpdateForm({ ...updateForm, komoditas: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      {komoditasOptions.filter((k) => k !== 'Semua Komoditas').map((k) => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>

                  {/* Spesifikasi / Size */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Spesifikasi / Size <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Pilih / input spesifikasi size..."
                      value={updateForm.spesifikasi}
                      onChange={(e) => setUpdateForm({ ...updateForm, spesifikasi: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Lokasi / Cabang */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Lokasi / Cabang <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={updateForm.cabang}
                      onChange={(e) => setUpdateForm({ ...updateForm, cabang: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      {['Jakarta (Kamal)', 'Bitung', 'Surabaya (Perak)', 'Ambon', 'Makassar', 'Pekalongan', 'Manado', 'Ternate', 'Bali', 'Banyuwangi', 'Kupang', 'Bau-Bau', 'Kendari', 'Sorong', 'Belawan'].map(
                        (c) => (
                          <option key={c} value={c}>{c}</option>
                        )
                      )}
                    </select>
                  </div>

                  {/* Tanggal & Qty */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Tanggal <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={updateForm.tanggal}
                        onChange={(e) => setUpdateForm({ ...updateForm, tanggal: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Qty <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          required
                          min={1}
                          placeholder="Jumlah"
                          value={updateForm.qty}
                          onChange={(e) => setUpdateForm({ ...updateForm, qty: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-bold"
                        />
                        <span className="px-2.5 py-2 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-600 flex items-center text-xs">
                          kg
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Keterangan */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Keterangan <span className="font-normal text-slate-400">(opsional)</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Masukkan keterangan (jika ada)"
                      value={updateForm.keterangan}
                      onChange={(e) => setUpdateForm({ ...updateForm, keterangan: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>

                  {/* Lampiran */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Lampiran <span className="font-normal text-slate-400">(opsional)</span>
                    </label>
                    <div className="border border-dashed border-slate-300 rounded-xl p-3 text-center bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 mx-auto text-slate-400 mb-1" />
                      <p className="text-[11px] font-semibold text-blue-600">Upload File</p>
                      <p className="text-[10px] text-slate-400">Excel atau PDF (Max. 10 MB)</p>
                    </div>
                  </div>
                </form>
              </div>

              {/* Drawer Footer Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUpdateDrawerOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  form="updateStokForm"
                  className="px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 6. MODAL DETAIL STOK */}
        {isDetailModalOpen && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800">Detail Stok Ikan Gudang</h3>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Komoditas:</span>
                  <span className="font-bold text-blue-600">{selectedItem.komoditas}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Spesifikasi / Size:</span>
                  <span className="font-semibold text-slate-800">{selectedItem.spesifikasi}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Lokasi / Cabang:</span>
                  <span className="font-bold text-slate-800">{selectedItem.cabang}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Qty Available:</span>
                  <span className="font-extrabold text-emerald-600 text-sm">
                    {new Intl.NumberFormat('id-ID').format(selectedItem.qtyAvailable)} {selectedItem.satuan}
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
      </div>
    </MainLayout>
  )
}
