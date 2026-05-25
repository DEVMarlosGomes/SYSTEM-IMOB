import { NavLink, useNavigate } from 'react-router-dom'
import {
  LogOut, LayoutDashboard, Building2, Calendar, Users, DollarSign,
  FileText, MessageSquare, ShieldCheck, Receipt, UserCog, Home, ClipboardList, BarChart2,
} from 'lucide-react'
import { useAuth } from '@/stores/auth'
import { Avatar } from '@/components/common/Avatar'
import { cn } from '@/lib/utils'
import { roleLabel } from '@/lib/format'
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
  { to: '/admin/fichas-locatario', label: 'Fichas Inquilinos', icon: ClipboardList, roles: ['admin'] },
  { to: '/admin/relatorios', label: 'Relatórios', icon: BarChart2, roles: ['admin'] },

  { to: '/corretor', label: 'Dashboard', icon: LayoutDashboard, roles: ['corretor'] },
  { to: '/corretor/imoveis', label: 'Meus imoveis', icon: Building2, roles: ['corretor'] },
  { to: '/corretor/agenda', label: 'Minha agenda', icon: Calendar, roles: ['corretor'] },
  { to: '/corretor/contratos', label: 'Contratos', icon: FileText, roles: ['corretor'] },
  { to: '/corretor/fichas-locatario', label: 'Meus Inquilinos', icon: ClipboardList, roles: ['corretor'] },

  { to: '/locatario', label: 'Meu imovel', icon: Home, roles: ['locatario'] },
  { to: '/locatario/pagamentos', label: 'Pagamentos', icon: Receipt, roles: ['locatario'] },

  { to: '/locador', label: 'Meu imovel', icon: Home, roles: ['locador'] },
  { to: '/locador/financeiro', label: 'Repasses', icon: DollarSign, roles: ['locador'] },
  { to: '/locador/chat', label: 'Chat imobiliaria', icon: MessageSquare, roles: ['locador'] },
]

function ImobVipLogo({ small }: { small?: boolean }) {
  if (small) {
    return (
      <div
        className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
        style={{
          background: '#fff',
          boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
          padding: '4px',
        }}
      >
        <img src="/logo.png" alt="ImobVip" className="w-full h-full object-contain" />
      </div>
    )
  }
  return (
    <div
      className="flex items-center justify-center rounded-xl px-3 py-2 w-full"
      style={{
        background: '#fff',
        boxShadow: '0 2px 12px rgba(0,0,0,0.20)',
      }}
    >
      <img src="/logo.png" alt="ImobVip Consultoria Imobiliária" className="h-10 object-contain" />
    </div>
  )
}

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
        'fixed inset-y-0 left-0 z-30 flex flex-col transition-all duration-300',
        collapsed ? 'w-[76px]' : 'w-[260px]',
      )}
      style={{
        background: 'linear-gradient(170deg, #091628 0%, #0F2238 45%, #1B3A5C 100%)',
        boxShadow: '4px 0 30px rgba(0,0,0,0.40)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <div
        className={cn('px-4 py-5 flex items-center', collapsed ? 'justify-center' : '')}
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {collapsed ? <ImobVipLogo small /> : <ImobVipLogo />}
      </div>

      {/* Tenant name */}
      {!collapsed && tenant && (
        <div
          className="mx-3 mt-3 px-3 py-1.5 rounded-lg text-[11px] text-center font-medium truncate"
          style={{
            background: 'rgba(212,168,83,0.08)',
            border: '1px solid rgba(212,168,83,0.15)',
            color: 'rgba(212,168,83,0.75)',
            letterSpacing: '0.08em',
          }}
        >
          {tenant.nome}
        </div>
      )}

      {/* Navigation */}
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
                      'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                      isActive ? 'nav-active' : 'text-white/55 hover:nav-hover border border-transparent',
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

      {/* User section */}
      <div
        className="px-3 py-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.20)' }}
      >
        <div
          className={cn('flex items-center gap-3 px-2 py-2 rounded-xl', collapsed && 'justify-center')}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <Avatar name={user.nome} src={user.avatar_url || undefined} size={34} />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user.nome}</div>
              <div className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {roleLabel(user.role)}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => { logout(); navigate('/login') }}
          className={cn(
            'mt-2 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm transition-all',
            'text-white/50 hover:text-white/85',
          )}
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(176,58,46,0.18)'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(176,58,46,0.25)'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.06)'
          }}
        >
          <LogOut size={15} />
          {!collapsed && <span>Sair</span>}
        </button>

        {onToggle && (
          <button
            onClick={onToggle}
            className="hidden md:block w-full mt-2 text-[11px] hover:text-white/70 transition text-center"
            style={{ color: 'rgba(255,255,255,0.30)' }}
          >
            {collapsed ? '→ Expandir' : '← Recolher'}
          </button>
        )}
      </div>
    </aside>
  )
}
