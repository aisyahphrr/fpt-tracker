'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { SummaryCard } from '@/components/dashboard/summary-card'
import { Package, AlertTriangle, CheckCircle, TrendingDown, Edit, MoreVertical, X, Building2, Search, Filter, Calendar, History, ArrowUpRight, ArrowDownRight, Download } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface StokItem {
  _id: string
  nama: string
  kode: string
  cabang: string
  stokAwal: number
  barangMasuk: number
  barangKeluar: number
}

interface MutasiItem {
  _id: string
  barangId: any
  jenis: 'masuk' | 'keluar'
  qty: number
  keterangan: string
  tanggal: string
}

const DEFAULT_CABANG = [
  'Jakarta',
  'Ambon',
  'Makassar',
  'Benoa',
  'Bacan',
  'Brondong',
  'Pemangkat',
  'Bitung',
  'Belawan',
  'Pekalongan',
  'Sorong'
]

const BULAN_OPTIONS = [
  { value: 'Semua', label: 'Semua Bulan' },
  { value: '1', label: 'Januari' },
  { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' },
  { value: '4', label: 'April' },
  { value: '5', label: 'Mei' },
  { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' },
  { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' }
]

const TAHUN_OPTIONS = [
  { value: 'Semua', label: 'Semua Tahun' },
  { value: '2024', label: '2024' },
  { value: '2025', label: '2025' },
  { value: '2026', label: '2026' },
  { value: '2027', label: '2027' },
  { value: '2028', label: '2028' }
]

export function StokPusat() {
  const [stokList, setStokList] = useState<StokItem[]>([])
  const [mutasiList, setMutasiList] = useState<MutasiItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCabangFilter, setSelectedCabangFilter] = useState('Semua Cabang')
  const [selectedNamaFilter, setSelectedNamaFilter] = useState('Semua Barang')
  const [selectedBulan, setSelectedBulan] = useState('Semua')
  const [selectedTahun, setSelectedTahun] = useState('2026')
  const [isLoading, setIsLoading] = useState(true)

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<StokItem | null>(null)
  const [formData, setFormData] = useState({ 
    tambahanMasuk: 0,
    tanggal: new Date().toISOString().split('T')[0]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [expandedRows, setExpandedRows] = useState<string[]>([])

  // History Modal State & Modal Internal Month Filter
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<StokItem | null>(null)
  const [modalBulanFilter, setModalBulanFilter] = useState('Semua')

  const [userRole, setUserRole] = useState<'admin' | 'staff'>('admin')

  useEffect(() => {
    fetchProfile()
    fetchStokAndMutasi()
  }, [selectedBulan, selectedTahun])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const data = await res.json()
        if (data?.role) setUserRole(data.role)
      }
    } catch (e) {
      console.error('Error fetching profile:', e)
    }
  }

  const fetchStokAndMutasi = async () => {
    try {
      setIsLoading(true)
      const resBarang = await fetch('/api/barang')
      const dataBarang = await resBarang.json()
      if (resBarang.ok) {
        setStokList(dataBarang)
      }

      // Fetch Mutasi
      let mutasiUrl = '/api/mutasi'
      if (selectedBulan !== 'Semua' && selectedTahun !== 'Semua') {
        mutasiUrl += `?bulan=${selectedBulan}&tahun=${selectedTahun}`
      } else if (selectedTahun !== 'Semua') {
        mutasiUrl += `?tahun=${selectedTahun}`
      }

      const resMutasi = await fetch(mutasiUrl)
      const dataMutasi = await resMutasi.json()
      if (resMutasi.ok) {
        setMutasiList(dataMutasi)
      }
    } catch (error) {
      console.error('Error fetching stok/mutasi:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleActionMenu = (id: string) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [id]
    )
  }

  const openEditModal = (item: any) => {
    setSelectedItem(item)
    setFormData({
      tambahanMasuk: 0,
      tanggal: new Date().toISOString().split('T')[0]
    })
    setExpandedRows([])
    setIsEditModalOpen(true)
  }

  const openHistoryModal = (item: any) => {
    setSelectedHistoryItem(item)
    setModalBulanFilter(selectedBulan)
    setExpandedRows([])
    setIsHistoryModalOpen(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === 'tanggal') {
      setFormData(prev => ({ ...prev, tanggal: value }))
    } else {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }))
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return
    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/barang/${selectedItem._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Gagal menyimpan stok')

      setIsEditModalOpen(false)
      setSelectedItem(null)
      fetchStokAndMutasi() 
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Deduce unique branches & unique item names for filtering
  const allBranches = useMemo(() => {
    const set = new Set<string>(DEFAULT_CABANG)
    stokList.forEach(b => {
      if (b.cabang) set.add(b.cabang)
    })
    return Array.from(set)
  }, [stokList])

  const uniqueItemNames = useMemo(() => {
    const set = new Set<string>()
    stokList.forEach(b => {
      if (b.nama) set.add(b.nama.trim())
    })
    return Array.from(set)
  }, [stokList])

  // Map Mutasi per barangId for selected period
  const mutasiPerBarang = useMemo(() => {
    const map: { [barangId: string]: { masuk: number, keluar: number } } = {}
    mutasiList.forEach(m => {
      const bId = typeof m.barangId === 'object' ? m.barangId?._id : m.barangId
      if (!bId) return
      if (!map[bId]) map[bId] = { masuk: 0, keluar: 0 }
      if (m.jenis === 'masuk') map[bId].masuk += m.qty
      if (m.jenis === 'keluar') map[bId].keluar += m.qty
    })
    return map
  }, [mutasiList])

  // Derived Data & Calculations
  const calculatedStok = useMemo(() => {
    const isFilteredByPeriod = selectedBulan !== 'Semua' || selectedTahun !== 'Semua'

    return stokList
      .filter(item => {
        const matchesCabang = selectedCabangFilter === 'Semua Cabang' ? true : (item.cabang || 'Jakarta') === selectedCabangFilter
        const matchesNama = selectedNamaFilter === 'Semua Barang' ? true : item.nama.trim().toLowerCase() === selectedNamaFilter.toLowerCase()
        const matchesSearch = searchQuery === '' ? true : (
          item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.cabang || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
        return matchesCabang && matchesNama && matchesSearch
      })
      .map(item => {
        const stokAwal = item.stokAwal || 0
        
        let barangMasuk = item.barangMasuk || 0
        let barangKeluar = item.barangKeluar || 0

        if (isFilteredByPeriod && mutasiPerBarang[item._id]) {
          barangMasuk = mutasiPerBarang[item._id].masuk
          barangKeluar = mutasiPerBarang[item._id].keluar
        }

        const sisaStok = stokAwal + barangMasuk - barangKeluar

        let status = 'aman'
        if (sisaStok <= 0) status = 'habis'
        else if (sisaStok <= 50) status = 'menipis'

        return { ...item, barangMasuk, barangKeluar, sisaStok, status }
      })
  }, [stokList, selectedCabangFilter, selectedNamaFilter, searchQuery, selectedBulan, selectedTahun, mutasiPerBarang])

  // Filtered History Mutasi for Modal with internal Month Filter
  const itemHistoryMutasi = useMemo(() => {
    if (!selectedHistoryItem) return []
    return mutasiList.filter(m => {
      const bId = typeof m.barangId === 'object' ? m.barangId?._id : m.barangId
      if (bId !== selectedHistoryItem._id) return false

      if (modalBulanFilter !== 'Semua') {
        const mDate = new Date(m.tanggal)
        const mMonth = (mDate.getMonth() + 1).toString()
        if (mMonth !== modalBulanFilter) return false
      }
      return true
    })
  }, [mutasiList, selectedHistoryItem, modalBulanFilter])

  // Totals for table footer
  const totals = useMemo(() => {
    let totalMasuk = 0
    let totalKeluar = 0
    let totalSisa = 0

    calculatedStok.forEach(item => {
      totalMasuk += (item.barangMasuk || 0)
      totalKeluar += (item.barangKeluar || 0)
      totalSisa += item.sisaStok
    })

    return { totalMasuk, totalKeluar, totalSisa }
  }, [calculatedStok])

  const totalBarang = calculatedStok.length
  const stokAman = calculatedStok.filter((item) => item.status === 'aman').length
  const stokMenipis = calculatedStok.filter((item) => item.status === 'menipis').length
  const stokHabis = calculatedStok.filter((item) => item.status === 'habis').length

  // Total Stok per Cabang calculation
  const stokPerCabang = useMemo(() => {
    const isFilteredByPeriod = selectedBulan !== 'Semua' || selectedTahun !== 'Semua'
    const branchMap: { [cabang: string]: { totalSisa: number; itemCount: number } } = {}

    allBranches.forEach(cab => {
      branchMap[cab] = { totalSisa: 0, itemCount: 0 }
    })

    stokList.forEach(item => {
      const cab = item.cabang || 'Jakarta'
      if (!branchMap[cab]) {
        branchMap[cab] = { totalSisa: 0, itemCount: 0 }
      }

      const stokAwal = item.stokAwal || 0
      let barangMasuk = item.barangMasuk || 0
      let barangKeluar = item.barangKeluar || 0

      if (isFilteredByPeriod && mutasiPerBarang[item._id]) {
        barangMasuk = mutasiPerBarang[item._id].masuk
        barangKeluar = mutasiPerBarang[item._id].keluar
      }

      const sisaStok = stokAwal + barangMasuk - barangKeluar
      branchMap[cab].totalSisa += sisaStok
      branchMap[cab].itemCount += 1
    })

    return branchMap
  }, [stokList, allBranches, selectedBulan, selectedTahun, mutasiPerBarang])

  const totalStokSemuaCabang = useMemo(() => {
    return Object.values(stokPerCabang).reduce((acc, curr) => acc + curr.totalSisa, 0)
  }, [stokPerCabang])

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'aman': return 'bg-green-100 text-green-700'
      case 'menipis': return 'bg-yellow-100 text-yellow-700'
      case 'habis': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aman': return 'Aman'
      case 'menipis': return 'Menipis'
      case 'habis': return 'Habis'
      default: return status
    }
  }

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return '-'
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return dateString
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getMonthLabel = (val: string) => {
    if (val === 'Semua') return 'Semua Bulan'
    const found = BULAN_OPTIONS.find(b => b.value === val)
    return found ? found.label : val
  }

  // --- EXPORT FUNCTIONS FOR POPUP MODAL ---
  const exportHistoryExcel = () => {
    if (!selectedHistoryItem) return
    const periodeLabel = `${getMonthLabel(modalBulanFilter)} ${selectedTahun}`

    const excelData = itemHistoryMutasi.map((m, index) => ({
      'No': index + 1,
      'Tanggal Update': formatDateDisplay(m.tanggal),
      'Jenis Mutasi': m.jenis === 'masuk' ? 'Barang Masuk (+)' : 'Barang Keluar (-)',
      'Jumlah Qty': m.jenis === 'masuk' ? `+${m.qty}` : `-${m.qty}`,
      'Keterangan Mutasi': m.keterangan || '-'
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)
    XLSX.utils.book_append_sheet(wb, ws, "Histori Mutasi")
    XLSX.writeFile(wb, `Histori_Stok_${selectedHistoryItem.nama.replace(/\s+/g, '_')}_Bulan_${modalBulanFilter}_Tahun_${selectedTahun}.xlsx`)
  }

  const exportHistoryPDF = () => {
    if (!selectedHistoryItem) return
    const doc = new jsPDF('portrait')
    const periodeLabel = `${getMonthLabel(modalBulanFilter)} ${selectedTahun}`

    doc.setFontSize(16)
    doc.text(`Histori Mutasi Stok: ${selectedHistoryItem.nama}`, 14, 20)
    doc.setFontSize(11)
    doc.text(`SKU: ${selectedHistoryItem.kode} | Cabang: ${selectedHistoryItem.cabang || 'Jakarta'} | Periode: ${periodeLabel}`, 14, 28)

    autoTable(doc, {
      startY: 35,
      head: [['No', 'Tanggal Update', 'Jenis Mutasi', 'Jumlah Qty', 'Keterangan']],
      body: itemHistoryMutasi.map((m, i) => [
        i + 1,
        formatDateDisplay(m.tanggal),
        m.jenis === 'masuk' ? 'Barang Masuk (+)' : 'Barang Keluar (-)',
        m.jenis === 'masuk' ? `+${m.qty}` : `-${m.qty}`,
        m.keterangan || '-'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [147, 51, 234] }
    })

    doc.save(`Histori_Stok_${selectedHistoryItem.nama.replace(/\s+/g, '_')}_Bulan_${modalBulanFilter}_Tahun_${selectedTahun}.pdf`)
  }

  return (
    <MainLayout>
      {/* Header & Main Filters */}
      <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-title mb-2">Stok Barang Multi-Cabang</h1>
          <p className="text-muted-foreground">Pantau sisa stok dan kelola penerimaan barang per lokasi cabang kota & periode</p>
        </div>

        {/* Filter Controls: Bulan & Tahun */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Bulan */}
          <div className="flex items-center gap-1.5 bg-white border border-border px-3 py-1.5 rounded-lg shadow-2xs">
            <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <select
              value={selectedBulan}
              onChange={(e) => setSelectedBulan(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-700 focus:outline-none cursor-pointer"
            >
              {BULAN_OPTIONS.map(b => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </div>

          {/* Filter Tahun */}
          <div className="flex items-center gap-1.5 bg-white border border-border px-3 py-1.5 rounded-lg shadow-2xs">
            <select
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-700 focus:outline-none cursor-pointer"
            >
              {TAHUN_OPTIONS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Total Stok Semua Cabang & Breakdown Per Cabang */}
      <div className="space-y-4 mb-8">
        {/* Main Card: Total Stok Semua Cabang */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white rounded-2xl p-6 shadow-md border border-blue-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <Building2 className="w-7 h-7 text-blue-200" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-blue-200 font-semibold mb-1">
                Ikhtisar Stok Multi-Cabang
              </p>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Total Stok Semua Cabang
              </h2>
              <p className="text-xs text-blue-200/80 mt-0.5">
                Total persediaan dari {allBranches.length} lokasi cabang ({stokList.length} SKU barang)
              </p>
            </div>
          </div>
          <div className="text-left md:text-right bg-white/10 backdrop-blur-md px-6 py-3.5 rounded-xl border border-white/15">
            <span className="text-xs text-blue-200 font-semibold block uppercase">Total Stok Sisa</span>
            <span className="text-3xl font-extrabold text-white">
              {totalStokSemuaCabang.toLocaleString('id-ID')} <span className="text-lg font-medium text-blue-200">Kg</span>
            </span>
          </div>
        </div>

        {/* Small Cards: Total Stok Per Cabang */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <span>Rincian Total Stok Per Cabang (Klik untuk filter)</span>
            </h3>
            <span className="text-xs text-muted-foreground font-medium">
              {allBranches.length} Cabang Terdaftar
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {allBranches.map((cabangName) => {
              const dataCabang = stokPerCabang[cabangName] || { totalSisa: 0, itemCount: 0 }
              const isFiltered = selectedCabangFilter === cabangName

              return (
                <button
                  key={cabangName}
                  onClick={() => setSelectedCabangFilter(selectedCabangFilter === cabangName ? 'Semua Cabang' : cabangName)}
                  className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                    isFiltered
                      ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-400/50'
                      : 'bg-card hover:bg-muted/40 border-border text-foreground shadow-2xs hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-bold truncate flex items-center gap-1 ${isFiltered ? 'text-white' : 'text-foreground'}`}>
                      📍 {cabangName}
                    </span>
                    {dataCabang.itemCount > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                        isFiltered ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {dataCabang.itemCount} SKU
                      </span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <span className={`text-lg font-extrabold block tracking-tight ${isFiltered ? 'text-white' : 'text-primary'}`}>
                      {dataCabang.totalSisa.toLocaleString('id-ID')} <span className={`text-xs font-semibold ${isFiltered ? 'text-blue-100' : 'text-muted-foreground'}`}>Kg</span>
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Inventory Table Card */}
      <div className="dashboard-card overflow-hidden">
        <div className="p-6 border-b border-border space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-subtitle">
                Detail Inventori & Mutasi ({selectedCabangFilter} - Periode {getMonthLabel(selectedBulan)} {selectedTahun})
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Filter berdasarkan nama barang untuk melihat perbandingan stok antar cabang</p>
            </div>
          </div>

          {/* Search, Cabang & Item Filter Controls */}
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari nama barang atau kode SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Filter Cabang */}
            <div className="w-full md:w-60 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <select
                value={selectedCabangFilter}
                onChange={(e) => setSelectedCabangFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="Semua Cabang">🌐 Semua Cabang</option>
                {allBranches.map(c => (
                  <option key={c} value={c}>📍 {c}</option>
                ))}
              </select>
            </div>

            {/* Filter Barang */}
            <div className="w-full md:w-60 flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <select
                value={selectedNamaFilter}
                onChange={(e) => setSelectedNamaFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="Semua Barang">📦 Semua Barang</option>
                {uniqueItemNames.map(nama => (
                  <option key={nama} value={nama}>{nama}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-gray-50/80 text-gray-700 font-semibold">
                <th className="px-5 py-3.5 text-left whitespace-nowrap">Kode (SKU)</th>
                <th className="px-5 py-3.5 text-left">Nama Barang</th>
                <th className="px-5 py-3.5 text-center whitespace-nowrap">Cabang</th>
                <th className="px-5 py-3.5 text-center whitespace-nowrap">Barang Masuk</th>
                <th className="px-5 py-3.5 text-center whitespace-nowrap">Barang Keluar</th>
                <th className="px-5 py-3.5 text-center whitespace-nowrap">Sisa Stok</th>
                <th className="px-5 py-3.5 text-center whitespace-nowrap">Status</th>
                <th className="px-5 py-3.5 text-center whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                    <div className="flex justify-center items-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-2">Memuat data stok cabang & mutasi...</span>
                    </div>
                  </td>
                </tr>
              ) : calculatedStok.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                    Tidak ada data barang yang sesuai filter
                  </td>
                </tr>
              ) : (
                calculatedStok.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50/60 transition-colors align-middle">
                    <td className="px-5 py-3.5 text-primary font-bold whitespace-nowrap font-mono">{item.kode}</td>
                    <td className="px-5 py-3.5 font-semibold text-gray-900">{item.nama}</td>
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 whitespace-nowrap shadow-2xs">
                        📍 {item.cabang || 'Jakarta'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-green-600 text-center font-bold whitespace-nowrap">
                      +{(item.barangMasuk || 0)}
                    </td>
                    <td className="px-5 py-3.5 text-red-600 text-center font-bold whitespace-nowrap">
                      -{(item.barangKeluar || 0)}
                    </td>
                    <td className="px-5 py-3.5 text-gray-900 text-center font-extrabold text-base whitespace-nowrap">
                      {item.sisaStok}
                    </td>
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getStatusBadgeClass(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      <div className="relative inline-block">
                        <button
                          onClick={() => toggleActionMenu(item._id)}
                          className="p-2 hover:bg-gray-200 rounded transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-600" />
                        </button>
  
                        {expandedRows.includes(item._id) && (
                          <div className="absolute right-8 top-0 mt-1 w-44 bg-white border border-border rounded-lg shadow-xl z-50 py-1 text-left">
                            {userRole === 'admin' && (
                              <button 
                                onClick={() => openEditModal(item)}
                                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-blue-50 transition-colors"
                              >
                                <Edit className="w-3.5 h-3.5 text-blue-600" />
                                Update Stok
                              </button>
                            )}
                            <button 
                              onClick={() => openHistoryModal(item)}
                              className={`w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 transition-colors ${userRole === 'admin' ? 'border-t border-gray-100' : ''}`}
                            >
                              <History className="w-3.5 h-3.5 text-purple-600" />
                              Detail Histori Stok
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Summary Footer Row showing total across branches */}
            {!isLoading && calculatedStok.length > 0 && (
              <tfoot className="bg-blue-50/70 border-t-2 border-blue-200 font-bold">
                <tr>
                  <td colSpan={3} className="px-6 py-3.5 text-right text-blue-900 text-sm">
                    TOTAL GABUNGAN ({calculatedStok.length} BARIS):
                  </td>
                  <td className="px-6 py-3.5 text-center text-green-700 text-sm">
                    +{totals.totalMasuk}
                  </td>
                  <td className="px-6 py-3.5 text-center text-red-700 text-sm">
                    -{totals.totalKeluar}
                  </td>
                  <td className="px-6 py-3.5 text-center text-primary text-base">
                    {totals.totalSisa} Kg
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Edit Stok Modal */}
      {isEditModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full shadow-2xl overflow-hidden">
            <div className="bg-gray-50 border-b border-border p-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Update Stok Barang</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm">
                <span className="block font-bold mb-1">{selectedItem.nama}</span>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-blue-600">SKU: {selectedItem.kode}</span>
                  <span className="font-bold bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded">📍 {selectedItem.cabang || 'Jakarta'}</span>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Stok Saat Ini</label>
                <input
                  type="number"
                  disabled
                  value={(selectedItem as any).sisaStok || 0}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-gray-100 text-sm font-bold text-gray-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tambah Barang Masuk (+)</label>
                <input
                  type="number"
                  name="tambahanMasuk"
                  min="1"
                  required
                  value={formData.tambahanMasuk || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500 text-sm font-semibold text-green-700 bg-green-50/50"
                  placeholder="Misal: 50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tanggal Update Stok (dd/mm/yyyy) *</label>
                <input
                  type="date"
                  name="tanggal"
                  required
                  value={formData.tanggal}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary text-sm font-medium text-gray-800 bg-white"
                />
                <p className="text-[11px] text-gray-500 mt-1">Sistem akan mencatat mutasi stok pada tanggal ini untuk pelacakan histori</p>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Stok'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Histori Mutasi Stok Modal (With Filter Bulan Inside Modal) */}
      {isHistoryModalOpen && selectedHistoryItem && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gray-50 border-b border-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-purple-600" />
                  Histori Mutasi Stok Barang
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Laporan rekam jejak update stok barang tahun <strong>{selectedTahun}</strong>
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Filter Bulan Inside Modal */}
                <div className="flex items-center gap-1.5 bg-white border border-purple-200 px-3 py-1.5 rounded-lg shadow-2xs">
                  <Calendar className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span className="text-xs font-bold text-purple-900">Bulan:</span>
                  <select
                    value={modalBulanFilter}
                    onChange={(e) => setModalBulanFilter(e.target.value)}
                    className="bg-transparent text-xs font-bold text-purple-900 focus:outline-none cursor-pointer"
                  >
                    {BULAN_OPTIONS.map(b => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Item Info Banner */}
              <div className="bg-purple-50/70 border border-purple-100 p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-extrabold text-purple-950 text-lg mb-1">{selectedHistoryItem.nama}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-purple-800">
                    <span className="bg-white px-2 py-0.5 rounded border border-purple-200">SKU: <strong>{selectedHistoryItem.kode}</strong></span>
                    <span className="bg-white px-2 py-0.5 rounded border border-purple-200">📍 Cabang: <strong>{selectedHistoryItem.cabang || 'Jakarta'}</strong></span>
                    <span className="bg-purple-100 text-purple-900 px-2 py-0.5 rounded border border-purple-300 font-bold">
                      📅 Periode: {getMonthLabel(modalBulanFilter)} {selectedTahun}
                    </span>
                  </div>
                </div>
                <div className="text-left sm:text-right bg-white sm:bg-transparent p-3 sm:p-0 rounded-lg border sm:border-none border-purple-200">
                  <span className="text-xs text-purple-600 font-bold uppercase tracking-wider block">Total Sisa Stok</span>
                  <span className="text-2xl font-black text-purple-900">
                    {(selectedHistoryItem as any).sisaStok !== undefined ? (selectedHistoryItem as any).sisaStok : (selectedHistoryItem.stokAwal + selectedHistoryItem.barangMasuk - selectedHistoryItem.barangKeluar)} Kg
                  </span>
                </div>
              </div>

              {/* History Table Container (Wide & Uncropped) */}
              <div className="border border-border rounded-xl overflow-x-auto shadow-2xs">
                <table className="w-full text-xs min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-border text-gray-700 font-semibold">
                      <th className="px-5 py-3.5 text-left w-32">Tanggal Update</th>
                      <th className="px-5 py-3.5 text-center w-40">Jenis Mutasi</th>
                      <th className="px-5 py-3.5 text-center w-28">Jumlah (Qty)</th>
                      <th className="px-5 py-3.5 text-left">Keterangan Mutasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-white">
                    {itemHistoryMutasi.length > 0 ? (
                      itemHistoryMutasi.map((m) => (
                        <tr key={m._id} className="hover:bg-purple-50/20 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-gray-900 whitespace-nowrap">
                            {formatDateDisplay(m.tanggal)}
                          </td>
                          <td className="px-5 py-3.5 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold ${
                              m.jenis === 'masuk' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {m.jenis === 'masuk' ? <ArrowUpRight className="w-3.5 h-3.5 text-green-700" /> : <ArrowDownRight className="w-3.5 h-3.5 text-red-700" />}
                              {m.jenis === 'masuk' ? 'Barang Masuk' : 'Barang Keluar'}
                            </span>
                          </td>
                          <td className={`px-5 py-3.5 text-center font-black text-sm whitespace-nowrap ${m.jenis === 'masuk' ? 'text-green-600' : 'text-red-600'}`}>
                            {m.jenis === 'masuk' ? `+${m.qty}` : `-${m.qty}`}
                          </td>
                          <td className="px-5 py-3.5 text-gray-700 font-medium leading-relaxed">
                            {m.keterangan || '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-gray-500 font-medium">
                          Belum ada catatan mutasi update stok untuk barang ini pada periode {getMonthLabel(modalBulanFilter)} {selectedTahun}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer with Export PDF & Excel Action Buttons */}
            <div className="bg-gray-50 border-t border-border p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={exportHistoryExcel}
                  disabled={itemHistoryMutasi.length === 0}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" /> Export Excel
                </button>
                <button
                  type="button"
                  onClick={exportHistoryPDF}
                  disabled={itemHistoryMutasi.length === 0}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" /> Export PDF
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Tutup Histori
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Legend */}
      <div className="mt-6 dashboard-card">
        <h3 className="text-subtitle mb-4">Keterangan Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-600"></div>
            <span className="text-sm text-foreground"><strong>Aman</strong> - Sisa stok lebih dari 50</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-sm text-foreground"><strong>Menipis</strong> - Sisa stok 1 sampai 50</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-600"></div>
            <span className="text-sm text-foreground"><strong>Habis</strong> - Sisa stok 0</span>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
