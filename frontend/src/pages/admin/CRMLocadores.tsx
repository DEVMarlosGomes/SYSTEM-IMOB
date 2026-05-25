import { useEffect, useState } from 'react'
import { Settings2 } from 'lucide-react'
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

const ALL_COLS = [
  { key: 'locador', label: 'Locador' },
  { key: 'imovel', label: 'Imóvel' },
  { key: 'bruto', label: 'Aluguel bruto' },
  { key: 'taxa', label: 'Taxa adm (10%)' },
  { key: 'liquido', label: 'Líquido' },
  { key: 'banco', label: 'Banco' },
  { key: 'pix', label: 'PIX' },
  { key: 'status', label: 'Status repasse' },
  { key: 'contato', label: 'Contato' },
] as const
type ColKey = typeof ALL_COLS[number]['key']

export default function CRMLocadores() {
  const [data, setData] = useState<CRMLocador[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCols, setShowCols] = useState<Set<ColKey>>(
    new Set(['locador', 'imovel', 'bruto', 'taxa', 'liquido', 'banco', 'pix', 'status', 'contato'])
  )
  const [colMenu, setColMenu] = useState(false)
  const debounced = useDebounce(search, 300)

  useEffect(() => {
    setLoading(true)
    crmService.locadores(debounced || undefined).then(setData).finally(() => setLoading(false))
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
        title="Locadores"
        description="Proprietários — banco, PIX, taxa de administração e valor líquido a receber."
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

      {loading ? <LoadingScreen /> : data.length === 0 ? <EmptyState title="Nenhum locador encontrado" /> : (
        <div className="card-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-muted text-ink-secondary uppercase text-[11px] tracking-wider">
                  {show('locador') && <th className="text-left px-4 py-3">Locador</th>}
                  {show('imovel') && <th className="text-left px-4 py-3">Imóvel</th>}
                  {show('bruto') && <th className="text-right px-4 py-3">Bruto</th>}
                  {show('taxa') && <th className="text-right px-4 py-3">Taxa (10%)</th>}
                  {show('liquido') && <th className="text-right px-4 py-3">Líquido</th>}
                  {show('banco') && <th className="text-left px-4 py-3">Banco</th>}
                  {show('pix') && <th className="text-left px-4 py-3">PIX</th>}
                  {show('status') && <th className="text-center px-4 py-3">Status repasse</th>}
                  {show('contato') && <th className="text-left px-4 py-3">Contato</th>}
                </tr>
              </thead>
              <tbody>
                {data.map((u) => (
                  <tr key={u.id} className="border-t border-line hover:bg-surface-muted/50">
                    {show('locador') && (
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
                    {show('imovel') && <td className="px-4 py-3">{u.property?.titulo ?? <span className="text-ink-muted">—</span>}</td>}
                    {show('bruto') && <td className="px-4 py-3 text-right font-medium">{u.contract ? currency(u.contract.valor_aluguel) : '—'}</td>}
                    {show('taxa') && <td className="px-4 py-3 text-right text-danger">{u.taxa_adm != null ? `-${currency(u.taxa_adm)}` : '—'}</td>}
                    {show('liquido') && <td className="px-4 py-3 text-right font-semibold text-success">{u.valor_liquido != null ? currency(u.valor_liquido) : '—'}</td>}
                    {show('banco') && <td className="px-4 py-3 text-ink-secondary text-xs">{u.banco || '—'}</td>}
                    {show('pix') && <td className="px-4 py-3 text-ink-secondary font-mono text-xs truncate max-w-[140px]">{u.pix || '—'}</td>}
                    {show('status') && (
                      <td className="px-4 py-3 text-center">
                        {u.last_payout
                          ? <StatusBadge variant={variantForPaymentLocador(u.last_payout.status_locador)}>{statusLocadorLabel(u.last_payout.status_locador)}</StatusBadge>
                          : <span className="text-ink-muted">—</span>}
                      </td>
                    )}
                    {show('contato') && <td className="px-4 py-3 text-ink-secondary">{u.telefone ? maskPhone(u.telefone) : '—'}</td>}
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
