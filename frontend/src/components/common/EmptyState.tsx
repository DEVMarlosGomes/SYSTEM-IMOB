import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Inbox } from 'lucide-react'

interface Props {
  title?: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({ title = 'Nada por aqui ainda', description, icon, action, className }: Props) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-12 px-6 rounded-xl border border-dashed border-line bg-surface-muted/40', className)}>
      <div className="h-14 w-14 rounded-full bg-white border border-line flex items-center justify-center text-ink-secondary mb-4">
        {icon || <Inbox size={26} />}
      </div>
      <h3 className="font-display text-lg text-ink mb-1">{title}</h3>
      {description && <p className="text-ink-secondary text-sm max-w-md">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
