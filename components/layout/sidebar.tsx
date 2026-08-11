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
} from 'lucide-react'

interface SidebarProps {
  userRole?: 'admin' | 'staff'
  userName?: string
  userEmail?: string
}

export function Sidebar({ userRole = 'admin', userName = 'Admin User', userEmail = 'admin@example.com' }: SidebarProps) {
  const pathname = usePathname()

  const allMenuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/permintaan', label: 'Permintaan Buyer', icon: ShoppingCart },
    { href: '/bahan-baku', label: 'Bahan Baku', icon: Layers },
    { href: '/struktur-biaya', label: 'Struktur Biaya', icon: Calculator },
    { href: '/progres-kwitansi', label: 'Progres Kwitansi', icon: Receipt },
    { href: '/pengiriman', label: 'Pengiriman', icon: Truck },
    { href: '/barang', label: 'Barang', icon: Package },
    { href: '/stok', label: 'Stok Barang', icon: BarChart3 },
    { href: '/laporan', label: 'Laporan', icon: FileText },
  ]

  const menuItems = allMenuItems

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {
      console.error('Logout error:', e)
    }
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    window.location.href = '/login'
  }

  return (
    <aside className="sidebar-container w-64 bg-gradient-to-b from-blue-900 via-[#1e3a8a] to-[#0f172a] text-white border-r border-blue-900/40 flex flex-col justify-between">
      {/* Logo Section */}
      <div className="p-5 border-b border-blue-800/40">
        <div className="flex items-center gap-3">
          <img src="/images (2).png" alt="FPT Tracker Logo" className="w-9 h-9 object-contain bg-white p-1 rounded-lg shadow-sm" />
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">FPT Tracker</h1>
            <p className="text-xs text-blue-200/80">Management System</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
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
          <span className="truncate">Profil</span>
        </Link>
      </div>

      {/* User Profile Section */}
      <div className="border-t border-blue-800/40 p-3.5 space-y-3 bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 border border-blue-400/40 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs">
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{userName}</p>
            <p className="text-xs text-blue-200/80 truncate capitalize">{userRole === 'admin' ? 'Admin Sales' : 'Staff Sales'}</p>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-300 hover:text-red-100 hover:bg-red-500/25 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
