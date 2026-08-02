'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BarChart3,
  FileText,
  User,
  LogOut,
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
    <aside className="sidebar-container w-64 bg-card">
      {/* Logo Section */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <img src="/images (2).png" alt="FPT Tracker Logo" className="w-10 h-10 object-contain" />
          <div>
            <h1 className="text-lg font-bold text-foreground">FPT Tracker</h1>
            <p className="text-xs text-muted-foreground">Management System</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                active
                  ? 'bg-blue-50 text-primary border-l-4 border-primary font-semibold'
                  : 'text-foreground hover:bg-gray-50 font-medium'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="flex-1">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Settings Section */}
      <div className="border-t border-border p-4 space-y-2">
        <Link
          href="/profil"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
            isActive('/profil')
              ? 'bg-blue-50 text-primary border-l-4 border-primary font-semibold'
              : 'text-foreground hover:bg-gray-50 font-medium'
          }`}
        >
          <User className="w-5 h-5" />
          <span>Profil</span>
        </Link>
      </div>

      {/* User Profile Section */}
      <div className="border-t border-border p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
            <p className="text-xs text-muted-foreground truncate capitalize">{userRole === 'admin' ? 'Admin Sales' : 'Staff Sales'}</p>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
