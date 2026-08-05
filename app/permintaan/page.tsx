'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { RequestTable, RequestItem as BaseRequestItem } from '@/components/permintaan/request-table'
import { Plus, Search, Filter, Trash2, X, FileText, Upload, Eye, Download, CheckCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

// Extend RequestItem to include MongoDB `_id` and nested `_id`
export interface PermintaanItem extends BaseRequestItem {
  _id: string
}

export default function PermintaanPage() {
  const [requests, setRequests] = useState<PermintaanItem[]>([])
  const [barangList, setBarangList] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [previewPdf, setPreviewPdf] = useState<{ url: string; name: string } | null>(null)
  
  const [selectedRequest, setSelectedRequest] = useState<PermintaanItem | null>(null)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('')

  // Form states
  const [formData, setFormData] = useState<Partial<PermintaanItem>>({
    tanggal: '',
    buyer: '',
    negara: '',
    tujuan: '',
    items: [{ name: '', spesifikasi: '', size: '', qty: 0, catatan: '', barangId: '' }],
    fileQuotation: '',
    catatan: ''
  })
  const [statusUpdate, setStatusUpdate] = useState<PermintaanItem['status']>('pending')

  const [userRole, setUserRole] = useState<'admin' | 'staff'>('admin')

  useEffect(() => {
    fetchProfile()
    fetchData()
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

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/permintaan')
      const data = await res.json()
      if (res.ok) {
        // Map _id to id for the RequestTable component compatibility
        const mappedData = data.map((d: any) => ({...d, id: d._id}))
        setRequests(mappedData)
      }
    } catch (error) {
      console.error('Error fetching permintaan:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchBarang = async () => {
    try {
      const res = await fetch('/api/barang')
      const data = await res.json()
      if (res.ok) setBarangList(data)
    } catch (error) {
      console.error('Error fetching barang:', error)
    }
  }

  const getFileName = (url: string) => {
    if (!url) return ''
    const parts = url.split('/')
    const rawName = parts[parts.length - 1]
    return rawName.replace(/^\d+-/, '')
  }

  // Handlers
  const handleDetail = (id: string) => {
    const req = requests.find(r => r.id === id)
    if (req) {
      setSelectedRequest(req)
      setIsDetailModalOpen(true)
    }
  }

  const handleEdit = (id: string) => {
    const req = requests.find(r => r.id === id)
    if (req) {
      setSelectedRequest(req)
      setFormData({
        tanggal: req.tanggal,
        buyer: req.buyer,
        negara: req.negara || '',
        tujuan: req.tujuan || '',
        items: req.items || [{ name: '', spesifikasi: '', size: '', qty: 0, catatan: '', barangId: '' }],
        fileQuotation: req.fileQuotation || '',
        catatan: req.catatan || ''
      })
      setError('')
      setUploadSuccessMsg('')
      setIsEditModalOpen(true)
    }
  }

  const handleDelete = (id: string) => {
    const req = requests.find(r => r.id === id)
    if (req) {
      setSelectedRequest(req)
      setIsDeleteModalOpen(true)
    }
  }

  const handleUpdateStatus = (id: string) => {
    const req = requests.find(r => r.id === id)
    if (req) {
      setSelectedRequest(req)
      setStatusUpdate(req.status)
      setIsStatusModalOpen(true)
    }
  }

  const handleQuotationUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validasi PDF Only
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Format file tidak didukung! Mohon pilih file berformat PDF (.pdf) saja untuk Quotation.')
      return
    }

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
        setFormData((prev) => ({ ...prev, fileQuotation: result.fileUrl }))
        setUploadSuccessMsg(`File Quotation "${result.fileName}" berhasil diunggah! Klik Simpan untuk menyimpan data.`)
      } else {
        alert(result.message || 'Gagal mengunggah Quotation PDF')
      }
    } catch (err) {
      console.error('Error uploading PDF:', err)
      alert('Terjadi kesalahan saat mengunggah Quotation PDF')
    } finally {
      setIsUploading(false)
    }
  }

  const confirmDelete = async () => {
    if (!selectedRequest) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/permintaan/${selectedRequest._id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus data')
      setIsDeleteModalOpen(false)
      setSelectedRequest(null)
      fetchData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmStatusUpdate = async () => {
    if (!selectedRequest) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/permintaan/${selectedRequest._id}`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusUpdate })
      })
      if (!res.ok) throw new Error('Gagal update status')
      setIsStatusModalOpen(false)
      setSelectedRequest(null)
      fetchData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleFormItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...(formData.items || [])]
    
    // Jika user mengubah nama barang dari datalist
    if (field === 'name') {
      const selectedBarang = barangList.find(b => b.nama === value)
      newItems[index] = { 
        ...newItems[index], 
        name: String(value),
        barangId: selectedBarang ? selectedBarang._id : '' // Simpan ID jika ketemu
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value }
    }
    
    setFormData({ ...formData, items: newItems })
  }

  const addFormItem = () => {
    setFormData({
      ...formData,
      items: [...(formData.items || []), { name: '', spesifikasi: '', size: '', qty: 0, catatan: '', barangId: '' }]
    })
  }
  
  const removeFormItem = (index: number) => {
    const newItems = [...(formData.items || [])]
    newItems.splice(index, 1)
    setFormData({ ...formData, items: newItems })
  }

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    // Validasi barang
    const invalidItems = formData.items?.filter(item => !item.name || item.qty <= 0)
    if (invalidItems && invalidItems.length > 0) {
      setError('Semua baris barang harus diisi nama dan jumlah (qty) minimal 1')
      setIsSubmitting(false)
      return
    }
    
    try {
      const url = isEditModalOpen && selectedRequest ? `/api/permintaan/${selectedRequest._id}` : '/api/permintaan'
      const method = isEditModalOpen ? 'PUT' : 'POST'

      const sanitizedItems = formData.items?.map(item => ({
        ...item,
        barangId: (item.barangId && item.barangId !== '') ? item.barangId : undefined
      }))

      const payload = {
        ...formData,
        items: sanitizedItems
      }
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Gagal menyimpan permintaan')

      setIsAddModalOpen(false)
      setIsEditModalOpen(false)
      fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openAddModal = () => {
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      buyer: '',
      negara: '',
      tujuan: '',
      items: [{ name: '', spesifikasi: '', size: '', qty: 0, catatan: '', barangId: '' }],
      fileQuotation: '',
      catatan: ''
    })
    setError('')
    setUploadSuccessMsg('')
    setIsAddModalOpen(true)
  }

  // Filter Data
  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.noRequest.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          req.buyer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus ? req.status === filterStatus : true
    return matchesSearch && matchesStatus
  })

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-title mb-2">Permintaan Buyer</h1>
        <p className="text-muted-foreground">Kelola semua permintaan dari buyer dan dokumen quotation PDF</p>
      </div>

      {/* Controls Section */}
      <div className="dashboard-card mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari nomor request atau buyer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-all"
              />
            </div>
          </div>

          {/* Buttons */}
          {userRole === 'admin' && (
            <div className="flex gap-3">
              <button className="btn-primary btn-sm" onClick={openAddModal}>
                <Plus className="w-4 h-4" />
                Tambah Permintaan
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <button className="px-3 py-2 text-sm rounded-lg border border-border hover:bg-gray-50 transition-colors font-medium">
            <Filter className="w-4 h-4 inline mr-1" />
            Filter
          </button>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-border bg-white hover:bg-gray-50 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="quotation_sent">Quotation sent</option>
            <option value="signing_mou">Signing MOU</option>
            <option value="selesai">Selesai</option>
            <option value="cancelled">Dibatalkan</option>
          </select>

          {/* Date Filter */}
          <input
            type="date"
            className="px-3 py-2 text-sm rounded-lg border border-border bg-white hover:bg-gray-50 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Request Table */}
      {isLoading ? (
        <div className="dashboard-card overflow-hidden p-8 flex justify-center items-center text-muted-foreground">
           <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
           Memuat data...
        </div>
      ) : (
        <RequestTable
          data={filteredRequests}
          userRole={userRole}
          onDetail={handleDetail}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onUpdateStatus={handleUpdateStatus}
          onPreviewPdf={(url, name) => setPreviewPdf({ url, name })}
        />
      )}

      {/* MODALS */}
      
      {/* 1. Add / Edit Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-border p-6 flex items-center justify-between z-10">
              <h2 className="text-subtitle font-bold">{isEditModalOpen ? 'Edit Permintaan' : 'Tambah Permintaan Baru'}</h2>
              <button
                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false) }}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitForm} className="p-6 space-y-6">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                  {error}
                </div>
              )}

              {uploadSuccessMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-200 font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{uploadSuccessMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Request</label>
                  <input 
                    type="text" 
                    disabled 
                    value={isEditModalOpen ? selectedRequest?.noRequest : "Dibuat otomatis"} 
                    className="w-full px-3 py-2 border border-border rounded-lg bg-gray-100 text-sm font-medium text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Permintaan</label>
                  <input 
                    type="date" 
                    required
                    value={formData.tanggal}
                    onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary text-sm transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Buyer / Perusahaan *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Misal: PT. Maju Bersama"
                    value={formData.buyer}
                    onChange={(e) => setFormData({...formData, buyer: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary text-sm transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Negara Buyer / Ekspor</label>
                  <input 
                    type="text" 
                    placeholder="Misal: Indonesia, Singapura, Jepang"
                    value={formData.negara || ''}
                    onChange={(e) => setFormData({...formData, negara: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary text-sm transition-shadow"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tujuan Pengiriman / Alamat / Pelabuhan</label>
                  <input 
                    type="text" 
                    placeholder="Misal: Port of Tanjung Priok, Jakarta / Gudang Utama Surabaya"
                    value={formData.tujuan || ''}
                    onChange={(e) => setFormData({...formData, tujuan: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary text-sm transition-shadow"
                  />
                </div>
              </div>

              {/* Datalist untuk dropdown Master Barang */}
              <datalist id="barang-list">
                {barangList.map((b: any) => (
                  <option key={b._id} value={b.nama}>{b.kode} - {b.kategori}</option>
                ))}
              </datalist>

              <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-bold text-blue-900">Daftar Barang Dipesan</label>
                  <button type="button" onClick={addFormItem} className="text-sm text-primary font-medium hover:underline flex items-center gap-1 bg-white px-3 py-1.5 rounded border border-blue-200">
                    <Plus className="w-4 h-4" /> Tambah Baris
                  </button>
                </div>
                
                <div className="space-y-3">
                  {formData.items?.map((item, index) => (
                    <div key={index} className="flex flex-col md:flex-row gap-3 items-start bg-white p-3 rounded-lg border border-blue-100 shadow-sm relative">
                      <div className="flex-1 w-full">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs text-gray-500 block font-medium">Cari Nama Barang *</label>
                          {item.name && (() => {
                            const found = barangList.find(b => b.nama.toLowerCase() === item.name.toLowerCase())
                            if (!found) {
                              return <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">📦 Non-Stok Master</span>
                            }
                            const sisaStok = (found.stokAwal || 0) + (found.barangMasuk || 0) - (found.barangKeluar || 0)
                            if (sisaStok <= 0) {
                              return <span className="text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded">⚠️ Stok Kosong (0)</span>
                            }
                            return <span className="text-[10px] bg-green-100 text-green-800 font-bold px-1.5 py-0.5 rounded">✅ Sisa Stok: {sisaStok}</span>
                          })()}
                        </div>
                        <input 
                          type="text" 
                          list="barang-list"
                          required
                          placeholder="Ketik nama barang (Master atau Baru)..."
                          value={item.name}
                          onChange={(e) => handleFormItemChange(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm transition-shadow shadow-inner"
                        />
                      </div>
                      <div className="w-full md:w-36">
                        <label className="text-xs text-gray-500 mb-1 block font-medium">Spesifikasi</label>
                        <input 
                          type="text" 
                          placeholder="Mis: Grade A, 80gsm"
                          value={item.spesifikasi || ''}
                          onChange={(e) => handleFormItemChange(index, 'spesifikasi', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm transition-shadow"
                        />
                      </div>
                      <div className="w-full md:w-28">
                        <label className="text-xs text-gray-500 mb-1 block font-medium">Size</label>
                        <input 
                          type="text" 
                          placeholder="Mis: S/M/L, A4"
                          value={item.size || ''}
                          onChange={(e) => handleFormItemChange(index, 'size', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm transition-shadow"
                        />
                      </div>
                      <div className="w-full md:w-24">
                        <label className="text-xs text-gray-500 mb-1 block font-medium">Qty *</label>
                        <input 
                          type="number" 
                          required
                          min="1"
                          placeholder="0"
                          value={item.qty || ''}
                          onChange={(e) => handleFormItemChange(index, 'qty', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm transition-shadow font-semibold text-center"
                        />
                      </div>
                      <div className="flex-1 w-full">
                        <label className="text-xs text-gray-500 mb-1 block font-medium">Catatan Pembeli</label>
                        <input 
                          type="text" 
                          placeholder="Catatan..."
                          value={item.catatan || ''}
                          onChange={(e) => handleFormItemChange(index, 'catatan', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm transition-shadow"
                        />
                      </div>
                      {formData.items && formData.items.length > 1 && (
                        <button type="button" onClick={() => removeFormItem(index)} className="text-red-500 hover:text-red-700 p-2 self-end mb-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Upload Quotation (PDF Only) Section */}
              <div className="space-y-2 border-t border-border pt-4">
                <label className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-red-600" />
                  <span>Upload File Quotation (PDF Only)</span>
                </label>

                <div className="p-4 bg-red-50/40 rounded-xl border border-red-200 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Pilih file Quotation berformat <strong>.pdf</strong> saja. File akan tersimpan secara otomatis.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 text-xs shadow-sm transition-all">
                      <Upload className="w-4 h-4" />
                      <span>{isUploading ? 'Mengunggah PDF...' : 'Pilih File Quotation (PDF Only)'}</span>
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleQuotationUpload}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </label>

                    {formData.fileQuotation && (
                      <div className="flex items-center gap-2 text-xs text-red-700 font-semibold bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
                        <FileText className="w-4 h-4 text-red-600" />
                        <span className="truncate max-w-xs">{formData.fileQuotation}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-muted-foreground">
                    Atau tempelkan URL / link file PDF eksternal jika ada:
                    <input
                      type="text"
                      placeholder="https://.../quotation.pdf atau /uploads/..."
                      value={formData.fileQuotation || ''}
                      onChange={(e) => setFormData({ ...formData, fileQuotation: e.target.value })}
                      className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Tambahan Permintaan</label>
                <textarea 
                  rows={3}
                  placeholder="Catatan khusus dari buyer atau tim sales..."
                  value={formData.catatan || ''}
                  onChange={(e) => setFormData({...formData, catatan: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary text-sm transition-shadow resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false) }}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="btn-primary text-sm"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Detail Modal */}
      {isDetailModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-border pb-4">
              <div>
                <h2 className="text-subtitle font-bold text-primary">{selectedRequest.noRequest}</h2>
                <p className="text-xs text-muted-foreground">Dibuat pada {selectedRequest.tanggal}</p>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl border border-border">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Buyer / Perusahaan</p>
                <p className="font-bold text-gray-900">{selectedRequest.buyer}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Negara Buyer</p>
                <p className="font-bold text-gray-900">{selectedRequest.negara || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground font-medium">Tujuan Pengiriman</p>
                <p className="font-semibold text-gray-900">{selectedRequest.tujuan || '-'}</p>
              </div>
              {selectedRequest.fileQuotation && (
                <div className="col-span-2 border-t border-gray-200 pt-2">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Dokumen Quotation (PDF)</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewPdf({ url: selectedRequest.fileQuotation!, name: getFileName(selectedRequest.fileQuotation!) })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold"
                    >
                      <Eye className="w-4 h-4 text-blue-600" />
                      <span>Preview Quotation PDF</span>
                    </button>
                    <a
                      href={selectedRequest.fileQuotation}
                      download
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold"
                    >
                      <Download className="w-4 h-4 text-emerald-600" />
                      <span>Unduh PDF</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-3">Daftar Barang Dipesan</h3>
              <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                {selectedRequest.items?.map((item, idx) => (
                  <div key={idx} className="p-3 bg-white hover:bg-gray-50 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm text-gray-900">{item.name}</p>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                        {item.spesifikasi && <span>Spec: {item.spesifikasi}</span>}
                        {item.size && <span>Size: {item.size}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-200">
                        {item.qty} Pcs
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedRequest.catatan && (
              <div className="text-xs bg-amber-50 text-amber-900 p-3 rounded-lg border border-amber-200">
                <span className="font-bold block mb-1">Catatan Tambahan:</span>
                {selectedRequest.catatan}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button onClick={() => setIsDetailModalOpen(false)} className="btn-secondary btn-sm">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {previewPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl rounded-2xl border border-border shadow-2xl p-6 space-y-4 max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-5 h-5 text-red-600 flex-shrink-0" />
                <h3 className="font-bold text-gray-900 text-base truncate">Preview Quotation: {previewPdf.name}</h3>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={previewPdf.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-all shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Buka / Unduh File</span>
                </a>
                <button
                  onClick={() => setPreviewPdf(null)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-[60vh] bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center p-2">
              <iframe 
                src={(() => {
                  const url = previewPdf.url
                  if (url.includes('drive.google.com')) {
                    const matchD = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
                    const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
                    const fileId = matchD ? matchD[1] : matchId ? matchId[1] : ''
                    if (fileId) return `https://drive.google.com/file/d/${fileId}/preview`
                  }
                  return url
                })()} 
                className="w-full h-full min-h-[60vh] border-0 rounded-lg" 
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. Status Update Modal */}
      {isStatusModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-subtitle font-bold">Update Status Permintaan</h2>
            <p className="text-sm text-muted-foreground">Ubah status untuk request <strong className="text-primary">{selectedRequest.noRequest}</strong> ({selectedRequest.buyer}):</p>
            
            <select
              value={statusUpdate}
              onChange={(e) => setStatusUpdate(e.target.value as any)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm font-semibold focus:ring-2 focus:ring-primary"
            >
              <option value="pending">Pending</option>
              <option value="quotation_sent">Quotation sent</option>
              <option value="signing_mou">Signing MOU</option>
              <option value="selesai">Selesai (Potong Stok Otomatis)</option>
              <option value="cancelled">Dibatalkan</option>
            </select>

            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setIsStatusModalOpen(false)} className="btn-secondary btn-sm">Batal</button>
              <button onClick={confirmStatusUpdate} disabled={isSubmitting} className="btn-primary btn-sm">
                {isSubmitting ? 'Menyimpan...' : 'Simpan Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-subtitle font-bold text-red-600">Hapus Permintaan?</h2>
            <p className="text-sm text-muted-foreground">Apakah Anda yakin ingin menghapus permintaan <strong>{selectedRequest.noRequest}</strong> dari <strong>{selectedRequest.buyer}</strong>?</p>

            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setIsDeleteModalOpen(false)} className="btn-secondary btn-sm">Batal</button>
              <button onClick={confirmDelete} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg text-sm">
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
