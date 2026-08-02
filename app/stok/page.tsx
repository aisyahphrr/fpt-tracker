'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { SummaryCard } from '@/components/dashboard/summary-card'
import { Package, AlertTriangle, CheckCircle, TrendingDown, Edit, MoreVertical, X } from 'lucide-react'
import { useState, useEffect } from 'react'

interface StokItem {
  _id: string
  nama: string
  kode: string
  stokAwal: number
  barangMasuk: number
  barangKeluar: number
}

export default function StokPage() {
  const [stokList, setStokList] = useState<StokItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<StokItem | null>(null)
  const [formData, setFormData] = useState({ tambahanMasuk: 0 })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [expandedRows, setExpandedRows] = useState<string[]>([])

  useEffect(() => {
    fetchStok()
  }, [])

  const fetchStok = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/barang')
      const data = await res.json()
      if (res.ok) {
        setStokList(data)
      } else {
        console.error('Failed to fetch stok:', data.message)
      }
    } catch (error) {
      console.error('Error fetching stok:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleActionMenu = (id: string) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [id]
    )
  }

  const openEditModal = (item: any) => { // using any because we need sisaStok which is derived
    setSelectedItem(item)
    setFormData({
      tambahanMasuk: 0
    })
    setExpandedRows([])
    setIsEditModalOpen(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }))
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
        // Hanya mengirimkan stokAwal dan barangMasuk (field lainnya tidak diubah)
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Gagal menyimpan stok')

      setIsEditModalOpen(false)
      setSelectedItem(null)
      fetchStok() 
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Derived Data & Calculations
  const calculatedStok = stokList.map(item => {
    const stokAwal = item.stokAwal || 0
    const barangMasuk = item.barangMasuk || 0
    const barangKeluar = item.barangKeluar || 0
    const sisaStok = stokAwal + barangMasuk - barangKeluar

    let status = 'aman'
    if (sisaStok <= 0) status = 'habis'
    else if (sisaStok <= 50) status = 'menipis'

    return { ...item, sisaStok, status }
  })

  const totalBarang = calculatedStok.length
  const stokAman = calculatedStok.filter((item) => item.status === 'aman').length
  const stokMenipis = calculatedStok.filter((item) => item.status === 'menipis').length
  const stokHabis = calculatedStok.filter((item) => item.status === 'habis').length

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

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-title mb-2">Stok Barang</h1>
        <p className="text-muted-foreground">Pantau sisa stok dan kelola penerimaan barang</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          title="Total Barang"
          value={totalBarang}
          icon={<Package className="w-6 h-6" />}
          backgroundColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <SummaryCard
          title="Stok Aman"
          value={stokAman}
          icon={<CheckCircle className="w-6 h-6" />}
          trend={totalBarang > 0 ? "up" : undefined}
          trendValue={totalBarang > 0 ? `${Math.round((stokAman / totalBarang) * 100)}%` : undefined}
          backgroundColor="bg-green-50"
          iconColor="text-green-600"
        />
        <SummaryCard
          title="Stok Menipis"
          value={stokMenipis}
          icon={<AlertTriangle className="w-6 h-6" />}
          backgroundColor="bg-yellow-50"
          iconColor="text-yellow-600"
        />
        <SummaryCard
          title="Stok Habis"
          value={stokHabis}
          icon={<TrendingDown className="w-6 h-6" />}
          backgroundColor="bg-red-50"
          iconColor="text-red-600"
        />
      </div>

      {/* Inventory Table */}
      <div className="dashboard-card overflow-hidden">
        <div className="flex justify-between items-center px-6 pt-6 mb-4">
          <h3 className="text-subtitle">Detail Inventori & Mutasi</h3>
        </div>
        
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full">
            <thead>
                  <tr className="border-b border-border bg-gray-50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground whitespace-nowrap w-28">Kode</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Nama Barang</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-foreground whitespace-nowrap">Barang Masuk</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-foreground whitespace-nowrap">Barang Keluar</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-foreground whitespace-nowrap">Sisa Stok</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-foreground w-24">Status</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-foreground w-24">Action</th>
                  </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                    <div className="flex justify-center items-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-2">Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : calculatedStok.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                    Belum ada barang di database
                  </td>
                </tr>
              ) : (
                calculatedStok.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-primary font-semibold whitespace-nowrap">{item.kode}</td>
                    <td className="px-6 py-4 text-sm text-foreground font-medium">{item.nama}</td>
                    <td className="px-6 py-4 text-sm text-green-600 text-center font-semibold">
                      +{(item.barangMasuk || 0)}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600 text-center font-semibold">
                      -{(item.barangKeluar || 0)}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground text-center font-bold text-lg">
                      {item.sisaStok}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="relative inline-block">
                        <button
                          onClick={() => toggleActionMenu(item._id)}
                          className="p-2 hover:bg-gray-200 rounded transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-600" />
                        </button>
  
                        {expandedRows.includes(item._id) && (
                          <div className="absolute right-8 top-0 mt-1 w-32 bg-card border border-border rounded-lg shadow-lg z-50">
                            <button 
                              onClick={() => openEditModal(item)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-gray-50 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                              Update Stok
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

            <form onSubmit={handleEditSubmit} className="p-5 space-y-5">
              <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm mb-4">
                <span className="block font-bold mb-1">{selectedItem.nama}</span>
                <span className="text-blue-600 text-xs">SKU: {selectedItem.kode}</span>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stok Saat Ini</label>
                <input
                  type="number"
                  disabled
                  value={(selectedItem as any).sisaStok || 0}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-gray-100 text-sm font-bold text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">Sisa stok terakhir di sistem</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tambah Barang Masuk (+)</label>
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
                <p className="text-xs text-gray-500 mt-1">Jumlah barang baru yang masuk (akan diakumulasi)</p>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
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
