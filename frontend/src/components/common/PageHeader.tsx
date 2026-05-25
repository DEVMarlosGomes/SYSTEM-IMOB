import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  title: string
  description?: string
  breadcrumb?: string[]
  actions?: ReactNode
  className?: string
  eyebrow?: string
}

export function PageHeader({ title, description, breadcrumb, actions, className, eyebrow }: Props) {
  return (
    <div
      className={cn('flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6 pb-5', className)}
      style={{ borderBottom: '1px solid rgba(226,221,214,0.55)' }}
    >
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <nav
            className="text-[11px] uppercase tracking-[0.12em] mb-2 flex items-center gap-1.5"
            style={{ color: 'rgba(139,145,161,0.85)' }}
          >
            {breadcrumb.map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {b}
                {i < breadcrumb.length - 1 && (
                  <span style={{ color: 'rgba(139,145,161,0.45)' }}>/</span>
                )}
              </span>
            ))}
          </nav>
        )}
        {eyebrow && (
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-1"
            style={{ color: '#B8923A' }}
          >
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl md:text-[34px] text-ink leading-tight">{title}</h1>
        {description && (
          <p className="text-ink-secondary mt-2 text-sm md:text-base max-w-2xl leading-relaxed">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap">{actions}</div>
      )}
    </div>
  )
}
