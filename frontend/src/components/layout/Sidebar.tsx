import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut, LayoutDashboard, Building2, Calendar, Users, DollarSign, FileText, MessageSquare, ShieldCheck, Receipt, UserCog } from 'lucide-react'
import { useAuth } from '@/stores/auth'
import { Avatar } from '@/components/common/Avatar'
import { cn } from '@/lib/utils'
import { roleLabel } from '@/lib/format'
import { APP_NAME } from '@/lib/constants'
import { useEffect, useState } from 'react'
import { tenantService } from '@/services'
import type { Tenant } from '@/types'

interface NavItem { to: string; label: string; icon: any; roles: string[] }

const NAV_ITEMS: NavItem[] = [
  { to: '/superadmin', label: 'Painel Global', icon: ShieldCheck, roles: ['superadmin'] },

  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { to: '/admin/imoveis', label: 'Imoveis', icon: Building2, roles: ['admin'] },
  { to: '/admin/corretores', label: 'Corretores', icon: UserCog, roles: ['admin'] },
  { to: '/admin/crm/locatarios', label: 'CRM Locatarios', icon: Users, roles: ['admin'] },
  { to: '/admin/crm/locadores', label: 'CRM Locadores', icon: Users, roles: ['admin'] },
  { to: '/admin/agenda', label: 'Agenda', icon: Calendar, roles: ['admin'] },
  { to: '/admin/financeiro', label: 'Financeiro', icon: DollarSign, roles: ['admin'] },
  { to: '/admin/contratos', label: 'Contratos', icon: FileText, roles: ['admin'] },
  { to: '/admin/chat', label: 'Chat com locadores', icon: MessageSquare, roles: ['admin'] },

  { to: '/corretor', label: 'Dashboard', icon: LayoutDashboard, roles: ['corretor'] },
  { to: '/corretor/imoveis', label: 'Meus imoveis', icon: Building2, roles: ['corretor'] },
  { to: '/corretor/agenda', label: 'Minha agenda', icon: Calendar, roles: ['corretor'] },
  { to: '/corretor/contratos', label: 'Contratos', icon: FileText, roles: ['corretor'] },

  { to: '/locatario', label: 'Meu imovel', icon: Building2, roles: ['locatario'] },
  { to: '/locatario/pagamentos', label: 'Pagamentos', icon: Receipt, roles: ['locatario'] },

  { to: '/locador', label: 'Meu imovel', icon: Building2, roles: ['locador'] },
  { to: '/locador/financeiro', label: 'Repasses', icon: DollarSign, roles: ['locador'] },
  { to: '/locador/chat', label: 'Chat imobiliaria', icon: MessageSquare, roles: ['locador'] },
]

export function Sidebar({ collapsed, onToggle }: { collapsed?: boolean; onToggle?: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tenant, setTenant] = useState<Tenant | null>(null)

  useEffect(() => {
    if (!user || user.role === 'superadmin') return
    tenantService.me().then(setTenant).catch(() => undefined)
  }, [user])

  if (!user) return null
  const items = NAV_ITEMS.filter((n) => n.roles.includes(user.role))

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 flex flex-col bg-navy-800 text-white border-r border-navy-700 transition-all',
        collapsed ? 'w-[76px]' : 'w-[260px]',
      )}
    >
      <div className="px-5 py-5 border-b border-navy-700 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-gold text-navy-800 font-display font-bold text-lg flex items-center justify-center shadow-gold">I</div>
        {!collapsed && (
          <div>
            <div className="font-display text-lg leading-none">{APP_NAME}</div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-gold-300 mt-1">{tenant?.nome || 'Plataforma premium'}</div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to.split('/').length <= 2}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition',
                      isActive ? 'bg-navy-600/80 text-gold' : 'text-white/70 hover:text-white hover:bg-navy-700/70',
                    )
                  }
                >
                  <Icon size={18} className="flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="px-3 py-4 border-t border-navy-700">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <Avatar name={user.nome} src={user.avatar_url || undefined} size={36} />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user.nome}</div>
              <div className="text-[11px] text-white/60 truncate">{roleLabel(user.role)} · {user.email}</div>
            </div>
          )}
        </div>
        <button
          onClick={() => { logout(); navigate('/login') }}
          className={cn('mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm bg-navy-700/60 text-white hover:bg-navy-700 transition border border-navy-600/60')}
        >
          <LogOut size={16} />
          {!collapsed && <span>Sair</span>}
        </button>
        {onToggle && (
          <button onClick={onToggle} className="hidden md:block w-full mt-2 text-xs text-white/50 hover:text-white">
            {collapsed ? 'Expandir' : 'Recolher menu'}
          </button>
        )}
      </div>
    </aside>
  )
}
