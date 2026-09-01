'use client'

import { useState, useEffect, useMemo } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  RefreshCw,
  ChevronDown,
  Info,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

interface SupplierRow {
  _id: string
  nama: string
  lokasi: string
  komoditas: string
  spesifikasi: string
  picKontak: string
  catatan?: string
  lastUpdated: string
}

export default function SupplierPage() {
  const [data, setData] = useState<SupplierRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [userName, setUserName] = useState('Aisyah (Direksi)')

  // Filters
  const [selectedKomoditas, setSelectedKomoditas] = useState('Semua Komoditas')
  const [selectedLokasi, setSelectedLokasi] = useState('Semua Lokasi')
  const [searchQuery, setSearchQuery] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Modal / Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    nama: '',
    lokasi: 'Bitung, Sulawesi Utara',
    komoditas: 'Yellowfin Tuna',
    spesifikasi: '',
    picKontak: '',
    catatan: '',
  })

  useEffect(() => {
    fetchProfile()
    fetchSuppliers()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const d = await res.json()
        if (d?.name) {
          const roleLabel = d.role === 'direksi' ? 'Direksi' : 'Staff Cabang'
          setUserName(`${d.name} (${roleLabel})`)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/supplier')
      if (res.ok) {
        const json = await res.json()
        setData(json || [])
      }
    } catch (e) {
      console.error('Error fetching suppliers:', e)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter Dropdown Options
  const komoditasOptions = useMemo(() => {
    const set = new Set(data.map((d) => d.komoditas).filter(Boolean))
    return ['Semua Komoditas', ...Array.from(set)]
  }, [data])

  const lokasiOptions = useMemo(() => {
    const set = new Set(data.map((d) => d.lokasi).filter(Boolean))
    return ['Semua Lokasi', ...Array.from(set)]
  }, [data])

  // Filtered Rows
  const filteredRows = useMemo(() => {
    return data.filter((row) => {
      if (selectedKomoditas !== 'Semua Komoditas' && row.komoditas !== selectedKomoditas) {
        return false
      }
      if (selectedLokasi !== 'Semua Lokasi' && row.lokasi !== selectedLokasi) {
        return false
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchName = row.nama.toLowerCase().includes(q)
        const matchKomoditas = row.komoditas.toLowerCase().includes(q)
        const matchLokasi = row.lokasi.toLowerCase().includes(q)
        const matchPIC = row.picKontak.toLowerCase().includes(q)
        if (!matchName && !matchKomoditas && !matchLokasi && !matchPIC) {
          return false
        }
      }
      return true
    })
  }, [data, selectedKomoditas, selectedLokasi, searchQuery])

  // Pagination
  const totalPages = Math.ceil(filteredRows.length / itemsPerPage) || 1
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredRows.slice(start, start + itemsPerPage)
  }, [filteredRows, currentPage])

  // Open Add Modal
  const handleOpenAdd = () => {
    setIsEditing(false)
    setEditingId(null)
    setFormData({
      nama: '',
      lokasi: 'Bitung, Sulawesi Utara',
      komoditas: 'Yellowfin Tuna',
      spesifikasi: '',
      picKontak: '',
      catatan: '',
    })
    setIsModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (item: SupplierRow) => {
    setIsEditing(true)
    setEditingId(item._id)
    setFormData({
      nama: item.nama,
      lokasi: item.lokasi,
      komoditas: item.komoditas,
      spesifikasi: item.spesifikasi || '',
      picKontak: item.picKontak,
      catatan: item.catatan || '',
    })
    setIsModalOpen(true)
  }

  // Submit Form (Create / Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nama || !formData.lokasi || !formData.komoditas || !formData.picKontak) {
      alert('Mohon lengkapi seluruh field bertanda bintang (*).')
      return
    }

    const now = new Date()
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} oleh ${userName}`

    if (isEditing && editingId) {
      // Optimistic Update
      setData(
        data.map((d) =>
          d._id === editingId
            ? {
                ...d,
                ...formData,
                lastUpdated: formattedDate,
              }
            : d
        )
      )
      setIsModalOpen(false)

      try {
        await fetch('/api/supplier', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            ...formData,
            user: userName,
          }),
        })
      } catch (err) {
        console.error('Error updating supplier:', err)
      }
    } else {
      // Create New
      const newSupplierObj: SupplierRow = {
        _id: `sup-${Date.now()}`,
        ...formData,
        lastUpdated: formattedDate,
      }
      setData([newSupplierObj, ...data])
      setIsModalOpen(false)

      try {
        await fetch('/api/supplier', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            user: userName,
          }),
        })
      } catch (err) {
        console.error('Error creating supplier:', err)
      }
    }
  }

  // Delete Supplier
  const handleDelete = async (id: string) => {
    if (!confirm('Apakah kamu yakin ingin menghapus data supplier ini?')) return
    setData(data.filter((d) => d._id !== id))

    try {
      await fetch(`/api/supplier?id=${id}`, {
        method: 'DELETE',
      })
    } catch (err) {
      console.error('Error deleting supplier:', err)
    }
  }

  const handleResetFilters = () => {
    setSelectedKomoditas('Semua Komoditas')
    setSelectedLokasi('Semua Lokasi')
    setSearchQuery('')
    setCurrentPage(1)
  }

  return (
    <MainLayout>
      <div className="space-y-6 pb-10 select-none">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <Users className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Supplier</h1>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Database supplier ikan di berbagai daerah sebagai referensi pemenuhan permintaan buyer.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Supplier</span>
          </button>
        </div>

        {/* 1. FILTER BAR */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Komoditas Dropdown */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Komoditas
              </label>
              <div className="relative">
                <select
                  value={selectedKomoditas}
                  onChange={(e) => setSelectedKomoditas(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
                >
                  {komoditasOptions.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Lokasi / Daerah Dropdown */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Lokasi / Daerah
              </label>
              <div className="relative">
                <select
                  value={selectedLokasi}
                  onChange={(e) => setSelectedLokasi(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
                >
                  {lokasiOptions.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Search Input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Pencarian
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari supplier atau komoditas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-1 border-t border-slate-100 text-xs">
            <button
              onClick={handleResetFilters}
              className="px-4 py-1.5 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* 2. MAIN SUPPLIER TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-3 text-center w-12">No</th>
                  <th className="py-3.5 px-3">Nama Supplier</th>
                  <th className="py-3.5 px-3">Lokasi / Daerah</th>
                  <th className="py-3.5 px-3">Komoditas</th>
                  <th className="py-3.5 px-3">Spesifikasi / Size</th>
                  <th className="py-3.5 px-3">PIC / Kontak</th>
                  <th className="py-3.5 px-3">Last Updated</th>
                  <th className="py-3.5 px-3 text-center w-16">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRows.length > 0 ? (
                  paginatedRows.map((row, index) => {
                    const rowNumber = (currentPage - 1) * itemsPerPage + index + 1

                    return (
                      <tr key={row._id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3.5 px-3 text-center text-slate-400 font-medium">
                          {rowNumber}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-blue-600 hover:underline cursor-pointer">
                          {row.nama}
                        </td>
                        <td className="py-3.5 px-3 text-slate-700 font-medium">
                          {row.lokasi}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-slate-800">
                          {row.komoditas}
                        </td>
                        <td className="py-3.5 px-3 text-slate-600">
                          {row.spesifikasi || '—'}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="space-y-0.5">
                            {row.picKontak.split('\n').map((line, idx) => (
                              <p
                                key={idx}
                                className={idx === 0 ? 'font-bold text-slate-800' : 'text-slate-500 text-[11px]'}
                              >
                                {line}
                              </p>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                          {row.lastUpdated}
                        </td>
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(row)}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Data Supplier"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(row._id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Supplier"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Tidak ada data supplier yang sesuai filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 text-xs text-slate-500 bg-slate-50/50">
            <p>
              Menampilkan {filteredRows.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} -{' '}
              {Math.min(currentPage * itemsPerPage, filteredRows.length)} dari {filteredRows.length} data
            </p>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setCurrentPage(pg)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currentPage === pg
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {pg}
                </button>
              ))}
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                ›
              </button>
            </div>
          </div>
        </div>

        {/* 3. BOTTOM BANNER (PENGARUH KE STATUS PERMINTAAN BUYER) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3 max-w-md">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Pengaruh ke Status Permintaan Buyer</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Status pada Permintaan Buyer ditentukan otomatis berdasarkan ketersediaan di Stok Gudang dan/atau Supplier.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Stock Explanation */}
            <div className="flex items-center gap-2.5 bg-emerald-50/70 border border-emerald-200/70 px-3.5 py-2 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="text-xs font-bold text-emerald-800 block">Stock</span>
                <span className="text-[10px] text-emerald-600 font-medium block">
                  Tersedia di Stok Gudang ATAU tercatat pada Supplier.
                </span>
              </div>
            </div>

            {/* Non-stock Explanation */}
            <div className="flex items-center gap-2.5 bg-rose-50/70 border border-rose-200/70 px-3.5 py-2 rounded-xl">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <div>
                <span className="text-xs font-bold text-rose-800 block">Non-stock</span>
                <span className="text-[10px] text-rose-600 font-medium block">
                  Tidak tersedia di Stok Gudang maupun Supplier.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. SLIDE-OVER DRAWER / MODAL: TAMBAH / EDIT SUPPLIER */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white h-full max-w-md w-full p-6 shadow-2xl border-l border-slate-200 space-y-4 animate-in slide-in-from-right duration-200 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      {isEditing ? 'Edit Supplier' : 'Tambah Supplier'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Lengkapi data supplier dan komoditas pasokannya.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} id="supplierForm" className="space-y-3.5 text-xs">
                  {/* Nama Supplier */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Supplier <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Masukkan nama supplier"
                      value={formData.nama}
                      onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  {/* Lokasi / Daerah */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Lokasi / Daerah <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.lokasi}
                      onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      {[
                        'Bitung, Sulawesi Utara',
                        'Manado, Sulawesi Utara',
                        'Tegal, Jawa Tengah',
                        'Ambon, Maluku',
                        'Ternate, Maluku Utara',
                        'Sorong, Papua Barat',
                        'Rembang, Jawa Tengah',
                        'Makassar, Sulawesi Selatan',
                        'Kendari, Sulawesi Tenggara',
                        'Bau-Bau, Sulawesi Tenggara',
                        'Belawan, Sumatera Utara',
                        'Jakarta (Kamal)',
                        'Bali',
                        'Surabaya, Jawa Timur',
                        'Banyuwangi, Jawa Timur',
                        'Kupang, NTT',
                      ].map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>

                  {/* Komoditas */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Komoditas <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Pilih / input jenis komoditas (misal: Yellowfin Tuna, Cakalang)"
                      value={formData.komoditas}
                      onChange={(e) => setFormData({ ...formData, komoditas: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  {/* Spesifikasi / Size */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Spesifikasi / Size
                    </label>
                    <input
                      type="text"
                      placeholder="Masukkan spesifikasi / size (contoh: 2-4 kg up, Grade A)"
                      value={formData.spesifikasi}
                      onChange={(e) => setFormData({ ...formData, spesifikasi: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* PIC / Kontak */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      PIC / Kontak <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Masukkan nama PIC dan nomor telepon / WA (misal: Bpk. Andi&#10;0812-3456-7890)"
                      value={formData.picKontak}
                      onChange={(e) => setFormData({ ...formData, picKontak: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs font-medium"
                    />
                  </div>

                  {/* Catatan */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Catatan <span className="font-normal text-slate-400">(opsional)</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Masukkan catatan..."
                      value={formData.catatan}
                      onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>
                </form>
              </div>

              {/* Drawer Footer */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  form="supplierForm"
                  className="px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
