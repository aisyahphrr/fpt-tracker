'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'

interface MainLayoutProps {
  children: React.ReactNode
  userRole?: 'admin' | 'staff'
  userName?: string
  userEmail?: string
}

export function MainLayout({
  children,
  userRole: initialRole = 'admin',
  userName: initialName,
  userEmail: initialEmail,
}: MainLayoutProps) {
  const [userName, setUserName] = useState(initialName || '')
  const [userRole, setUserRole] = useState(initialRole || '')
  const [userEmail, setUserEmail] = useState(initialEmail || '')

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/user/profile')
        if (res.ok) {
          const data = await res.json()
          if (data?.name) setUserName(data.name)
          if (data?.role) setUserRole(data.role)
          if (data?.email) setUserEmail(data.email)
        }
      } catch (err) {
        console.error('Error loading layout user profile:', err)
      }
    }
    fetchProfile()
  }, [])

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar userRole={userRole as any} userName={userName} userEmail={userEmail} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <Topbar userName={userName} userRole={userRole} />

        {/* Main Content */}
        <main className="main-content px-6 py-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
