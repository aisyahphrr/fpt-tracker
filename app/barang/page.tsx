'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { Plus, Search, Edit, Trash2, MoreVertical, Building2, Box } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'

interface BarangItem {
  _id: string
  kode: string
  nama: string
  cabang: string
  kategori: string
  satuan: string
  deskripsi: string
  stokAwal: number
  barangMasuk: number
  barangKeluar: number
  status: 'aktif' | 'nonaktif'
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

export default function BarangPage() {
  const [barangList, setBarangList] = useState<BarangItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCabangFilter, setSelectedCabangFilter] = useState('Semua Cabang')
  const [selectedNamaFilter, setSelectedNamaFilter] = useState('Semua Barang')
  const [expandedRows, setExpandedRows] = useState<string[]>([])
  const [showAggregationModal, setShowAggregationModal] = useState(false)
  const [selectedAggregatedName, setSelectedAggregatedName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  const [selectedBarang, setSelectedBarang] = useState<BarangItem | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    kode: '',
    nama: '',
    cabangSelect: 'Jakarta',
    cabangCustom: '',
    kategori: '',
    satuan: '',
    deskripsi: '',
    stokAwal: 0,
    status: 'aktif'
  })

  const [userRole, setUserRole] = useState<'admin' | 'staff'>('admin')

  useEffect(() => {
    fetchProfile()
    fetchBarang()
  }, [])

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

  const fetchBarang = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/barang')
      const data = await res.json()
      if (res.ok) {
        setBarangList(data)
      } else {
        console.error('Failed to fetch barang:', data.message)
      }
    } catch (error) {
      console.error('Error fetching barang:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleActionMenu = (id: string) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [id]
    )
  }

  const openAddModal = () => {
    resetForm()
    setExpandedRows([])
    setIsAddModalOpen(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle Add
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    const finalCabang = formData.cabangSelect === 'Lainnya' ? formData.cabangCustom.trim() : formData.cabangSelect
    if (!finalCabang) {
      setError('Nama cabang/kota wajib diisi')
      setIsSubmitting(false)
      return
    }

    try {
      const res = await fetch('/api/barang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          cabang: finalCabang
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Gagal menambahkan barang')

      setIsAddModalOpen(false)
      resetForm()
      fetchBarang() 
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Edit
  const openEditModal = (barang: BarangItem) => {
    setSelectedBarang(barang)
    const isDefault = DEFAULT_CABANG.includes(barang.cabang || 'Jakarta')
    setFormData({
      kode: barang.kode,
      nama: barang.nama,
      cabangSelect: isDefault ? (barang.cabang || 'Jakarta') : 'Lainnya',
      cabangCustom: isDefault ? '' : (barang.cabang || ''),
      kategori: barang.kategori,
      satuan: barang.satuan,
      deskripsi: barang.deskripsi || '',
      stokAwal: barang.stokAwal || 0,
      status: barang.status
    })
    setExpandedRows([])
    setIsEditModalOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBarang) return
    setIsSubmitting(true)
    setError('')

    const finalCabang = formData.cabangSelect === 'Lainnya' ? formData.cabangCustom.trim() : formData.cabangSelect
    if (!finalCabang) {
      setError('Nama cabang/kota wajib diisi')
      setIsSubmitting(false)
      return
    }

    try {
      const res = await fetch(`/api/barang/${selectedBarang._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          cabang: finalCabang
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Gagal mengupdate barang')

      setIsEditModalOpen(false)
      setSelectedBarang(null)
      fetchBarang() 
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Delete
  const openDeleteModal = (barang: BarangItem) => {
    setSelectedBarang(barang)
    setExpandedRows([])
    setIsDeleteModalOpen(true)
  }

  const handleDeleteSubmit = async () => {
    if (!selectedBarang) return
    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/barang/${selectedBarang._id}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Gagal menghapus barang')

      setIsDeleteModalOpen(false)
      setSelectedBarang(null)
      fetchBarang() 
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      kode: '',
      nama: '',
      cabangSelect: 'Jakarta',
      cabangCustom: '',
      kategori: '',
      satuan: '',
      deskripsi: '',
      stokAwal: 0,
      status: 'aktif'
    })
    setError('')
  }

  // Deduce all unique branches present in DB for filter
  const allBranches = useMemo(() => {
    const set = new Set<string>(DEFAULT_CABANG)
    barangList.forEach(b => {
      if (b.cabang) set.add(b.cabang)
    })
    return Array.from(set)
  }, [barangList])

  // Deduce unique item names present in DB for filter
  const uniqueItemNames = useMemo(() => {
    const set = new Set<string>()
    barangList.forEach(b => {
      if (b.nama) set.add(b.nama.trim())
    })
    return Array.from(set)
  }, [barangList])

  // Filtered Barang
  const filteredBarang = useMemo(() => {
    return barangList.filter(b => {
      const matchesSearch = b.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            b.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (b.cabang || '').toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCabang = selectedCabangFilter === 'Semua Cabang' ? true : (b.cabang || 'Jakarta') === selectedCabangFilter
      const matchesNama = selectedNamaFilter === 'Semua Barang' ? true : b.nama.trim().toLowerCase() === selectedNamaFilter.toLowerCase()
      return matchesSearch && matchesCabang && matchesNama
    })
  }, [barangList, searchQuery, selectedCabangFilter, selectedNamaFilter])

  // Aggregate items by name across all branches
  const aggregatedStockMap = useMemo(() => {
    const map: { [name: string]: { totalStok: number, branches: { [cabang: string]: number } } } = {}
    barangList.forEach(b => {
      const nameKey = b.nama.trim().toLowerCase()
      const currentStok = (b.stokAwal || 0) + (b.barangMasuk || 0) - (b.barangKeluar || 0)
      const branchName = b.cabang || 'Jakarta'

      if (!map[nameKey]) {
        map[nameKey] = { totalStok: 0, branches: {} }
      }
      map[nameKey].totalStok += currentStok
      map[nameKey].branches[branchName] = (map[nameKey].branches[branchName] || 0) + currentStok
    })
    return map
  }, [barangList])

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-title mb-2">Master Barang</h1>
        <p className="text-muted-foreground">Katalog master barang (Nama, Kode, Kategori)</p>
      </div>

      {/* Controls */}
      <div className="dashboard-card mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-1">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari kode atau nama barang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-all"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Cabang */}
            <select
              value={selectedCabangFilter}
              onChange={(e) => setSelectedCabangFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <option value="Semua Cabang">🌐 Semua Cabang</option>
              {allBranches.map(c => (
                <option key={c} value={c}>📍 Cabang {c}</option>
              ))}
            </select>

            {/* Filter Barang */}
            <select
              value={selectedNamaFilter}
              onChange={(e) => setSelectedNamaFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <option value="Semua Barang">📦 Semua Barang</option>
              {uniqueItemNames.map(nama => (
                <option key={nama} value={nama}>{nama}</option>
              ))}
            </select>

            {userRole === 'admin' && (
              <button 
                onClick={() => {
                  resetForm()
                  setIsAddModalOpen(true)
                }} 
                className="btn-primary btn-sm whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Tambah Barang
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="dashboard-card overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-gray-50/80 text-gray-700 font-semibold">
                <th className="px-5 py-3.5 text-left whitespace-nowrap">Kode (SKU)</th>
                <th className="px-5 py-3.5 text-left">Nama Barang</th>
                <th className="px-5 py-3.5 text-center whitespace-nowrap">Cabang / Kota</th>
                <th className="px-5 py-3.5 text-left whitespace-nowrap">Kategori</th>
                <th className="px-5 py-3.5 text-center whitespace-nowrap">Satuan</th>
                <th className="px-5 py-3.5 text-center whitespace-nowrap">Stok Cabang</th>
                <th className="px-5 py-3.5 text-center whitespace-nowrap">Stok Gabungan All Cabang</th>
                <th className="px-5 py-3.5 text-center whitespace-nowrap">Status</th>
                <th className="px-5 py-3.5 text-center whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-muted-foreground">
                    <div className="flex justify-center items-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-2">Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredBarang.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-muted-foreground">
                    Belum ada barang di database
                  </td>
                </tr>
              ) : (
                filteredBarang.map((barang) => {
                  const currentStok = (barang.stokAwal || 0) + (barang.barangMasuk || 0) - (barang.barangKeluar || 0)
                  const keyName = barang.nama.trim().toLowerCase()
                  const totalGabungan = aggregatedStockMap[keyName]?.totalStok || currentStok

                  return (
                    <tr key={barang._id} className="hover:bg-gray-50/60 transition-colors align-middle">
                      <td className="px-5 py-3.5 text-primary font-bold whitespace-nowrap font-mono">{barang.kode}</td>
                      <td className="px-5 py-3.5 text-foreground">
                        <div className="font-semibold text-gray-900">{barang.nama}</div>
                        {barang.deskripsi && <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{barang.deskripsi}</div>}
                      </td>
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-800 text-xs font-bold rounded-full border border-blue-200 whitespace-nowrap shadow-2xs">
                          📍 {barang.cabang || 'Jakarta'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-700 capitalize whitespace-nowrap">{barang.kategori}</td>
                      <td className="px-5 py-3.5 text-gray-700 text-center whitespace-nowrap">{barang.satuan}</td>
                      <td className="px-5 py-3.5 text-gray-900 text-center font-extrabold text-base whitespace-nowrap">
                        {currentStok}
                      </td>
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAggregatedName(barang.nama)
                            setShowAggregationModal(true)
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold rounded-full border border-indigo-200 transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
                        >
                          <Box className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{totalGabungan} {barang.satuan}</span>
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                            barang.status === 'aktif'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {barang.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        {userRole === 'admin' ? (
                          <div className="flex justify-center items-center gap-1">
                            <button
                              onClick={() => openEditModal(barang)}
                              className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(barang)}
                              className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium italic">Read Only</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Multi-Cabang Aggregation Overview */}
      {showAggregationModal && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-gray-900 text-base">Rincian Stok Per Cabang</h3>
              </div>
              <button onClick={() => { setShowAggregationModal(false); setSelectedAggregatedName(null); }} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Rincian stok barang di setiap cabang lokasi gudang:
            </p>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {Object.entries(aggregatedStockMap)
                .filter(([name]) => !selectedAggregatedName || name === selectedAggregatedName.trim().toLowerCase())
                .map(([name, data]) => {
                  const originalName = barangList.find(b => b.nama.trim().toLowerCase() === name)?.nama || name
                  return (
                    <div key={name} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-2">
                        <span className="font-bold text-gray-900 text-sm">{originalName}</span>
                        <span className="bg-primary/10 text-primary font-bold px-2.5 py-0.5 rounded-full text-xs">
                          Total: {data.totalStok} Unit
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-xs">
                        {Object.entries(data.branches).map(([bName, bStok]) => (
                          <div key={bName} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-gray-100">
                            <span className="font-medium text-gray-700">
                              📍 Cabang {bName}
                            </span>
                            <span className="font-bold text-gray-900">{bStok} Unit</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
            </div>

            <div className="pt-2 text-right">
              <button onClick={() => { setShowAggregationModal(false); setSelectedAggregatedName(null); }} className="btn-secondary btn-sm">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit Barang */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="bg-gray-50 border-b border-border p-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {isEditModalOpen ? 'Edit Master Barang' : 'Tambah Master Barang'}
              </h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false)
                  setIsEditModalOpen(false)
                }}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={isEditModalOpen ? handleEditSubmit : handleAddSubmit} className="p-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                  {error}
                </div>
              )}

              {/* Cabang Selection */}
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-2">
                <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider">Cabang / Lokasi Gudang *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <select
                      name="cabangSelect"
                      value={formData.cabangSelect}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm font-medium bg-white"
                    >
                      {DEFAULT_CABANG.map(c => (
                        <option key={c} value={c}>📍 {c}</option>
                      ))}
                      <option value="Lainnya">➕ Kota Lainnya (Custom)...</option>
                    </select>
                  </div>

                  {formData.cabangSelect === 'Lainnya' && (
                    <div>
                      <input
                        type="text"
                        name="cabangCustom"
                        required
                        value={formData.cabangCustom}
                        onChange={handleInputChange}
                        placeholder="Nama Kota / Cabang Baru..."
                        className="w-full px-3 py-2 border border-primary rounded-lg focus:ring-2 focus:ring-primary text-sm bg-white font-medium"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kode Barang (SKU) *</label>
                  <input
                    type="text"
                    name="kode"
                    required
                    disabled={isEditModalOpen}
                    value={formData.kode}
                    onChange={handleInputChange}
                    placeholder="Mis: ATK-005"
                    className={`w-full px-3 py-2 border border-border rounded-lg text-sm ${isEditModalOpen ? 'bg-gray-100 text-gray-500' : 'focus:ring-2 focus:ring-primary'}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Satuan *</label>
                  <input
                    type="text"
                    name="satuan"
                    required
                    value={formData.satuan}
                    onChange={handleInputChange}
                    placeholder="Mis: Pcs, Box, Rim"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Barang *</label>
                <input
                  type="text"
                  name="nama"
                  required
                  value={formData.nama}
                  onChange={handleInputChange}
                  placeholder="Mis: Tinta Printer Epson Hitam"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
                  <input
                    type="text"
                    name="kategori"
                    required
                    value={formData.kategori}
                    onChange={handleInputChange}
                    placeholder="Mis: Tinta & Toner"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>

                {!isEditModalOpen ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stok Awal Cabang</label>
                    <input
                      type="number"
                      name="stokAwal"
                      min={0}
                      placeholder="0"
                      value={formData.stokAwal === 0 || (formData.stokAwal as any) === '' ? '' : formData.stokAwal}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary text-sm"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary text-sm"
                    >
                      <option value="aktif">Aktif</option>
                      <option value="nonaktif">Nonaktif</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi (Opsional)</label>
                <textarea
                  name="deskripsi"
                  value={formData.deskripsi}
                  onChange={handleInputChange}
                  placeholder="Deskripsi spesifikasi barang..."
                  rows={2}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false)
                    setIsEditModalOpen(false)
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center"
                >
                  {isSubmitting ? 'Menyimpan...' : (isEditModalOpen ? 'Simpan Perubahan' : 'Simpan Barang')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedBarang && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm ring-1 ring-red-100">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Hapus Barang?</h2>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus <strong>{selectedBarang.nama}</strong> ({selectedBarang.cabang})?
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setIsDeleteModalOpen(false)} 
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 w-full"
              >
                Batal
              </button>
              <button 
                onClick={handleDeleteSubmit} 
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 w-full disabled:opacity-50"
              >
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
