import { cn } from '@/lib/utils'
import { initials } from '@/lib/format'

interface Props {
  name?: string | null
  src?: string | null
  size?: number
  className?: string
}

export function Avatar({ name, src, size = 40, className }: Props) {
  return (
    <div
      className={cn(
        'rounded-full bg-gradient-to-br from-navy-500 to-navy text-white flex items-center justify-center font-medium overflow-hidden flex-shrink-0 ring-2 ring-white shadow-soft',
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.36) }}
    >
      {src ? <img src={src} alt={name || ''} className="h-full w-full object-cover" /> : <span>{initials(name)}</span>}
    </div>
  )
}
