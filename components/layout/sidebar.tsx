'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingCart,
  Layers,
  Calculator,
  Package,
  BarChart3,
  FileText,
  User,
  LogOut,
  Receipt,
  Truck,
  Building2,
  Users,
  ClipboardCheck,
  ArrowLeftRight,
  Shield,
} from 'lucide-react'
import { useState, useEffect } from 'react'

interface SidebarProps {
  userRole?: string
  userName?: string
  userEmail?: string
}

export function Sidebar({ 
  userRole = 'admin', 
  userName = 'Admin User', 
  userEmail = 'admin@example.com' 
}: SidebarProps) {
  const pathname = usePathname()
  const [canSwitch, setCanSwitch] = useState(false)
  const [currentPortal, setCurrentPortal] = useState<'pusat' | 'cabang'>('pusat')

  useEffect(() => {
    async function checkProfile() {
      try {
        const res = await fetch('/api/user/profile')
        if (res.ok) {
          const d = await res.json()
          setCanSwitch(!!d?.canSwitchPortal)
          setCurrentPortal(d?.portalMode === 'cabang' ? 'cabang' : 'pusat')
        }
      } catch (e) {
        console.error(e)
      }
    }
    checkProfile()
  }, [])

  const handleSwitchPortal = async (targetPortal: 'pusat' | 'cabang') => {
    try {
      await fetch('/api/user/switch-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portal: targetPortal }),
      })
      window.location.reload()
    } catch (e) {
      console.error('Error switching portal:', e)
    }
  }

  // 1. Menu Lengkap untuk Kantor Pusat / Admin (Sesuai Vercel)
  const pusatMenuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/permintaan', label: 'Permintaan Buyer', icon: ShoppingCart },
    { href: '/bahan-baku', label: 'Bahan Baku', icon: Layers },
    { href: '/struktur-biaya', label: 'Struktur Biaya', icon: Calculator },
    { href: '/progres-kwitansi', label: 'Progres Kwitansi', icon: Receipt },
    { href: '/pengiriman', label: 'Pengiriman', icon: Truck },
    { href: '/barang', label: 'Barang', icon: Package },
    { href: '/stok', label: 'Stok Barang', icon: BarChart3 },
    { href: '/approval', label: 'Approval Cabang', icon: ClipboardCheck },
    { href: '/laporan', label: 'Laporan', icon: FileText },
  ]

  // 2. Menu Sederhana untuk Kantor Cabang (Sesuai Panduan PDF Cabang)
  const cabangMenuSections = [
    {
      items: [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'MARKET PLACE',
      items: [
        { href: '/permintaan', label: 'Permintaan Buyer', icon: ShoppingCart },
        { href: '/bahan-baku', label: 'Bahan Baku', icon: Layers },
      ],
    },
    {
      title: 'STOCKING',
      items: [
        { href: '/stok', label: 'Stok Gudang', icon: Building2 },
        { href: '/supplier', label: 'Supplier', icon: Users },
      ],
    },
    {
      title: 'APPROVAL',
      items: [
        { href: '/approval', label: 'Approval', icon: ClipboardCheck },
      ],
    },
    {
      title: 'LAPORAN',
      items: [
        { href: '/laporan', label: 'Laporan', icon: FileText },
      ],
    },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/'
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {
      console.error('Logout error:', e)
    }
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    document.cookie = 'portal_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    window.location.href = '/login'
  }

  // --- TAMPILAN SIDEBAR PUSAT (100% PERSIS VERCEL) ---
  if (currentPortal === 'pusat') {
    const isNailah = userEmail?.toLowerCase().includes('nailah')
    const displayName = isNailah ? 'Nailah (Admin)' : (userName || 'Admin Sales')
    const displayRole = isNailah || userRole === 'admin' ? 'Admin Sales' : 'Staff Sales'

    return (
      <aside key="pusat-sidebar" className="sidebar-container w-64 bg-gradient-to-b from-blue-900 via-[#1e3a8a] to-[#0f172a] text-white border-r border-blue-900/40 flex flex-col justify-between select-none">
        {/* Logo Section */}
        <div className="p-5 border-b border-blue-800/40">
          <div className="flex items-center gap-3">
            <img
              src="/apple-icon.png"
              alt="FPT Tracker Logo"
              className="w-9 h-9 object-contain bg-white p-1 rounded-lg shadow-sm shrink-0"
            />
            <div>
              <h1 className="text-base font-bold text-white tracking-tight leading-tight">
                FPT Tracker
              </h1>
              <p className="text-xs text-blue-200/80">Management System</p>
            </div>
          </div>
        </div>

        {/* Portal Switcher Banner for Pusat */}
        {canSwitch && (
          <div className="mx-3.5 mt-3 p-2 bg-blue-800/60 border border-blue-700/60 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-200">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Portal: Kantor Pusat</span>
              </div>
            </div>
            <button
              onClick={() => handleSwitchPortal('cabang')}
              className="w-full mt-2 py-1 px-2 text-[11px] font-bold text-blue-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <ArrowLeftRight className="w-3 h-3" />
              <span>Pindah ke Web Cabang</span>
            </button>
          </div>
        )}

        {/* Menu Items */}
        <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto custom-scrollbar">
          {pusatMenuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-sm ${
                  active
                    ? 'bg-blue-600 text-white font-semibold shadow-sm border-l-4 border-blue-300'
                    : 'text-blue-100/85 hover:bg-white/10 hover:text-white font-medium'
                }`}
              >
                <Icon className="w-4.5 h-4.5 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Settings Section */}
        <div className="border-t border-blue-800/40 p-3.5 space-y-1.5">
          <Link
            href="/profil"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-sm ${
              isActive('/profil')
                ? 'bg-blue-600 text-white font-semibold shadow-sm border-l-4 border-blue-300'
                : 'text-blue-100/85 hover:bg-white/10 hover:text-white font-medium'
            }`}
          >
            <User className="w-4.5 h-4.5 shrink-0" />
            <span className="flex-1 truncate">Profil</span>
          </Link>
        </div>

        {/* User Profile Section */}
        <div className="border-t border-blue-800/40 p-3.5 space-y-3 bg-black/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 border border-blue-400/40 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs">
              {displayName ? displayName.charAt(0).toUpperCase() : 'N'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{displayName}</p>
              <p className="text-xs text-blue-200/80 truncate capitalize">{displayRole}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-300 hover:text-red-100 hover:bg-red-500/25 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    )
  }

  // --- TAMPILAN SIDEBAR CABANG / DIREKSI (SESUAI PANDUAN REVISI CABANG) ---
  const isDireksi = userRole === 'direksi' || userEmail?.toLowerCase().includes('aisyah') || userEmail?.toLowerCase().includes('titik') || userEmail?.toLowerCase().includes('errinto')
  const displayRoleCabang = isDireksi ? 'Direksi' : 'Kantor Cabang'

  return (
    <aside key="cabang-sidebar" className="sidebar-container w-64 bg-[#0a192f] text-white flex flex-col justify-between select-none shadow-xl border-r border-[#1e293b]/50">
      {/* Logo & Header Section */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img
            src="/apple-icon.png"
            alt="FPT Logo"
            className="w-9 h-9 object-contain bg-white p-1 rounded-lg shadow-sm shrink-0"
          />
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white tracking-tight leading-snug">
              FPT Market Place & Stocking
            </h1>
            <p className="text-[11px] text-blue-200/60 font-medium">Management System</p>
          </div>
        </div>
      </div>

      {/* Portal Switcher Banner for Pusat users viewing Cabang portal */}
      {canSwitch && (
        <div className="mx-3.5 mt-3 p-2 bg-blue-950/80 border border-blue-800 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Mode: Web Cabang (Pusat View)</span>
            </div>
          </div>
          <button
            onClick={() => handleSwitchPortal('pusat')}
            className="w-full mt-2 py-1 px-2 text-[11px] font-bold text-slate-900 bg-blue-400 hover:bg-blue-300 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <ArrowLeftRight className="w-3 h-3" />
            <span>Kembali ke Web Pusat</span>
          </button>
        </div>
      )}

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-4 space-y-3 overflow-y-auto custom-scrollbar">
        {cabangMenuSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {section.title && (
              <p className="px-3 text-[10px] font-bold text-slate-400/80 tracking-wider uppercase mb-1.5 mt-2">
                {section.title}
              </p>
            )}
            {section.items.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-[13px] ${
                    active
                      ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white font-medium'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User Info & Logout Footer */}
      <div className="p-4 border-t border-white/10 space-y-3 bg-[#071324]/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 border border-blue-400/40 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs">
            {userName ? userName.charAt(0).toUpperCase() : 'C'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">{userName || 'Staff Cabang'}</p>
            <p className="text-[11px] text-blue-300/70 truncate">{displayRoleCabang}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
