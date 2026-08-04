'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { Plus, Search, Edit, Trash2, Calculator, ExternalLink, FileText, Truck, Upload, Eye, Download, CheckCircle, X } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'

interface StrukturBiayaItem {
  _id: string
  noRequest: string
  buyer: string
  logistik: string
  filePerhitungan: string
  catatan?: string
  createdAt?: string
}

interface PermintaanSimple {
  _id: string
  noRequest: string
  buyer: string
}

export default function StrukturBiayaPage() {
  const [biayaList, setBiayaList] = useState<StrukturBiayaItem[]>([])
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

  const [editingItem, setEditingItem] = useState<StrukturBiayaItem | null>(null)
  const [itemToDelete, setItemToDelete] = useState<StrukturBiayaItem | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('')

  // Form State
  const [formData, setFormData] = useState({
    noRequest: '',
    buyer: '',
    logistik: '',
    filePerhitungan: '',
    catatan: '',
  })

  useEffect(() => {
    fetchProfile()
    fetchStrukturBiaya()
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

  const fetchStrukturBiaya = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/struktur-biaya')
      const data = await res.json()
      if (res.ok) {
        setBiayaList(data)
      } else {
        console.error('Failed to fetch struktur biaya:', data.message)
      }
    } catch (err) {
      console.error('Error fetching struktur biaya:', err)
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

  // Filter dropdown options
  const uniqueNoRequests = useMemo(() => {
    const requests = Array.from(new Set(biayaList.map((item) => item.noRequest)))
    return ['Semua No. Permintaan', ...requests]
  }, [biayaList])

  // Filtered List
  const filteredList = useMemo(() => {
    return biayaList.filter((item) => {
      const matchesSearch =
        item.noRequest.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.buyer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.logistik.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesFilter =
        selectedNoRequestFilter === 'Semua No. Permintaan' || item.noRequest === selectedNoRequestFilter

      return matchesSearch && matchesFilter
    })
  }, [biayaList, searchQuery, selectedNoRequestFilter])

  // Handle open Add Modal (Admin Only)
  const handleOpenAddModal = () => {
    if (userRole !== 'admin') return
    setEditingItem(null)
    const firstReq = permintaanOptions[0]
    setFormData({
      noRequest: firstReq?.noRequest || '',
      buyer: firstReq?.buyer || '',
      logistik: '',
      filePerhitungan: '',
      catatan: '',
    })
    setError('')
    setUploadSuccessMsg('')
    setIsModalOpen(true)
  }

  // Handle open Edit Modal (Admin Only)
  const handleOpenEditModal = (item: StrukturBiayaItem) => {
    if (userRole !== 'admin') return
    setEditingItem(item)
    setFormData({
      noRequest: item.noRequest,
      buyer: item.buyer,
      logistik: item.logistik || '',
      filePerhitungan: item.filePerhitungan || '',
      catatan: item.catatan || '',
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

  // Auto-fill buyer when noRequest selected from dropdown
  const handleNoRequestChange = (noReq: string) => {
    const matchedPermintaan = permintaanOptions.find((p) => p.noRequest === noReq)
    setFormData((prev) => ({
      ...prev,
      noRequest: noReq,
      buyer: matchedPermintaan ? matchedPermintaan.buyer : prev.buyer,
    }))
  }

  // Submit Handler (Admin Only)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (userRole !== 'admin') {
      setError('Akses ditolak. Hanya Admin Sales yang memiliki izin.')
      return
    }

    if (!formData.noRequest || !formData.buyer) {
      setError('No. Permintaan dan Buyer wajib diisi.')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      const url = editingItem ? `/api/struktur-biaya/${editingItem._id}` : '/api/struktur-biaya'
      const method = editingItem ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const resData = await res.json()

      if (res.ok) {
        setIsModalOpen(false)
        fetchStrukturBiaya()
      } else {
        setError(resData.message || 'Gagal menyimpan data struktur biaya.')
      }
    } catch (err) {
      console.error('Error submitting form:', err)
      setError('Terjadi kesalahan koneksi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete Handler (Admin Only)
  const handleDelete = async () => {
    if (!itemToDelete || userRole !== 'admin') return
    try {
      setIsSubmitting(true)
      const res = await fetch(`/api/struktur-biaya/${itemToDelete._id}`, { method: 'DELETE' })
      if (res.ok) {
        setIsDeleteModalOpen(false)
        setItemToDelete(null)
        fetchStrukturBiaya()
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

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Struktur Biaya</h1>
            <p className="text-sm text-muted-foreground">Pengelolaan data logistik dan dokumen perhitungan struktur biaya per Permintaan Buyer</p>
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
                placeholder="Cari No. Request, buyer, logistik..."
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
              <span>Tambah Struktur Biaya</span>
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
                  <th className="p-4 font-semibold">Buyer</th>
                  <th className="p-4 font-semibold">Logistik (Kurir)</th>
                  <th className="p-4 font-semibold">Dokumen Perhitungan Biaya</th>
                  <th className="p-4 font-semibold">Catatan</th>
                  {userRole === 'admin' && <th className="p-4 font-semibold text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={userRole === 'admin' ? 6 : 5} className="p-8 text-center text-muted-foreground">
                      Memuat data struktur biaya...
                    </td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={userRole === 'admin' ? 6 : 5} className="p-8 text-center text-muted-foreground">
                      Belum ada data struktur biaya.
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
                      <td className="p-4 font-semibold text-foreground">{item.buyer}</td>
                      <td className="p-4">
                        {item.logistik ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 rounded-md border border-amber-200 text-xs font-semibold">
                            <Truck className="w-3.5 h-3.5" />
                            <span>{item.logistik}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Belum diisi</span>
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
                                onClick={() => setPreviewFile({ url: item.filePerhitungan, name: getFileName(item.filePerhitungan) })}
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
                          <span className="text-xs text-muted-foreground italic">Belum diunggah</span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-muted-foreground max-w-xs truncate">
                        {item.catatan || '-'}
                      </td>

                      {/* Kolom Aksi Hanya untuk Admin */}
                      {userRole === 'admin' && (
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
                              title="Edit / Upload Document"
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
            <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-xl p-6 space-y-6 my-8">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold text-foreground">
                    {editingItem ? 'Edit Struktur Biaya' : 'Tambah Struktur Biaya'}
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

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* No Request */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    No. Permintaan <span className="text-destructive">*</span>
                  </label>
                  {permintaanOptions.length > 0 ? (
                    <select
                      value={formData.noRequest}
                      onChange={(e) => handleNoRequestChange(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                      required
                    >
                      <option value="" disabled>-- Pilih No. Permintaan --</option>
                      {permintaanOptions.map((p) => (
                        <option key={p._id} value={p.noRequest}>
                          {p.noRequest} ({p.buyer})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.noRequest}
                      onChange={(e) => setFormData({ ...formData, noRequest: e.target.value })}
                      placeholder="Contoh: REQ-2026-001"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  )}
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
                    placeholder="Nama Buyer / Perusahaan"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>

                {/* Logistik */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Logistik (Kurir / Ekspedisi)
                  </label>
                  <input
                    type="text"
                    value={formData.logistik}
                    onChange={(e) => setFormData({ ...formData, logistik: e.target.value })}
                    placeholder="Contoh: JNE Cargo, DHL Express, Ekspedisi Lokal, dll"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* File / Link Perhitungan */}
                <div className="space-y-2 border-t border-border pt-3">
                  <label className="block text-xs font-semibold text-foreground">
                    Upload File Perhitungan (Excel, Word, PDF)
                  </label>

                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2">
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 text-xs shadow-sm transition-all">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploading ? 'Mengunggah...' : 'Pilih File (Excel/Word/PDF)'}</span>
                        <input
                          type="file"
                          accept=".xlsx,.xls,.doc,.docx,.pdf"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                          className="hidden"
                        />
                      </label>

                      {formData.filePerhitungan && (
                        <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 truncate max-w-xs">
                          {formData.filePerhitungan}
                        </span>
                      )}
                    </div>

                    <input
                      type="text"
                      placeholder="Atau masukkan URL / link dokumen..."
                      value={formData.filePerhitungan}
                      onChange={(e) => setFormData({ ...formData, filePerhitungan: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Catatan */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Catatan Tambahan</label>
                  <textarea
                    rows={3}
                    value={formData.catatan}
                    onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                    placeholder="Catatan mengenai struktur biaya atau pengiriman..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
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
              <h3 className="text-lg font-bold text-foreground">Hapus Struktur Biaya?</h3>
              <p className="text-sm text-muted-foreground">
                Apakah Anda yakin ingin menghapus struktur biaya untuk request <strong>{itemToDelete.noRequest}</strong> ({itemToDelete.buyer})?
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
