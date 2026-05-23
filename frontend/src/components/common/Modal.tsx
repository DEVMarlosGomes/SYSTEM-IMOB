import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  hideCloseButton?: boolean
}

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Modal({ open, onClose, title, description, children, footer, size = 'md', hideCloseButton }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-fade-in" role="dialog" aria-modal="true">
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="absolute inset-0 bg-navy-800/40 backdrop-blur-sm"
      />
      <div className={cn('relative w-full bg-white rounded-t-2xl md:rounded-xl shadow-modal border border-line max-h-[92vh] flex flex-col', sizes[size])}>
        {(title || !hideCloseButton) && (
          <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-line">
            <div>
              {title && <h2 className="font-display text-xl text-ink">{title}</h2>}
              {description && <p className="text-sm text-ink-secondary mt-1">{description}</p>}
            </div>
            {!hideCloseButton && (
              <button onClick={onClose} className="p-1.5 rounded-md text-ink-secondary hover:bg-surface-muted" aria-label="Fechar">
                <X size={18} />
              </button>
            )}
          </div>
        )}
        <div className="px-6 py-5 overflow-y-auto scrollbar-thin flex-1">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-line bg-surface/60 rounded-b-xl flex items-center justify-end gap-3">{footer}</div>}
      </div>
    </div>
  )
}
