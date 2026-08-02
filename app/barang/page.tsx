'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { Plus, Search, Edit, Trash2, MoreVertical, Filter, X } from 'lucide-react'
import { useState, useEffect } from 'react'

interface BarangItem {
  _id: string
  kode: string
  nama: string
  kategori: string
  satuan: string
  deskripsi: string
  stokAwal: number
  barangMasuk: number
  barangKeluar: number
  status: 'aktif' | 'nonaktif'
}

export default function BarangPage() {
  const [barangList, setBarangList] = useState<BarangItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedRows, setExpandedRows] = useState<string[]>([])
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
    kategori: '',
    satuan: '',
    deskripsi: '',
    status: 'aktif'
  })

  useEffect(() => {
    fetchBarang()
  }, [])

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle Add
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/barang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Gagal menyimpan barang')

      setIsAddModalOpen(false)
      setFormData({ kode: '', nama: '', kategori: '', satuan: '', deskripsi: '', status: 'aktif' })
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
    setFormData({
      kode: barang.kode,
      nama: barang.nama,
      kategori: barang.kategori,
      satuan: barang.satuan,
      deskripsi: barang.deskripsi || '',
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

    try {
      const res = await fetch(`/api/barang/${selectedBarang._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
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

  // Filter Data
  const filteredBarang = barangList.filter(b => 
    b.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.kode.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-title mb-2">Master Barang</h1>
        <p className="text-muted-foreground">Katalog master barang (Nama, Kode, Kategori)</p>
      </div>

      {/* Controls */}
      <div className="dashboard-card mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
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
          <div className="flex gap-3">
            <button 
              onClick={() => {
                setFormData({ kode: '', nama: '', kategori: '', satuan: '', deskripsi: '', status: 'aktif' })
                setError('')
                setIsAddModalOpen(true)
              }} 
              className="btn-primary btn-sm"
            >
              <Plus className="w-4 h-4" />
              Tambah Barang
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="dashboard-card overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-gray-50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Kode</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Nama Barang</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Kategori</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Satuan</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-foreground">Stok</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    <div className="flex justify-center items-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-2">Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredBarang.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    Belum ada barang di database
                  </td>
                </tr>
              ) : (
                filteredBarang.map((barang) => (
                  <tr key={barang._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-primary font-semibold">{barang.kode}</td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      <div className="font-medium">{barang.nama}</div>
                      {barang.deskripsi && <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{barang.deskripsi}</div>}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{barang.kategori}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{barang.satuan}</td>
                    <td className="px-6 py-4 text-sm text-foreground text-center font-bold">
                      {(barang.stokAwal || 0) + (barang.barangMasuk || 0) - (barang.barangKeluar || 0)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          barang.status === 'aktif'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {barang.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="relative inline-block">
                        <button
                          onClick={() => toggleActionMenu(barang._id)}
                          className="p-2 hover:bg-gray-200 rounded transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-600" />
                        </button>
  
                        {expandedRows.includes(barang._id) && (
                          <div className="absolute right-8 top-0 mt-1 w-32 bg-card border border-border rounded-lg shadow-lg z-50">
                            <button 
                              onClick={() => openEditModal(barang)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-gray-50 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button 
                              onClick={() => openDeleteModal(barang)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-border"
                            >
                              <Trash2 className="w-4 h-4" />
                              Hapus
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. Modal Tambah / Edit Barang */}
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
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={isEditModalOpen ? handleEditSubmit : handleAddSubmit} className="p-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kode Barang (SKU) *</label>
                  <input
                    type="text"
                    name="kode"
                    required
                    disabled={isEditModalOpen} // Disable saat edit
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
                
                {isEditModalOpen && (
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
                  rows={3}
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

      {/* 2. Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedBarang && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5 border-4 border-white shadow-sm ring-1 ring-red-100">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Hapus Barang?</h2>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              Apakah Anda yakin ingin menghapus <strong>{selectedBarang.nama}</strong>? Data ini akan dihapus permanen dari database.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setIsDeleteModalOpen(false)} 
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full"
              >
                Batal
              </button>
              <button 
                onClick={handleDeleteSubmit} 
                disabled={isSubmitting}
                className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm w-full disabled:opacity-50"
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
