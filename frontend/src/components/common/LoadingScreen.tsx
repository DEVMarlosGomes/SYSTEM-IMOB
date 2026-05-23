import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LoadingScreen({ label = 'Carregando…', fullscreen = false, className }: { label?: string; fullscreen?: boolean; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 text-ink-secondary', fullscreen ? 'min-h-screen' : 'py-12', className)}>
      <Loader2 className="animate-spin text-navy" size={28} />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function InlineLoader({ className }: { className?: string }) {
  return <Loader2 className={cn('animate-spin', className)} size={16} />
}
