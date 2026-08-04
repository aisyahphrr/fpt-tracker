'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { Plus, Search, Edit, Trash2, Layers, ExternalLink, Image as ImageIcon, Video, FileText, Upload, Eye, Download, CheckCircle, X } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'

interface SumberItem {
  _id?: string
  namaSumber: string
  harga: number
  size: string
  spesifikasi: string
}

interface BahanBakuItem {
  _id: string
  noRequest: string
  barang: string
  qty: number
  sumber: SumberItem[]
  filePerhitungan?: string
  linkFotoGdrive: string
  linkVideoGdrive: string
  createdAt?: string
}

interface PermintaanSimple {
  _id: string
  noRequest: string
  buyer: string
}

export default function BahanBakuPage() {
  const [bahanBakuList, setBahanBakuList] = useState<BahanBakuItem[]>([])
  const [permintaanOptions, setPermintaanOptions] = useState<PermintaanSimple[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNoRequestFilter, setSelectedNoRequestFilter] = useState('Semua No. Permintaan')
  const [isLoading, setIsLoading] = useState(true)

  // User Role State (default 'staff' to be safe)
  const [userRole, setUserRole] = useState<'admin' | 'staff'>('staff')

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null)

  const [editingItem, setEditingItem] = useState<BahanBakuItem | null>(null)
  const [itemToDelete, setItemToDelete] = useState<BahanBakuItem | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('')

  // Form State
  const [formData, setFormData] = useState({
    noRequest: '',
    barang: '',
    qty: 1,
    sumber: [] as SumberItem[],
    filePerhitungan: '',
    linkFotoGdrive: '',
    linkVideoGdrive: '',
  })

  useEffect(() => {
    fetchProfile()
    fetchBahanBaku()
    fetchPermintaanOptions()
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

  const fetchBahanBaku = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/bahan-baku')
      const data = await res.json()
      if (res.ok) {
        setBahanBakuList(data)
      } else {
        console.error('Failed to fetch bahan baku:', data.message)
      }
    } catch (err) {
      console.error('Error fetching bahan baku:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPermintaanOptions = async () => {
    try {
      const res = await fetch('/api/permintaan')
      if (res.ok) {
        const data = await res.json()
        setPermintaanOptions(data)
      }
    } catch (err) {
      console.error('Error fetching permintaan options:', err)
    }
  }

  const getFileName = (url: string) => {
    if (!url) return ''
    const parts = url.split('/')
    const rawName = parts[parts.length - 1]
    return rawName.replace(/^\d+-/, '')
  }

  // Unique list of No. Request for filter dropdown
  const uniqueNoRequests = useMemo(() => {
    const requests = Array.from(new Set(bahanBakuList.map((item) => item.noRequest)))
    return ['Semua No. Permintaan', ...requests]
  }, [bahanBakuList])

  // Filtered List
  const filteredList = useMemo(() => {
    return bahanBakuList.filter((item) => {
      const matchesSearch =
        item.noRequest.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.barang.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sumber.some((s) => s.namaSumber.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesFilter =
        selectedNoRequestFilter === 'Semua No. Permintaan' || item.noRequest === selectedNoRequestFilter

      return matchesSearch && matchesFilter
    })
  }, [bahanBakuList, searchQuery, selectedNoRequestFilter])

  // Handle open Add Modal (Admin Only)
  const handleOpenAddModal = () => {
    if (userRole !== 'admin') return
    setEditingItem(null)
    setFormData({
      noRequest: permintaanOptions[0]?.noRequest || '',
      barang: '',
      qty: 1,
      sumber: [
        {
          namaSumber: '',
          harga: 0,
          size: '',
          spesifikasi: '',
        },
      ],
      filePerhitungan: '',
      linkFotoGdrive: '',
      linkVideoGdrive: '',
    })
    setError('')
    setUploadSuccessMsg('')
    setIsModalOpen(true)
  }

  // Handle open Edit Modal (Admin Only)
  const handleOpenEditModal = (item: BahanBakuItem) => {
    if (userRole !== 'admin') return
    setEditingItem(item)
    setFormData({
      noRequest: item.noRequest,
      barang: item.barang,
      qty: item.qty,
      sumber: item.sumber && item.sumber.length > 0 ? item.sumber : [{ namaSumber: '', harga: 0, size: '', spesifikasi: '' }],
      filePerhitungan: item.filePerhitungan || '',
      linkFotoGdrive: item.linkFotoGdrive || '',
      linkVideoGdrive: item.linkVideoGdrive || '',
    })
    setError('')
    setUploadSuccessMsg('')
    setIsModalOpen(true)
  }

  // File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      setUploadSuccessMsg('')
      const data = new FormData()
      data.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      })

      const result = await res.json()
      if (res.ok) {
        setFormData((prev) => ({ ...prev, filePerhitungan: result.fileUrl }))
        setUploadSuccessMsg(`File "${result.fileName}" berhasil diunggah! Klik "Simpan Data" untuk menyimpan ke database.`)
      } else {
        alert(result.message || 'Gagal mengunggah file')
      }
    } catch (err) {
      console.error('Error uploading file:', err)
      alert('Terjadi kesalahan saat mengunggah file')
    } finally {
      setIsUploading(false)
    }
  }

  // Sumber Management in Form
  const handleAddSumber = () => {
    setFormData((prev) => ({
      ...prev,
      sumber: [...prev.sumber, { namaSumber: '', harga: 0, size: '', spesifikasi: '' }],
    }))
  }

  const handleRemoveSumber = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      sumber: prev.sumber.filter((_, i) => i !== index),
    }))
  }

  const handleSumberChange = (index: number, field: keyof SumberItem, value: any) => {
    setFormData((prev) => {
      const updatedSumber = [...prev.sumber]
      updatedSumber[index] = { ...updatedSumber[index], [field]: value }
      return { ...prev, sumber: updatedSumber }
    })
  }

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (userRole !== 'admin') {
      setError('Akses ditolak. Hanya Admin Sales yang memiliki izin.')
      return
    }

    if (!formData.noRequest || !formData.barang) {
      setError('No. Permintaan dan Nama Barang wajib diisi.')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      const payload = {
        noRequest: formData.noRequest,
        barang: formData.barang,
        qty: Number(formData.qty) || 1,
        sumber: formData.sumber,
        filePerhitungan: formData.filePerhitungan,
        linkFotoGdrive: formData.linkFotoGdrive,
        linkVideoGdrive: formData.linkVideoGdrive,
      }

      const url = editingItem ? `/api/bahan-baku/${editingItem._id}` : '/api/bahan-baku'
      const method = editingItem ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const resData = await res.json()

      if (res.ok) {
        setIsModalOpen(false)
        fetchBahanBaku()
      } else {
        setError(resData.message || 'Gagal menyimpan data bahan baku.')
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
      const res = await fetch(`/api/bahan-baku/${itemToDelete._id}`, { method: 'DELETE' })
      if (res.ok) {
        setIsDeleteModalOpen(false)
        setItemToDelete(null)
        fetchBahanBaku()
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

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Bahan Baku</h1>
            <p className="text-sm text-muted-foreground">
              Manajemen detail sumber, spesifikasi, media, dan file perhitungan per Permintaan Buyer
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
                placeholder="Cari No. Request, barang, sumber..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Filter Dropdown */}
            <select
              value={selectedNoRequestFilter}
              onChange={(e) => setSelectedNoRequestFilter(e.target.value)}
              className="w-full sm:w-56 py-2 px-3 text-sm rounded-lg border border-input bg-background font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {uniqueNoRequests.map((noReq) => (
                <option key={noReq} value={noReq}>
                  {noReq}
                </option>
              ))}
            </select>
          </div>

          {/* Tombol Tambah Hanya untuk Admin */}
          {userRole === 'admin' && (
            <button
              onClick={handleOpenAddModal}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all text-sm shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Data Bahan Baku</span>
            </button>
          )}
        </div>

        {/* Data Table */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                  <th className="p-4 font-semibold">No. Permintaan</th>
                  <th className="p-4 font-semibold">Barang</th>
                  <th className="p-4 font-semibold">Qty</th>
                  <th className="p-4 font-semibold">Sumber & Spesifikasi</th>
                  <th className="p-4 font-semibold">Media (GDrive)</th>
                  <th className="p-4 font-semibold">File Perhitungan</th>
                  {userRole === 'admin' && <th className="p-4 font-semibold text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={userRole === 'admin' ? 7 : 6} className="p-8 text-center text-muted-foreground">
                      Memuat data bahan baku...
                    </td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={userRole === 'admin' ? 7 : 6} className="p-8 text-center text-muted-foreground">
                      Belum ada data bahan baku.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item) => (
                    <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-semibold text-primary">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                          {item.noRequest}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-foreground">{item.barang}</td>
                      <td className="p-4 text-foreground font-semibold">{item.qty}</td>
                      <td className="p-4">
                        {item.sumber && item.sumber.length > 0 ? (
                          <div className="space-y-2">
                            {item.sumber.map((s, idx) => (
                              <div key={idx} className="p-2.5 bg-background rounded-lg border border-border text-xs space-y-1">
                                <div className="flex items-center justify-between font-semibold text-foreground">
                                  <span>{s.namaSumber || `Sumber ${idx + 1}`}</span>
                                  <span className="text-emerald-600 font-bold">{formatRupiah(s.harga || 0)}</span>
                                </div>
                                {s.size && (
                                  <div>
                                    <span className="text-muted-foreground">Size: </span>
                                    <span className="font-medium text-foreground">{s.size}</span>
                                  </div>
                                )}
                                {s.spesifikasi && (
                                  <div className="text-muted-foreground italic truncate max-w-xs">
                                    Spec: {s.spesifikasi}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Belum ada rincian sumber</span>
                        )}
                      </td>
                      <td className="p-4 space-y-2">
                        {item.linkFotoGdrive ? (
                          <a
                            href={item.linkFotoGdrive}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-md text-xs font-medium transition-colors"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>Foto GDrive</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : null}
                        {item.linkVideoGdrive ? (
                          <div>
                            <a
                              href={item.linkVideoGdrive}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-md text-xs font-medium transition-colors"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Video GDrive</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ) : null}
                        {!item.linkFotoGdrive && !item.linkVideoGdrive && (
                          <span className="text-xs text-muted-foreground italic">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        {item.filePerhitungan ? (
                          <div className="flex flex-col gap-1.5 items-start">
                            <span className="text-xs font-medium text-foreground truncate max-w-[180px]" title={getFileName(item.filePerhitungan)}>
                              📄 {getFileName(item.filePerhitungan)}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setPreviewFile({ url: item.filePerhitungan!, name: getFileName(item.filePerhitungan!) })}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-md text-xs font-semibold transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-600" />
                                <span>Preview</span>
                              </button>
                              <a
                                href={item.filePerhitungan}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-md text-xs font-semibold transition-colors"
                              >
                                <Download className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Unduh</span>
                              </a>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Belum ada file</span>
                        )}
                      </td>

                      {/* Kolom Aksi Hanya untuk Admin */}
                      {userRole === 'admin' && (
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
                              title="Edit / Upload File"
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

        {/* Modal Add / Edit (Admin Only) */}
        {isModalOpen && userRole === 'admin' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-card w-full max-w-2xl rounded-2xl border border-border shadow-xl p-6 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold text-foreground">
                    {editingItem ? 'Edit Data Bahan Baku' : 'Tambah Data Bahan Baku'}
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

              {uploadSuccessMsg && (
                <div className="p-3 text-xs bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{uploadSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* No Request */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      No. Permintaan <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.noRequest}
                      onChange={(e) => setFormData({ ...formData, noRequest: e.target.value })}
                      placeholder="Contoh: REQ-2026-001"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>

                  {/* Barang */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Nama Barang <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.barang}
                      onChange={(e) => setFormData({ ...formData, barang: e.target.value })}
                      placeholder="Nama Barang"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>

                  {/* Qty */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Qty Barang</label>
                    <input
                      type="number"
                      min={1}
                      value={formData.qty}
                      onChange={(e) => setFormData({ ...formData, qty: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Sumber Section (Multi-sumber) */}
                <div className="space-y-3 border-t border-border pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Rincian Sumber / Vendor</h3>
                      <p className="text-xs text-muted-foreground">1 barang bisa memiliki lebih dari 1 sumber supplier</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSumber}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-blue-50 text-primary border border-blue-200 font-semibold rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Sumber</span>
                    </button>
                  </div>

                  {formData.sumber.map((s, idx) => (
                    <div key={idx} className="p-4 bg-muted/30 rounded-xl border border-border space-y-3 relative">
                      <div className="flex items-center justify-between border-b border-border/50 pb-2">
                        <span className="text-xs font-bold text-foreground">Sumber #{idx + 1}</span>
                        {formData.sumber.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSumber(idx)}
                            className="text-xs text-destructive hover:underline font-medium"
                          >
                            Hapus Sumber
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-muted-foreground mb-1">Nama Sumber / Supplier</label>
                          <input
                            type="text"
                            placeholder="Supplier A / Toko B"
                            value={s.namaSumber}
                            onChange={(e) => handleSumberChange(idx, 'namaSumber', e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-muted-foreground mb-1">Harga per Sumber (Rp)</label>
                          <input
                            type="number"
                            placeholder="0"
                            value={s.harga}
                            onChange={(e) => handleSumberChange(idx, 'harga', Number(e.target.value))}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-muted-foreground mb-1">Size per Sumber</label>
                          <input
                            type="text"
                            placeholder="Contoh: S, M, L, XL"
                            value={s.size}
                            onChange={(e) => handleSumberChange(idx, 'size', e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-muted-foreground mb-1">Spesifikasi per Sumber</label>
                          <input
                            type="text"
                            placeholder="Catatan spesifikasi..."
                            value={s.spesifikasi}
                            onChange={(e) => handleSumberChange(idx, 'spesifikasi', e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Media Links Section */}
                <div className="space-y-3 border-t border-border pt-4">
                  <h3 className="text-sm font-bold text-foreground">Media (Google Drive Links)</h3>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Link GDrive Foto Product</label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={formData.linkFotoGdrive}
                      onChange={(e) => setFormData({ ...formData, linkFotoGdrive: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Link GDrive Video Product</label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={formData.linkVideoGdrive}
                      onChange={(e) => setFormData({ ...formData, linkVideoGdrive: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Upload File Perhitungan Section (Placed BELOW Media Section) */}
                <div className="space-y-3 border-t border-border pt-4">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span>Upload File Perhitungan Bahan Baku (Excel, Word, PDF)</span>
                  </h3>
                  <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Pilih file dengan format <strong>.xlsx, .xls, .doc, .docx, atau .pdf</strong>. Jangan lupa klik <strong>"Simpan Data"</strong> di bawah setelah file terunggah.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 text-xs shadow-sm transition-all">
                        <Upload className="w-4 h-4" />
                        <span>{isUploading ? 'Mengunggah File...' : 'Pilih File (Excel/Word/PDF)'}</span>
                        <input
                          type="file"
                          accept=".xlsx,.xls,.doc,.docx,.pdf"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                          className="hidden"
                        />
                      </label>

                      {formData.filePerhitungan && (
                        <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                          <FileText className="w-4 h-4" />
                          <span className="truncate max-w-xs">{formData.filePerhitungan}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-[11px] text-muted-foreground">
                      Atau tempelkan URL / link file eksternal jika ada:
                      <input
                        type="text"
                        placeholder="https://... atau /uploads/..."
                        value={formData.filePerhitungan}
                        onChange={(e) => setFormData({ ...formData, filePerhitungan: e.target.value })}
                        className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
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
                    disabled={isSubmitting || isUploading}
                    className="px-5 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* File Preview Modal (Available for all roles) */}
        {previewFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-card w-full max-w-4xl rounded-2xl border border-border shadow-2xl p-6 space-y-4 max-h-[95vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                  <h3 className="font-bold text-foreground text-base truncate">{previewFile.name}</h3>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={previewFile.url}
                    download
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh File</span>
                  </a>
                  <button
                    onClick={() => setPreviewFile(null)}
                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-[60vh] bg-muted/20 rounded-xl overflow-hidden flex items-center justify-center p-2">
                {previewFile.url.includes('drive.google.com') ? (
                  <iframe 
                    src={(() => {
                      const url = previewFile.url
                      const matchD = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
                      const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
                      const fileId = matchD ? matchD[1] : matchId ? matchId[1] : ''
                      if (fileId) return `https://drive.google.com/file/d/${fileId}/preview`
                      return url
                    })()} 
                    className="w-full h-full min-h-[60vh] border-0 rounded-lg" 
                  />
                ) : previewFile.url.toLowerCase().endsWith('.pdf') ? (
                  <iframe src={previewFile.url} className="w-full h-full min-h-[60vh] border-0 rounded-lg" />
                ) : previewFile.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img src={previewFile.url} alt="Preview" className="max-h-[70vh] object-contain rounded-lg" />
                ) : (
                  <div className="text-center p-8 space-y-4">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-bold text-foreground">Dokumen ({previewFile.name.split('.').pop()?.toUpperCase()})</p>
                      <p className="text-xs text-muted-foreground">Preview langsung dalam browser mendukung format PDF & Gambar.</p>
                      <p className="text-xs text-muted-foreground">Untuk file Excel / Word, silakan klik tombol unduh atau buka dokumen di bawah.</p>
                    </div>
                    <a
                      href={previewFile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 shadow-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Buka / Unduh Dokumen ({previewFile.name})</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal (Admin Only) */}
        {isDeleteModalOpen && itemToDelete && userRole === 'admin' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-foreground">Hapus Data Bahan Baku?</h3>
              <p className="text-sm text-muted-foreground">
                Apakah Anda yakin ingin menghapus bahan baku untuk barang <strong>{itemToDelete.barang}</strong> ({itemToDelete.noRequest})?
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-semibold bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-all"
                >
                  {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
