'use client'

import { useState, useEffect, useMemo } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { formatUserRoleLabel } from '@/lib/utils'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  ShoppingCart,
  ShoppingBag,
  Layers,
  Plus,
  Search,
  Calendar,
  Filter,
  RefreshCw,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Pencil,
  ChevronDown,
  ChevronUp,
  FileText,
  Download,
} from 'lucide-react'

export interface PermintaanSizeItem {
  size: string
  qty: number
  harga: number
  currency: 'IDR' | 'USD' | 'JPY'
}

export interface PermintaanRow {
  _id: string
  noRequest: string
  tanggal: string
  buyer: string
  negara: string
  tujuan?: string
  komoditas: string
  spesifikasi: string
  size?: string
  qty: number
  hargaBuyer: number // in base IDR, 0 = Not Available
  hargaMin?: number
  hargaMax?: number
  currencyBuyer?: 'USD' | 'IDR' | 'JPY'
  sizes?: PermintaanSizeItem[]
  statusStok: 'Stock' | 'Non-Stock'
  lastUpdated: string
  catatan?: string
  fileQuotation?: string
}

// Initial flat seed records matching the revision guide
const INITIAL_CABANG_PERMINTAAN: PermintaanRow[] = [
  {
    _id: 'inq-1',
    noRequest: 'INQ-2026-001',
    tanggal: '04/09/2026',
    buyer: 'Ocean Trading Co.Ltd',
    negara: 'Korea Selatan',
    tujuan: 'Busan, Korea',
    komoditas: 'Cuttlefish',
    spesifikasi: 'Whole Clean, FOB, Packing : 4.5kg or 5.0kg x 2 blocks, Grade A',
    qty: 25000,
    hargaBuyer: 3312500000,
    hargaMin: 125000,
    hargaMax: 140000,
    currencyBuyer: 'IDR',
    sizes: [
      { size: '100 - 200 g', qty: 5000, harga: 125000, currency: 'IDR' },
      { size: '200 - 300 g', qty: 8000, harga: 130000, currency: 'IDR' },
      { size: '300 - 500 g', qty: 7000, harga: 135000, currency: 'IDR' },
      { size: '500 g Up', qty: 5000, harga: 140000, currency: 'IDR' },
    ],
    statusStok: 'Stock',
    lastUpdated: '04/09/2026 oleh Nailah (Admin Pusat)',
  },
  {
    _id: 'inq-2',
    noRequest: 'INQ-2026-002',
    tanggal: '01/09/2026',
    buyer: 'MMP International Co.Ltd',
    negara: 'Thailand',
    tujuan: 'Bangkok, Thailand',
    komoditas: 'Skipjack Tuna',
    spesifikasi: 'Grade A, Whole Round, Frozen',
    qty: 25000,
    hargaBuyer: 729000000,
    hargaMin: 27540,
    hargaMax: 30780,
    currencyBuyer: 'USD',
    sizes: [
      { size: '1 - 2 kg', qty: 10000, harga: 1.70, currency: 'USD' },
      { size: '2 - 4 kg', qty: 10000, harga: 1.80, currency: 'USD' },
      { size: '4 kg up', qty: 5000, harga: 1.90, currency: 'USD' },
    ],
    statusStok: 'Stock',
    lastUpdated: '01/09/2026 oleh Nailah (Admin Pusat)',
  },
  {
    _id: 'inq-3',
    noRequest: 'INQ-2026-003',
    tanggal: '28/08/2026',
    buyer: 'Siam Canadian',
    negara: 'China',
    tujuan: 'Guangzhou Port, China',
    komoditas: 'Squid',
    spesifikasi: 'Tube & Tentacles, Semi-IQF',
    qty: 10000,
    hargaBuyer: 340200000,
    currencyBuyer: 'USD',
    sizes: [
      { size: 'U5', qty: 4000, harga: 2.10, currency: 'USD' },
      { size: 'U7', qty: 6000, harga: 2.10, currency: 'USD' },
    ],
    statusStok: 'Stock',
    lastUpdated: '28/08/2026 oleh Tami (Pusat)',
  },
  {
    _id: 'inq-4',
    noRequest: 'INQ-2026-004',
    tanggal: '27/08/2026',
    buyer: 'Saigon Blue Ocean JSC',
    negara: 'Vietnam',
    tujuan: 'Da Nang, Vietnam',
    komoditas: 'Yellowfin Tuna',
    spesifikasi: 'Saku AAA, CO Treated',
    qty: 30000,
    hargaBuyer: 1433700000,
    currencyBuyer: 'USD',
    sizes: [
      { size: '10 kg up', qty: 15000, harga: 2.80, currency: 'USD' },
      { size: '20 kg up', qty: 15000, harga: 3.10, currency: 'USD' },
    ],
    statusStok: 'Stock',
    lastUpdated: '27/08/2026 oleh Nailah (Admin Pusat)',
  },
  {
    _id: 'inq-5',
    noRequest: 'INQ-2026-005',
    tanggal: '25/08/2026',
    buyer: 'Hong Ly Seafood',
    negara: 'Vietnam',
    tujuan: 'Ho Chi Minh Port, Vietnam',
    komoditas: 'Squid',
    spesifikasi: 'Ring & Tentacles, IQF',
    qty: 20000,
    hargaBuyer: 729000000,
    currencyBuyer: 'USD',
    sizes: [
      { size: 'Cleaned Size A', qty: 10000, harga: 2.00, currency: 'USD' },
      { size: 'Cleaned Size B', qty: 10000, harga: 2.50, currency: 'USD' },
    ],
    statusStok: 'Stock',
    lastUpdated: '25/08/2026 oleh Roberto (Pusat)',
  },
  {
    _id: 'inq-6',
    noRequest: 'INQ-2026-006',
    tanggal: '20/08/2026',
    buyer: 'Alief IKE',
    negara: 'Yunani',
    tujuan: 'Athens Port, Greece',
    komoditas: 'Octopus',
    spesifikasi: '1-2 kg/pc, Frozen Ball',
    qty: 5000,
    hargaBuyer: 486000000,
    currencyBuyer: 'USD',
    sizes: [
      { size: '1 - 2 kg', qty: 5000, harga: 6.00, currency: 'USD' },
    ],
    statusStok: 'Stock',
    lastUpdated: '20/08/2026 oleh Nailah (Admin Pusat)',
  },
  {
    _id: 'inq-7',
    noRequest: 'INQ-2026-007',
    tanggal: '18/08/2026',
    buyer: 'Trang Thuy Seafood',
    negara: 'Vietnam',
    tujuan: 'Da Nang, Vietnam',
    komoditas: 'Yellowfin Tuna',
    spesifikasi: 'Loin IVP, Grade A',
    qty: 15000,
    hargaBuyer: 619650000,
    currencyBuyer: 'USD',
    sizes: [
      { size: '2 - 3 kg', qty: 8000, harga: 2.30, currency: 'USD' },
      { size: '3 - 5 kg', qty: 7000, harga: 2.80, currency: 'USD' },
    ],
    statusStok: 'Stock',
    lastUpdated: '18/08/2026 oleh Tami (Pusat)',
  },
]

export function PermintaanCabang() {
  const [data, setData] = useState<PermintaanRow[]>(INITIAL_CABANG_PERMINTAAN)
  const [barangList, setBarangList] = useState<any[]>([])
  const [bahanBakuList, setBahanBakuList] = useState<any[]>([])
  const [supplierList, setSupplierList] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [userName, setUserName] = useState('Aisyah (Direksi)')

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true)
        const res = await fetch('/api/permintaan')
        if (res.ok) {
          const dbData = await res.json()
          if (Array.isArray(dbData) && dbData.length > 0) {
            const mapped: PermintaanRow[] = dbData.map((d: any) => {
              const seedMatch = INITIAL_CABANG_PERMINTAAN.find(
                (s) => s.buyer.toLowerCase().trim() === (d.buyer || '').toLowerCase().trim()
              )

              let sizesList = d.sizes && d.sizes.length > 0 ? d.sizes : []
              if (sizesList.length === 0 && d.items && d.items.length > 0) {
                const hasSizes = d.items.some((it: any) => it.size && it.size !== '')
                if (hasSizes) {
                  sizesList = d.items.map((it: any) => ({
                    size: it.size || 'All Size',
                    qty: Number(it.qty) || 0,
                    harga: Number(it.harga) || 0,
                    currency: it.currency || d.currency || 'IDR',
                  }))
                }
              }
              if (sizesList.length === 0 && seedMatch && seedMatch.sizes) {
                sizesList = seedMatch.sizes
              }

              const komoditas = d.items?.[0]?.name || d.komoditas || (seedMatch ? seedMatch.komoditas : '-')
              const spesifikasi = d.items?.[0]?.spesifikasi || d.spesifikasi || (seedMatch ? seedMatch.spesifikasi : '-')
              const qty = d.totalQty || d.qty || (seedMatch ? seedMatch.qty : 0)
              const hargaBuyer = d.items?.[0]?.harga || d.hargaBuyer || (seedMatch ? seedMatch.hargaBuyer : 0)

              return {
                _id: d._id || d.id || `inq-${Math.random()}`,
                noRequest: d.noRequest || (seedMatch ? seedMatch.noRequest : 'INQ-2026-001'),
                tanggal: d.tanggal || (seedMatch ? seedMatch.tanggal : '04/09/2026'),
                buyer: d.buyer || (seedMatch ? seedMatch.buyer : '-'),
                negara: d.negara || (seedMatch ? seedMatch.negara : 'Indonesia'),
                tujuan: d.tujuan || (seedMatch ? seedMatch.tujuan : ''),
                komoditas,
                spesifikasi,
                qty,
                hargaBuyer,
                hargaMin: d.hargaMin || (seedMatch ? seedMatch.hargaMin : undefined),
                hargaMax: d.hargaMax || (seedMatch ? seedMatch.hargaMax : undefined),
                currencyBuyer: d.currency || d.currencyBuyer || (seedMatch ? seedMatch.currencyBuyer : 'IDR'),
                sizes: sizesList,
                statusStok: d.statusStok || 'Stock',
                lastUpdated: d.lastUpdated || '04/09/2026 oleh Nailah (Admin Pusat)',
                catatan: d.catatan || '',
                fileQuotation: d.fileQuotation || '',
              }
            })
            setData(mapped)
          }
        }
      } catch (e) {
        console.error('Error fetching permintaan:', e)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllData()
  }, [])

  // Currency / Kurs states
  const [selectedCurrency, setSelectedCurrency] = useState<'IDR' | 'USD' | 'JPY'>('IDR')
  const [rates, setRates] = useState({
    USD: 16200,
    JPY: 109.85,
  })
  const [isKursModalOpen, setIsKursModalOpen] = useState(false)
  const [tempRates, setTempRates] = useState({ USD: 16200, JPY: 109.85 })
  const [kursLastUpdated, setKursLastUpdated] = useState('Aktif per 30 Mei 2026, 14:30')

  // Filters
  const [searchBuyer, setSearchBuyer] = useState('')
  const [selectedNegara, setSelectedNegara] = useState('Pilih negara...')
  const [selectedKomoditas, setSelectedKomoditas] = useState('Pilih komoditas...')
  const [selectedPeriod, setSelectedPeriod] = useState('01/08/2026 - 30/08/2026')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<PermintaanRow | null>(null)

  // Size Detail Modal State
  const [isDetailSizeModalOpen, setIsDetailSizeModalOpen] = useState(false)
  const [selectedDetailItem, setSelectedDetailItem] = useState<PermintaanRow | null>(null)

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    buyer: '',
    negara: '',
    tujuan: '',
    komoditas: '',
    spesifikasi: '',
    qty: 0,
    currencyBuyer: 'USD' as 'USD' | 'IDR' | 'JPY',
    priceUnit: 'per_kg' as 'per_kg' | 'total',
    hargaBuyer: '', // String to allow empty / Not Available
    catatan: '',
  })

  // Size breakdown rows in Add Modal
  const [sizeRows, setSizeRows] = useState<Array<{ size: string; qty: string; currency: 'IDR' | 'USD' | 'JPY'; harga: string }>>([
    { size: '100 - 200 g', qty: '', currency: 'IDR', harga: '' },
    { size: '200 - 300 g', qty: '', currency: 'IDR', harga: '' },
    { size: '300 - 500 g', qty: '', currency: 'IDR', harga: '' },
    { size: '500 g Up', qty: '', currency: 'IDR', harga: '' },
  ])
  const [qtyBelumDibagi, setQtyBelumDibagi] = useState(false)
  const [singleQty, setSingleQty] = useState('')
  const [singleHarga, setSingleHarga] = useState('')
  const [singleCurrency, setSingleCurrency] = useState<'IDR' | 'USD' | 'JPY'>('IDR')

  // Dynamic size metrics calculation
  const sizeMetrics = useMemo(() => {
    if (qtyBelumDibagi) {
      const q = Number(singleQty) || 0
      const h = Number(singleHarga) || 0
      const curr = singleCurrency
      const formatH = (v: number) => curr === 'USD' ? `USD ${v.toFixed(2)}` : curr === 'JPY' ? `¥ ${v}` : `Rp ${new Intl.NumberFormat('id-ID').format(v)}`
      return {
        totalQty: q,
        minHarga: h,
        maxHarga: h,
        avgHarga: h,
        currency: curr,
        rangeText: h > 0 ? `${formatH(h)} / kg` : '—',
      }
    }

    let totalQ = 0
    const validPrices: number[] = []
    let sumWeighted = 0

    sizeRows.forEach((r) => {
      const q = Number(r.qty) || 0
      const h = Number(r.harga) || 0
      totalQ += q
      if (h > 0) {
        validPrices.push(h)
        sumWeighted += (q > 0 ? q * h : h)
      }
    })

    const minH = validPrices.length > 0 ? Math.min(...validPrices) : 0
    const maxH = validPrices.length > 0 ? Math.max(...validPrices) : 0
    const avgH = totalQ > 0 ? Math.round(sumWeighted / totalQ) : (validPrices.length > 0 ? Math.round(validPrices.reduce((a, b) => a + b, 0) / validPrices.length) : 0)
    const curr = sizeRows[0]?.currency || 'IDR'

    const formatH = (val: number) => curr === 'USD' ? `USD ${val.toFixed(2)}` : curr === 'JPY' ? `¥ ${val}` : `Rp ${new Intl.NumberFormat('id-ID').format(val)}`

    let rangeText = '—'
    if (minH > 0 && maxH > 0) {
      if (minH === maxH) {
        rangeText = `${formatH(minH)} / kg`
      } else {
        rangeText = `${formatH(minH)} - ${formatH(maxH)} / kg (Rata-rata: ${formatH(avgH)} / kg)`
      }
    }

    return { totalQty: totalQ, minHarga: minH, maxHarga: maxH, avgHarga: avgH, currency: curr, rangeText }
  }, [sizeRows, qtyBelumDibagi, singleQty, singleHarga, singleCurrency])

  const handleAddSizeRow = () => {
    setSizeRows((prev) => [
      ...prev,
      { size: '', qty: '', currency: prev[0]?.currency || 'IDR', harga: '' },
    ])
  }

  const handleRemoveSizeRow = (idx: number) => {
    setSizeRows((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleUpdateSizeRow = (idx: number, field: string, val: any) => {
    setSizeRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: val } : r))
    )
  }

  const handleDownloadDetailPDF = (item: PermintaanRow) => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('DETAIL PERMINTAAN BUYER', 14, 20)
    doc.setFontSize(10)
    doc.text(`Buyer: ${item.buyer}`, 14, 28)
    doc.text(`Negara / Tujuan: ${item.negara}`, 14, 34)
    doc.text(`Tanggal: ${item.tanggal}`, 14, 40)
    doc.text(`Komoditas: ${item.komoditas}`, 14, 46)
    doc.text(`Spesifikasi: ${item.spesifikasi || '-'}`, 14, 52)
    doc.text(`Total Qty: ${new Intl.NumberFormat('id-ID').format(item.qty)} kg`, 14, 58)

    const tableBody = (item.sizes || []).map((s, idx) => [
      idx + 1,
      s.size,
      `${new Intl.NumberFormat('id-ID').format(s.qty)} kg`,
      s.currency === 'USD' ? `USD ${s.harga.toFixed(2)}` : `Rp ${new Intl.NumberFormat('id-ID').format(s.harga)}`,
      s.currency
    ])

    autoTable(doc, {
      startY: 66,
      head: [['No', 'Size', 'Qty (kg)', 'Harga Buyer', 'Mata Uang']],
      body: tableBody,
      foot: [['Total', '', `${new Intl.NumberFormat('id-ID').format(item.qty)} kg`, '', '']],
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] },
    })

    doc.save(`Permintaan_${item.buyer.replace(/\s+/g, '_')}_${item.komoditas}.pdf`)
  }

  // Real-time calculation and currency conversion
  const calculatedPrices = useMemo(() => {
    const rawVal = parseFloat(formData.hargaBuyer) || 0
    if (rawVal <= 0) return null

    const qty = Number(formData.qty) || 1
    const usdRate = rates.USD || 17705
    const jpyRate = rates.JPY || 109.85

    let pricePerKgIDR = 0
    let totalPriceIDR = 0
    let pricePerKgOriginal = 0
    let totalPriceOriginal = 0

    if (formData.currencyBuyer === 'USD') {
      if (formData.priceUnit === 'per_kg') {
        pricePerKgOriginal = rawVal
        totalPriceOriginal = rawVal * qty
        pricePerKgIDR = Math.round(rawVal * usdRate)
        totalPriceIDR = Math.round(totalPriceOriginal * usdRate)
      } else {
        totalPriceOriginal = rawVal
        pricePerKgOriginal = rawVal / qty
        totalPriceIDR = Math.round(rawVal * usdRate)
        pricePerKgIDR = Math.round(pricePerKgOriginal * usdRate)
      }
    } else if (formData.currencyBuyer === 'JPY') {
      if (formData.priceUnit === 'per_kg') {
        pricePerKgOriginal = rawVal
        totalPriceOriginal = rawVal * qty
        pricePerKgIDR = Math.round(rawVal * jpyRate)
        totalPriceIDR = Math.round(totalPriceOriginal * jpyRate)
      } else {
        totalPriceOriginal = rawVal
        pricePerKgOriginal = rawVal / qty
        totalPriceIDR = Math.round(rawVal * jpyRate)
        pricePerKgIDR = Math.round(pricePerKgOriginal * jpyRate)
      }
    } else {
      // IDR
      if (formData.priceUnit === 'per_kg') {
        pricePerKgOriginal = rawVal
        totalPriceOriginal = rawVal * qty
        pricePerKgIDR = rawVal
        totalPriceIDR = totalPriceOriginal
      } else {
        totalPriceOriginal = rawVal
        pricePerKgOriginal = Math.round(rawVal / qty)
        totalPriceIDR = rawVal
        pricePerKgIDR = pricePerKgOriginal
      }
    }

    return {
      pricePerKgIDR,
      totalPriceIDR,
      pricePerKgOriginal,
      totalPriceOriginal,
      currency: formData.currencyBuyer,
      unit: formData.priceUnit,
    }
  }, [formData.hargaBuyer, formData.currencyBuyer, formData.priceUnit, formData.qty, rates.USD, rates.JPY])

  const handleTogglePriceUnit = (newUnit: 'per_kg' | 'total') => {
    if (newUnit === formData.priceUnit) return
    const currentVal = parseFloat(formData.hargaBuyer) || 0
    const qty = Number(formData.qty) || 1

    if (currentVal > 0) {
      if (newUnit === 'total') {
        const newTotal = currentVal * qty
        setFormData({
          ...formData,
          priceUnit: 'total',
          hargaBuyer: formData.currencyBuyer === 'USD' ? newTotal.toFixed(2) : Math.round(newTotal).toString(),
        })
      } else {
        const newPerKg = currentVal / qty
        setFormData({
          ...formData,
          priceUnit: 'per_kg',
          hargaBuyer: formData.currencyBuyer === 'USD' ? newPerKg.toFixed(2) : Math.round(newPerKg).toString(),
        })
      }
    } else {
      setFormData({ ...formData, priceUnit: newUnit })
    }
  }

  // Form State for Edit Permintaan (Nego Qty & Harga)
  const [editFormData, setEditFormData] = useState({
    id: '',
    noRequest: '',
    tanggal: '',
    buyer: '',
    negara: '',
    tujuan: '',
    komoditas: '',
    spesifikasi: '',
    qty: 0,
    currencyBuyer: 'USD' as 'USD' | 'IDR' | 'JPY',
    priceUnit: 'per_kg' as 'per_kg' | 'total',
    hargaBuyer: '', // String in selected currency
    catatan: '',
  })

  // Real-time calculation and currency conversion for Edit Form
  const calculatedEditPrices = useMemo(() => {
    const rawVal = parseFloat(editFormData.hargaBuyer) || 0
    if (rawVal <= 0) return null

    const qty = Number(editFormData.qty) || 1
    const usdRate = rates.USD || 17705
    const jpyRate = rates.JPY || 109.85

    let pricePerKgIDR = 0
    let totalPriceIDR = 0
    let pricePerKgOriginal = 0
    let totalPriceOriginal = 0

    if (editFormData.currencyBuyer === 'USD') {
      if (editFormData.priceUnit === 'per_kg') {
        pricePerKgOriginal = rawVal
        totalPriceOriginal = rawVal * qty
        pricePerKgIDR = Math.round(rawVal * usdRate)
        totalPriceIDR = Math.round(totalPriceOriginal * usdRate)
      } else {
        totalPriceOriginal = rawVal
        pricePerKgOriginal = rawVal / qty
        totalPriceIDR = Math.round(rawVal * usdRate)
        pricePerKgIDR = Math.round(pricePerKgOriginal * usdRate)
      }
    } else if (editFormData.currencyBuyer === 'JPY') {
      if (editFormData.priceUnit === 'per_kg') {
        pricePerKgOriginal = rawVal
        totalPriceOriginal = rawVal * qty
        pricePerKgIDR = Math.round(rawVal * jpyRate)
        totalPriceIDR = Math.round(totalPriceOriginal * jpyRate)
      } else {
        totalPriceOriginal = rawVal
        pricePerKgOriginal = rawVal / qty
        totalPriceIDR = Math.round(rawVal * jpyRate)
        pricePerKgIDR = Math.round(pricePerKgOriginal * jpyRate)
      }
    } else {
      // IDR
      if (editFormData.priceUnit === 'per_kg') {
        pricePerKgOriginal = rawVal
        totalPriceOriginal = rawVal * qty
        pricePerKgIDR = rawVal
        totalPriceIDR = totalPriceOriginal
      } else {
        totalPriceOriginal = rawVal
        pricePerKgOriginal = Math.round(rawVal / qty)
        totalPriceIDR = rawVal
        pricePerKgIDR = pricePerKgOriginal
      }
    }

    return {
      pricePerKgIDR,
      totalPriceIDR,
      pricePerKgOriginal,
      totalPriceOriginal,
      currency: editFormData.currencyBuyer,
      unit: editFormData.priceUnit,
    }
  }, [editFormData.hargaBuyer, editFormData.currencyBuyer, editFormData.priceUnit, editFormData.qty, rates.USD, rates.JPY])

  const handleToggleEditPriceUnit = (newUnit: 'per_kg' | 'total') => {
    if (newUnit === editFormData.priceUnit) return
    const currentVal = parseFloat(editFormData.hargaBuyer) || 0
    const qty = Number(editFormData.qty) || 1

    if (currentVal > 0) {
      if (newUnit === 'total') {
        const newTotal = currentVal * qty
        setEditFormData({
          ...editFormData,
          priceUnit: 'total',
          hargaBuyer: editFormData.currencyBuyer === 'USD' ? newTotal.toFixed(2) : Math.round(newTotal).toString(),
        })
      } else {
        const newPerKg = currentVal / qty
        setEditFormData({
          ...editFormData,
          priceUnit: 'per_kg',
          hargaBuyer: editFormData.currencyBuyer === 'USD' ? newPerKg.toFixed(2) : Math.round(newPerKg).toString(),
        })
      }
    } else {
      setEditFormData({ ...editFormData, priceUnit: newUnit })
    }
  }

  const handleOpenEdit = (row: PermintaanRow) => {
    setSelectedItem(row)
    
    // Auto-detect best currency based on country
    const isJapan = (row.negara || '').toLowerCase().includes('jepang') || (row.negara || '').toLowerCase().includes('japan')
    const isIndonesia = (row.negara || '').toLowerCase().includes('indonesia')
    const defaultCurr: 'USD' | 'IDR' | 'JPY' = isJapan ? 'JPY' : isIndonesia ? 'IDR' : 'USD'

    const currentRate = defaultCurr === 'USD' ? (rates.USD || 17705) : defaultCurr === 'JPY' ? (rates.JPY || 109.85) : 1
    const perKg = (row.qty > 0 && row.hargaBuyer > 0) ? (row.hargaBuyer / row.qty) : 0
    let defaultPriceStr = ''
    if (perKg > 0) {
      if (defaultCurr === 'USD') {
        defaultPriceStr = (perKg / currentRate).toFixed(2)
      } else if (defaultCurr === 'JPY') {
        defaultPriceStr = Math.round(perKg / currentRate).toString()
      } else {
        defaultPriceStr = Math.round(perKg).toString()
      }
    }

    // Convert date to YYYY-MM-DD for input date
    let dateVal = new Date().toISOString().split('T')[0]
    if (row.tanggal && row.tanggal.includes('/')) {
      const parts = row.tanggal.split('/')
      if (parts.length === 3) {
        dateVal = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
      }
    }

    setEditFormData({
      id: row._id,
      noRequest: row.noRequest,
      tanggal: dateVal,
      buyer: row.buyer,
      negara: row.negara,
      tujuan: row.tujuan || row.negara,
      komoditas: row.komoditas,
      spesifikasi: row.spesifikasi,
      qty: row.qty,
      currencyBuyer: defaultCurr,
      priceUnit: 'per_kg',
      hargaBuyer: defaultPriceStr,
      catatan: row.catatan || '',
    })

    setIsEditModalOpen(true)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editFormData.buyer || !editFormData.komoditas || editFormData.qty <= 0) {
      alert('Mohon lengkapi Nama Buyer, Komoditas, dan Kuantitas (Qty).')
      return
    }

    const numericTotalPrice = calculatedEditPrices ? calculatedEditPrices.totalPriceIDR : (editFormData.hargaBuyer ? parseFloat(editFormData.hargaBuyer) : 0)
    const numericPerKgPrice = calculatedEditPrices ? calculatedEditPrices.pricePerKgIDR : (editFormData.qty > 0 ? Math.round(numericTotalPrice / editFormData.qty) : numericTotalPrice)

    let formattedDate = ''
    if (editFormData.tanggal) {
      const parts = editFormData.tanggal.split('-')
      if (parts.length === 3) {
        formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`
      } else {
        formattedDate = editFormData.tanggal
      }
    } else {
      const now = new Date()
      formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`
    }

    // Update local state
    setData((prev) =>
      prev.map((item) =>
        item._id === editFormData.id
          ? {
              ...item,
              tanggal: formattedDate,
              buyer: editFormData.buyer,
              negara: editFormData.negara,
              tujuan: editFormData.tujuan,
              komoditas: editFormData.komoditas,
              spesifikasi: editFormData.spesifikasi,
              qty: Number(editFormData.qty),
              hargaBuyer: numericTotalPrice,
              lastUpdated: `${formattedDate} (Dinego oleh ${userName})`,
              catatan: editFormData.catatan,
            }
          : item
      )
    )

    setIsEditModalOpen(false)

    // Persist to Backend API
    try {
      const rawId = editFormData.id.includes('-') && editFormData.id.length > 20 ? editFormData.id.split('-')[0] : editFormData.id
      if (rawId && !rawId.startsWith('inq-')) {
        await fetch(`/api/permintaan/${rawId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tanggal: formattedDate,
            buyer: editFormData.buyer,
            negara: editFormData.negara,
            tujuan: editFormData.tujuan,
            items: [
              {
                name: editFormData.komoditas,
                spesifikasi: editFormData.spesifikasi,
                qty: Number(editFormData.qty),
                harga: numericTotalPrice,
                hargaBuyerPerKg: numericPerKgPrice,
              },
            ],
            catatan: editFormData.catatan,
          }),
        })
      }
      fetchRealData()
    } catch (err) {
      console.error('Error updating Permintaan:', err)
    }
  }

  const handleDeletePermintaan = async (row: PermintaanRow) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus permintaan dari "${row.buyer}" (${row.komoditas})?`)) {
      return
    }

    // Optimistic UI state update
    setData((prev) => prev.filter((item) => item._id !== row._id))

    // Persist to Backend API
    try {
      const rawId = row._id.includes('-') && row._id.length > 20 ? row._id.split('-')[0] : row._id
      if (rawId && !rawId.startsWith('inq-')) {
        await fetch(`/api/permintaan/${rawId}`, {
          method: 'DELETE',
        })
      }
      fetchRealData()
    } catch (err) {
      console.error('Error deleting Permintaan:', err)
    }
  }

  useEffect(() => {
    fetchProfile()
    fetchKursData()
    fetchRealData()
  }, [])

  const fetchKursData = async () => {
    try {
      const res = await fetch('/api/kurs')
      if (res.ok) {
        const d = await res.json()
        if (d?.USD && d?.JPY) {
          setRates({ USD: d.USD, JPY: d.JPY })
          setTempRates({ USD: d.USD, JPY: d.JPY })
          if (d.selectedCurrency) setSelectedCurrency(d.selectedCurrency)
          if (d.lastUpdated) setKursLastUpdated(d.lastUpdated)
        }
      }
    } catch (e) {
      console.error('Error fetching kurs:', e)
    }
  }

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const d = await res.json()
        if (d?.name) {
          const roleLabel = formatUserRoleLabel(d.role, d.name, d.email)
          setUserName(`${d.name} (${roleLabel})`)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchRealData = async () => {
    try {
      setIsLoading(true)
      const [resP, resB, resBarang, resSupplier] = await Promise.all([
        fetch('/api/permintaan'),
        fetch('/api/bahan-baku'),
        fetch('/api/barang'),
        fetch('/api/supplier'),
      ])

      let realBarang: any[] = []
      let realBahanBaku: any[] = []
      let realSupplier: any[] = []

      if (resBarang.ok) {
        realBarang = await resBarang.json()
        setBarangList(realBarang || [])
      }
      if (resB.ok) {
        realBahanBaku = await resB.json()
        setBahanBakuList(realBahanBaku || [])
      }
      if (resSupplier.ok) {
        realSupplier = await resSupplier.json()
        setSupplierList(realSupplier || [])
      }

      if (resP.ok) {
        const rawPermintaan = await resP.json()
        if (Array.isArray(rawPermintaan)) {
          if (rawPermintaan.length === 0) {
            setData(INITIAL_CABANG_PERMINTAAN)
          } else {
            const flatRows: PermintaanRow[] = []
            rawPermintaan.forEach((p: any) => {
              const seedMatch = INITIAL_CABANG_PERMINTAAN.find(
                (s) => s.buyer.toLowerCase().trim() === (p.buyer || '').toLowerCase().trim()
              )

              let sizesList = p.sizes && p.sizes.length > 0 ? p.sizes : []
              if (sizesList.length === 0 && p.items && p.items.length > 0) {
                if (p.items[0]?.sizes && p.items[0].sizes.length > 0) {
                  sizesList = p.items[0].sizes
                } else {
                  const hasSizes = p.items.some((it: any) => it.size && it.size !== '')
                  if (hasSizes) {
                    sizesList = p.items.map((it: any) => ({
                      size: it.size || 'All Size',
                      qty: Number(it.qty) || 0,
                      harga: Number(it.harga) || 0,
                      currency: it.currency || p.currency || 'IDR',
                    }))
                  }
                }
              }
              if (sizesList.length === 0 && seedMatch && seedMatch.sizes) {
                sizesList = seedMatch.sizes
              }

              const komoditasName = (p.items?.[0]?.name || p.komoditas || (seedMatch ? seedMatch.komoditas : 'Ikan')).trim()
              const kLower = komoditasName.toLowerCase()

              const inBarang = realBarang.some((b) => {
                const bNama = (b.nama || '').toLowerCase().trim()
                return bNama && (bNama.includes(kLower) || kLower.includes(bNama))
              })
              const inBahanBaku = realBahanBaku.some((bb) => {
                const bbName = (bb.komoditas || bb.barang || '').toLowerCase().trim()
                return (bbName && (bbName.includes(kLower) || kLower.includes(bbName))) && (bb.sumber?.length || 0) > 0
              })
              const inSupplier = realSupplier.some((s) => {
                const sKom = (s.komoditas || s.namaKomoditas || '').toLowerCase().trim()
                return sKom && (sKom.includes(kLower) || kLower.includes(sKom))
              })

              const autoStatus: 'Stock' | 'Non-Stock' = (inBarang || inBahanBaku || inSupplier) ? 'Stock' : 'Non-Stock'
              const spesifikasiText = p.items?.[0]?.spesifikasi || p.spesifikasi || (seedMatch ? seedMatch.spesifikasi : 'Whole Clean, FOB')

              flatRows.push({
                _id: p._id || p.id || `inq-${Math.random()}`,
                noRequest: p.noRequest || (seedMatch ? seedMatch.noRequest : `INQ-2026-${String(flatRows.length + 1).padStart(3, '0')}`),
                tanggal: p.tanggal || (seedMatch ? seedMatch.tanggal : '04/09/2026'),
                buyer: p.buyer || (seedMatch ? seedMatch.buyer : 'Buyer'),
                negara: p.negara || (seedMatch ? seedMatch.negara : 'Indonesia'),
                tujuan: p.tujuan || p.negara || (seedMatch ? seedMatch.tujuan : ''),
                komoditas: komoditasName,
                spesifikasi: spesifikasiText,
                qty: p.totalQty || p.qty || (seedMatch ? seedMatch.qty : 25000),
                hargaBuyer: p.items?.[0]?.harga || p.hargaBuyer || (seedMatch ? seedMatch.hargaBuyer : 0),
                hargaMin: p.hargaMin || (p.items?.[0]?.hargaMin) || (seedMatch ? seedMatch.hargaMin : undefined),
                hargaMax: p.hargaMax || (p.items?.[0]?.hargaMax) || (seedMatch ? seedMatch.hargaMax : undefined),
                currencyBuyer: p.currency || p.currencyBuyer || (seedMatch ? seedMatch.currencyBuyer : 'IDR'),
                sizes: sizesList,
                statusStok: p.statusStok || autoStatus,
                lastUpdated: p.lastUpdated || (seedMatch ? seedMatch.lastUpdated : '04/09/2026 oleh Nailah (Admin Pusat)'),
                catatan: p.catatan || '',
                fileQuotation: p.fileQuotation || '',
              })
            })
            setData(flatRows)
          }
        }
      }
    } catch (e) {
      console.error('Error loading Permintaan Cabang data:', e)
    } finally {
      setIsLoading(false)
    }
  }

  // --- CONVERSION LOGIC ---
  const formatPrice = (baseIdr: number) => {
    if (!baseIdr || baseIdr <= 0) {
      return <span className="text-slate-400 italic font-medium">Not Available</span>
    }

    if (selectedCurrency === 'USD') {
      const converted = baseIdr / rates.USD
      return (
        <span className="font-semibold text-slate-800">
          $ {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(converted)}
        </span>
      )
    }

    if (selectedCurrency === 'JPY') {
      const converted = baseIdr / rates.JPY
      return (
        <span className="font-semibold text-slate-800">
          ¥ {new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 0 }).format(converted)}
        </span>
      )
    }

    // Default IDR
    return (
      <span className="font-semibold text-slate-800">
        Rp {new Intl.NumberFormat('id-ID').format(baseIdr)}
      </span>
    )
  }

  // --- FILTER OPTIONS ---
  const negaraOptions = useMemo(() => {
    const set = new Set<string>()
    data.forEach((d) => {
      if (d.negara) set.add(d.negara)
    })
    return ['Pilih negara...', ...Array.from(set)]
  }, [data])

  const komoditasOptions = useMemo(() => {
    const set = new Set<string>()
    data.forEach((d) => {
      if (d.komoditas) set.add(d.komoditas)
    })
    return ['Pilih komoditas...', ...Array.from(set)]
  }, [data])

  // --- FILTERED DATA ---
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (searchBuyer && !item.buyer.toLowerCase().includes(searchBuyer.toLowerCase())) {
        return false
      }
      if (selectedNegara !== 'Pilih negara...' && item.negara !== selectedNegara) {
        return false
      }
      if (selectedKomoditas !== 'Pilih komoditas...' && item.komoditas !== selectedKomoditas) {
        return false
      }
      return true
    })
  }, [data, searchBuyer, selectedNegara, selectedKomoditas])

  // --- KPI CALCULATIONS ---
  const totalPermintaan = filteredData.length
  const totalQtyPermintaan = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + (item.qty || 0), 0)
  }, [filteredData])

  const totalJenisKomoditas = useMemo(() => {
    return new Set(filteredData.map((d) => d.komoditas)).size
  }, [filteredData])

  const totalStockCount = useMemo(() => {
    return filteredData.filter((d) => d.statusStok === 'Stock').length
  }, [filteredData])

  const totalNonStockCount = totalPermintaan - totalStockCount

  const stockPct = totalPermintaan > 0 ? ((totalStockCount / totalPermintaan) * 100).toFixed(1) : '0'
  const nonStockPct = totalPermintaan > 0 ? ((totalNonStockCount / totalPermintaan) * 100).toFixed(1) : '0'

  // --- PAGINATION ---
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredData.slice(start, start + itemsPerPage)
  }, [filteredData, currentPage])

  // Flag helper
  const getFlag = (country: string) => {
    const c = (country || '').toLowerCase()
    if (c.includes('vietnam')) return '🇻🇳'
    if (c.includes('thailand')) return '🇹🇭'
    if (c.includes('jepang') || c.includes('japan')) return '🇯🇵'
    if (c.includes('korea')) return '🇰🇷'
    if (c.includes('indonesia')) return '🇮🇩'
    if (c.includes('china')) return '🇨🇳'
    if (c.includes('malaysia')) return '🇲🇾'
    if (c.includes('singapore')) return '🇸🇬'
    if (c.includes('usa') || c.includes('amerika')) return '🇺🇸'
    return '🌐'
  }

  // Handle Add New Permintaan
  const handleSavePermintaan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.buyer || !formData.komoditas) {
      alert('Mohon lengkapi Nama Buyer dan Komoditas.')
      return
    }

    const finalSizes = qtyBelumDibagi
      ? [{ size: 'All Size', qty: Number(singleQty) || 0, harga: Number(singleHarga) || 0, currency: singleCurrency }]
      : sizeRows
          .filter((r) => r.size.trim() !== '')
          .map((r) => ({
            size: r.size.trim(),
            qty: Number(r.qty) || 0,
            harga: Number(r.harga) || 0,
            currency: r.currency || 'IDR',
          }))

    const finalTotalQty = qtyBelumDibagi
      ? Number(singleQty) || 0
      : sizeMetrics.totalQty

    if (finalTotalQty <= 0) {
      alert('Mohon isi kuantitas (Qty) minimal 1 kg.')
      return
    }

    let numericTotalPrice = 0
    finalSizes.forEach((s) => {
      const rate = s.currency === 'USD' ? rates.USD : s.currency === 'JPY' ? rates.JPY : 1
      numericTotalPrice += s.qty * s.harga * rate
    })

    const numericPerKgPrice = finalTotalQty > 0 ? Math.round(numericTotalPrice / finalTotalQty) : 0

    // Automatic matching with stocks/suppliers
    const kLower = formData.komoditas.toLowerCase().trim()
    const inBarang = barangList.some((b) => {
      const bNama = (b.nama || '').toLowerCase().trim()
      return bNama && (bNama.includes(kLower) || kLower.includes(bNama))
    })
    const inBahanBaku = bahanBakuList.some((bb) => {
      const bbName = (bb.komoditas || bb.barang || '').toLowerCase().trim()
      return (bbName && (bbName.includes(kLower) || kLower.includes(bbName))) && (bb.sumber?.length || 0) > 0
    })
    const inSupplier = supplierList.some((s) => {
      const sKom = (s.komoditas || s.namaKomoditas || '').toLowerCase().trim()
      return sKom && (sKom.includes(kLower) || kLower.includes(sKom))
    })
    const autoStatusStok: 'Stock' | 'Non-Stock' = inBarang || inBahanBaku || inSupplier ? 'Stock' : 'Non-Stock'

    let formattedDate = ''
    if (formData.tanggal) {
      const parts = formData.tanggal.split('-')
      if (parts.length === 3) {
        formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`
      } else {
        formattedDate = formData.tanggal
      }
    } else {
      const now = new Date()
      formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`
    }

    const newRow: PermintaanRow = {
      _id: `temp-${Date.now()}`,
      noRequest: `INQ-${new Date().getFullYear()}-${String(data.length + 1).padStart(3, '0')}`,
      tanggal: formattedDate,
      buyer: formData.buyer,
      negara: formData.negara || '-',
      tujuan: formData.tujuan || formData.negara || '-',
      komoditas: formData.komoditas,
      spesifikasi: formData.spesifikasi || '-',
      qty: finalTotalQty,
      hargaBuyer: numericTotalPrice,
      currencyBuyer: finalSizes[0]?.currency || 'IDR',
      hargaMin: sizeMetrics.minHarga,
      hargaMax: sizeMetrics.maxHarga,
      sizes: finalSizes,
      statusStok: autoStatusStok,
      lastUpdated: 'Baru saja',
      catatan: formData.catatan,
    }

    // Optimistically update state
    setData([newRow, ...data])
    setIsAddModalOpen(false)

    // Save to Backend API
    try {
      await fetch('/api/permintaan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggal: formattedDate,
          buyer: formData.buyer,
          negara: formData.negara,
          tujuan: formData.tujuan,
          items: [
            {
              name: formData.komoditas,
              spesifikasi: formData.spesifikasi,
              qty: finalTotalQty,
              harga: numericTotalPrice,
              hargaBuyerPerKg: numericPerKgPrice,
            },
          ],
          sizes: finalSizes,
          hargaMin: sizeMetrics.minHarga,
          hargaMax: sizeMetrics.maxHarga,
          currency: finalSizes[0]?.currency || 'IDR',
          statusStok: autoStatusStok,
          catatan: formData.catatan,
        }),
      })
      fetchRealData()
    } catch (err) {
      console.error('Error saving to API:', err)
    }

    // Reset Form
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      buyer: '',
      negara: '',
      tujuan: '',
      komoditas: '',
      spesifikasi: '',
      qty: 0,
      currencyBuyer: 'USD',
      priceUnit: 'per_kg',
      hargaBuyer: '',
      catatan: '',
    })
    setSizeRows([
      { size: '100 - 200 g', qty: '', currency: 'IDR', harga: '' },
      { size: '200 - 300 g', qty: '', currency: 'IDR', harga: '' },
      { size: '300 - 500 g', qty: '', currency: 'IDR', harga: '' },
      { size: '500 g Up', qty: '', currency: 'IDR', harga: '' },
    ])
    setQtyBelumDibagi(false)
    setSingleQty('')
    setSingleHarga('')
  }

  // Handle Save Kurs Manual
  const handleSaveKurs = async () => {
    setRates({ ...tempRates })
    const now = new Date()
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    const formattedDate = `Aktif per ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    setKursLastUpdated(formattedDate)
    setIsKursModalOpen(false)

    try {
      await fetch('/api/kurs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          USD: tempRates.USD,
          JPY: tempRates.JPY,
          selectedCurrency,
          user: userName,
        }),
      })
    } catch (err) {
      console.error('Error saving kurs to backend:', err)
    }
  }

  const handleCurrencyChange = async (curr: 'IDR' | 'USD' | 'JPY') => {
    setSelectedCurrency(curr)
    try {
      await fetch('/api/kurs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          USD: rates.USD,
          JPY: rates.JPY,
          selectedCurrency: curr,
          user: userName,
        }),
      })
    } catch (err) {
      console.error(err)
    }
  }

  const handleResetFilter = () => {
    setSearchBuyer('')
    setSelectedNegara('Pilih negara...')
    setSelectedKomoditas('Pilih komoditas...')
    setCurrentPage(1)
  }

  return (
    <MainLayout>
      <div className="space-y-6 pb-10 select-none">
        {/* HEADER SECTION WITH MANUAL KURS WIDGET */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Permintaan Buyer</h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Kelola semua permintaan dari buyer dan dokumen quotation PDF
            </p>
          </div>

          {/* KURS MANUAL CARD (TOP RIGHT) */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">KURS MANUAL</span>
                  <HelpCircle className="w-3 h-3 text-slate-400" />
                </div>
                {/* Currency Buttons */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg mt-1 gap-0.5">
                  {(['IDR', 'USD', 'JPY'] as const).map((curr) => (
                    <button
                      key={curr}
                      onClick={() => handleCurrencyChange(curr)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        selectedCurrency === curr
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden sm:block" />

            {/* Rates Display */}
            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
              <div className="text-left text-xs font-medium text-slate-600 space-y-0.5">
                <p>1 USD = <span className="font-bold text-slate-800">{new Intl.NumberFormat('id-ID').format(rates.USD)}</span></p>
                <p>1 JPY = <span className="font-bold text-slate-800">{rates.JPY.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span></p>
              </div>

              {/* Edit Kurs Button */}
              <button
                onClick={() => {
                  setTempRates({ ...rates })
                  setIsKursModalOpen(true)
                }}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                title="Ubah Nilai Kurs Manual"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[10px] text-slate-400 font-medium pl-1 hidden xl:block">
              {kursLastUpdated}
            </div>
          </div>
        </div>

        {/* 1. ROW 1: 5 SUMMARY KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Total Permintaan */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-500 leading-tight">Total Permintaan</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-800 tracking-tight">{totalPermintaan}</span>
                <span className="text-xs font-semibold text-slate-400">Permintaan</span>
              </div>
              <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                + 15% vs 7 hari lalu
              </p>
            </div>
          </div>

          {/* Card 2: Total Qty Permintaan */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-500 leading-tight">Total Qty Permintaan</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-800 tracking-tight">
                  {new Intl.NumberFormat('id-ID').format(totalQtyPermintaan)}
                </span>
                <span className="text-xs font-semibold text-slate-400">kg</span>
              </div>
              <p className="text-[11px] font-medium text-slate-400">
                Total Keseluruhan <span className="font-semibold text-emerald-600 ml-1">+ 18% vs 7 hari</span>
              </p>
            </div>
          </div>

          {/* Card 3: Komoditas Diminta */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-500 leading-tight">Komoditas Diminta</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-800 tracking-tight">{totalJenisKomoditas}</span>
                <span className="text-xs font-semibold text-slate-400">Jenis Ikan</span>
              </div>
              <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                + 8% vs 7 hari lalu
              </p>
            </div>
          </div>

          {/* Card 4: Stock (Tersedia) */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <span className="w-4 h-4 rounded-full bg-emerald-500" />
              </div>
              <p className="text-xs font-medium text-slate-500 leading-tight">Stock (Tersedia)</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-800 tracking-tight">{totalStockCount}</span>
                <span className="text-xs font-semibold text-slate-400">Permintaan</span>
              </div>
              <p className="text-[11px] font-semibold text-emerald-600">
                {stockPct}% dari total
              </p>
            </div>
          </div>

          {/* Card 5: Non-stock */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <span className="w-4 h-4 rounded-full bg-rose-500" />
              </div>
              <p className="text-xs font-medium text-slate-500 leading-tight">Non-stock</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-800 tracking-tight">{totalNonStockCount}</span>
                <span className="text-xs font-semibold text-slate-400">Permintaan</span>
              </div>
              <p className="text-[11px] font-semibold text-rose-600">
                {nonStockPct}% dari total
              </p>
            </div>
          </div>
        </div>

        {/* 2. FILTER & ACTION BAR */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Filter 1: Nama Buyer */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Nama Buyer
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama buyer..."
                  value={searchBuyer}
                  onChange={(e) => setSearchBuyer(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Filter 2: Negara / Tujuan */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Negara / Tujuan
              </label>
              <div className="relative">
                <select
                  value={selectedNegara}
                  onChange={(e) => setSelectedNegara(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
                >
                  {negaraOptions.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Filter 3: Komoditas / Ikan */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Komoditas / Ikan
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

            {/* Filter 4: Periode Tanggal */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Periode Tanggal
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
            <button
              onClick={() => handleResetFilter()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter Lainnya</span>
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={handleResetFilter}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Reset
              </button>
              <button
                onClick={() => setCurrentPage(1)}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Terapkan Filter</span>
              </button>
              <button
                onClick={() => {
                  setFormData({
                    tanggal: new Date().toISOString().split('T')[0],
                    buyer: '',
                    negara: '',
                    tujuan: '',
                    komoditas: '',
                    spesifikasi: '',
                    qty: 0,
                    currencyBuyer: 'USD',
                    priceUnit: 'per_kg',
                    hargaBuyer: '',
                    catatan: '',
                  })
                  setIsAddModalOpen(true)
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Permintaan</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. FLAT PERMINTAAN TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3 text-center w-12">No</th>
                  <th className="py-3 px-3">Tanggal</th>
                  <th className="py-3 px-3">Nama Buyer</th>
                  <th className="py-3 px-3">Negara / Tujuan</th>
                  <th className="py-3 px-3">Komoditas</th>
                  <th className="py-3 px-3">Spesifikasi</th>
                  <th className="py-3 px-3 text-right">Qty</th>
                  <th className="py-3 px-3 text-right">
                    Harga Buyer ({selectedCurrency}) <HelpCircle className="w-3 h-3 inline text-slate-400 ml-0.5" />
                  </th>
                  <th className="py-3 px-3 text-center">Status Stok</th>
                  <th className="py-3 px-3">Last Updated</th>
                  <th className="py-3 px-3 text-center w-16">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedData.length > 0 ? (
                  paginatedData.map((row, index) => {
                    const rowNumber = (currentPage - 1) * itemsPerPage + index + 1

                    return (
                      <tr key={row._id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3 px-3 text-center text-slate-400 font-medium">
                          {rowNumber}
                        </td>
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                          {row.tanggal}
                        </td>
                        <td className="py-3 px-3 font-bold text-blue-600 hover:underline cursor-pointer">
                          {row.buyer}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="mr-1.5">{getFlag(row.negara)}</span>
                          <span className="font-medium text-slate-700">{row.negara}</span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {row.komoditas}
                        </td>
                        <td className="py-3 px-3 text-slate-700 max-w-xs">
                          <div className="font-medium text-[12px] text-slate-800 leading-snug line-clamp-2" title={row.spesifikasi}>
                            {row.spesifikasi || '-'}
                          </div>
                          {row.sizes && row.sizes.length > 0 && (
                            <div className="mt-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDetailItem(row)
                                  setIsDetailSizeModalOpen(true)
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                              >
                                <span>{row.sizes.length} Sizes</span>
                                <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-800 whitespace-nowrap">
                          {new Intl.NumberFormat('id-ID').format(row.qty)} kg
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          {row.sizes && row.sizes.length > 0 ? (
                            <div>
                              <div className="font-bold text-slate-800">
                                {(() => {
                                  const validPrices = row.sizes.map((s) => Number(s.harga) || 0).filter((h) => h > 0)
                                  if (validPrices.length > 0) {
                                    const minP = Math.min(...validPrices)
                                    const maxP = Math.max(...validPrices)
                                    const curr = row.sizes[0]?.currency || 'IDR'
                                    if (minP !== maxP) {
                                      if (curr === 'USD') return `USD ${minP.toFixed(2)} - ${maxP.toFixed(2)}`
                                      if (curr === 'JPY') return `¥ ${minP} - ${maxP}`
                                      return `Rp ${new Intl.NumberFormat('id-ID').format(minP)} - ${new Intl.NumberFormat('id-ID').format(maxP)}`
                                    } else {
                                      if (curr === 'USD') return `USD ${minP.toFixed(2)} / kg`
                                      if (curr === 'JPY') return `¥ ${minP} / kg`
                                      return `Rp ${new Intl.NumberFormat('id-ID').format(minP)} / kg`
                                    }
                                  }
                                  return '—'
                                })()}
                              </div>
                              {row.hargaBuyer > 0 && (
                                <div className="text-[10px] text-slate-400 font-medium">
                                  Total: {formatPrice(row.hargaBuyer)}
                                </div>
                              )}
                            </div>
                          ) : row.hargaBuyer > 0 ? (
                            <div>
                              <div className="font-bold text-slate-800">
                                {formatPrice(row.qty > 0 ? Math.round(row.hargaBuyer / row.qty) : row.hargaBuyer)}
                                <span className="text-[11px] font-semibold text-slate-500 ml-1">/ kg</span>
                              </div>
                              {row.qty > 1 && (
                                <div className="text-[10px] text-slate-400 font-medium">
                                  Total: {formatPrice(row.hargaBuyer)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic font-medium">Not Available</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {row.statusStok === 'Stock' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Non-stock
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                          {row.lastUpdated}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(row)}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Permintaan (Nego Qty & Harga)"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedItem(row)
                                setIsDetailModalOpen(true)
                              }}
                              className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Lihat Detail Permintaan"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePermintaan(row)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Permintaan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400">
                      Tidak ada data permintaan buyer yang sesuai filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* TABLE FOOTER / PAGINATION */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 text-xs text-slate-500 bg-slate-50/50">
            <p>
              Menampilkan {filteredData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} -{' '}
              {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} data
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

        {/* MODAL 1: TAMBAH PERMINTAAN BUYER (MULTI-SIZE SUPPORT) */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-200 my-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Tambah Permintaan Buyer Baru</h3>
                  <p className="text-xs text-slate-400">Input data spesifikasi dan rincian harga per size dari buyer</p>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePermintaan} className="space-y-4 text-xs">
                {/* SECTION 1: INFORMASI UMUM */}
                <div className="space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    1. Informasi Umum
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Tanggal Permintaan <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.tanggal}
                        onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Nama Buyer <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Ba Hai JSC / Ocean Trading"
                        value={formData.buyer}
                        onChange={(e) => setFormData({ ...formData, buyer: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Negara / Tujuan <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Vietnam"
                        value={formData.negara}
                        onChange={(e) => setFormData({ ...formData, negara: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Komoditas / Ikan <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Cuttlefish / Cakalang / Tuna"
                        value={formData.komoditas}
                        onChange={(e) => setFormData({ ...formData, komoditas: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-bold text-blue-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Spesifikasi Produk <span className="text-slate-400 font-normal">(Opsional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Whole Round, IQF, Grade A"
                      value={formData.spesifikasi}
                      onChange={(e) => setFormData({ ...formData, spesifikasi: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* SECTION 2: DETAIL SIZE & HARGA */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        2. Detail Size & Harga
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Tentukan harga dan kuantitas per masing-masing size
                      </p>
                    </div>

                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                      <input
                        type="checkbox"
                        checked={qtyBelumDibagi}
                        onChange={(e) => setQtyBelumDibagi(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span>Qty belum dibagi per size</span>
                    </label>
                  </div>

                  {qtyBelumDibagi ? (
                    /* Fallback Single Qty & Single Price */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Total Kuantitas (kg) *</label>
                        <input
                          type="number"
                          required
                          min={1}
                          placeholder="Contoh: 25000"
                          value={singleQty}
                          onChange={(e) => setSingleQty(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Harga Buyer (/kg)</label>
                        <div className="flex gap-2">
                          <select
                            value={singleCurrency}
                            onChange={(e) => setSingleCurrency(e.target.value as any)}
                            className="px-2.5 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl font-bold text-xs"
                          >
                            <option value="IDR">IDR (Rp)</option>
                            <option value="USD">USD ($)</option>
                            <option value="JPY">JPY (¥)</option>
                          </select>
                          <input
                            type="number"
                            step="any"
                            placeholder="Contoh: 45000"
                            value={singleHarga}
                            onChange={(e) => setSingleHarga(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Multi-Size Dynamic Breakdown Table */
                    <div className="space-y-2.5">
                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                            <tr>
                              <th className="py-2.5 px-3">Size / Ukuran</th>
                              <th className="py-2.5 px-3">Qty (kg)</th>
                              <th className="py-2.5 px-3">Mata Uang</th>
                              <th className="py-2.5 px-3">Harga Buyer (/kg)</th>
                              <th className="py-2.5 px-3 text-center w-12">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {sizeRows.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-2 px-3">
                                  <input
                                    type="text"
                                    placeholder="Contoh: 100 - 200 g"
                                    value={row.size}
                                    onChange={(e) => handleUpdateSizeRow(idx, 'size', e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium text-xs"
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <input
                                    type="number"
                                    min={0}
                                    placeholder="0"
                                    value={row.qty}
                                    onChange={(e) => handleUpdateSizeRow(idx, 'qty', e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 font-semibold text-xs text-right"
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <select
                                    value={row.currency}
                                    onChange={(e) => handleUpdateSizeRow(idx, 'currency', e.target.value)}
                                    className="w-full px-2 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg font-bold text-xs cursor-pointer"
                                  >
                                    <option value="IDR">IDR (Rp)</option>
                                    <option value="USD">USD ($)</option>
                                    <option value="JPY">JPY (¥)</option>
                                  </select>
                                </td>
                                <td className="py-2 px-3">
                                  <input
                                    type="number"
                                    step="any"
                                    placeholder={row.currency === 'USD' ? '2.50' : '25000'}
                                    value={row.harga}
                                    onChange={(e) => handleUpdateSizeRow(idx, 'harga', e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 font-bold text-xs text-right"
                                  />
                                </td>
                                <td className="py-2 px-3 text-center">
                                  {sizeRows.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSizeRow(idx)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                      title="Hapus baris size"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex justify-between items-center pt-1">
                        <button
                          type="button"
                          onClick={handleAddSizeRow}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah Size</span>
                        </button>

                        <span className="text-[11px] text-slate-400">
                          {sizeRows.filter((r) => r.size.trim() !== '').length} size terdaftar
                        </span>
                      </div>

                      {/* SUMMARY CARDS */}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Total Qty
                          </span>
                          <p className="text-base font-extrabold text-slate-800 mt-0.5">
                            {new Intl.NumberFormat('id-ID').format(sizeMetrics.totalQty)} kg
                          </p>
                        </div>

                        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3">
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                            Range / Rata-rata Harga
                          </span>
                          <p className="text-xs font-bold text-blue-900 mt-1 truncate">
                            {sizeMetrics.rangeText}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION 3: CATATAN TAMBAHAN */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan</label>
                  <textarea
                    rows={2}
                    placeholder="Catatan khusus spesifikasi, packaging, atau terms pengiriman..."
                    value={formData.catatan}
                    onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer transition-colors"
                  >
                    Simpan Permintaan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: DETAIL PERMINTAAN */}
        {isDetailModalOpen && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-800">{selectedItem.noRequest}</h3>
                  <p className="text-xs text-slate-400">Detail Permintaan Buyer</p>
                </div>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Nama Buyer:</span>
                  <span className="font-bold text-slate-800">{selectedItem.buyer}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Negara / Tujuan:</span>
                  <span className="font-semibold text-slate-800">{getFlag(selectedItem.negara)} {selectedItem.negara}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Komoditas:</span>
                  <span className="font-bold text-blue-600">{selectedItem.komoditas}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Spesifikasi:</span>
                  <span className="font-medium text-slate-700">{selectedItem.spesifikasi}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Kuantitas:</span>
                  <span className="font-bold text-slate-800">{new Intl.NumberFormat('id-ID').format(selectedItem.qty)} kg</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Harga Satuan ({selectedCurrency}/kg):</span>
                  <span className="font-bold text-slate-800">
                    {formatPrice(selectedItem.qty > 0 ? Math.round(selectedItem.hargaBuyer / selectedItem.qty) : selectedItem.hargaBuyer)} / kg
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Total Transaksi ({selectedCurrency}):</span>
                  <span className="font-extrabold text-blue-700">{formatPrice(selectedItem.hargaBuyer)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Status Stok:</span>
                  <span>
                    {selectedItem.statusStok === 'Stock' ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Stock (Tersedia)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        Non-stock
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Last Updated:</span>
                  <span className="text-slate-600">{selectedItem.lastUpdated}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: UBAH KURS MANUAL */}
        {isKursModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800">Ubah Kurs Manual</h3>
                <button
                  onClick={() => setIsKursModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">1 USD (dalam IDR)</label>
                  <input
                    type="number"
                    value={tempRates.USD}
                    onChange={(e) => setTempRates({ ...tempRates, USD: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">1 JPY (dalam IDR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={tempRates.JPY}
                    onChange={(e) => setTempRates({ ...tempRates, JPY: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setIsKursModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveKurs}
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Simpan Kurs
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 4: EDIT PERMINTAAN BUYER (NEGO QTY & HARGA) */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Edit className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Edit Permintaan Buyer (Negosiasi)</h3>
                    <p className="text-[11px] text-slate-400">
                      Sesuaikan kuantitas atau harga kesepakatan baru hasil negosiasi ({editFormData.noRequest})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Tanggal Permintaan <span className="font-normal text-blue-600">(Pilih dari kalender)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        value={editFormData.tanggal}
                        onChange={(e) => setEditFormData({ ...editFormData, tanggal: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Buyer *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Ba Hai JSC"
                      value={editFormData.buyer}
                      onChange={(e) => setEditFormData({ ...editFormData, buyer: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Negara / Tujuan *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Vietnam"
                      value={editFormData.negara}
                      onChange={(e) => setEditFormData({ ...editFormData, negara: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Komoditas / Ikan *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Cakalang / Tuna"
                      value={editFormData.komoditas}
                      onChange={(e) => setEditFormData({ ...editFormData, komoditas: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Kuantitas (kg) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="Contoh: 25000"
                      value={editFormData.qty || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, qty: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-extrabold text-blue-700"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-slate-700">
                        Harga Negosiasi Buyer <span className="font-normal text-slate-400">(Opsional)</span>
                      </label>
                      {/* Unit Selector: Per kg vs Total */}
                      <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200 text-[11px]">
                        <button
                          type="button"
                          onClick={() => handleToggleEditPriceUnit('per_kg')}
                          className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                            editFormData.priceUnit === 'per_kg'
                              ? 'bg-white text-blue-600 shadow-xs'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          / kg
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleEditPriceUnit('total')}
                          className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                            editFormData.priceUnit === 'total'
                              ? 'bg-white text-blue-600 shadow-xs'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          Total
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-1.5">
                      {/* Currency Selector: USD / IDR / JPY */}
                      <select
                        value={editFormData.currencyBuyer}
                        onChange={(e) => setEditFormData({ ...editFormData, currencyBuyer: e.target.value as any })}
                        className="w-28 px-2.5 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl font-bold text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="IDR">IDR (Rp)</option>
                        <option value="JPY">JPY (¥)</option>
                      </select>

                      <input
                        type="number"
                        step="any"
                        placeholder={
                          editFormData.currencyBuyer === 'USD'
                            ? editFormData.priceUnit === 'per_kg' ? 'Contoh: 2.10' : 'Contoh: 52500'
                            : editFormData.currencyBuyer === 'JPY'
                            ? editFormData.priceUnit === 'per_kg' ? 'Contoh: 350' : 'Contoh: 8750000'
                            : editFormData.priceUnit === 'per_kg' ? 'Contoh: 45000' : 'Contoh: 405000000'
                        }
                        value={editFormData.hargaBuyer}
                        onChange={(e) => setEditFormData({ ...editFormData, hargaBuyer: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800 text-xs"
                      />
                    </div>

                    {/* Real-time Currency Conversion Box */}
                    {calculatedEditPrices && (
                      <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-[11px] space-y-1 text-emerald-900 animate-in fade-in duration-150">
                        {editFormData.priceUnit === 'per_kg' ? (
                          <>
                            <div className="flex justify-between items-center font-bold">
                              <span>Harga Satuan (/kg):</span>
                              <span className="text-emerald-700 font-extrabold text-xs">
                                {editFormData.currencyBuyer !== 'IDR' ? (
                                  <>
                                    {editFormData.currencyBuyer === 'USD' ? '$' : '¥'}{' '}
                                    {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(calculatedEditPrices.pricePerKgOriginal)} / kg
                                    <span className="text-[10px] text-emerald-600 font-normal ml-1">
                                      (≈ Rp {new Intl.NumberFormat('id-ID').format(calculatedEditPrices.pricePerKgIDR)}/kg)
                                    </span>
                                  </>
                                ) : (
                                  `Rp ${new Intl.NumberFormat('id-ID').format(calculatedEditPrices.pricePerKgIDR)} / kg`
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-600 pt-0.5 border-t border-emerald-200/50">
                              <span>Total Estimasi Transaksi:</span>
                              <span className="font-bold text-slate-800">
                                {editFormData.currencyBuyer !== 'IDR' ? (
                                  <>
                                    {editFormData.currencyBuyer === 'USD' ? '$' : '¥'}{' '}
                                    {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(calculatedEditPrices.totalPriceOriginal)}{' '}
                                    (≈ Rp {new Intl.NumberFormat('id-ID').format(calculatedEditPrices.totalPriceIDR)})
                                  </>
                                ) : (
                                  `Rp ${new Intl.NumberFormat('id-ID').format(calculatedEditPrices.totalPriceIDR)}`
                                )}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between items-center font-bold">
                              <span>Total Nilai Transaksi:</span>
                              <span className="text-emerald-700 font-extrabold text-xs">
                                {editFormData.currencyBuyer !== 'IDR' ? (
                                  <>
                                    {editFormData.currencyBuyer === 'USD' ? '$' : '¥'}{' '}
                                    {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(calculatedEditPrices.totalPriceOriginal)}{' '}
                                    <span className="text-[10px] text-emerald-600 font-normal ml-1">
                                      (≈ Rp {new Intl.NumberFormat('id-ID').format(calculatedEditPrices.totalPriceIDR)})
                                    </span>
                                  </>
                                ) : (
                                  `Rp ${new Intl.NumberFormat('id-ID').format(calculatedEditPrices.totalPriceIDR)} Total`
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-600 pt-0.5 border-t border-emerald-200/50">
                              <span>Ekuivalen Satuan (/kg):</span>
                              <span className="font-bold text-slate-800">
                                {editFormData.currencyBuyer !== 'IDR' ? (
                                  <>
                                    {editFormData.currencyBuyer === 'USD' ? '$' : '¥'}{' '}
                                    {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(calculatedEditPrices.pricePerKgOriginal)} / kg{' '}
                                    (≈ Rp {new Intl.NumberFormat('id-ID').format(calculatedEditPrices.pricePerKgIDR)}/kg)
                                  </>
                                ) : (
                                  `Rp ${new Intl.NumberFormat('id-ID').format(calculatedEditPrices.pricePerKgIDR)} / kg`
                                )}
                              </span>
                            </div>
                          </>
                        )}
                        {editFormData.currencyBuyer !== 'IDR' && (
                          <p className="text-[10px] text-emerald-700/80 italic pt-0.5">
                            *Kurs: 1 {editFormData.currencyBuyer} = Rp{' '}
                            {new Intl.NumberFormat('id-ID').format(editFormData.currencyBuyer === 'USD' ? rates.USD : rates.JPY)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Spesifikasi</label>
                  <input
                    type="text"
                    placeholder="Contoh: 2 kg up, FOB, Grade A"
                    value={editFormData.spesifikasi}
                    onChange={(e) => setEditFormData({ ...editFormData, spesifikasi: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catatan Negosiasi / Tambahan</label>
                  <textarea
                    rows={2}
                    placeholder="Catatan hasil negosiasi dengan buyer..."
                    value={editFormData.catatan}
                    onChange={(e) => setEditFormData({ ...editFormData, catatan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
                  >
                    Simpan Perubahan Negosiasi
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 5: DETAIL PERMINTAAN BUYER (POPUP DETAIL SIZE & HARGA) */}
        {isDetailSizeModalOpen && selectedDetailItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-200 my-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      Detail Permintaan Buyer — {selectedDetailItem.komoditas}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selectedDetailItem.noRequest} • {selectedDetailItem.buyer} ({selectedDetailItem.negara})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDetailSizeModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Info Badges Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Tanggal</span>
                  <span className="font-semibold text-slate-800">{selectedDetailItem.tanggal}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Total Kuantitas</span>
                  <span className="font-extrabold text-blue-700">
                    {new Intl.NumberFormat('id-ID').format(selectedDetailItem.qty)} kg
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Spesifikasi</span>
                  <span className="font-medium text-slate-700 truncate block">
                    {selectedDetailItem.spesifikasi || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Status Ketersediaan</span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold mt-0.5 ${
                      selectedDetailItem.statusStok === 'Stock'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {selectedDetailItem.statusStok === 'Stock' ? '✓ Tersedia (Stock)' : '⚠ Non-Stock'}
                  </span>
                </div>
              </div>

              {/* Size Breakdown Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Rincian Kuantitas & Harga per Size
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {(selectedDetailItem.sizes || []).length} Size Terdefinisi
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-10">No</th>
                        <th className="py-2.5 px-3">Size / Ukuran</th>
                        <th className="py-2.5 px-3 text-right">Kuantitas (kg)</th>
                        <th className="py-2.5 px-3 text-right">Harga Buyer (/kg)</th>
                        <th className="py-2.5 px-3 text-right">Subtotal Estimasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedDetailItem.sizes && selectedDetailItem.sizes.length > 0 ? (
                        selectedDetailItem.sizes.map((s, idx) => {
                          const rate = s.currency === 'USD' ? rates.USD : s.currency === 'JPY' ? rates.JPY : 1
                          const subtotal = s.qty * s.harga * rate
                          return (
                            <tr key={idx} className="hover:bg-blue-50/20 transition-colors">
                              <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                              <td className="py-2.5 px-3 font-bold text-slate-800">{s.size}</td>
                              <td className="py-2.5 px-3 text-right font-semibold text-slate-700">
                                {new Intl.NumberFormat('id-ID').format(s.qty)} kg
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-blue-700">
                                {s.currency === 'USD'
                                  ? `$ ${s.harga.toFixed(2)}`
                                  : s.currency === 'JPY'
                                  ? `¥ ${new Intl.NumberFormat('ja-JP').format(s.harga)}`
                                  : `Rp ${new Intl.NumberFormat('id-ID').format(s.harga)}`}
                              </td>
                              <td className="py-2.5 px-3 text-right font-extrabold text-slate-800">
                                Rp {new Intl.NumberFormat('id-ID').format(subtotal)}
                              </td>
                            </tr>
                          )
                        })
                      ) : (
                        <tr>
                          <td className="py-2.5 px-3 text-center text-slate-400">1</td>
                          <td className="py-2.5 px-3 font-bold text-slate-800">All Size</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-slate-700">
                            {new Intl.NumberFormat('id-ID').format(selectedDetailItem.qty)} kg
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-blue-700">
                            {selectedDetailItem.currencyBuyer === 'USD'
                              ? `$ ${(selectedDetailItem.hargaBuyer / (rates.USD * (selectedDetailItem.qty || 1))).toFixed(2)}`
                              : `Rp ${new Intl.NumberFormat('id-ID').format(selectedDetailItem.qty > 0 ? Math.round(selectedDetailItem.hargaBuyer / selectedDetailItem.qty) : selectedDetailItem.hargaBuyer)}`}
                          </td>
                          <td className="py-2.5 px-3 text-right font-extrabold text-slate-800">
                            Rp {new Intl.NumberFormat('id-ID').format(selectedDetailItem.hargaBuyer)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-800">
                      <tr>
                        <td colSpan={2} className="py-2.5 px-3 text-right">Total:</td>
                        <td className="py-2.5 px-3 text-right text-blue-700">
                          {new Intl.NumberFormat('id-ID').format(selectedDetailItem.qty)} kg
                        </td>
                        <td></td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-emerald-700">
                          Rp {new Intl.NumberFormat('id-ID').format(selectedDetailItem.hargaBuyer)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Catatan / Keterangan */}
              {selectedDetailItem.catatan && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Catatan Tambahan:</span>
                  <p className="text-slate-700">{selectedDetailItem.catatan}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleDownloadDetailPDF(selectedDetailItem)}
                  className="px-4 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF Detail</span>
                </button>

                <button
                  onClick={() => setIsDetailSizeModalOpen(false)}
                  className="px-5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
