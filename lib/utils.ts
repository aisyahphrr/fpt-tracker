import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatUserRoleLabel(role?: string, name?: string, email?: string): string {
  const r = (role || '').toLowerCase()
  const n = (name || '').toLowerCase()
  const e = (email || '').toLowerCase()

  if (r === 'admin' || n.includes('nailah') || e.includes('nailah')) return 'Admin Pusat'
  if (n.includes('ahlan') || e.includes('ahlan')) return 'Staff Pusat'
  if (r === 'direksi' || n.includes('aisyah') || n.includes('titik') || n.includes('errin') || e.includes('aisyah') || e.includes('titik') || e.includes('errinto')) return 'Direksi'
  if (r === 'cabang' || n.includes('cabang') || e.includes('cabang')) return 'Staff Cabang'
  if (r === 'pusat' || e.includes('pusat')) return 'Staff Pusat'
  
  return role || 'Staff Cabang'
}
