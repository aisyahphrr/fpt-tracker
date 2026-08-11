'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { Plus, Search, Edit, Trash2, Receipt, X, Filter } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'

interface ProgresKwitansiItem {
  _id: string
  noQuo: string
  buyer: string
  status: 'Waiting' | 'Negotiation' | 'Terbit PO' | 'Price Deal' | 'Rejected'
  keterangan?: string
  createdAt?: string
}

export default function ProgresKwitansiPage() {
  const [list, setList] = useState<ProgresKwitansiItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('Semua Status')
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<'admin' | 'staff'>('admin')

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ProgresKwitansiItem | null>(null)
  const [itemToDelete, setItemToDelete] = useState<ProgresKwitansiItem | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Form State
  const [formData, setFormData] = useState({
    noQuo: '',
    buyer: '',
    status: 'Waiting' as ProgresKwitansiItem['status'],
    keterangan: '',
  })

  useEffect(() => {
    fetchProfile()
    fetchData()
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

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/progres-kwitansi')
      const data = await res.json()
      if (res.ok) {
        setList(data)
      } else {
        console.error('Failed to fetch:', data.message)
      }
    } catch (err) {
      console.error('Error fetching progres kwitansi:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Filtered List
  const filteredList = useMemo(() => {
    return list.filter((item) => {
      const matchesSearch =
        item.noQuo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.buyer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.keterangan && item.keterangan.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesStatus =
        selectedStatusFilter === 'Semua Status' || item.status === selectedStatusFilter

      return matchesSearch && matchesStatus
    })
  }, [list, searchQuery, selectedStatusFilter])

  // Open Add Modal (Admin Only)
  const handleOpenAddModal = () => {
    if (userRole !== 'admin') return
    setEditingItem(null)
    setFormData({
      noQuo: '',
      buyer: '',
      status: 'Waiting',
      keterangan: '',
    })
    setError('')
    setIsModalOpen(true)
  }

  // Open Edit Modal (Admin Only)
  const handleOpenEditModal = (item: ProgresKwitansiItem) => {
    if (userRole !== 'admin') return
    setEditingItem(item)
    setFormData({
      noQuo: item.noQuo,
      buyer: item.buyer,
      status: item.status,
      keterangan: item.keterangan || '',
    })
    setError('')
    setIsModalOpen(true)
  }

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (userRole !== 'admin') {
      setError('Akses ditolak. Hanya Admin Sales yang memiliki izin.')
      return
    }

    if (!formData.noQuo || !formData.buyer) {
      setError('No. Quo dan Buyer wajib diisi.')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      const url = editingItem ? `/api/progres-kwitansi/${editingItem._id}` : '/api/progres-kwitansi'
      const method = editingItem ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const resData = await res.json()

      if (res.ok) {
        setIsModalOpen(false)
        fetchData()
      } else {
        setError(resData.message || 'Gagal menyimpan data.')
      }
    } catch (err) {
      console.error('Error submitting form:', err)
      setError('Terjadi kesalahan koneksi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete Handler
  const handleDelete = async () => {
    if (!itemToDelete || userRole !== 'admin') return
    try {
      setIsSubmitting(true)
      const res = await fetch(`/api/progres-kwitansi/${itemToDelete._id}`, { method: 'DELETE' })
      if (res.ok) {
        setIsDeleteModalOpen(false)
        setItemToDelete(null)
        fetchData()
      } else {
        const data = await res.json()
        alert(data.message || 'Gagal menghapus data')
      }
    } catch (err) {
      console.error('Error deleting item:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: ProgresKwitansiItem['status']) => {
    switch (status) {
      case 'Waiting':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'Negotiation':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Terbit PO':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Price Deal':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Progres Kwitansi</h1>
            <p className="text-sm text-muted-foreground">
              Pelacakan status No. Quo, Buyer, dan progres negosiasi kwitansi
            </p>
          </div>
          {userRole !== 'admin' && (
            <span className="inline-flex items-center px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-semibold self-start sm:self-auto">
              Mode Lihat (Staff Sales)
            </span>
          )}
        </div>

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari No. Quo, Buyer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative w-full sm:w-56">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
              >
                <option value="Semua Status">Semua Status</option>
                <option value="Waiting">Waiting</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Terbit PO">Terbit PO</option>
                <option value="Price Deal">Price Deal</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Tombol Tambah (Admin Only) */}
          {userRole === 'admin' && (
            <button
              onClick={handleOpenAddModal}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all text-sm shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Progres Kwitansi</span>
            </button>
          )}
        </div>

        {/* Data Table */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                  <th className="p-4 font-semibold">No. Quo</th>
                  <th className="p-4 font-semibold">Buyer</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Keterangan</th>
                  {userRole === 'admin' && <th className="p-4 font-semibold text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={userRole === 'admin' ? 5 : 4} className="p-8 text-center text-muted-foreground">
                      Memuat data progres kwitansi...
                    </td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={userRole === 'admin' ? 5 : 4} className="p-8 text-center text-muted-foreground">
                      Belum ada data progres kwitansi.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item) => (
                    <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-semibold text-primary">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                          {item.noQuo}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-foreground">{item.buyer}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground text-xs">
                        {item.keterangan || '-'}
                      </td>
                      {userRole === 'admin' && (
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setItemToDelete(item)
                                setIsDeleteModalOpen(true)
                              }}
                              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Add / Edit */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold text-foreground">
                    {editingItem ? 'Edit Progres Kwitansi' : 'Tambah Progres Kwitansi'}
                  </h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="p-3 text-xs bg-red-50 text-red-600 rounded-lg border border-red-200 font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* No. Quo */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    No. Quo <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.noQuo}
                    onChange={(e) => setFormData({ ...formData, noQuo: e.target.value })}
                    placeholder="Isi No. Quo manual..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>

                {/* Buyer */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Buyer <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.buyer}
                    onChange={(e) => setFormData({ ...formData, buyer: e.target.value })}
                    placeholder="Nama Buyer..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Status <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                  >
                    <option value="Waiting">Waiting</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Terbit PO">Terbit PO</option>
                    <option value="Price Deal">Price Deal</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                {/* Keterangan */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Keterangan (Opsional)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.keterangan}
                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    placeholder="Catatan atau keterangan tambahan..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Delete Confirmation */}
        {isDeleteModalOpen && itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-foreground">Hapus Progres Kwitansi?</h3>
              <p className="text-sm text-muted-foreground">
                Apakah Anda yakin ingin menghapus data dengan No. Quo <strong>{itemToDelete.noQuo}</strong> ({itemToDelete.buyer})? Data yang dihapus tidak dapat dikembalikan.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-semibold bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-all shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Menghapus...' : 'Hapus Data'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
