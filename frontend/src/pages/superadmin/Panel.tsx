import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { Avatar } from '@/components/common/Avatar'
import { StatusBadge } from '@/components/common/StatusBadge'
import { tenantService, userService } from '@/services'
import { authService } from '@/services/auth'
import type { Tenant, User } from '@/types'
import { useAuth } from '@/stores/auth'
import { useNavigate } from 'react-router-dom'
import { defaultRouteFor } from '@/routes/PrivateRoute'
import { Building2, UserCog } from 'lucide-react'

export default function SuperadminPanel() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const { setSession } = useAuth()
  const navigate = useNavigate()

  useEffect(() => { Promise.all([tenantService.list(), userService.list()]).then(([t, u]) => { setTenants(t); setUsers(u) }).finally(() => setLoading(false)) }, [])

  async function impersonate(u: User) {
    if (!confirm(`Impersonar ${u.nome} (${u.role})?`)) return
    try {
      const res = await authService.impersonate(u.id)
      setSession(res.user, res.access_token)
      toast.success(`Agora voce esta como ${u.nome}`)
      navigate(defaultRouteFor(u.role))
    } catch { toast.error('Falha ao impersonar.') }
  }

  if (loading) return <AppLayout><LoadingScreen /></AppLayout>
  return (
    <AppLayout>
      <PageHeader eyebrow="Plataforma" title="Painel do Superusuario" description="Visao global das imobiliarias e usuarios. Impersone para dar suporte." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card-premium p-5">
          <h3 className="font-display text-lg mb-3 flex items-center gap-2"><Building2 className="text-gold"/> Imobiliarias</h3>
          <ul className="space-y-2">
            {tenants.map((t) => (
              <li key={t.id} className="flex items-center justify-between p-3 border border-line rounded-md">
                <div>
                  <div className="font-medium">{t.nome}</div>
                  <div className="text-xs text-ink-secondary">{t.cnpj || 'CNPJ nao informado'} · {t.telefone || '—'}</div>
                </div>
                <StatusBadge variant="navy">{t.slug || 'tenant'}</StatusBadge>
              </li>
            ))}
          </ul>
        </div>
        <div className="card-premium p-5">
          <h3 className="font-display text-lg mb-3 flex items-center gap-2"><UserCog className="text-gold"/> Usuarios</h3>
          <ul className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin">
            {users.map((u) => (
              <li key={u.id} className="flex items-center gap-3 p-2 border border-line rounded-md">
                <Avatar name={u.nome} size={32}/>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{u.nome}</div>
                  <div className="text-xs text-ink-muted truncate">{u.email} · {u.role}</div>
                </div>
                {u.role !== 'superadmin' && <button className="btn-outline text-xs" onClick={() => impersonate(u)}>Entrar como</button>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppLayout>
  )
}
