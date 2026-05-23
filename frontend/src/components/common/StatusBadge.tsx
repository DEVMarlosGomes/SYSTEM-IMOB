import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  children: ReactNode
  className?: string
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'navy' | 'gold'
  icon?: ReactNode
}

const variants: Record<NonNullable<Props['variant']>, string> = {
  neutral: 'bg-surface-muted text-ink-secondary border border-line',
  success: 'bg-success-soft text-success border border-success/30',
  warning: 'bg-warning-soft text-warning border border-warning/30',
  danger: 'bg-danger-soft text-danger border border-danger/30',
  navy: 'bg-navy-50 text-navy border border-navy-200',
  gold: 'bg-gold/15 text-gold-700 border border-gold/40',
}

export function StatusBadge({ children, className, variant = 'neutral', icon }: Props) {
  return (
    <span className={cn('badge-pill', variants[variant], className)}>
      {icon}
      {children}
    </span>
  )
}

export function variantForPropertyStatus(s: string): Props['variant'] {
  if (s === 'disponivel') return 'success'
  if (s === 'alugado') return 'navy'
  if (s === 'indisponivel') return 'warning'
  return 'neutral'
}

export function variantForPaymentLocatario(s: string): Props['variant'] {
  if (s === 'pago') return 'success'
  if (s === 'atrasado') return 'danger'
  if (s === 'comprovante_enviado') return 'navy'
  return 'warning'
}

export function variantForPaymentLocador(s: string): Props['variant'] {
  if (s === 'pago') return 'success'
  if (s === 'gerando_impostos') return 'warning'
  return 'navy'
}
