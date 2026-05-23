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
    <div className={cn('flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6 pb-5 border-b border-line', className)}>
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="text-xs uppercase tracking-wider text-ink-muted mb-2 flex items-center gap-1.5">
            {breadcrumb.map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {b}
                {i < breadcrumb.length - 1 && <span className="opacity-50">/</span>}
              </span>
            ))}
          </nav>
        )}
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-500 mb-1">{eyebrow}</p>}
        <h1 className="font-display text-3xl md:text-[34px] text-ink leading-tight">{title}</h1>
        {description && <p className="text-ink-secondary mt-2 text-sm md:text-base max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  )
}
