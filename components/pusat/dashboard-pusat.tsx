'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { SummaryCard } from '@/components/dashboard/summary-card'
import { ActivityLog } from '@/components/dashboard/activity-log'
import {
  ShoppingCart,
  Package,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Loader2,
  PieChart as PieIcon
} from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts'

interface Permintaan {
  _id: string
  noRequest: string
  tanggal: string
  buyer: string
  jumlahItem: number
  totalQty: number
  status: 'pending' | 'diproses' | 'selesai' | 'cancelled'
  createdAt?: string
}

interface Barang {
  _id: string
  kode: string
  nama: string
  kategori: string
  stokAwal: number
  barangMasuk: number
  barangKeluar: number
}

export function DashboardPusat() {
  const [dateFilter, setDateFilter] = useState<'hari' | 'minggu' | 'bulan'>('hari')
  const [permintaanList, setPermintaanList] = useState<Permintaan[]>([])
  const [barangList, setBarangList] = useState<Barang[]>([])
  const [userName, setUserName] = useState('Nailah')
  const [userEmail, setUserEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      const [resPermintaan, resBarang, resProfile] = await Promise.all([
        fetch('/api/permintaan'),
        fetch('/api/barang'),
        fetch('/api/user/profile')
      ])

      if (resPermintaan.ok) {
        const dataP = await resPermintaan.json()
        setPermintaanList(Array.isArray(dataP) ? dataP : (dataP.data || []))
      }
      if (resBarang.ok) {
        const dataB = await resBarang.json()
        setBarangList(Array.isArray(dataB) ? dataB : (dataB.data || []))
      }
      if (resProfile.ok) {
        const prof = await resProfile.json()
        if (prof?.name) setUserName(prof.name)
        if (prof?.email) setUserEmail(prof.email)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // --- DERIVED METRICS ---
  const totalPermintaan = permintaanList.length
  const totalPending = permintaanList.filter((p) => p.status === 'pending').length
  const totalProcessedSbb = permintaanList.filter((p: any) => p.status === 'processed_by_sbb').length
  const totalProcessedPl = permintaanList.filter((p: any) => p.status === 'processed_by_pl').length
  const totalPriceSbd = permintaanList.filter((p: any) => p.status === 'price_processed_by_sbd').length
  const totalRejected = permintaanList.filter((p: any) => p.status === 'rejected').length
  const totalQuotationSent = permintaanList.filter((p: any) => p.status === 'quotation_sent').length

  const totalBarangKeluar = barangList.reduce((acc, b) => acc + (b.barangKeluar || 0), 0)
  const totalStokTersedia = barangList.reduce(
    (acc, b) => acc + ((b.stokAwal || 0) + (b.barangMasuk || 0) - (b.barangKeluar || 0)),
    0
  )

  // --- TREND CHART DATA ---
  const trendChartData = useMemo(() => {
    if (permintaanList.length === 0) {
      return [
        { label: 'Senin', transaksi: 0 },
        { label: 'Selasa', transaksi: 0 },
        { label: 'Rabu', transaksi: 0 },
        { label: 'Kamis', transaksi: 0 },
        { label: 'Jumat', transaksi: 0 },
      ]
    }

    const groupMap = new Map<string, number>()
    
    // Sort by tanggal ascending
    const sortedList = [...permintaanList].sort(
      (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
    )

    sortedList.forEach((item) => {
      let dateKey = item.tanggal || 'Hari ini'
      if (dateFilter === 'bulan') {
        dateKey = dateKey.substring(0, 7) // YYYY-MM
      }
      groupMap.set(dateKey, (groupMap.get(dateKey) || 0) + 1)
    })

    return Array.from(groupMap.entries()).map(([label, count]) => ({
      label,
      transaksi: count,
    }))
  }, [permintaanList, dateFilter])

  // --- STATUS PIE CHART DATA ---
  const statusPieData = useMemo(() => {
    const data = [
      { name: 'Pending', value: totalPending, color: '#eab308' },
      { name: 'Processed by SBB', value: totalProcessedSbb, color: '#f59e0b' },
      { name: 'Processed by PL', value: totalProcessedPl, color: '#3b82f6' },
      { name: 'Price processed by SBD', value: totalPriceSbd, color: '#6366f1' },
      { name: 'Rejected', value: totalRejected, color: '#ef4444' },
      { name: 'Quotation Sent', value: totalQuotationSent, color: '#10b981' },
    ].filter((item) => item.value > 0)

    if (data.length === 0) {
      return [{ name: 'Belum Ada Transaksi', value: 1, color: '#cbd5e1' }]
    }
    return data
  }, [totalPending, totalProcessedSbb, totalProcessedPl, totalPriceSbd, totalRejected, totalQuotationSent])

  // --- TOP PRODUCTS BAR CHART DATA ---
  const topProductsData = useMemo(() => {
    return barangList
      .map((b) => ({
        nama: b.nama.length > 15 ? b.nama.substring(0, 15) + '...' : b.nama,
        keluar: b.barangKeluar || 0,
        sisa: (b.stokAwal || 0) + (b.barangMasuk || 0) - (b.barangKeluar || 0),
      }))
      .sort((a, b) => b.keluar - a.keluar)
      .slice(0, 6)
  }, [barangList])

  return (
    <MainLayout userRole="admin" userName={userName} userEmail={userEmail}>
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-title mb-1">Dashboard</h1>
          <p className="text-muted-foreground">
            Selamat datang kembali, <span className="font-semibold text-primary">{userName}</span> 👋
          </p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white px-3 py-1.5 rounded-lg border border-border">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span>Memuat data database...</span>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <SummaryCard
          title="Total Permintaan"
          value={totalPermintaan.toString()}
          icon={<ShoppingCart className="w-6 h-6" />}
          backgroundColor="bg-blue-50"
          iconColor="text-blue-600"
        />

        <SummaryCard
          title="Total Pending"
          value={totalPending.toString()}
          icon={<AlertCircle className="w-6 h-6" />}
          backgroundColor="bg-yellow-50"
          iconColor="text-yellow-600"
        />

        <SummaryCard
          title="Processed SBB"
          value={totalProcessedSbb.toString()}
          icon={<TrendingUp className="w-6 h-6" />}
          backgroundColor="bg-amber-50"
          iconColor="text-amber-600"
        />

        <SummaryCard
          title="Quotation Sent"
          value={totalQuotationSent.toString()}
          icon={<CheckCircle className="w-6 h-6" />}
          backgroundColor="bg-green-50"
          iconColor="text-green-600"
        />

        <SummaryCard
          title="Barang Keluar"
          value={totalBarangKeluar.toString()}
          icon={<Package className="w-6 h-6" />}
          backgroundColor="bg-purple-50"
          iconColor="text-purple-600"
        />

        <SummaryCard
          title="Stok Tersedia"
          value={totalStokTersedia.toString()}
          icon={<BarChart3 className="w-6 h-6" />}
          backgroundColor="bg-pink-50"
          iconColor="text-pink-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2">
          <div className="dashboard-card p-6">
            <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">Trend Permintaan Buyer</h3>
                <p className="text-xs text-muted-foreground">Grafik statistik pergerakan transaksi pesanan</p>
              </div>
              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setDateFilter('hari')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    dateFilter === 'hari'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Hari
                </button>
                <button
                  onClick={() => setDateFilter('minggu')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    dateFilter === 'minggu'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Minggu
                </button>
                <button
                  onClick={() => setDateFilter('bulan')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    dateFilter === 'bulan'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Bulan
                </button>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTransaksi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="transaksi"
                    name="Jumlah Transaksi"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorTransaksi)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Status Pie Chart */}
        <div className="dashboard-card p-6 flex flex-col justify-between">
          <div className="border-b border-border pb-4 mb-4">
            <h3 className="text-lg font-bold text-foreground">Persentase Status</h3>
            <p className="text-xs text-muted-foreground">Distribusi status permintaan saat ini</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border">
            {statusPieData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-xs font-medium text-gray-700">{item.name}:</span>
                <span className="text-xs font-bold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products Bar Chart */}
        <div className="lg:col-span-2">
          <div className="dashboard-card p-6">
            <div className="border-b border-border pb-4 mb-6">
              <h3 className="text-lg font-bold text-foreground">Produk Paling Banyak Terjual</h3>
              <p className="text-xs text-muted-foreground">Perbandingan kuantitas barang keluar vs sisa stok di gudang</p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="nama" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="keluar" name="Barang Keluar (Terjual)" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="sisa" name="Sisa Stok Gudang" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <ActivityLog />
      </div>
    </MainLayout>
  )
}
