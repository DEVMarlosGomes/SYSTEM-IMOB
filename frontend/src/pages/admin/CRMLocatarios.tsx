import { useEffect, useState } from 'react'
import { Settings2, AlertTriangle, Clock } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { EmptyState } from '@/components/common/EmptyState'
import { StatusBadge, variantForPaymentLocatario } from '@/components/common/StatusBadge'
import { crmService } from '@/services'
import type { CRMLocatario } from '@/types'
import { currency, fmtShortDate, maskPhone, statusLocatarioLabel } from '@/lib/format'
import { Avatar } from '@/components/common/Avatar'
import { useDebounce } from '@/hooks/useDebounce'

const ALL_COLS = [
  { key: 'locatario', label: 'Locatário' },
  { key: 'cpf', label: 'CPF' },
  { key: 'imovel', label: 'Imóvel' },
  { key: 'aluguel', label: 'Aluguel' },
  { key: 'vencimento', label: 'Vencimento' },
  { key: 'dias_vencer', label: 'Dias p/ vencer' },
  { key: 'meses_atraso', label: 'Meses em atraso' },
  { key: 'status', label: 'Status' },
  { key: 'contato', label: 'Contato' },
] as const
type ColKey = typeof ALL_COLS[number]['key']

export default function CRMLocatarios() {
  const [data, setData] = useState<CRMLocatario[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCols, setShowCols] = useState<Set<ColKey>>(
    new Set(['locatario', 'cpf', 'imovel', 'aluguel', 'vencimento', 'dias_vencer', 'meses_atraso', 'status', 'contato'])
  )
  const [colMenu, setColMenu] = useState(false)
  const debounced = useDebounce(search, 300)

  useEffect(() => {
    setLoading(true)
    crmService.locatarios(debounced || undefined).then(setData).finally(() => setLoading(false))
  }, [debounced])

  function toggleCol(k: ColKey) {
    setShowCols(prev => {
      const next = new Set(prev)
      next.has(k) ? next.delete(k) : next.add(k)
      return next
    })
  }

  const show = (k: ColKey) => showCols.has(k)

  return (
    <AppLayout search={search} onSearch={setSearch} searchPlaceholder="Buscar por nome, e-mail ou telefone…">
      <PageHeader
        eyebrow="CRM"
        title="Locatários"
        description="Contratos ativos, status de pagamento, dias até vencimento e meses em atraso."
        actions={
          <div className="relative">
            <button className="btn-outline flex items-center gap-2" onClick={() => setColMenu(m => !m)}>
              <Settings2 size={15}/> Colunas
            </button>
            {colMenu && (
              <div className="absolute right-0 top-10 z-50 w-52 rounded-2xl p-3 space-y-1 shadow-modal"
                style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(226,221,214,0.7)' }}>
                {ALL_COLS.map(c => (
                  <label key={c.key} className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-sm hover:bg-surface-muted">
                    <input type="checkbox" checked={showCols.has(c.key)} onChange={() => toggleCol(c.key)} className="accent-navy" />
                    {c.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        }
      />

      {loading ? <LoadingScreen /> : data.length === 0 ? <EmptyState title="Nenhum locatário encontrado" /> : (
        <div className="card-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-muted text-ink-secondary uppercase text-[11px] tracking-wider">
                  {show('locatario') && <th className="text-left px-4 py-3">Locatário</th>}
                  {show('cpf') && <th className="text-left px-4 py-3">CPF</th>}
                  {show('imovel') && <th className="text-left px-4 py-3">Imóvel</th>}
                  {show('aluguel') && <th className="text-right px-4 py-3">Aluguel</th>}
                  {show('vencimento') && <th className="text-center px-4 py-3">Vencimento</th>}
                  {show('dias_vencer') && <th className="text-center px-4 py-3">Dias p/ vencer</th>}
                  {show('meses_atraso') && <th className="text-center px-4 py-3">Em atraso</th>}
                  {show('status') && <th className="text-center px-4 py-3">Status</th>}
                  {show('contato') && <th className="text-left px-4 py-3">Contato</th>}
                </tr>
              </thead>
              <tbody>
                {data.map((u) => {
                  const overdue5 = (u.meses_atraso ?? 0) > 0
                  return (
                    <tr key={u.id} className="border-t border-line hover:bg-surface-muted/50">
                      {show('locatario') && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.nome} size={32} />
                            <div>
                              <div className="font-medium text-ink">{u.nome}</div>
                              <div className="text-xs text-ink-muted">{u.email}</div>
                            </div>
                          </div>
                        </td>
                      )}
                      {show('cpf') && <td className="px-4 py-3 text-ink-secondary font-mono text-xs">{u.cpf || '—'}</td>}
                      {show('imovel') && <td className="px-4 py-3">{u.property?.titulo ?? <span className="text-ink-muted">—</span>}</td>}
                      {show('aluguel') && <td className="px-4 py-3 text-right font-medium">{u.contract ? currency(u.contract.valor_aluguel) : '—'}</td>}
                      {show('vencimento') && <td className="px-4 py-3 text-center text-ink-secondary">{u.contract ? `dia ${u.contract.dia_vencimento}` : '—'}</td>}
                      {show('dias_vencer') && (
                        <td className="px-4 py-3 text-center">
                          {u.dias_para_vencer != null ? (
                            <span className={`inline-flex items-center gap-1 text-xs font-medium ${u.dias_para_vencer <= 3 ? 'text-warning' : 'text-ink-secondary'}`}>
                              {u.dias_para_vencer <= 3 && <Clock size={11}/>}
                              {u.dias_para_vencer === 0 ? 'Hoje' : u.dias_para_vencer < 0 ? `${Math.abs(u.dias_para_vencer)}d atrasado` : `${u.dias_para_vencer}d`}
                            </span>
                          ) : <span className="text-ink-muted">—</span>}
                        </td>
                      )}
                      {show('meses_atraso') && (
                        <td className="px-4 py-3 text-center">
                          {overdue5 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-danger">
                              <AlertTriangle size={11}/> {u.meses_atraso} {u.meses_atraso === 1 ? 'mês' : 'meses'}
                            </span>
                          ) : <span className="text-success text-xs font-medium">Em dia</span>}
                        </td>
                      )}
                      {show('status') && (
                        <td className="px-4 py-3 text-center">
                          {u.last_payment
                            ? <StatusBadge variant={variantForPaymentLocatario(u.last_payment.status_locatario)}>{statusLocatarioLabel(u.last_payment.status_locatario)}</StatusBadge>
                            : <span className="text-ink-muted">—</span>}
                        </td>
                      )}
                      {show('contato') && <td className="px-4 py-3 text-ink-secondary">{u.telefone ? maskPhone(u.telefone) : '—'}</td>}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
