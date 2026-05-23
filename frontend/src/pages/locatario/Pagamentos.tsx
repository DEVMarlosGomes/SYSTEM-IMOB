import { useEffect, useState } from 'react'
import { Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { StatusBadge, variantForPaymentLocatario } from '@/components/common/StatusBadge'
import { paymentService, uploadService } from '@/services'
import type { Payment } from '@/types'
import { currency, fmtMonth, fmtShortDate, statusLocatarioLabel } from '@/lib/format'
import { buildUploadUrl } from '@/lib/api'
import { EmptyState } from '@/components/common/EmptyState'

export default function LocatarioPagamentos() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try { setPayments(await paymentService.list()) } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  async function onUpload(p: Payment, file: File) {
    try {
      const res = await uploadService.upload(file, 'comprovantes-locatario')
      await paymentService.uploadComprovante(p.id, res.url)
      toast.success('Comprovante enviado.')
      await load()
    } catch { toast.error('Falha no envio.') }
  }

  return (
    <AppLayout>
      <PageHeader eyebrow="Financeiro" title="Meus pagamentos" description="Acompanhe vencimentos e envie comprovantes." />
      {loading ? <LoadingScreen /> : payments.length === 0 ? <EmptyState description="Nenhum pagamento gerado." /> : (
        <div className="card-premium overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-surface-muted uppercase text-[11px] tracking-wider text-ink-secondary">
              <th className="text-left px-4 py-3">Mes referencia</th>
              <th className="text-center px-4 py-3">Vencimento</th>
              <th className="text-right px-4 py-3">Valor</th>
              <th className="text-center px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Acoes</th>
            </tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="px-4 py-3">{fmtMonth(p.mes_referencia)}</td>
                  <td className="px-4 py-3 text-center text-ink-secondary">{fmtShortDate(p.data_vencimento)}</td>
                  <td className="px-4 py-3 text-right font-medium">{currency(p.valor)}</td>
                  <td className="px-4 py-3 text-center"><StatusBadge variant={variantForPaymentLocatario(p.status_locatario)}>{statusLocatarioLabel(p.status_locatario)}</StatusBadge></td>
                  <td className="px-4 py-3 text-right">
                    {(p.status_locatario === 'pendente' || p.status_locatario === 'atrasado') ? (
                      <label className="btn-gold cursor-pointer inline-flex"><Upload size={14}/> Comprovante<input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(p, e.target.files[0])} /></label>
                    ) : p.comprovante_locatario_url ? (
                      <a href={buildUploadUrl(p.comprovante_locatario_url)} target="_blank" rel="noreferrer" className="btn-outline">Ver</a>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  )
}
