import { ReactNode, CSSProperties } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: ReactNode
  trend?: { direction: 'up' | 'down' | 'flat'; label: string }
  accent?: 'navy' | 'gold' | 'success' | 'warning' | 'danger' | 'neutral'
  className?: string
}

const accentConfig: Record<NonNullable<Props['accent']>, {
  icon: CSSProperties
  blob1: string
  blob2: string
  glow: string
  border: string
}> = {
  navy: {
    icon: {
      background: 'linear-gradient(135deg, #2E5F8A 0%, #1B3A5C 100%)',
      boxShadow: '0 4px 14px rgba(27,58,92,0.35), inset 0 1px 1px rgba(255,255,255,0.15)',
      color: '#FFFFFF',
    },
    blob1: 'rgba(46,95,138,0.18)',
    blob2: 'rgba(27,58,92,0.10)',
    glow: 'rgba(27,58,92,0.08)',
    border: 'rgba(27,58,92,0.10)',
  },
  gold: {
    icon: {
      background: 'linear-gradient(135deg, #E1BD5C 0%, #D4A853 100%)',
      boxShadow: '0 4px 14px rgba(212,168,83,0.45), inset 0 1px 1px rgba(255,255,255,0.45)',
      color: '#0F2238',
    },
    blob1: 'rgba(212,168,83,0.22)',
    blob2: 'rgba(225,189,92,0.12)',
    glow: 'rgba(212,168,83,0.10)',
    border: 'rgba(212,168,83,0.15)',
  },
  success: {
    icon: {
      background: 'linear-gradient(135deg, #3a9162 0%, #2D7A4F 100%)',
      boxShadow: '0 4px 14px rgba(45,122,79,0.32), inset 0 1px 1px rgba(255,255,255,0.15)',
      color: '#FFFFFF',
    },
    blob1: 'rgba(45,122,79,0.16)',
    blob2: 'rgba(58,145,98,0.09)',
    glow: 'rgba(45,122,79,0.07)',
    border: 'rgba(45,122,79,0.12)',
  },
  warning: {
    icon: {
      background: 'linear-gradient(135deg, #D48C38 0%, #C17B2A 100%)',
      boxShadow: '0 4px 14px rgba(193,123,42,0.32), inset 0 1px 1px rgba(255,255,255,0.20)',
      color: '#FFFFFF',
    },
    blob1: 'rgba(193,123,42,0.18)',
    blob2: 'rgba(212,140,56,0.09)',
    glow: 'rgba(193,123,42,0.07)',
    border: 'rgba(193,123,42,0.14)',
  },
  danger: {
    icon: {
      background: 'linear-gradient(135deg, #C84434 0%, #B03A2E 100%)',
      boxShadow: '0 4px 14px rgba(176,58,46,0.32), inset 0 1px 1px rgba(255,255,255,0.15)',
      color: '#FFFFFF',
    },
    blob1: 'rgba(176,58,46,0.15)',
    blob2: 'rgba(200,68,52,0.08)',
    glow: 'rgba(176,58,46,0.07)',
    border: 'rgba(176,58,46,0.12)',
  },
  neutral: {
    icon: {
      background: 'linear-gradient(135deg, #5A6070 0%, #3D4455 100%)',
      boxShadow: '0 4px 14px rgba(0,0,0,0.14), inset 0 1px 1px rgba(255,255,255,0.12)',
      color: '#FFFFFF',
    },
    blob1: 'rgba(90,96,112,0.10)',
    blob2: 'rgba(27,58,92,0.06)',
    glow: 'rgba(15,34,56,0.04)',
    border: 'rgba(226,221,214,0.65)',
  },
}

const trendColors = {
  up:   { bg: 'rgba(45,122,79,0.09)',  color: '#2D7A4F', border: 'rgba(45,122,79,0.20)' },
  down: { bg: 'rgba(176,58,46,0.09)', color: '#B03A2E', border: 'rgba(176,58,46,0.20)' },
  flat: { bg: 'rgba(90,96,112,0.07)', color: '#5A6070', border: 'rgba(90,96,112,0.15)' },
}

export function KPICard({ label, value, hint, icon, trend, accent = 'neutral', className }: Props) {
  const cfg = accentConfig[accent]
  const trendStyle = trend ? trendColors[trend.direction] : null

  return (
    <div
      className={cn('liquid-card liquid-shimmer p-5 group', className)}
      style={{
        border: `1px solid ${cfg.border}`,
        boxShadow: `0 8px 36px ${cfg.glow}, 0 2px 8px rgba(15,34,56,0.04), inset 0 1px 2px rgba(255,255,255,0.95)`,
      }}
    >
      {/* Blob 1 — grande, canto superior direito */}
      <div
        className="liquid-blob"
        style={{
          width: 140,
          height: 140,
          top: -40,
          right: -40,
          background: `radial-gradient(circle, ${cfg.blob1} 0%, transparent 70%)`,
          animationDuration: '10s',
        }}
      />
      {/* Blob 2 — menor, canto inferior esquerdo */}
      <div
        className="liquid-blob-alt"
        style={{
          width: 100,
          height: 100,
          bottom: -30,
          left: -20,
          background: `radial-gradient(circle, ${cfg.blob2} 0%, transparent 70%)`,
          animationDuration: '14s',
          animationDelay: '-4s',
        }}
      />

      {/* Highlight topo */}
      <div
        className="absolute top-0 left-4 right-4 h-px"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.88) 50%, transparent 100%)' }}
      />

      {/* Conteúdo */}
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div
            className="text-[11px] font-semibold uppercase tracking-[0.13em] leading-tight"
            style={{ color: 'rgba(90,96,112,0.80)' }}
          >
            {label}
          </div>
          {icon && (
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
              style={cfg.icon}
            >
              {icon}
            </div>
          )}
        </div>

        <div className="font-display text-[2rem] leading-none text-ink mb-3">{value}</div>

        <div className="flex items-center justify-between gap-2 min-h-[20px]">
          {hint && (
            <div className="text-xs" style={{ color: 'rgba(90,96,112,0.70)' }}>{hint}</div>
          )}
          {trend && trendStyle && (
            <span
              className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold flex-shrink-0 ml-auto"
              style={{
                background: trendStyle.bg,
                color: trendStyle.color,
                border: `1px solid ${trendStyle.border}`,
              }}
            >
              {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '—'} {trend.label}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
