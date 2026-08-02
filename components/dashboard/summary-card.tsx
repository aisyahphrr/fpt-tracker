import { ArrowUp, ArrowDown } from 'lucide-react'
import React from 'react'

interface SummaryCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string | number
  backgroundColor?: string
  iconColor?: string
}

export function SummaryCard({
  title,
  value,
  icon,
  trend = 'neutral',
  trendValue,
  backgroundColor = 'bg-blue-50',
  iconColor = 'text-primary',
}: SummaryCardProps) {
  return (
    <div className="dashboard-card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium mb-2">{title}</p>
          <p className="text-3xl font-bold text-foreground mb-2">{value}</p>

          {trendValue && (
            <div className="flex items-center gap-1">
              {trend === 'up' && (
                <>
                  <ArrowUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-600">+{trendValue}</span>
                </>
              )}
              {trend === 'down' && (
                <>
                  <ArrowDown className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-semibold text-red-600">{trendValue}</span>
                </>
              )}
              {trend === 'neutral' && <span className="text-sm text-muted-foreground">{trendValue}</span>}
            </div>
          )}
        </div>

        <div className={`${backgroundColor} p-3 rounded-lg ${iconColor}`}>{icon}</div>
      </div>
    </div>
  )
}
