'use client'

import { useState, useEffect } from 'react'
import { StokPusat } from '@/components/pusat/stok-pusat'
import { StokCabang } from '@/components/cabang/stok-cabang'

export default function StokRouterPage() {
  const [isPusat, setIsPusat] = useState<boolean | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/user/profile')
        if (res.ok) {
          const user = await res.json()
          const isPortalPusat = user?.portalMode === 'pusat'
          setIsPusat(isPortalPusat)
        } else {
          setIsPusat(false)
        }
      } catch (e) {
        console.error(e)
        setIsPusat(false)
      }
    }

    fetchUser()
  }, [])

  if (isPusat === null) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-xs text-slate-400 font-medium">Memuat data Stok...</p>
        </div>
      </div>
    )
  }

  return isPusat ? <StokPusat /> : <StokCabang />
}
