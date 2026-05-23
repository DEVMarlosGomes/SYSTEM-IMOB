import { Search, Bell, Menu } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
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
    <header className="sticky top-0 z-20 bg-white/85 backdrop-blur border-b border-line">
      <div className="flex items-center gap-3 px-4 md:px-6 py-3">
        <button onClick={onMenu} className="md:hidden p-2 rounded-md text-ink-secondary hover:bg-surface-muted" aria-label="Menu">
          <Menu size={20} />
        </button>
        {onSearch && (
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={16} />
            <input
              value={search ?? ''}
              onChange={(e) => onSearch?.(e.target.value)}
              placeholder={searchPlaceholder}
              className="input-premium pl-9"
            />
          </div>
        )}
        <div className="ml-auto flex items-center gap-3">
          <button className="p-2 rounded-md text-ink-secondary hover:bg-surface-muted" aria-label="Notificacoes">
            <Bell size={18} />
          </button>
          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-line">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-ink">{user.nome}</div>
                <div className="text-[11px] text-ink-muted">{roleLabel(user.role)}</div>
              </div>
              <Avatar name={user.nome} src={user.avatar_url || undefined} size={36} />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
