'use client'

import { CheckCircle, Clock, AlertCircle, FileText, PackagePlus, XCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Activity {
  id: string
  type: 'completed' | 'pending' | 'error' | 'info' | 'cancel'
  title: string
  description: string
  timestamp: string
  rawDate: Date
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'completed':
      return <CheckCircle className="w-5 h-5 text-green-600" />
    case 'pending':
      return <Clock className="w-5 h-5 text-yellow-600" />
    case 'error':
      return <AlertCircle className="w-5 h-5 text-red-600" />
    case 'cancel':
      return <XCircle className="w-5 h-5 text-gray-500" />
    case 'info':
      return <PackagePlus className="w-5 h-5 text-blue-600" />
    default:
      return <FileText className="w-5 h-5 text-purple-600" />
  }
}

function getActivityBgColor(type: string) {
  switch (type) {
    case 'completed':
      return 'bg-green-50'
    case 'pending':
      return 'bg-yellow-50'
    case 'error':
      return 'bg-red-50'
    case 'cancel':
      return 'bg-gray-100'
    case 'info':
      return 'bg-blue-50'
    default:
      return 'bg-purple-50'
  }
}

export function ActivityLog() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      setIsLoading(true)
      const [resPermintaan, resBarang, resMutasi] = await Promise.all([
        fetch('/api/permintaan'),
        fetch('/api/barang'),
        fetch('/api/mutasi')
      ])

      const list: Activity[] = []

      // 1. Process Permintaan
      if (resPermintaan.ok) {
        const dataPermintaan = await resPermintaan.json()
        dataPermintaan.forEach((p: any) => {
          const dateObj = new Date(p.createdAt || p.tanggal)
          let type: Activity['type'] = 'info'
          let title = 'Permintaan Baru'

          if (p.status === 'pending') {
            type = 'pending'
            title = 'Permintaan Menunggu Konfirmasi'
          } else if (p.status === 'diproses') {
            type = 'info'
            title = 'Permintaan Sedang Diproses'
          } else if (p.status === 'selesai') {
            type = 'completed'
            title = 'Permintaan Selesai'
          } else if (p.status === 'cancelled') {
            type = 'cancel'
            title = 'Permintaan Dibatalkan'
          }

          list.push({
            id: `permintaan-${p._id}`,
            type,
            title,
            description: `${p.buyer} - ${p.noRequest} (${p.totalQty || 0} qty)`,
            timestamp: formatDate(dateObj),
            rawDate: dateObj
          })
        })
      }

      // 2. Process Mutasi (Tambah Stok)
      if (resMutasi.ok) {
        const dataMutasi = await resMutasi.json()
        dataMutasi.forEach((m: any) => {
          if (m.jenis === 'masuk') {
            const dateObj = new Date(m.tanggal || m.createdAt)
            const namaBarang = typeof m.barangId === 'object' ? m.barangId?.nama : 'Barang'
            list.push({
              id: `mutasi-${m._id}`,
              type: 'info',
              title: 'Stok Masuk Diperbarui',
              description: `${namaBarang} (+${m.qty} unit)`,
              timestamp: formatDate(dateObj),
              rawDate: dateObj
            })
          }
        })
      }

      // 3. Process Barang (Stok Menipis Warnings)
      if (resBarang.ok) {
        const dataBarang = await resBarang.json()
        dataBarang.forEach((b: any) => {
          const sisaStok = (b.stokAwal || 0) + (b.barangMasuk || 0) - (b.barangKeluar || 0)
          if (sisaStok <= 50) {
            list.push({
              id: `warning-${b._id}`,
              type: 'error',
              title: sisaStok === 0 ? 'Stok Habis' : 'Stok Menipis',
              description: `${b.nama} (Sisa ${sisaStok} unit)`,
              timestamp: 'Perhatian Sistem',
              rawDate: new Date()
            })
          }
        })
      }

      // Sort by rawDate descending
      list.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime())

      // Limit to 5 items
      setActivities(list.slice(0, 5))
    } catch (err) {
      console.error('Error fetching activity log:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffMin = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffMin < 1) return 'Baru saja'
    if (diffMin < 60) return `${diffMin} menit yang lalu`
    
    const diffHours = Math.floor(diffMin / 60)
    if (diffHours < 24) return `${diffHours} jam yang lalu`

    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="dashboard-card p-6">
      <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
        <h3 className="text-lg font-bold text-foreground">Aktivitas Terbaru</h3>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Belum ada aktivitas tercatat hari ini
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-3 pb-3 border-b border-border last:border-b-0 last:pb-0 items-start">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full ${getActivityBgColor(activity.type)} flex items-center justify-center mt-0.5`}>
                {getActivityIcon(activity.type)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground leading-snug">{activity.title}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{activity.description}</p>
                <p className="text-[11px] text-gray-400 font-medium mt-1">{activity.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
