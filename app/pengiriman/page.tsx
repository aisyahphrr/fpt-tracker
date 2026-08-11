'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { Plus, Search, Edit, Trash2, Truck, X, Filter, Upload, FileText, CheckCircle, ExternalLink, Eye } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'

interface DokumenMap {
  invoice?: string
  awb?: string
  suratJalan?: string
  tellySheet?: string
  fotoProduct?: string
  tandaTerima?: string
}

interface PengirimanItem {
  _id: string
  buyer: string
  noPo: string
  dokumen: DokumenMap
  status: 'Pemuatan Ikan' | 'Pengiriman' | 'Diterima' | 'Reject'
  keterangan?: string
  createdAt?: string
}

const DOCUMENT_TYPES = [
  { key: 'invoice', label: 'Invoice' },
  { key: 'awb', label: 'AWB' },
  { key: 'suratJalan', label: 'Surat Jalan' },
  { key: 'tellySheet', label: 'Telly Sheet' },
  { key: 'fotoProduct', label: 'Foto Product' },
  { key: 'tandaTerima', label: 'Tanda Terima' },
] as const

export default function PengirimanPage() {
  const [list, setList] = useState<PengirimanItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('Semua Status')
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<'admin' | 'staff'>('admin')

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PengirimanItem | null>(null)
  const [itemToDelete, setItemToDelete] = useState<PengirimanItem | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [uploadSuccessMsgs, setUploadSuccessMsgs] = useState<Record<string, string>>({})

  // Form State
  const [formData, setFormData] = useState({
    buyer: '',
    noPo: '',
    dokumen: {
      invoice: '',
      awb: '',
      suratJalan: '',
      tellySheet: '',
      fotoProduct: '',
      tandaTerima: '',
    } as DokumenMap,
    status: 'Pemuatan Ikan' as PengirimanItem['status'],
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
      const res = await fetch('/api/pengiriman')
      const data = await res.json()
      if (res.ok) {
        setList(data)
      } else {
        console.error('Failed to fetch:', data.message)
      }
    } catch (err) {
      console.error('Error fetching pengiriman:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Filtered List
  const filteredList = useMemo(() => {
    return list.filter((item) => {
      const matchesSearch =
        item.buyer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.noPo.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
      buyer: '',
      noPo: '',
      dokumen: {
        invoice: '',
        awb: '',
        suratJalan: '',
        tellySheet: '',
        fotoProduct: '',
        tandaTerima: '',
      },
      status: 'Pemuatan Ikan',
      keterangan: '',
    })
    setError('')
    setUploadSuccessMsgs({})
    setIsModalOpen(true)
  }

  // Open Edit Modal (Admin Only)
  const handleOpenEditModal = (item: PengirimanItem) => {
    if (userRole !== 'admin') return
    setEditingItem(item)
    setFormData({
      buyer: item.buyer,
      noPo: item.noPo,
      dokumen: {
        invoice: item.dokumen?.invoice || '',
        awb: item.dokumen?.awb || '',
        suratJalan: item.dokumen?.suratJalan || '',
        tellySheet: item.dokumen?.tellySheet || '',
        fotoProduct: item.dokumen?.fotoProduct || '',
        tandaTerima: item.dokumen?.tandaTerima || '',
      },
      status: item.status,
      keterangan: item.keterangan || '',
    })
    setError('')
    setUploadSuccessMsgs({})
    setIsModalOpen(true)
  }

  // Handle Document Upload (Each uploaded to Google Drive via /api/upload)
  const handleSingleDocUpload = async (docKey: keyof DokumenMap, e: React.ChangeEvent<HTMLInputElement>) => {
    if (userRole !== 'admin') return
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingDocKey(docKey)
      const data = new FormData()
      data.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      })

      const result = await res.json()
      if (res.ok && result.fileUrl) {
        setFormData((prev) => ({
          ...prev,
          dokumen: {
            ...prev.dokumen,
            [docKey]: result.fileUrl,
          },
        }))
        setUploadSuccessMsgs((prev) => ({
          ...prev,
          [docKey]: `Berhasil mengunggah ${file.name} ke Google Drive!`,
        }))
      } else {
        alert(result.message || 'Gagal mengunggah file')
      }
    } catch (err) {
      console.error('Error uploading document:', err)
      alert('Terjadi kesalahan saat mengunggah file.')
    } finally {
      setUploadingDocKey(null)
    }
  }

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (userRole !== 'admin') {
      setError('Akses ditolak. Hanya Admin Sales yang memiliki izin.')
      return
    }

    if (!formData.buyer || !formData.noPo) {
      setError('Buyer dan No. PO wajib diisi.')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      const url = editingItem ? `/api/pengiriman/${editingItem._id}` : '/api/pengiriman'
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
        setError(resData.message || 'Gagal menyimpan data pengiriman.')
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
      const res = await fetch(`/api/pengiriman/${itemToDelete._id}`, { method: 'DELETE' })
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

  const getStatusBadge = (status: PengirimanItem['status']) => {
    switch (status) {
      case 'Pemuatan Ikan':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Pengiriman':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'Diterima':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'Reject':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const countUploadedDocs = (dokumen: DokumenMap = {}) => {
    return DOCUMENT_TYPES.filter((d) => Boolean(dokumen[d.key as keyof DokumenMap])).length
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Pengiriman</h1>
            <p className="text-sm text-muted-foreground">
              Manajemen status pengiriman & upload dokumen per PO ke Google Drive
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
                placeholder="Cari Buyer, No. PO..."
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
                <option value="Pemuatan Ikan">Pemuatan Ikan</option>
                <option value="Pengiriman">Pengiriman</option>
                <option value="Diterima">Diterima</option>
                <option value="Reject">Reject</option>
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
              <span>Tambah Data Pengiriman</span>
            </button>
          )}
        </div>

        {/* Data Table */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                  <th className="p-4 font-semibold">Buyer</th>
                  <th className="p-4 font-semibold">No. PO</th>
                  <th className="p-4 font-semibold">Dokumen Unggahan</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Keterangan</th>
                  {userRole === 'admin' && <th className="p-4 font-semibold text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={userRole === 'admin' ? 6 : 5} className="p-8 text-center text-muted-foreground">
                      Memuat data pengiriman...
                    </td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={userRole === 'admin' ? 6 : 5} className="p-8 text-center text-muted-foreground">
                      Belum ada data pengiriman.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item) => {
                    const uploadedCount = countUploadedDocs(item.dokumen)
                    return (
                      <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4 font-semibold text-foreground">{item.buyer}</td>
                        <td className="p-4 font-semibold text-primary">
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                            {item.noPo}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap items-center gap-1.5 max-w-md">
                            {DOCUMENT_TYPES.map((doc) => {
                              const fileUrl = item.dokumen?.[doc.key as keyof DokumenMap]
                              if (!fileUrl) return null
                              return (
                                <a
                                  key={doc.key}
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded text-[11px] font-semibold transition-colors"
                                  title={`Lihat file ${doc.label} di GDrive`}
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>{doc.label}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )
                            })}
                            {uploadedCount === 0 && (
                              <span className="text-xs text-muted-foreground italic">Belum ada dokumen diunggah</span>
                            )}
                          </div>
                        </td>
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
                                title="Edit / Upload Dokumen"
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
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Add / Edit */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-card w-full max-w-3xl rounded-2xl border border-border shadow-xl p-6 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold text-foreground">
                    {editingItem ? 'Edit Data Pengiriman' : 'Tambah Data Pengiriman'}
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

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                  {/* No. PO */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      No. PO <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.noPo}
                      onChange={(e) => setFormData({ ...formData, noPo: e.target.value })}
                      placeholder="Isi No. PO manual..."
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>

                {/* Status & Keterangan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Status Pengiriman <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                    >
                      <option value="Pemuatan Ikan">Pemuatan Ikan</option>
                      <option value="Pengiriman">Pengiriman</option>
                      <option value="Diterima">Diterima</option>
                      <option value="Reject">Reject</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Keterangan (Opsional)
                    </label>
                    <input
                      type="text"
                      value={formData.keterangan}
                      onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                      placeholder="Catatan pengiriman..."
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Upload Dokumen Section (Individual files upload directly to Google Drive) */}
                <div className="space-y-3 border-t border-border pt-4">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Upload Dokumen</h3>
                    <p className="text-xs text-muted-foreground">
                      Setiap dokumen diunggah secara terpisah langsung ke Google Drive.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {DOCUMENT_TYPES.map((doc) => {
                      const fileUrl = formData.dokumen[doc.key as keyof DokumenMap]
                      const isUploadingThis = uploadingDocKey === doc.key
                      const successMsg = uploadSuccessMsgs[doc.key]

                      return (
                        <div key={doc.key} className="p-3 bg-muted/30 rounded-xl border border-border space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground">{doc.label}</span>
                            {fileUrl ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                Terunggah
                              </span>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">Belum ada</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 rounded-lg text-xs font-semibold transition-colors shrink-0">
                              <Upload className="w-3.5 h-3.5" />
                              <span>{isUploadingThis ? 'Uploading...' : 'Pilih File'}</span>
                              <input
                                type="file"
                                onChange={(e) => handleSingleDocUpload(doc.key as keyof DokumenMap, e)}
                                disabled={isUploadingThis}
                                className="hidden"
                              />
                            </label>

                            {fileUrl ? (
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium truncate"
                                title="Lihat di GDrive"
                              >
                                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">GDrive File</span>
                              </a>
                            ) : null}
                          </div>

                          {successMsg && (
                            <p className="text-[10px] text-emerald-600 font-semibold">{successMsg}</p>
                          )}

                          {/* Direct URL input fallback */}
                          <input
                            type="text"
                            placeholder="Atau tempel link GDrive..."
                            value={fileUrl || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              dokumen: {
                                ...formData.dokumen,
                                [doc.key]: e.target.value,
                              },
                            })}
                            className="w-full px-2.5 py-1 text-[11px] rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary/20"
                          />
                        </div>
                      )
                    })}
                  </div>
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
                    disabled={isSubmitting || uploadingDocKey !== null}
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
              <h3 className="text-lg font-bold text-foreground">Hapus Data Pengiriman?</h3>
              <p className="text-sm text-muted-foreground">
                Apakah Anda yakin ingin menghapus data pengiriman PO <strong>{itemToDelete.noPo}</strong> ({itemToDelete.buyer})? Data yang dihapus tidak dapat dikembalikan.
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
