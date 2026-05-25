import { Search, Menu } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { NotificationBell } from '@/components/common/NotificationBell'
import { useAuth } from '@/stores/auth'
import { roleLabel } from '@/lib/format'

interface Props {
  onMenu?: () => void
  search?: string
  onSearch?: (s: string) => void
  searchPlaceholder?: string
}

export function Header({ onMenu, search, onSearch, searchPlaceholder = 'Buscar imoveis, clientes…' }: Props) {
  const { user } = useAuth()
  return (
    <header
      className="sticky top-0 z-20"
      style={{
        background: 'rgba(248,247,244,0.82)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        borderBottom: '1px solid rgba(255,255,255,0.65)',
        boxShadow: '0 1px 3px rgba(15,34,56,0.06), 0 1px 0 rgba(255,255,255,0.90) inset',
      }}
    >
      <div className="flex items-center gap-3 px-4 md:px-6 py-3">
        <button
          onClick={onMenu}
          className="md:hidden p-2 rounded-xl text-ink-secondary transition-all"
          style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.55)' }}
          aria-label="Menu"
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.85)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.60)' }}
        >
          <Menu size={20} />
        </button>

        {onSearch && (
          <div className="relative flex-1 max-w-xl">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              size={16}
              style={{ color: 'rgba(90,96,112,0.70)' }}
            />
            <input
              value={search ?? ''}
              onChange={(e) => onSearch?.(e.target.value)}
              placeholder={searchPlaceholder}
              className="input-premium pl-9"
            />
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {/* Notification bell */}
          <NotificationBell />

          {/* User info */}
          {user && (
            <div
              className="flex items-center gap-3 pl-3 ml-1"
              style={{ borderLeft: '1px solid rgba(226,221,214,0.70)' }}
            >
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-ink leading-tight">{user.nome}</div>
                <div className="text-[11px]" style={{ color: 'rgba(90,96,112,0.75)' }}>{roleLabel(user.role)}</div>
              </div>
              <div
                className="rounded-xl overflow-hidden"
                style={{ boxShadow: '0 2px 8px rgba(27,58,92,0.15), 0 0 0 2px rgba(212,168,83,0.20)' }}
              >
                <Avatar name={user.nome} src={user.avatar_url || undefined} size={36} />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
