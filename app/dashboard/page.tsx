'use client'

import { useState, useEffect } from 'react'
import { DashboardPusat } from '@/components/pusat/dashboard-pusat'
import { DashboardCabang } from '@/components/cabang/dashboard-cabang'

export default function DashboardPage() {
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
        const isPortalPusat = data?.portalMode === 'pusat'
        setIsPusat(isPortalPusat)
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

  return isPusat ? <DashboardPusat /> : <DashboardCabang />
}
