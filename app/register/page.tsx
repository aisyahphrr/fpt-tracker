'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, LayoutDashboard } from 'lucide-react'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Gagal mendaftar')
      }

      setSuccess('Pendaftaran berhasil! Silakan login.')
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
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
            <div className="mb-8 inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 border-2 border-blue-200">
              <LayoutDashboard className="w-12 h-12 text-primary" />
            </div>

            <h2 className="text-3xl font-bold text-foreground mb-4">
              Daftar Sebagai Staff
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Bergabung untuk memonitor permintaan penjualan dan ketersediaan barang.
            </p>
          </div>
        </div>

        {/* Right Section - Register Form */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <div className="flex lg:hidden items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <LayoutDashboard className="w-6 h-6 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">SaleStock</h1>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Buat Akun Baru</h2>
              <p className="text-muted-foreground">Isi form di bawah untuk mendaftar sebagai Staff</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg border border-green-200 text-sm">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="text-label block mb-2">
                  Nama Lengkap
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder-gray-400"
                  required
                />
              </div>

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
                  placeholder="staff@example.com"
                  className="w-full px-4 py-3 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder-gray-400"
                  required
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="text-label block mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-4 py-3 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder-gray-400"
                    required
                    minLength={6}
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3 font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-blue-200 border-t-white rounded-full animate-spin mr-2"></span>
                    Mendaftar...
                  </>
                ) : (
                  'Daftar Sekarang'
                )}
              </button>
            </form>

            {/* Footer */}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Sudah punya akun?{' '}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
