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
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="absolute inset-0"
        style={{
          background: 'rgba(9,22,40,0.55)',
          backdropFilter: 'blur(8px) saturate(150%)',
          WebkitBackdropFilter: 'blur(8px) saturate(150%)',
        }}
      />

      {/* Modal panel */}
      <div
        className={cn(
          'relative w-full rounded-t-3xl md:rounded-2xl max-h-[92vh] flex flex-col',
          sizes[size],
        )}
        style={{
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.65)',
          boxShadow: '0 24px 60px rgba(9,22,40,0.25), 0 4px 16px rgba(9,22,40,0.10), inset 0 1px 1px rgba(255,255,255,0.95)',
        }}
      >
        {/* Top highlight */}
        <div
          className="absolute top-0 left-6 right-6 h-px rounded-full"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.90) 50%, transparent 100%)' }}
        />

        {(title || !hideCloseButton) && (
          <div
            className="flex items-start justify-between gap-4 px-6 py-5"
            style={{ borderBottom: '1px solid rgba(226,221,214,0.60)' }}
          >
            <div>
              {title && <h2 className="font-display text-xl text-ink">{title}</h2>}
              {description && <p className="text-sm text-ink-secondary mt-1">{description}</p>}
            </div>
            {!hideCloseButton && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-ink-secondary transition-all flex-shrink-0"
                style={{
                  background: 'rgba(255,255,255,0.60)',
                  border: '1px solid rgba(226,221,214,0.60)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(176,58,46,0.08)'
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(176,58,46,0.20)'
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#B03A2E'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.60)'
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(226,221,214,0.60)'
                  ;(e.currentTarget as HTMLButtonElement).style.color = ''
                }}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        <div className="px-6 py-5 overflow-y-auto scrollbar-thin flex-1">{children}</div>

        {footer && (
          <div
            className="px-6 py-4 rounded-b-2xl flex items-center justify-end gap-3"
            style={{
              borderTop: '1px solid rgba(226,221,214,0.60)',
              background: 'rgba(248,247,244,0.60)',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
