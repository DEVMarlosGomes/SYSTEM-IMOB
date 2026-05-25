import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, UserCheck } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { EmptyState } from '@/components/common/EmptyState'
import { StatusBadge } from '@/components/common/StatusBadge'
import { fichaLocatarioService } from '@/services'
import type { FichaLocatario } from '@/types/locatario.types'
import { STATUS_FICHA } from '@/types/locatario.types'
import { formatCurrency, fmtDateBR, mascaraCPFPublico } from '@/lib/validations'
import { useAuth } from '@/stores/auth'
import { useDebounce } from '@/hooks/useDebounce'

function statusVariant(s: FichaLocatario['status']): 'success' | 'warning' | 'neutral' {
  if (s === 'ativo') return 'success'
  if (s === 'analise') return 'warning'
  return 'neutral'
}

const STATUS_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'analise', label: 'Em análise' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
]

export default function FichasLocatarios() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [fichas, setFichas] = useState<FichaLocatario[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const debounced = useDebounce(search, 300)

  const base = user?.role === 'corretor' ? '/corretor' : '/admin'

  useEffect(() => {
    setLoading(true)
    fichaLocatarioService
      .list({ search: debounced || undefined, status: statusFilter || undefined })
      .then(res => { setFichas(res.items); setTotal(res.total) })
      .finally(() => setLoading(false))
  }, [debounced, statusFilter])

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Fichas"
        title="Fichas de Inquilinos"
        description="Cadastros completos de inquilinos com dados LGPD e documentação."
        actions={
          <button className="btn-gold flex items-center gap-2" onClick={() => navigate(`${base}/fichas-locatario/novo`)}>
            <Plus size={16} /> Nova Ficha Inquilino
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
          <input
            className="input-premium pl-9 text-sm py-2 w-full"
            placeholder="Buscar por nome, CPF, condomínio…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === f.value
                  ? 'text-white'
                  : 'text-ink-secondary hover:text-ink'
              }`}
              style={{
                background: statusFilter === f.value
                  ? 'linear-gradient(135deg, #2E5F8A 0%, #1B3A5C 100%)'
                  : 'rgba(255,255,255,0.60)',
                border: statusFilter === f.value
                  ? '1px solid rgba(27,58,92,0.40)'
                  : '1px solid rgba(226,221,214,0.60)',
              }}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-ink-muted ml-auto">{total} ficha{total !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <LoadingScreen />
      ) : fichas.length === 0 ? (
        <EmptyState
          title="Nenhuma ficha encontrada"
          description={search ? 'Tente outros termos de busca.' : 'Clique em "Nova Ficha Inquilino" para cadastrar.'}
          icon={<UserCheck size={32} style={{ color: '#D4A853' }} />}
        />
      ) : (
        <div className="card-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="text-[11px] uppercase tracking-wider text-ink-muted"
                  style={{ background: 'rgba(248,247,244,0.70)', borderBottom: '1px solid rgba(226,221,214,0.55)' }}
                >
                  <th className="text-left px-4 py-3">Inquilino</th>
                  <th className="text-left px-4 py-3">CPF</th>
                  <th className="text-left px-4 py-3">Unidade</th>
                  <th className="text-right px-4 py-3">Locação</th>
                  <th className="text-center px-4 py-3">Chaves</th>
                  <th className="text-center px-4 py-3">Status</th>
                  {user?.role === 'admin' && <th className="text-left px-4 py-3">Corretor</th>}
                </tr>
              </thead>
              <tbody>
                {fichas.map(f => (
                  <tr
                    key={f.id}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: '1px solid rgba(226,221,214,0.40)' }}
                    onClick={() => navigate(`${base}/fichas-locatario/${f.id}`)}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,247,244,0.80)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">{f.cliente1.nome_completo}</div>
                      <div className="text-xs text-ink-muted">{f.condominio}</div>
                    </td>
                    <td className="px-4 py-3 text-ink-secondary font-mono text-xs">
                      {mascaraCPFPublico(f.cliente1.cpf)}
                    </td>
                    <td className="px-4 py-3 text-ink-secondary">{f.unidade}</td>
                    <td className="px-4 py-3 text-right font-medium text-ink">
                      R$ {formatCurrency(f.valor_locacao)}
                    </td>
                    <td className="px-4 py-3 text-center text-ink-secondary text-xs">
                      {fmtDateBR(f.data_prevista_entrega_chaves)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge variant={statusVariant(f.status)}>{STATUS_FICHA[f.status]}</StatusBadge>
                    </td>
                    {user?.role === 'admin' && (
                      <td className="px-4 py-3 text-ink-secondary text-xs">
                        {f.corretor?.nome ?? '—'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
