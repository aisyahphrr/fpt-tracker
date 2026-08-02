'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { RequestTable, RequestItem as BaseRequestItem } from '@/components/permintaan/request-table'
import { Plus, Search, Filter, Trash2, X } from 'lucide-react'
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
  
  const [selectedRequest, setSelectedRequest] = useState<PermintaanItem | null>(null)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Form states
  const [formData, setFormData] = useState<Partial<PermintaanItem>>({
    tanggal: '',
    buyer: '',
    negara: '',
    tujuan: '',
    items: [{ name: '', spesifikasi: '', size: '', qty: 0, catatan: '', barangId: '' }],
    catatan: ''
  })
  const [statusUpdate, setStatusUpdate] = useState<PermintaanItem['status']>('pending')

  useEffect(() => {
    fetchData()
    fetchBarang()
  }, [])

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
        catatan: req.catatan || ''
      })
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
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
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
      catatan: ''
    })
    setError('')
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
        <p className="text-muted-foreground">Kelola semua permintaan dari buyer</p>
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
          <div className="flex gap-3">
            <button className="btn-primary btn-sm" onClick={openAddModal}>
              <Plus className="w-4 h-4" />
              Tambah Permintaan
            </button>
          </div>
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
          onDetail={handleDetail}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onUpdateStatus={handleUpdateStatus}
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
                          placeholder="Catatan tambahan..."
                          value={item.catatan || ''}
                          onChange={(e) => handleFormItemChange(index, 'catatan', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm transition-shadow"
                        />
                      </div>
                      {formData.items!.length > 1 && (
                        <div className="md:pt-5">
                          <button type="button" onClick={() => removeFormItem(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors w-full md:w-auto mt-1" title="Hapus Baris">
                            <Trash2 className="w-5 h-5 mx-auto" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan Tambahan Surat Jalan (Opsional)</label>
                <textarea 
                  rows={3}
                  value={formData.catatan || ''}
                  onChange={(e) => setFormData({...formData, catatan: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary text-sm transition-shadow"
                  placeholder="Instruksi pengiriman, dll..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button 
                  type="button" 
                  onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false) }} 
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50">
                  {isSubmitting ? 'Menyimpan...' : (isEditModalOpen ? 'Simpan Perubahan' : 'Buat Permintaan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Detail Modal */}
      {isDetailModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-border p-6 flex items-center justify-between z-10">
              <h2 className="text-subtitle font-bold">Detail Permintaan: <span className="text-primary">{selectedRequest.noRequest}</span></h2>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Buyer Info */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Informasi Buyer & Pengiriman</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8 text-sm bg-gray-50 p-5 rounded-xl border border-border shadow-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Nama Buyer</p>
                    <p className="font-semibold text-foreground text-base">{selectedRequest.buyer}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Negara Buyer</p>
                    <p className="font-semibold text-gray-900 text-base">{selectedRequest.negara || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Tujuan Pengiriman</p>
                    <p className="font-semibold text-gray-900 text-base">{selectedRequest.tujuan || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Tanggal Permintaan</p>
                    <p className="font-semibold text-foreground text-base">{selectedRequest.tanggal}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      selectedRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedRequest.status === 'quotation_sent' ? 'bg-purple-100 text-purple-800' :
                      selectedRequest.status === 'signing_mou' ? 'bg-indigo-100 text-indigo-800' :
                      selectedRequest.status === 'selesai' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedRequest.status === 'quotation_sent' ? 'Quotation sent' : selectedRequest.status === 'signing_mou' ? 'Signing MOU' : selectedRequest.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Daftar Barang Dipesan</h3>
                <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-gray-50">
                        <th className="px-5 py-3 text-left font-semibold text-gray-700">Nama Barang</th>
                        <th className="px-5 py-3 text-left font-semibold text-gray-700">Spesifikasi</th>
                        <th className="px-5 py-3 text-center font-semibold text-gray-700">Size</th>
                        <th className="px-5 py-3 text-center font-semibold text-gray-700 w-20">Qty</th>
                        <th className="px-5 py-3 text-left font-semibold text-gray-700">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-white">
                      {selectedRequest.items && selectedRequest.items.length > 0 ? (
                        selectedRequest.items.map((item: any, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="px-5 py-3 text-foreground font-medium">
                              <div>
                                <p className="font-semibold text-gray-900">{item.name}</p>
                                {(() => {
                                  const found = barangList.find(b => b.nama.toLowerCase() === item.name.toLowerCase() || b._id === item.barangId)
                                  if (!found) {
                                    return <span className="inline-block mt-0.5 text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">📦 Non-Stok Master</span>
                                  }
                                  const sisaStok = (found.stokAwal || 0) + (found.barangMasuk || 0) - (found.barangKeluar || 0)
                                  if (sisaStok <= 0) {
                                    return <span className="inline-block mt-0.5 text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded">⚠️ Stok Kosong</span>
                                  }
                                  return null
                                })()}
                              </div>
                            </td>
                            <td className="px-5 py-3 text-gray-600">{item.spesifikasi || '-'}</td>
                            <td className="px-5 py-3 text-center text-gray-600">{item.size || '-'}</td>
                            <td className="px-5 py-3 text-foreground text-center font-bold bg-gray-50/50">{item.qty}</td>
                            <td className="px-5 py-3 text-muted-foreground text-xs">{item.catatan || '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">Detail barang tidak tersedia</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-gray-100 border-t border-border">
                      <tr>
                        <td colSpan={3} className="px-5 py-3 font-semibold text-right text-gray-700">Total Quantity</td>
                        <td className="px-5 py-3 font-bold text-center text-primary">{selectedRequest.totalQty}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {selectedRequest.catatan && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Catatan Tambahan</h3>
                  <p className="text-sm p-4 bg-yellow-50 text-yellow-800 rounded-xl border border-yellow-200">
                    {selectedRequest.catatan}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t border-border justify-end">
                <button 
                  onClick={() => {
                    setIsDetailModalOpen(false)
                    handleUpdateStatus(selectedRequest.id)
                  }} 
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Update Status
                </button>
                <button 
                  onClick={() => {
                    setIsDetailModalOpen(false)
                    handleEdit(selectedRequest.id)
                  }} 
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Edit Data
                </button>
                <button onClick={() => setIsDetailModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Update Status Modal */}
      {isStatusModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Update Status</h2>
            <p className="text-sm text-gray-500 mb-6">
              Pilih status terbaru untuk permintaan <strong className="text-gray-900">{selectedRequest.noRequest}</strong>
            </p>
            
            <div className="space-y-3 mb-8">
              {[
                { id: 'pending', label: 'Pending', desc: 'Permintaan baru masuk' },
                { id: 'quotation_sent', label: 'Quotation sent', desc: 'Surat penawaran telah dikirim ke buyer' },
                { id: 'signing_mou', label: 'Signing MOU', desc: 'Proses penandatanganan kesepakatan / MOU' },
                { id: 'selesai', label: 'Selesai', desc: 'Selesai dan otomatis memotong stok' },
                { id: 'cancelled', label: 'Dibatalkan', desc: 'Permintaan dibatalkan' }
              ].map((s) => (
                <label 
                  key={s.id} 
                  className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                    statusUpdate === s.id 
                      ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20' 
                      : 'border-border hover:bg-gray-50'
                  }`}
                >
                  <div className="pt-1">
                    <input 
                      type="radio" 
                      name="status"
                      value={s.id}
                      checked={statusUpdate === s.id}
                      onChange={(e) => setStatusUpdate(e.target.value as any)}
                      className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                    />
                  </div>
                  <div>
                    <div className={`font-semibold text-sm capitalize ${statusUpdate === s.id ? 'text-primary' : 'text-gray-900'}`}>{s.label}</div>
                    <div className="text-xs text-gray-500">{s.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setIsStatusModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full">Batal</button>
              <button disabled={isSubmitting} onClick={confirmStatusUpdate} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow-sm w-full disabled:opacity-50">
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5 border-4 border-white shadow-sm ring-1 ring-red-100">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Hapus Permintaan?</h2>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              Apakah Anda yakin ingin menghapus data permintaan <strong className="text-gray-900">{selectedRequest.noRequest}</strong>? Tindakan ini tidak dapat dikembalikan.
            </p>

            <div className="flex gap-3 justify-center">
              <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full">
                Batal
              </button>
              <button disabled={isSubmitting} onClick={confirmDelete} className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm w-full disabled:opacity-50">
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
