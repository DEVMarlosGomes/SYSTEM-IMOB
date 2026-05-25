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
    <div
      className={cn('flex flex-col items-center justify-center text-center py-14 px-6 rounded-2xl', className)}
      style={{
        background: 'rgba(255,255,255,0.45)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1.5px dashed rgba(212,168,83,0.25)',
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.75)',
      }}
    >
      <div
        className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background: 'rgba(255,255,255,0.75)',
          border: '1px solid rgba(226,221,214,0.80)',
          boxShadow: '0 2px 8px rgba(15,34,56,0.06)',
          color: 'rgba(90,96,112,0.70)',
        }}
      >
        {icon || <Inbox size={26} />}
      </div>
      <h3 className="font-display text-lg text-ink mb-1">{title}</h3>
      {description && (
        <p className="text-ink-secondary text-sm max-w-md leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
