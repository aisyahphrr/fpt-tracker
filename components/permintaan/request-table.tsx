'use client'

import { Edit, Trash2, Eye, MoreVertical, Download } from 'lucide-react'
import { useState } from 'react'

export interface RequestItem {
  id: string
  noRequest: string
  tanggal: string
  buyer: string
  negara?: string
  tujuan?: string
  jumlahItem: number
  totalQty: number
  status: 'pending' | 'quotation_sent' | 'signing_mou' | 'selesai' | 'cancelled'
  items?: { name: string; qty: number; catatan?: string; barangId?: string; spesifikasi?: string; size?: string }[]
  catatan?: string
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return 'badge-pending'
    case 'quotation_sent':
      return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800'
    case 'signing_mou':
      return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800'
    case 'selesai':
      return 'badge-success'
    case 'cancelled':
      return 'badge-error'
    default:
      return 'badge-pending'
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'pending':
      return 'Pending'
    case 'quotation_sent':
      return 'Quotation sent'
    case 'signing_mou':
      return 'Signing MOU'
    case 'selesai':
      return 'Selesai'
    case 'cancelled':
      return 'Dibatalkan'
    default:
      return status
  }
}

interface RequestTableProps {
  data: RequestItem[]
  onDetail?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onUpdateStatus?: (id: string) => void
}

export function RequestTable({ data, onDetail, onEdit, onDelete, onUpdateStatus }: RequestTableProps) {
  const [expandedRows, setExpandedRows] = useState<string[]>([])

  const toggleActionMenu = (id: string) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  return (
    <div className="dashboard-card">
      <div className="overflow-x-auto min-h-[300px] pb-32">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-gray-50">
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">No</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Nomor Request</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Tanggal</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Buyer</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Negara / Tujuan</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Jumlah Item</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Total Qty</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Status</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-foreground">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((request, index) => (
              <tr
                key={request.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 text-sm text-foreground font-medium">{index + 1}</td>
                <td className="px-6 py-4 text-sm text-primary font-semibold">{request.noRequest}</td>
                <td className="px-6 py-4 text-sm text-foreground">{request.tanggal}</td>
                <td className="px-6 py-4 text-sm text-foreground font-medium">{request.buyer}</td>
                <td className="px-6 py-4 text-sm text-foreground">
                  {request.negara || request.tujuan ? (
                    <div>
                      <p className="font-semibold text-gray-900">{request.negara || '-'}</p>
                      <p className="text-xs text-muted-foreground">{request.tujuan || '-'}</p>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-foreground text-center">{request.jumlahItem}</td>
                <td className="px-6 py-4 text-sm text-foreground text-center">{request.totalQty}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={getStatusBadge(request.status)}>{getStatusLabel(request.status)}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="relative inline-block">
                    <button
                      onClick={() => toggleActionMenu(request.id)}
                      className="p-2 hover:bg-gray-200 rounded transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-600" />
                    </button>

                    {expandedRows.includes(request.id) && (
                      <div className="absolute right-8 top-0 mt-1 w-40 bg-card border border-border rounded-lg shadow-lg z-50">
                        <button
                          onClick={() => {
                            onDetail?.(request.id)
                            toggleActionMenu(request.id)
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-gray-50 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Detail
                        </button>
                        <button
                          onClick={() => {
                            onEdit?.(request.id)
                            toggleActionMenu(request.id)
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-gray-50 transition-colors border-t border-border"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            onUpdateStatus?.(request.id)
                            toggleActionMenu(request.id)
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-gray-50 transition-colors border-t border-border"
                        >
                          <Download className="w-4 h-4" />
                          Update Status
                        </button>
                        <button
                          onClick={() => {
                            onDelete?.(request.id)
                            toggleActionMenu(request.id)
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-border"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
