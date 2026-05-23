import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { EmptyState } from '@/components/common/EmptyState'
import { StatusBadge, variantForPaymentLocador } from '@/components/common/StatusBadge'
import { paymentService } from '@/services'
import type { Payment } from '@/types'
import { currency, fmtMonth, fmtShortDate, statusLocadorLabel } from '@/lib/format'
import { buildUploadUrl } from '@/lib/api'

export default function LocadorFinanceiro() {
  const [data, setData] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { paymentService.list().then(setData).finally(() => setLoading(false)) }, [])
  return (
    <AppLayout>
      <PageHeader eyebrow="Financeiro" title="Meus repasses" description="Historico completo dos repasses do seu imovel." />
      {loading ? <LoadingScreen /> : data.length === 0 ? <EmptyState description="Nenhum repasse no historico." /> : (
        <div className="card-premium overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-surface-muted uppercase text-[11px] tracking-wider text-ink-secondary">
              <th className="text-left px-4 py-3">Mes</th>
              <th className="text-center px-4 py-3">Vencimento</th>
              <th className="text-right px-4 py-3">Valor</th>
              <th className="text-center px-4 py-3">Status repasse</th>
              <th className="text-center px-4 py-3">Comprovante</th>
            </tr></thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="px-4 py-3">{fmtMonth(p.mes_referencia)}</td>
                  <td className="px-4 py-3 text-center text-ink-secondary">{fmtShortDate(p.data_vencimento)}</td>
                  <td className="px-4 py-3 text-right font-medium">{currency(p.valor)}</td>
                  <td className="px-4 py-3 text-center"><StatusBadge variant={variantForPaymentLocador(p.status_locador)}>{statusLocadorLabel(p.status_locador)}</StatusBadge></td>
                  <td className="px-4 py-3 text-center">{p.comprovante_locador_url ? <a className="btn-outline" href={buildUploadUrl(p.comprovante_locador_url)} target="_blank" rel="noreferrer">Baixar</a> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  )
}
