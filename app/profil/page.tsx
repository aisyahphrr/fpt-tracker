'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { User, Mail, Phone, MapPin, Briefcase, Calendar, Edit, Save, Lock, Key, X, CheckCircle, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { formatUserRoleLabel } from '@/lib/utils'

export default function ProfilPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)

  // Profile State
  const [profile, setProfile] = useState({
    name: 'Nailah',
    email: '',
    telepon: '',
    alamat: '',
    role: 'admin',
    posisi: 'Admin Pusat',
    departemen: 'Sales & Inventory',
    createdAt: ''
  })

  const [formData, setFormData] = useState(profile)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Password State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/user/profile')
      const data = await res.json()
      if (res.ok && data) {
        const loadedProfile = {
          name: data.name || 'Nailah',
          email: data.email || '',
          telepon: data.telepon || '',
          alamat: data.alamat || '',
          role: data.role || '',
          posisi: data.posisi || '',
          departemen: data.departemen || 'Sales & Inventory',
          createdAt: data.createdAt ? new Date(data.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
        }
        setProfile(loadedProfile)
        setFormData(loadedProfile)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    setProfileMessage(null)

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          telepon: formData.telepon,
          alamat: formData.alamat,
          posisi: formData.posisi,
          departemen: formData.departemen
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Gagal menyimpan profil')

      setProfile(formData)
      setIsEditing(false)
      setProfileMessage({ type: 'success', text: 'Profil berhasil disimpan ke database!' })
      setTimeout(() => setProfileMessage(null), 4000)
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleCancelEdit = () => {
    setFormData(profile)
    setIsEditing(false)
    setProfileMessage(null)
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Konfirmasi password baru tidak cocok')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password baru minimal 6 karakter')
      return
    }

    setPasswordSubmitting(true)
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Gagal mengubah password')

      setPasswordSuccess('Password berhasil diperbarui di database!')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => {
        setIsPasswordModalOpen(false)
        setPasswordSuccess('')
      }, 2000)
    } catch (err: any) {
      setPasswordError(err.message)
    } finally {
      setPasswordSubmitting(false)
    }
  }

  const displayRole = formatUserRoleLabel(profile.role, profile.name, profile.email)

  return (
    <MainLayout userName={profile.name} userEmail={profile.email}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-title mb-2">Profil Saya</h1>
        <p className="text-muted-foreground">Kelola informasi profil dan keamanan akun Anda</p>
      </div>

      {profileMessage && (
        <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${profileMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {profileMessage.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
          <span className="text-sm font-medium">{profileMessage.text}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Profile Avatar Section */}
        <div className="lg:col-span-1">
          <div className="dashboard-card text-center p-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4 shadow-lg">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1">{profile.name}</h2>
            <p className="text-sm text-primary font-bold mb-4">{displayRole}</p>

            <div className="space-y-2 text-sm pt-4 border-t border-border">
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Role:</span>
                <span className="font-bold px-2.5 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200/60">
                  {displayRole}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Status:</span>
                <span className="badge-success">Aktif</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Info Section */}
        <div className="lg:col-span-2">
          <div className="dashboard-card p-6">
            <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">Informasi Profil</h3>
                <p className="text-xs text-muted-foreground">Lengkapi data pribadi dan kontak Anda</p>
              </div>
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="btn-secondary btn-sm flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Edit Profil
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nama */}
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1.5">Nama Lengkap *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="Masukkan nama lengkap"
                      className="w-full px-3.5 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Posisi */}
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1.5">Posisi / Jabatan</label>
                    <input
                      type="text"
                      value={formData.posisi || displayRole}
                      onChange={(e) => handleChange('posisi', e.target.value)}
                      placeholder={displayRole}
                      className="w-full px-3.5 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1.5">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="contoh@email.com"
                      className="w-full px-3.5 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Telepon */}
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1.5">Nomor Telepon</label>
                    <input
                      type="tel"
                      value={formData.telepon}
                      onChange={(e) => handleChange('telepon', e.target.value)}
                      placeholder="0812xxxxxxxx"
                      className="w-full px-3.5 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Alamat */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">Alamat</label>
                  <textarea
                    value={formData.alamat}
                    onChange={(e) => handleChange('alamat', e.target.value)}
                    rows={2}
                    placeholder="Masukkan alamat lengkap..."
                    className="w-full px-3.5 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-border justify-end">
                  <button type="button" onClick={handleCancelEdit} className="btn-secondary px-5 py-2">
                    Batal
                  </button>
                  <button type="submit" disabled={savingProfile} className="btn-primary px-5 py-2 flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {savingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Nama Lengkap</p>
                    <p className="text-foreground font-bold text-base mt-0.5">{profile.name || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Posisi / Jabatan</p>
                    <p className="text-foreground font-bold text-base mt-0.5">{displayRole}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Email</p>
                    <p className="text-foreground font-bold text-base mt-0.5 break-all">{profile.email || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Telepon</p>
                    <p className="text-foreground font-bold text-base mt-0.5">{profile.telepon || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 md:col-span-2">
                  <div className="p-2.5 rounded-lg bg-red-50 text-red-600">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Alamat</p>
                    <p className="text-foreground font-bold text-base mt-0.5">{profile.alamat || '-'}</p>
                  </div>
                </div>

                {profile.createdAt && (
                  <div className="flex items-start gap-3 md:col-span-2 pt-2 border-t border-border">
                    <div className="p-2.5 rounded-lg bg-gray-50 text-gray-600">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Terdaftar Sejak</p>
                      <p className="text-foreground font-bold text-base mt-0.5">{profile.createdAt}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security Section (Keamanan Akun & Fitur Ganti Password) */}
      <div className="dashboard-card p-6">
        <div className="flex items-center justify-between mb-4 border-b border-border pb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">Keamanan Akun</h3>
            <p className="text-xs text-muted-foreground">Kelola kata sandi dan keamanan akses akun Anda</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Kata Sandi (Password)</p>
              <p className="text-xs text-muted-foreground">Amankan akun Anda dengan secara berkala mengupdate kata sandi</p>
            </div>
          </div>

          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Key className="w-4 h-4" />
            Ganti Password
          </button>
        </div>
      </div>

      {/* Modal Ganti Password */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="bg-gray-50 border-b border-border p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-gray-900">Ganti Password Akun</h2>
              </div>
              <button
                onClick={() => {
                  setIsPasswordModalOpen(false)
                  setPasswordError('')
                  setPasswordSuccess('')
                }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              {passwordError && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Password Saat Ini *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-3.5 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary"
                  placeholder="Masukkan password saat ini"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Password Baru *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-3.5 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary"
                  placeholder="Minimal 6 karakter"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Konfirmasi Password Baru *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-3.5 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary"
                  placeholder="Ulangi password baru"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={passwordSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                >
                  {passwordSubmitting ? 'Menyimpan...' : 'Perbarui Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
