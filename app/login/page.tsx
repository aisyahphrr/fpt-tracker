'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, LayoutDashboard } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Login gagal')
      }

      // Redirect to dashboard on success
      window.location.href = '/dashboard'
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="flex w-full max-w-5xl gap-8">
        {/* Left Section - Illustration */}
        <div className="hidden lg:flex flex-1 items-center justify-center">
          <div className="text-center max-w-md">
            <div className="mb-8 inline-flex items-center justify-center p-3 rounded-2xl bg-white shadow-sm border border-border">
              <img src="/images (2).png" alt="FPT Tracker Logo" className="w-20 h-20 object-contain" />
            </div>

            <h2 className="text-3xl font-bold text-foreground mb-4">
              Welcome to FPT Tracker
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Kelola permintaan penjualan dan inventori dengan mudah dan profesional
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 font-bold">✓</span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">Dashboard Lengkap</p>
                  <p className="text-sm text-muted-foreground">Monitoring real-time semua aktivitas</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 font-bold">✓</span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">Manajemen Stok</p>
                  <p className="text-sm text-muted-foreground">Kelola inventori dengan sistem otomatis</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 font-bold">✓</span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">Laporan Terpercaya</p>
                  <p className="text-sm text-muted-foreground">Export laporan dalam berbagai format</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Login Form */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <div className="flex lg:hidden items-center gap-3 mb-6">
                <img src="/images (2).png" alt="FPT Tracker Logo" className="w-10 h-10 object-contain" />
                <h1 className="text-2xl font-bold text-foreground">FPT Tracker</h1>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Masuk ke Akun Anda</h2>
              <p className="text-muted-foreground">Gunakan kredensial Anda untuk mengakses dashboard</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="text-label block mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nailah@gmail.com"
                  className="w-full px-4 py-3 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder-gray-400"
                  required
                />
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="text-label">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder-gray-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-border focus:ring-2 focus:ring-primary cursor-pointer"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-foreground cursor-pointer font-medium">
                  Remember me
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3 font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-blue-200 border-t-white rounded-full animate-spin mr-2"></span>
                    Sedang Masuk...
                  </>
                ) : (
                  'Masuk'
                )}
              </button>
            </form>

            {/* Footer */}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Belum punya akun?{' '}
              <Link href="/register" className="text-primary font-semibold hover:underline">
                Daftar sebagai Staff
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
