import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LoadingScreen({ label = 'Carregando…', fullscreen = false, className }: { label?: string; fullscreen?: boolean; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4', fullscreen ? 'min-h-screen' : 'py-16', className)}>
      <div
        className="h-14 w-14 rounded-2xl flex items-center justify-center"
        style={{
          background: 'rgba(255,255,255,0.70)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.60)',
          boxShadow: '0 4px 20px rgba(27,58,92,0.10)',
        }}
      >
        <Loader2 className="animate-spin" size={26} style={{ color: '#1B3A5C' }} />
      </div>
      <span className="text-sm font-medium" style={{ color: 'rgba(90,96,112,0.80)' }}>{label}</span>
    </div>
  )
}

export function InlineLoader({ className }: { className?: string }) {
  return <Loader2 className={cn('animate-spin', className)} size={16} style={{ color: '#1B3A5C' }} />
}
