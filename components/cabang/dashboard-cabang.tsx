'use client'

import { useState, useEffect, useMemo } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import {
  ShoppingCart,
  ShoppingBag,
  Package,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Calendar,
  Filter,
  RefreshCw,
  TrendingUp,
  ChevronDown,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const PERIOD_OPTIONS = [
  { value: 'Semua Waktu', label: 'Semua Waktu' },
  { value: '01', label: 'Januari 2026' },
  { value: '02', label: 'Februari 2026' },
  { value: '03', label: 'Maret 2026' },
  { value: '04', label: 'April 2026' },
  { value: '05', label: 'Mei 2026' },
  { value: '06', label: 'Juni 2026' },
  { value: '07', label: 'Juli 2026' },
  { value: '08', label: 'Agustus 2026' },
  { value: '09', label: 'September 2026' },
  { value: '10', label: 'Oktober 2026' },
  { value: '11', label: 'November 2026' },
  { value: '12', label: 'Desember 2026' },
]

export function DashboardCabang() {
  const [userName, setUserName] = useState('AISYAH (Direksi Cabang)')
  const [selectedKomoditas, setSelectedKomoditas] = useState('Semua Komoditas')
  const [selectedPeriod, setSelectedPeriod] = useState('Semua Waktu')
  const [lastUpdatedTime, setLastUpdatedTime] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Real data from database
  const [permintaanList, setPermintaanList] = useState<any[]>([])
  const [bahanBakuList, setBahanBakuList] = useState<any[]>([])
  const [barangList, setBarangList] = useState<any[]>([])

  useEffect(() => {
    fetchProfile()
    fetchDashboardData()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const data = await res.json()
        if (data?.name) {
          const emailClean = (data.email || '').toLowerCase()
          const isDireksi = data.role === 'direksi' || emailClean.includes('aisyah')
          const roleLabel = isDireksi ? 'Direksi Cabang' : 'Staff Cabang'
          setUserName(`${data.name.toUpperCase()} (${roleLabel})`)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      const [resP, resB, resBarang] = await Promise.all([
        fetch('/api/permintaan'),
        fetch('/api/bahan-baku'),
        fetch('/api/barang'),
      ])

      if (resP.ok) {
        const data = await resP.json()
        setPermintaanList(data || [])
      }
      if (resB.ok) {
        const data = await resB.json()
        setBahanBakuList(data || [])
      }
      if (resBarang.ok) {
        const data = await resBarang.json()
        setBarangList(data || [])
      }

      // Update timestamp
      const now = new Date()
      const day = now.getDate()
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
      const formattedDate = `${day} ${months[now.getMonth()]} ${now.getFullYear()}, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      setLastUpdatedTime(formattedDate)
    } catch (e) {
      console.error('Error loading dashboard data:', e)
    } finally {
      setIsLoading(false)
    }
  }

  // --- FILTERED DATA SETS (PERIOD + KOMODITAS) ---
  const matchPeriod = (dateStr: string | undefined, periodVal: string) => {
    if (!dateStr || periodVal === 'Semua Waktu') return true
    const lower = dateStr.toLowerCase()
    const monthNames: Record<string, string[]> = {
      '01': ['01', 'januari', 'jan'],
      '02': ['02', 'februari', 'feb'],
      '03': ['03', 'maret', 'mar'],
      '04': ['04', 'april', 'apr'],
      '05': ['05', 'mei', 'may'],
      '06': ['06', 'juni', 'jun'],
      '07': ['07', 'juli', 'jul'],
      '08': ['08', 'agustus', 'agu', 'aug'],
      '09': ['09', 'september', 'sep'],
      '10': ['10', 'oktober', 'okt', 'oct'],
      '11': ['11', 'november', 'nov'],
      '12': ['12', 'desember', 'des', 'dec'],
    }
    const tokens = monthNames[periodVal] || [periodVal]
    const matchSlash = lower.includes(`/${periodVal}/`) || lower.includes(`-${periodVal}-`)
    const matchTokens = tokens.some((t) => lower.includes(t))
    return matchSlash || matchTokens
  }

  const filteredPermintaan = useMemo(() => {
    return permintaanList.filter((p) => {
      // 1. Komoditas
      if (selectedKomoditas !== 'Semua Komoditas') {
        const inItems = p.items?.some((it: any) => it.name?.toLowerCase().includes(selectedKomoditas.toLowerCase()))
        const inName = (p.komoditas || '').toLowerCase().includes(selectedKomoditas.toLowerCase())
        if (!inItems && !inName) return false
      }
      // 2. Period
      if (selectedPeriod !== 'Semua Waktu') {
        const dateStr = p.tanggal || p.lastUpdated || p.createdAt
        if (!matchPeriod(dateStr, selectedPeriod)) return false
      }
      return true
    })
  }, [permintaanList, selectedKomoditas, selectedPeriod])

  const filteredBahanBaku = useMemo(() => {
    return bahanBakuList.filter((b) => {
      // 1. Komoditas
      if (selectedKomoditas !== 'Semua Komoditas') {
        const inKomoditas = (b.komoditas || b.barang || '').toLowerCase().includes(selectedKomoditas.toLowerCase())
        if (!inKomoditas) return false
      }
      // 2. Period
      if (selectedPeriod !== 'Semua Waktu') {
        const dateStr = b.lastUpdated || b.createdAt
        if (!matchPeriod(dateStr, selectedPeriod)) return false
      }
      return true
    })
  }, [bahanBakuList, selectedKomoditas, selectedPeriod])

  // --- 1. 100% REAL DYNAMIC KPI CALCULATIONS ---
  const totalPermintaanBuyer = filteredPermintaan.length

  const totalQtyPermintaan = useMemo(() => {
    return filteredPermintaan.reduce((acc, p) => acc + (p.totalQty || 0), 0)
  }, [filteredPermintaan])

  const totalStokTersedia = useMemo(() => {
    return barangList.reduce((acc, b) => {
      const stok = (b.stokAwal || 0) + (b.barangMasuk || 0) - (b.barangKeluar || 0)
      return acc + (stok > 0 ? stok : 0)
    }, 0)
  }, [barangList])

  const totalSumberBahanBaku = useMemo(() => {
    let count = 0
    filteredBahanBaku.forEach((b) => {
      count += (b.sumber && b.sumber.length) || 0
    })
    return count
  }, [filteredBahanBaku])

  const totalApproval = useMemo(() => {
    return filteredPermintaan.filter(
      (p) => p.status === 'selesai' || p.status === 'quotation_sent' || p.statusStok === 'Stock'
    ).length
  }, [filteredPermintaan])

  const approvalPct = totalPermintaanBuyer > 0 ? Math.round((totalApproval / totalPermintaanBuyer) * 100) : 0

  // --- 2. 100% REAL DYNAMIC STATUS KETERSEDIAAN BREAKDOWN ---
  const statusKetersediaan = useMemo(() => {
    let suitableQty = 0
    let limitedSupplyQty = 0
    let priceNotCompQty = 0
    let unsuitableQty = 0

    filteredBahanBaku.forEach((b) => {
      const qReq = b.qtyPermintaan || b.qty || 0
      const pBuyer = b.hargaBuyer || 0
      const sumberArr = b.sumber || []

      const qSrc = sumberArr.reduce((sum: number, s: any) => sum + (s.qty || 0), 0)
      const totalCost = sumberArr.reduce(
        (sum: number, s: any) => sum + (s.qty || 0) * (s.harga || s.hargaBahanBaku || 0),
        0
      )
      const pAvg = qSrc > 0 ? totalCost / qSrc : 0

      const isQtyEnough = qSrc >= qReq && qSrc > 0
      const isPriceMatch = pAvg <= pBuyer || pBuyer === 0

      if (isQtyEnough && isPriceMatch) {
        suitableQty += qReq
      } else if (!isQtyEnough && isPriceMatch) {
        limitedSupplyQty += qReq
      } else if (isQtyEnough && !isPriceMatch) {
        priceNotCompQty += qReq
      } else {
        unsuitableQty += qReq
      }
    })

    const totalCalculated = suitableQty + limitedSupplyQty + priceNotCompQty + unsuitableQty || 1

    return {
      suitable: {
        qty: suitableQty,
        pct: `${Math.round((suitableQty / totalCalculated) * 100)}%`,
      },
      limitedSupply: {
        qty: limitedSupplyQty,
        pct: `${Math.round((limitedSupplyQty / totalCalculated) * 100)}%`,
      },
      priceNotComp: {
        qty: priceNotCompQty,
        pct: `${Math.round((priceNotCompQty / totalCalculated) * 100)}%`,
      },
      unsuitable: {
        qty: unsuitableQty,
        pct: `${Math.round((unsuitableQty / totalCalculated) * 100)}%`,
      },
    }
  }, [filteredBahanBaku])

  // --- 3. 100% REAL PERBANDINGAN PERMINTAAN VS STOK ---
  const shortageQty = Math.max(0, totalQtyPermintaan - totalStokTersedia)
  const shortagePct = totalQtyPermintaan > 0 ? Math.round((shortageQty / totalQtyPermintaan) * 100) : 0
  const combinedTotal = totalQtyPermintaan + totalStokTersedia || 1
  const permintaanBarPct = Math.round((totalQtyPermintaan / combinedTotal) * 100)
  const stokBarPct = 100 - permintaanBarPct

  // --- 4. 100% REAL DYNAMIC KOMODITAS TERBANYAK DATA ---
  const komoditasChartData = useMemo(() => {
    const map: { [key: string]: number } = {}
    filteredPermintaan.forEach((p) => {
      if (p.items && p.items.length > 0) {
        p.items.forEach((it: any) => {
          const name = it.name || 'Lainnya'
          map[name] = (map[name] || 0) + (it.qty || 0)
        })
      }
    })

    const arr = Object.entries(map)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 7)

    if (arr.length === 0) {
      return [{ name: 'Belum Ada Data', qty: 0 }]
    }
    return arr
  }, [filteredPermintaan])

  // --- 5. 100% REAL DYNAMIC NEGARA BUYER DATA ---
  const negaraPieData = useMemo(() => {
    const map: { [key: string]: number } = {}
    filteredPermintaan.forEach((p) => {
      const country = p.negara || p.tujuan?.split(',')?.pop()?.trim() || 'Lainnya'
      map[country] = (map[country] || 0) + 1
    })

    const palette = ['#2563eb', '#10b981', '#f59e0b', '#a855f7', '#06b6d4', '#ec4899', '#64748b']
    const total = filteredPermintaan.length || 1

    return Object.entries(map)
      .map(([name, value], idx) => ({
        name,
        value,
        pct: `${Math.round((value / total) * 100)}%`,
        color: palette[idx % palette.length],
      }))
      .sort((a, b) => b.value - a.value)
  }, [filteredPermintaan])

  // --- 6. 100% REAL DYNAMIC AKTIVITAS TERBARU ---
  const recentActivities = useMemo(() => {
    const activities: any[] = []

    // Dari permintaan
    filteredPermintaan.forEach((p, idx) => {
      const itemSample = p.items?.[0]
      const reqNum = p.noRequest || `INQ-2026-00${idx + 1}`
      activities.push({
        id: `p-${p._id || idx}`,
        title: `${reqNum} • ${p.buyer || 'Buyer'}`,
        subtitle: `${new Intl.NumberFormat('id-ID').format(p.totalQty || 0)} kg | ${p.statusStok || 'Stock'} | ${p.tujuan || p.negara || 'Ekspor'}`,
        time: p.lastUpdated || `${p.tanggal || '28/08/2026'} oleh ${p.createdBy || 'Aisyah (Direksi)'}`,
        icon: ShoppingCart,
        iconBg: 'bg-blue-100 text-blue-600',
      })
    })

    // Dari bahan baku
    filteredBahanBaku.forEach((b, idx) => {
      if (b.sumber && b.sumber.length > 0) {
        const s = b.sumber[0]
        activities.push({
          id: `b-${b._id || idx}`,
          title: `Bahan Baku • ${b.komoditas || b.barang || 'Ikan'}`,
          subtitle: `${s.cabang || 'Cabang'} - ${s.supplier || 'Supplier'} | ${new Intl.NumberFormat('id-ID').format(s.qty || 0)} kg`,
          time: s.lastUpdated || b.lastUpdated || 'Hari ini',
          icon: Package,
          iconBg: 'bg-emerald-100 text-emerald-600',
        })
      }
    })

    return activities.slice(0, 5)
  }, [filteredPermintaan, filteredBahanBaku])

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num)
  }

  // List komoditas options
  const komoditasOptions = useMemo(() => {
    const set = new Set<string>()
    permintaanList.forEach((p) => {
      p.items?.forEach((it: any) => {
        if (it.name) set.add(it.name)
      })
    })
    bahanBakuList.forEach((b) => {
      if (b.komoditas) set.add(b.komoditas)
      if (b.barang) set.add(b.barang)
    })
    return ['Semua Komoditas', ...Array.from(set)]
  }, [permintaanList, bahanBakuList])

  return (
    <MainLayout>
      <div className="space-y-6 pb-8 select-none">
        {/* TOP HEADER & GLOBAL FILTERS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Selamat datang kembali, <span className="font-semibold text-blue-600">{userName}</span> 👋
            </p>
          </div>

          {/* Filters Bar */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Periode Filter Dropdown */}
            <div className="relative">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="appearance-none bg-white pl-8 pr-8 py-2 rounded-xl border border-slate-200 shadow-xs text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer"
              >
                {PERIOD_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Komoditas Filter */}
            <div className="relative">
              <select
                value={selectedKomoditas}
                onChange={(e) => setSelectedKomoditas(e.target.value)}
                className="appearance-none bg-white pl-8 pr-8 py-2 rounded-xl border border-slate-200 shadow-xs text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer"
              >
                {komoditasOptions.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 1. ROW 1: 5 KPI CARDS (100% REAL DARI DATABASE) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* KPI 1: Total Permintaan Buyer */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-500 leading-tight">Total Permintaan Buyer</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-800 tracking-tight">{totalPermintaanBuyer}</span>
                <span className="text-xs font-semibold text-slate-400">Permintaan</span>
              </div>
              <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                Data Real Database
              </p>
            </div>
          </div>

          {/* KPI 2: Total Qty Permintaan */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-500 leading-tight">Total Qty Permintaan</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-800 tracking-tight">{formatNumber(totalQtyPermintaan)}</span>
                <span className="text-xs font-semibold text-slate-400">kg</span>
              </div>
              <p className="text-[11px] font-medium text-slate-400">
                Total Keseluruhan Permintaan
              </p>
            </div>
          </div>

          {/* KPI 3: Total Stok Tersedia */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-500 leading-tight">Total Stok Tersedia</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-800 tracking-tight">{formatNumber(totalStokTersedia)}</span>
                <span className="text-xs font-semibold text-slate-400">kg</span>
              </div>
              <p className="text-[11px] font-medium text-slate-400">
                Gudang Real Stock
              </p>
            </div>
          </div>

          {/* KPI 4: Jumlah Sumber Bahan Baku */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-500 leading-tight">Jumlah Sumber Bahan Baku</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-800 tracking-tight">{totalSumberBahanBaku}</span>
                <span className="text-xs font-semibold text-slate-400">Total Aktif</span>
              </div>
              <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                Multi-Supplier Cabang
              </p>
            </div>
          </div>

          {/* KPI 5: Permintaan Sudah di-Approval */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-500 leading-tight">Permintaan yang Sudah di-Approval</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-800 tracking-tight">{totalApproval}</span>
                <span className="text-xs font-semibold text-slate-400">Permintaan / Sumber</span>
              </div>
              <p className="text-[11px] font-semibold text-blue-600">
                {approvalPct}% dari total permintaan
              </p>
            </div>
          </div>
        </div>

        {/* 2. ROW 2: RINGKASAN STATUS & PERBANDINGAN (REAL DATA) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Ringkasan Status Ketersediaan (7 cols) */}
          <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-800">
                Ringkasan Status Ketersediaan <span className="text-xs font-normal text-slate-500">(berdasarkan perbandingan harga & stok)</span>
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Suitable */}
              <div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-800">Suitable</span>
                </div>
                <p className="text-base font-bold text-slate-800">{formatNumber(statusKetersediaan.suitable.qty)} kg</p>
                <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">({statusKetersediaan.suitable.pct})</p>
              </div>

              {/* Limited Supply */}
              <div className="bg-amber-50/40 border border-amber-200 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-amber-800">Limited Supply</span>
                </div>
                <p className="text-base font-bold text-slate-800">{formatNumber(statusKetersediaan.limitedSupply.qty)} kg</p>
                <p className="text-[11px] font-semibold text-amber-600 mt-0.5">({statusKetersediaan.limitedSupply.pct})</p>
              </div>

              {/* Price Not Competitive */}
              <div className="bg-orange-50/40 border border-orange-200 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span className="text-xs font-bold text-orange-800">Price Not Comp.</span>
                </div>
                <p className="text-base font-bold text-slate-800">{formatNumber(statusKetersediaan.priceNotComp.qty)} kg</p>
                <p className="text-[11px] font-semibold text-orange-600 mt-0.5">({statusKetersediaan.priceNotComp.pct})</p>
              </div>

              {/* Unsuitable */}
              <div className="bg-rose-50/40 border border-rose-200 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span className="text-xs font-bold text-rose-800">Unsuitable</span>
                </div>
                <p className="text-base font-bold text-slate-800">{formatNumber(statusKetersediaan.unsuitable.qty)} kg</p>
                <p className="text-[11px] font-semibold text-rose-600 mt-0.5">({statusKetersediaan.unsuitable.pct})</p>
              </div>
            </div>
          </div>

          {/* Perbandingan Permintaan vs Stok (5 cols) */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3">Perbandingan Permintaan vs Stok</h3>

              {/* Split Progress Bar */}
              <div className="w-full h-4 rounded-full overflow-hidden bg-slate-100 flex shadow-inner mb-3">
                <div
                  style={{ width: `${Math.max(5, permintaanBarPct)}%` }}
                  className="bg-blue-600 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500"
                >
                  {permintaanBarPct}%
                </div>
                <div
                  style={{ width: `${Math.max(5, stokBarPct)}%` }}
                  className="bg-emerald-500 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500"
                >
                  {stokBarPct}%
                </div>
              </div>

              {/* Numbers */}
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-[11px] font-medium text-slate-400">Total Permintaan</p>
                  <p className="text-sm font-bold text-blue-600">{formatNumber(totalQtyPermintaan)} kg</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-medium text-slate-400">Total Stok Tersedia</p>
                  <p className="text-sm font-bold text-emerald-600">{formatNumber(totalStokTersedia)} kg</p>
                </div>
              </div>
            </div>

            {/* Warning Alert Banner */}
            <div className="bg-rose-50 border border-rose-200/60 rounded-xl p-2.5 flex items-center gap-2 text-xs font-semibold text-rose-700">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                {shortageQty > 0
                  ? `Kekurangan ${formatNumber(shortageQty)} kg (${shortagePct}%) dari total permintaan`
                  : 'Stok di gudang mencukupi seluruh total permintaan buyer'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. ROW 3: 3 ANALYTICS COLUMNS (100% REAL DATA DARI DATABASE) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column 1: Komoditas Permintaan Terbanyak (4 cols) */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 leading-tight">Komoditas dengan Permintaan Terbanyak</h3>
              <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                Real-Time
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={komoditasChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 25, bottom: 5 }}
                >
                  <XAxis
                    type="number"
                    tickFormatter={(val) => (val >= 1000 ? `${Math.round(val / 1000)}k` : val)}
                    fontSize={10}
                    stroke="#94a3b8"
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    fontSize={11}
                    stroke="#64748b"
                    tickLine={false}
                    axisLine={false}
                    width={85}
                  />
                  <Tooltip
                    formatter={(val: any) => [`${formatNumber(val)} kg`, 'Qty Permintaan']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="qty" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-1">
              <span className="text-[11px] font-medium text-slate-400">Qty (kg)</span>
            </div>
          </div>

          {/* Column 2: Negara / Tujuan Buyer Terbanyak (4 cols) */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 leading-tight">Negara / Tujuan Buyer Terbanyak</h3>
              <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                Real-Time
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 h-64">
              {/* Donut Chart with Center Text */}
              <div className="relative w-40 h-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={negaraPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={68}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {negaraPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any, name: any) => [`${val} Transaksi`, name]}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-extrabold text-slate-800 leading-tight">
                    {totalPermintaanBuyer}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
                </div>
              </div>

              {/* Legends */}
              <div className="space-y-1.5 flex-1 pl-2 max-h-56 overflow-y-auto custom-scrollbar">
                {negaraPieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="font-medium text-slate-600 truncate max-w-[70px]">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-800 text-[11px]">
                      {item.value} <span className="text-slate-400 font-normal">({item.pct})</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-4" />
          </div>

          {/* Column 3: Aktivitas Terbaru (4 cols) */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 leading-tight">Aktivitas Terbaru</h3>
              <a
                href="/permintaan"
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                Lihat Semua
              </a>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-64 custom-scrollbar pr-1">
              {recentActivities.length > 0 ? (
                recentActivities.map((act) => {
                  const Icon = act.icon
                  return (
                    <div key={act.id} className="flex items-start gap-2.5">
                      <div className={`w-7 h-7 rounded-lg ${act.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 leading-snug truncate">{act.title}</p>
                        <p className="text-[11px] text-slate-400 truncate">{act.subtitle}</p>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 shrink-0 ml-1">{act.time}</span>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">Belum ada aktivitas tercatat</div>
              )}
            </div>
            <div className="h-4" />
          </div>
        </div>

        {/* FOOTER METADATA */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-200/60">
          <div className="flex items-center gap-1.5">
            <span>Last Updated: {lastUpdatedTime || 'Hari ini'}</span>
            <button
              onClick={() => fetchDashboardData()}
              className="p-1 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
            <span>oleh {userName}</span>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
