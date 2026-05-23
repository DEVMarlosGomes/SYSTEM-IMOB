import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: ReactNode
  trend?: { direction: 'up' | 'down' | 'flat'; label: string }
  accent?: 'navy' | 'gold' | 'success' | 'warning' | 'danger' | 'neutral'
  className?: string
}

const accents = {
  navy: 'from-navy-50 to-white border-navy-100 [&_.kpi-icon]:bg-navy [&_.kpi-icon]:text-white',
  gold: 'from-gold/10 to-white border-gold/30 [&_.kpi-icon]:bg-gold [&_.kpi-icon]:text-navy-800',
  success: 'from-success-soft to-white border-success/20 [&_.kpi-icon]:bg-success [&_.kpi-icon]:text-white',
  warning: 'from-warning-soft to-white border-warning/20 [&_.kpi-icon]:bg-warning [&_.kpi-icon]:text-white',
  danger: 'from-danger-soft to-white border-danger/20 [&_.kpi-icon]:bg-danger [&_.kpi-icon]:text-white',
  neutral: 'from-surface-muted to-white border-line [&_.kpi-icon]:bg-ink [&_.kpi-icon]:text-white',
}

const trendStyles = {
  up: 'text-success bg-success-soft',
  down: 'text-danger bg-danger-soft',
  flat: 'text-ink-secondary bg-surface-muted',
}

export function KPICard({ label, value, hint, icon, trend, accent = 'neutral', className }: Props) {
  return (
    <div className={cn('relative overflow-hidden rounded-xl border p-5 shadow-soft bg-gradient-to-br', accents[accent], className)}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="text-xs font-medium uppercase tracking-wider text-ink-secondary">{label}</div>
        {icon && <div className="kpi-icon h-10 w-10 rounded-lg flex items-center justify-center">{icon}</div>}
      </div>
      <div className="font-display text-3xl text-ink leading-tight">{value}</div>
      <div className="mt-2 flex items-center justify-between gap-2">
        {hint && <div className="text-xs text-ink-secondary">{hint}</div>}
        {trend && (
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', trendStyles[trend.direction])}>
            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '—'} {trend.label}
          </span>
        )}
      </div>
    </div>
  )
}
