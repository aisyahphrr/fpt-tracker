'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { SummaryCard } from '@/components/dashboard/summary-card'
import { FileText, Download, Users, PackageCheck, TrendingUp, Calendar, Building2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Permintaan {
  _id: string
  noRequest: string
  tanggal: string
  buyer: string
  jumlahItem: number
  totalQty: number
  status: string
  items: any[]
}

interface Barang {
  _id: string
  kode: string
  nama: string
  cabang: string
  kategori: string
  stokAwal: number
  barangMasuk: number
  barangKeluar: number
}

interface Mutasi {
  _id: string
  barangId: any
  tanggal: string
  jenis: 'masuk' | 'keluar'
  qty: number
}

export default function LaporanPage() {
  const [permintaanData, setPermintaanData] = useState<Permintaan[]>([])
  const [barangData, setBarangData] = useState<Barang[]>([])
  const [mutasiData, setMutasiData] = useState<Mutasi[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Default ke bulan dan tahun saat ini
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState((currentDate.getMonth() + 1).toString().padStart(2, '0'))
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString())

  useEffect(() => {
    fetchData()
  }, [selectedMonth, selectedYear])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [resPermintaan, resBarang, resMutasi] = await Promise.all([
        fetch('/api/permintaan'),
        fetch('/api/barang'),
        fetch(`/api/mutasi?bulan=${selectedMonth}&tahun=${selectedYear}`)
      ])
      
      if (resPermintaan.ok) setPermintaanData(await resPermintaan.json())
      if (resBarang.ok) setBarangData(await resBarang.json())
      if (resMutasi.ok) setMutasiData(await resMutasi.json())
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // --- FILTERING LOGIC ---
  const filteredPermintaan = permintaanData.filter(req => {
    const reqYear = req.tanggal.substring(0, 4)
    const reqMonth = req.tanggal.substring(5, 7)
    return reqYear === selectedYear && reqMonth === selectedMonth
  })

  // Permintaan yang selesai saja untuk perhitungan mutasi
  const completedPermintaan = filteredPermintaan.filter(req => req.status === 'selesai')
  
  // --- BUYER REPORT DATA ---
  const buyerMap = new Map<string, { count: number, totalItem: number, totalQty: number }>()
  completedPermintaan.forEach(req => {
    const existing = buyerMap.get(req.buyer) || { count: 0, totalItem: 0, totalQty: 0 }
    buyerMap.set(req.buyer, {
      count: existing.count + 1,
      totalItem: existing.totalItem + req.jumlahItem,
      totalQty: existing.totalQty + req.totalQty
    })
  })
  
  const buyerReport = Array.from(buyerMap.entries()).map(([buyer, stats]) => ({
    buyer,
    ...stats
  })).sort((a, b) => b.totalQty - a.totalQty)

  // --- SUMMARY METRICS ---
  const totalBuyerUnik = buyerReport.length
  const totalTransaksiSelesai = completedPermintaan.length
  const totalBarangKeluarBulanIni = completedPermintaan.reduce((acc, req) => acc + req.totalQty, 0)

  // --- BARANG REPORT DATA (HISTORICAL) ---
  const endDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0, 23, 59, 59);

  const barangReport = barangData.map(b => {
    const mutasiItem = mutasiData.filter(m => {
      const bId = typeof m.barangId === 'object' ? m.barangId._id : m.barangId;
      return bId === b._id;
    });

    let totalMasukUpToMonth = 0;
    let totalKeluarUpToMonth = 0;
    
    let masukBulanIni = 0;
    let keluarBulanIni = 0;

    mutasiItem.forEach(m => {
      const mDate = new Date(m.tanggal);
      if (mDate <= endDate) {
        if (m.jenis === 'masuk') totalMasukUpToMonth += m.qty;
        if (m.jenis === 'keluar') totalKeluarUpToMonth += m.qty;
        
        const mYear = mDate.getFullYear().toString();
        const mMonth = (mDate.getMonth() + 1).toString().padStart(2, '0');
        
        if (mYear === selectedYear && mMonth === selectedMonth) {
           if (m.jenis === 'masuk') masukBulanIni += m.qty;
           if (m.jenis === 'keluar') keluarBulanIni += m.qty;
        }
      }
    });

    const sisaStokAkhir = (b.stokAwal || 0) + totalMasukUpToMonth - totalKeluarUpToMonth;

    return {
      kode: b.kode,
      nama: b.nama,
      cabang: b.cabang || 'Jakarta (Pusat)',
      kategori: b.kategori,
      masukBulanIni,
      keluarBulanIni,
      sisaStok: sisaStokAkhir
    }
  })
  .filter(b => b.sisaStok > 0 || b.masukBulanIni > 0 || b.keluarBulanIni > 0);

  // --- EXPORT FUNCTIONS ---
  const getMonthName = (monthStr: string) => {
    const date = new Date(2000, parseInt(monthStr) - 1, 1)
    return date.toLocaleString('id-ID', { month: 'long' })
  }

  const exportExcel = () => {
    const wb = XLSX.utils.book_new()

    // Sheet 1: Rekap Buyer
    const wsBuyerData = buyerReport.map((b, index) => ({
      'No': index + 1,
      'Nama Buyer / Perusahaan': b.buyer,
      'Total Transaksi': b.count,
      'Total Jenis Barang': b.totalItem,
      'Total Qty Barang': b.totalQty
    }))
    const wsBuyer = XLSX.utils.json_to_sheet(wsBuyerData)
    XLSX.utils.book_append_sheet(wb, wsBuyer, "Laporan Buyer")

    // Sheet 2: Rekap Barang
    const wsBarangData = barangReport.map((b, index) => ({
      'No': index + 1,
      'Kode SKU': b.kode,
      'Nama Barang': b.nama,
      'Cabang / Kota': b.cabang,
      'Kategori': b.kategori,
      'Stok Masuk Periode Ini': b.masukBulanIni,
      'Terjual Periode Ini': b.keluarBulanIni,
      'Sisa Stok Akhir Periode': b.sisaStok
    }))
    const wsBarang = XLSX.utils.json_to_sheet(wsBarangData)
    XLSX.utils.book_append_sheet(wb, wsBarang, "Laporan Stok Multi-Cabang")

    XLSX.writeFile(wb, `Laporan_FPT_Tracker_${selectedMonth}_${selectedYear}.xlsx`)
  }

  const exportPDF = () => {
    const doc = new jsPDF('landscape')
    
    // Header
    doc.setFontSize(18)
    doc.text('Laporan Bulanan FPT Tracker', 14, 22)
    doc.setFontSize(12)
    doc.text(`Periode: ${getMonthName(selectedMonth)} ${selectedYear}`, 14, 30)
    
    // Tabel 1: Rekap Buyer
    doc.setFontSize(14)
    doc.text('1. Rekapitulasi Buyer (Transaksi Selesai)', 14, 42)
    
    autoTable(doc, {
      startY: 46,
      head: [['No', 'Nama Buyer', 'Jumlah Transaksi', 'Total Jenis Barang', 'Total Qty']],
      body: buyerReport.map((b, i) => [i + 1, b.buyer, b.count, b.totalItem, b.totalQty]),
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] }
    })

    // Tabel 2: Rekap Barang
    let finalY = (doc as any).lastAutoTable.finalY || 46
    
    if (finalY > 150) {
      doc.addPage()
      finalY = 20
    } else {
      finalY += 15
    }

    doc.setFontSize(14)
    doc.text('2. Status & Mutasi Barang Multi-Cabang', 14, finalY)

    autoTable(doc, {
      startY: finalY + 4,
      head: [['No', 'Kode', 'Nama Barang', 'Cabang', 'Kategori', 'Stok Masuk', 'Terjual', 'Sisa Stok Akhir']],
      body: barangReport.map((b, i) => [
        i + 1, 
        b.kode, 
        b.nama, 
        b.cabang,
        b.kategori, 
        b.masukBulanIni, 
        b.keluarBulanIni, 
        b.sisaStok
      ]),
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }
    })

    doc.save(`Laporan_FPT_Tracker_${selectedMonth}_${selectedYear}.pdf`)
  }

  const months = [
    { value: '01', label: 'Januari' }, { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' }, { value: '04', label: 'April' },
    { value: '05', label: 'Mei' }, { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' }, { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' }, { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' }, { value: '12', label: 'Desember' }
  ]

  const years = ['2024', '2025', '2026', '2027', '2028', '2029', '2030']

  return (
    <MainLayout>
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-title mb-2">Laporan & Ekspor Data</h1>
          <p className="text-muted-foreground">Analisis performa penjualan dan mutasi stok multi-cabang secara lengkap</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-border">
          <div className="flex items-center gap-2 pl-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Periode:</span>
          </div>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 text-sm bg-gray-50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-semibold text-gray-700"
          >
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 text-sm bg-gray-50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-semibold text-gray-700"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <PackageCheck className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <p className="text-blue-100 font-medium mb-1">Transaksi Selesai</p>
            <h3 className="text-4xl font-bold mb-4">{totalTransaksiSelesai}</h3>
            <p className="text-sm text-blue-200">Total pesanan yang berhasil dikirim bulan ini</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-purple-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Users className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <p className="text-indigo-100 font-medium mb-1">Total Buyer Aktif</p>
            <h3 className="text-4xl font-bold mb-4">{totalBuyerUnik}</h3>
            <p className="text-sm text-indigo-200">Jumlah klien/perusahaan yang order bulan ini</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <TrendingUp className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <p className="text-emerald-100 font-medium mb-1">Barang Keluar</p>
            <h3 className="text-4xl font-bold mb-4">{totalBarangKeluarBulanIni}</h3>
            <p className="text-sm text-emerald-200">Total kuantitas barang (qty) terjual bulan ini</p>
          </div>
        </div>
      </div>

      {/* Export Action Bar */}
      <div className="dashboard-card mb-8 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">Download Laporan ({getMonthName(selectedMonth)} {selectedYear})</h3>
          <p className="text-sm text-muted-foreground">Unduh rekapitulasi data dalam format pilihan Anda</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={exportExcel}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" /> Export Excel
          </button>
          <button 
            onClick={exportPDF}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Table 1: Rekap Buyer */}
          <div className="dashboard-card overflow-hidden">
            <div className="p-6 border-b border-border bg-gray-50/50">
              <h3 className="text-subtitle">1. Rekapitulasi Buyer (Transaksi Selesai)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 w-16">No</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Nama Buyer / Perusahaan</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Total Transaksi</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Total Jenis Barang</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Total Qty Barang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {buyerReport.length > 0 ? buyerReport.map((b, idx) => (
                    <tr key={b.buyer} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-500">{idx + 1}</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{b.buyer}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-700 text-center">{b.count}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-700 text-center">{b.totalItem}</td>
                      <td className="px-6 py-4 text-sm font-bold text-blue-600 text-center">{b.totalQty}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        Tidak ada data transaksi selesai pada bulan ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Rekap Barang */}
          <div className="dashboard-card overflow-hidden">
            <div className="p-6 border-b border-border bg-gray-50/50">
              <h3 className="text-subtitle">2. Status & Mutasi Barang Multi-Cabang ({getMonthName(selectedMonth)} {selectedYear})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-50">
                    <th className="px-6 py-4 text-left font-semibold text-gray-600 w-16">No</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-600">Kode</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-600">Nama Barang</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-600">Cabang</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-600">Kategori</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-600 text-green-700 bg-green-50/50">Stok Masuk Bulan Ini</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-600 text-red-700 bg-red-50/50">Terjual Bulan Ini</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-600 bg-blue-50/50">Sisa Stok Akhir Bulan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {barangReport.length > 0 ? barangReport.map((b, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-500">{idx + 1}</td>
                      <td className="px-6 py-4 text-sm font-medium text-primary whitespace-nowrap">{b.kode}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{b.nama}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          📍 {b.cabang}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-700 text-center">{b.kategori}</td>
                      <td className="px-6 py-4 text-sm font-bold text-green-600 text-center bg-green-50/10">+{b.masukBulanIni}</td>
                      <td className="px-6 py-4 text-sm font-bold text-red-600 text-center bg-red-50/10">-{b.keluarBulanIni}</td>
                      <td className="px-6 py-4 text-sm font-black text-gray-900 text-center bg-blue-50/10 text-lg">{b.sisaStok}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        Tidak ada data barang pada periode ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
