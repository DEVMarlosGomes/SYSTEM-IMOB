import { useEffect, useState } from 'react'
import { Receipt, CheckCircle2, FileDown, Inbox, Upload, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { EmptyState } from '@/components/common/EmptyState'
import { Modal } from '@/components/common/Modal'
import { Avatar } from '@/components/common/Avatar'
import { StatusBadge, variantForPaymentLocador } from '@/components/common/StatusBadge'
import { paymentService, uploadService } from '@/services'
import type { Payment, PaymentKanban, PaymentStatusLocador } from '@/types'
import { currency, fmtMonth, fmtShortDate, statusLocadorLabel } from '@/lib/format'
import { buildUploadUrl } from '@/lib/api'
import { DUE_DAYS } from '@/lib/constants'

type TabKey = 'kanban' | 'comprovantes' | 'repasses'

export default function Financeiro() {
  const [tab, setTab] = useState<TabKey>('kanban')
  const [kanban, setKanban] = useState<PaymentKanban | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Payment | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [k, all] = await Promise.all([paymentService.kanban(), paymentService.list()])
      setKanban(k)
      setPayments(all)
    } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  async function approve(id: string) {
    try {
      await paymentService.approve(id)
      toast.success('Pagamento aprovado e repasse iniciado.')
      await load()
      setSelected(null)
    } catch { toast.error('Erro ao aprovar.') }
  }

  async function advancePayout(p: Payment, next: PaymentStatusLocador) {
    try {
      await paymentService.update(p.id, { status_locador: next })
      toast.success(`Status atualizado: ${statusLocadorLabel(next)}`)
      await load()
    } catch { toast.error('Erro ao atualizar status.') }
  }

  async function uploadComprovanteLocador(p: Payment, file: File) {
    try {
      const res = await uploadService.upload(file, 'comprovantes-locador')
      await paymentService.update(p.id, { comprovante_locador_url: res.url, status_locador: 'pago', data_pagamento: new Date().toISOString().slice(0, 10) as any })
      toast.success('Comprovante de repasse enviado.')
      await load()
    } catch { toast.error('Erro no upload.') }
  }

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Financeiro"
        title="Recebimentos e repasses"
        description="Acompanhe pagamentos por vencimento, aprove comprovantes e gerencie repasses aos locadores."
      />

      <div className="flex gap-2 mb-5">
        <TabButton active={tab === 'kanban'} onClick={() => setTab('kanban')} label="Kanban de pagamentos" />
        <TabButton active={tab === 'comprovantes'} onClick={() => setTab('comprovantes')} label="Comprovantes recebidos" />
        <TabButton active={tab === 'repasses'} onClick={() => setTab('repasses')} label="Repasses" />
      </div>

      {loading ? <LoadingScreen /> : tab === 'kanban' && kanban ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {DUE_DAYS.map((d) => {
            const col = kanban[String(d)] || { a_cobrar: [], pago: [], atrasado: [] }
            const total = col.a_cobrar.length + col.pago.length + col.atrasado.length
            return (
              <div key={d} className="card-premium p-3">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div>
                    <div className="font-display text-lg text-navy">Dia {d}</div>
                    <div className="text-[11px] uppercase tracking-wider text-ink-muted">{total} pagamento(s)</div>
                  </div>
                </div>
                <KanbanSection title="A cobrar" color="warning" items={col.a_cobrar} onPick={setSelected} />
                <KanbanSection title="Pagos" color="success" items={col.pago} onPick={setSelected} />
                <KanbanSection title="Atrasados" color="danger" items={col.atrasado} onPick={setSelected} />
              </div>
            )
          })}
        </div>
      ) : tab === 'comprovantes' ? (
        <div className="space-y-3">
          {payments.filter((p) => p.comprovante_locatario_url && p.status_locatario !== 'pago').length === 0 && (
            <EmptyState icon={<Inbox size={24}/>} title="Nenhum comprovante pendente" description="Quando um locatario enviar comprovante, ele aparecera aqui para aprovacao." />
          )}
          {payments.filter((p) => p.comprovante_locatario_url && p.status_locatario !== 'pago').map((p) => (
            <div key={p.id} className="card-premium p-4 flex flex-col md:flex-row md:items-center gap-3">
              <Avatar name={p.locatario?.nome || ''} size={40} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-ink">{p.locatario?.nome}</div>
                <div className="text-xs text-ink-secondary">{fmtMonth(p.mes_referencia)} · vence em {fmtShortDate(p.data_vencimento)}</div>
              </div>
              <div className="font-medium text-ink">{currency(p.valor)}</div>
              <a href={buildUploadUrl(p.comprovante_locatario_url)} target="_blank" rel="noreferrer" className="btn-outline"><FileDown size={14}/> Comprovante</a>
              <button className="btn-gold" onClick={() => approve(p.id)}><CheckCircle2 size={14}/> Aprovar pagamento</button>
            </div>
          ))}
        </div>
      ) : tab === 'repasses' ? (
        <div className="space-y-3">
          {payments.filter((p) => p.status_locatario === 'pago').length === 0 ? <EmptyState description="Sem repasses para processar." /> : (
            payments.filter((p) => p.status_locatario === 'pago').map((p) => (
              <div key={p.id} className="card-premium p-4 flex flex-col md:flex-row md:items-center gap-3">
                <Avatar name={p.locador?.nome || ''} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-ink">{p.locador?.nome}</div>
                  <div className="text-xs text-ink-secondary">{p.property?.titulo} · {fmtMonth(p.mes_referencia)} · Repasse previsto: {p.data_repasse_prevista ? fmtShortDate(p.data_repasse_prevista) : '—'}</div>
                </div>
                <div className="font-medium text-ink">{currency(p.valor)}</div>
                <StatusBadge variant={variantForPaymentLocador(p.status_locador)}>{statusLocadorLabel(p.status_locador)}</StatusBadge>
                {p.status_locador !== 'pago' && (
                  <>
                    {p.status_locador === 'em_esteira' && <button className="btn-outline" onClick={() => advancePayout(p, 'gerando_impostos')}>Gerar impostos</button>}
                    {p.status_locador === 'gerando_impostos' && (
                      <label className="btn-gold cursor-pointer">
                        <Upload size={14}/> Anexar comprovante
                        <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => e.target.files?.[0] && uploadComprovanteLocador(p, e.target.files[0])} />
                      </label>
                    )}
                  </>
                )}
                {p.comprovante_locador_url && (
                  <a href={buildUploadUrl(p.comprovante_locador_url)} target="_blank" rel="noreferrer" className="btn-outline"><FileDown size={14}/> Recibo</a>
                )}
              </div>
            ))
          )}
        </div>
      ) : null}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detalhes do pagamento" size="md" footer={
        <>
          {selected?.comprovante_locatario_url && <a href={buildUploadUrl(selected.comprovante_locatario_url)} target="_blank" rel="noreferrer" className="btn-outline mr-auto"><FileDown size={14}/> Ver comprovante</a>}
          <button className="btn-ghost" onClick={() => setSelected(null)}>Fechar</button>
          {selected && selected.status_locatario !== 'pago' && <button className="btn-gold" onClick={() => approve(selected.id)}><CheckCircle2 size={14}/> Aprovar pagamento</button>}
        </>
      }>
        {selected && (
          <div className="space-y-2 text-sm">
            <div><b>Locatario:</b> {selected.locatario?.nome}</div>
            <div><b>Imovel:</b> {selected.property?.titulo}</div>
            <div><b>Mes referencia:</b> {fmtMonth(selected.mes_referencia)}</div>
            <div><b>Vencimento:</b> {fmtShortDate(selected.data_vencimento)}</div>
            <div><b>Valor:</b> {currency(selected.valor)}</div>
            <div className="pt-2"><StatusBadge>{selected.status_locatario}</StatusBadge></div>
          </div>
        )}
      </Modal>
    </AppLayout>
  )
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return <button onClick={onClick} className={`px-4 py-2 rounded-md text-sm font-medium border transition ${active ? 'bg-navy text-white border-navy' : 'bg-white border-line text-ink hover:border-navy'}`}>{label}</button>
}

function KanbanSection({ title, color, items, onPick }: { title: string; color: 'success' | 'warning' | 'danger'; items: Payment[]; onPick: (p: Payment) => void }) {
  const palette: Record<string, string> = {
    success: 'border-success/40 bg-success-soft/40 text-success',
    warning: 'border-warning/40 bg-warning-soft/40 text-warning',
    danger: 'border-danger/40 bg-danger-soft/40 text-danger',
  }
  return (
    <div className="mb-2">
      <div className={`text-[11px] uppercase tracking-wider font-semibold mt-1 mb-1.5 px-1 ${palette[color].split(' ')[2]}`}>{title} · {items.length}</div>
      <div className="space-y-2">
        {items.length === 0 && <div className="text-[11px] text-ink-muted italic px-1 py-2">Vazio</div>}
        {items.map((p) => (
          <button key={p.id} onClick={() => onPick(p)} className={`w-full text-left bg-white border rounded-md p-2.5 hover:shadow-soft transition ${palette[color]}`}>
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="text-sm font-medium text-ink truncate">{p.locatario?.nome}</div>
              <span className="text-[11px] text-ink-secondary">{p.data_vencimento.slice(8, 10)}/{p.data_vencimento.slice(5, 7)}</span>
            </div>
            <div className="text-xs text-ink-secondary truncate">{p.property?.titulo}</div>
            <div className="text-sm font-semibold text-navy mt-1.5">{currency(p.valor)}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
