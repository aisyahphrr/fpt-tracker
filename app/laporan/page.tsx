'use client'

import { useState, useEffect } from 'react'
import { LaporanPusat } from '@/components/pusat/laporan-pusat'
import { LaporanCabang } from '@/components/cabang/laporan-cabang'

export default function LaporanPage() {
  const [isPusat, setIsPusat] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const data = await res.json()
        const email = (data?.email || '').toLowerCase()
        const role = (data?.role || '').toLowerCase()

        const isCabang =
          data?.portalMode === 'cabang' ||
          role === 'direksi' ||
          role === 'cabang' ||
          email.includes('aisyah') ||
          email.includes('cabang')

        setIsPusat(!isCabang)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return isPusat ? <LaporanPusat /> : <LaporanCabang />
}
