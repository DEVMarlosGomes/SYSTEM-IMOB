import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { EmptyState } from '@/components/common/EmptyState'
import { StatusBadge, variantForPaymentLocador } from '@/components/common/StatusBadge'
import { crmService } from '@/services'
import type { CRMLocador } from '@/types'
import { currency, maskPhone, statusLocadorLabel } from '@/lib/format'
import { Avatar } from '@/components/common/Avatar'
import { useDebounce } from '@/hooks/useDebounce'

export default function CRMLocadores() {
  const [data, setData] = useState<CRMLocador[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search, 300)

  useEffect(() => {
    setLoading(true)
    crmService.locadores(debounced || undefined).then(setData).finally(() => setLoading(false))
  }, [debounced])

  return (
    <AppLayout search={search} onSearch={setSearch} searchPlaceholder="Buscar locadores…">
      <PageHeader eyebrow="CRM" title="Locadores" description="Proprietarios que recebem repasses. Acompanhe a esteira de repasse de cada um." />
      {loading ? <LoadingScreen /> : data.length === 0 ? <EmptyState title="Nenhum locador encontrado" /> : (
        <div className="card-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-muted text-ink-secondary uppercase text-[11px] tracking-wider">
                  <th className="text-left px-4 py-3">Locador</th>
                  <th className="text-left px-4 py-3">Imovel</th>
                  <th className="text-right px-4 py-3">Valor a receber</th>
                  <th className="text-center px-4 py-3">Status repasse</th>
                  <th className="text-left px-4 py-3">Contato</th>
                </tr>
              </thead>
              <tbody>
                {data.map((u) => (
                  <tr key={u.id} className="border-t border-line hover:bg-surface-muted/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.nome} size={32} />
                        <div>
                          <div className="font-medium text-ink">{u.nome}</div>
                          <div className="text-xs text-ink-muted">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{u.property ? u.property.titulo : <span className="text-ink-muted">—</span>}</td>
                    <td className="px-4 py-3 text-right font-medium">{u.contract ? currency(u.contract.valor_aluguel) : '—'}</td>
                    <td className="px-4 py-3 text-center">
                      {u.last_payout ? <StatusBadge variant={variantForPaymentLocador(u.last_payout.status_locador)}>{statusLocadorLabel(u.last_payout.status_locador)}</StatusBadge> : <span className="text-ink-muted">—</span>}
                    </td>
                    <td className="px-4 py-3 text-ink-secondary">{u.telefone ? maskPhone(u.telefone) : '—'}</td>
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
