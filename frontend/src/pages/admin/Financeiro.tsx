import { useEffect, useState } from 'react'
import { Receipt, CheckCircle2, FileDown, Inbox, Upload, AlertTriangle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { EmptyState } from '@/components/common/EmptyState'
import { Modal } from '@/components/common/Modal'
import { Avatar } from '@/components/common/Avatar'
import { StatusBadge, variantForPaymentLocador, variantForPaymentLocatario } from '@/components/common/StatusBadge'
import { paymentService, uploadService } from '@/services'
import type { Payment, PaymentKanban, PaymentStatusLocador } from '@/types'
import { currency, fmtMonth, fmtShortDate, statusLocadorLabel, statusLocatarioLabel } from '@/lib/format'
import { buildUploadUrl } from '@/lib/api'
import { DUE_DAYS } from '@/lib/constants'

type TabKey = 'kanban' | 'comprovantes' | 'repasses'

// ── helpers ──────────────────────────────────────────────────────────────────

function daysOverdue(data_vencimento: string) {
  const due = new Date(data_vencimento + 'T12:00:00')
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  return Math.floor((today.getTime() - due.getTime()) / 86400000)
}

function monthOptions() {
  const opts = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const ym = d.toISOString().slice(0, 7)
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    opts.push({ value: ym, label: label.charAt(0).toUpperCase() + label.slice(1) })
  }
  return opts
}

// ── Timeline component ────────────────────────────────────────────────────────
function PaymentTimeline({ p }: { p: Payment }) {
  const steps = [
    { label: 'Criado', done: true },
    { label: 'Comprovante', done: !!p.comprovante_locatario_url },
    { label: 'Aprovado', done: p.status_locatario === 'pago' },
    { label: 'Repasse', done: p.status_locador !== 'em_esteira' && p.status_locatario === 'pago' },
    { label: 'Pago ao locador', done: p.status_locador === 'pago' },
  ]
  return (
    <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(226,221,214,0.6)' }}>
      <div className="text-xs uppercase tracking-wider text-ink-muted mb-3 font-semibold">Linha do tempo</div>
      <div className="flex items-center">
        {steps.map((s, i) => (
          <div key={s.label} className="flex-1 flex items-center">
            <div className="flex flex-col items-center">
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={s.done ? {
                  background: 'linear-gradient(135deg, #27AE60, #2ECC71)',
                  color: '#fff',
                  boxShadow: '0 2px 8px rgba(39,174,96,0.35)',
                } : {
                  background: 'rgba(226,221,214,0.6)',
                  color: '#aaa',
                  border: '2px solid rgba(226,221,214,0.8)',
                }}
              >{s.done ? '✓' : i + 1}</div>
              <div className="text-[10px] text-center mt-1 leading-tight text-ink-secondary w-12">{s.label}</div>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-1 rounded-full"
                style={{ background: steps[i + 1].done ? 'linear-gradient(90deg, #27AE60, #2ECC71)' : 'rgba(226,221,214,0.6)' }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Financeiro() {
  const [tab, setTab] = useState<TabKey>('kanban')
  const [kanban, setKanban] = useState<PaymentKanban | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Payment | null>(null)
  const [mesFilter, setMesFilter] = useState(() => new Date().toISOString().slice(0, 7))
  const [rejectModal, setRejectModal] = useState<Payment | null>(null)
  const [motivoRejeicao, setMotivoRejeicao] = useState('')
  const [dragId, setDragId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [k, all] = await Promise.all([paymentService.kanban(mesFilter), paymentService.list()])
      setKanban(k)
      setPayments(all)
    } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [mesFilter])

  async function approve(id: string) {
    try {
      await paymentService.approve(id)
      toast.success('Pagamento aprovado e repasse iniciado.')
      await load(); setSelected(null)
    } catch { toast.error('Erro ao aprovar.') }
  }

  async function rejeitar() {
    if (!rejectModal) return
    try {
      await paymentService.rejeitar(rejectModal.id, motivoRejeicao || 'Comprovante inválido.')
      toast.success('Comprovante rejeitado. Locatário notificado.')
      setRejectModal(null); setMotivoRejeicao('')
      await load()
    } catch { toast.error('Erro ao rejeitar.') }
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
      await paymentService.update(p.id, { comprovante_locador_url: res.url, status_locador: 'pago' })
      toast.success('Comprovante de repasse enviado.')
      await load()
    } catch { toast.error('Erro no upload.') }
  }

  // ── DnD handlers ─────────────────────────────────────────────────────────
  async function onDropSection(section: 'a_cobrar' | 'pago' | 'atrasado') {
    if (!dragId) return
    setDragId(null)
    try {
      if (section === 'pago') {
        await paymentService.approve(dragId)
        toast.success('Pagamento aprovado.')
      } else {
        const status = section === 'a_cobrar' ? 'pendente' : 'atrasado'
        await paymentService.update(dragId, { status_locatario: status })
        toast.success('Status atualizado.')
      }
      await load()
    } catch { toast.error('Erro ao mover pagamento.') }
  }

  // ── KPI summary ──────────────────────────────────────────────────────────
  const allKanbanPayments = kanban
    ? DUE_DAYS.flatMap(d => {
        const col = kanban[String(d)] || { a_cobrar: [], pago: [], atrasado: [] }
        return [...col.a_cobrar, ...col.pago, ...col.atrasado]
      })
    : []
  const totalReceber = allKanbanPayments.filter(p => p.status_locatario !== 'pago').reduce((s, p) => s + p.valor, 0)
  const totalRecebido = allKanbanPayments.filter(p => p.status_locatario === 'pago').reduce((s, p) => s + p.valor, 0)
  const totalAtrasado = allKanbanPayments.filter(p => p.status_locatario === 'atrasado').reduce((s, p) => s + p.valor, 0)
  const totalRepassado = allKanbanPayments.filter(p => p.status_locador === 'pago').reduce((s, p) => s + p.valor, 0)

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Financeiro"
        title="Recebimentos e repasses"
        description="Acompanhe pagamentos por vencimento, aprove comprovantes e gerencie repasses."
      />

      <div className="flex gap-2 mb-5">
        <TabButton active={tab === 'kanban'} onClick={() => setTab('kanban')} label="Kanban de pagamentos" />
        <TabButton active={tab === 'comprovantes'} onClick={() => setTab('comprovantes')} label="Comprovantes recebidos" />
        <TabButton active={tab === 'repasses'} onClick={() => setTab('repasses')} label="Repasses" />
      </div>

      {/* Month filter (kanban only) */}
      {tab === 'kanban' && (
        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm text-ink-secondary font-medium">Mês de referência:</label>
          <select
            className="input-premium max-w-xs"
            value={mesFilter}
            onChange={e => setMesFilter(e.target.value)}
          >
            {monthOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      )}

      {loading ? <LoadingScreen /> : tab === 'kanban' && kanban ? (
        <>
          {/* KPI summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'A receber', value: totalReceber, color: '#D4A853' },
              { label: 'Recebido', value: totalRecebido, color: '#27AE60' },
              { label: 'Em atraso', value: totalAtrasado, color: '#E53E3E' },
              { label: 'Repassado', value: totalRepassado, color: '#2E5F8A' },
            ].map(kpi => (
              <div key={kpi.label} className="card-premium p-4" style={{ borderLeft: `3px solid ${kpi.color}` }}>
                <div className="text-[11px] uppercase tracking-wider text-ink-muted">{kpi.label}</div>
                <div className="text-xl font-bold mt-1" style={{ color: kpi.color }}>{currency(kpi.value)}</div>
              </div>
            ))}
          </div>

          {/* Kanban columns */}
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
                  <KanbanSection title="A cobrar" sectionKey="a_cobrar" color="warning" items={col.a_cobrar} onPick={setSelected} dragId={dragId} onDragStart={setDragId} onDrop={onDropSection} />
                  <KanbanSection title="Pagos" sectionKey="pago" color="success" items={col.pago} onPick={setSelected} dragId={dragId} onDragStart={setDragId} onDrop={onDropSection} />
                  <KanbanSection title="Atrasados" sectionKey="atrasado" color="danger" items={col.atrasado} onPick={setSelected} dragId={dragId} onDragStart={setDragId} onDrop={onDropSection} />
                </div>
              )
            })}
          </div>
        </>
      ) : tab === 'comprovantes' ? (
        <div className="space-y-3">
          {payments.filter((p) => p.comprovante_locatario_url && p.status_locatario !== 'pago' && p.status_locatario !== 'rejeitado').length === 0 && (
            <EmptyState icon={<Inbox size={24}/>} title="Nenhum comprovante pendente" description="Quando um locatário enviar comprovante, ele aparecerá aqui para aprovação." />
          )}
          {payments.filter((p) => p.comprovante_locatario_url && p.status_locatario !== 'pago' && p.status_locatario !== 'rejeitado').map((p) => {
            const overdue = daysOverdue(p.data_vencimento)
            return (
              <div key={p.id} className="card-premium p-4 flex flex-col md:flex-row md:items-center gap-3">
                <Avatar name={p.locatario?.nome || ''} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-ink">{p.locatario?.nome}</div>
                  <div className="text-xs text-ink-secondary">{fmtMonth(p.mes_referencia)} · vence em {fmtShortDate(p.data_vencimento)}</div>
                  {overdue > 5 && (
                    <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-danger">
                      <AlertTriangle size={11}/> {overdue} dias de atraso
                    </div>
                  )}
                </div>
                <div className="font-medium text-ink">{currency(p.valor)}</div>
                <StatusBadge variant={variantForPaymentLocatario(p.status_locatario)}>{statusLocatarioLabel(p.status_locatario)}</StatusBadge>
                <a href={buildUploadUrl(p.comprovante_locatario_url)} target="_blank" rel="noreferrer" className="btn-outline"><FileDown size={14}/> Comprovante</a>
                <button className="btn-gold" onClick={() => approve(p.id)}><CheckCircle2 size={14}/> Aprovar</button>
                <button className="btn-danger" onClick={() => { setRejectModal(p); setMotivoRejeicao('') }}><XCircle size={14}/> Rejeitar</button>
              </div>
            )
          })}
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
                    {p.status_locador === 'gerando_impostos' && <button className="btn-outline" onClick={() => advancePayout(p, 'enviado')}>Marcar enviado</button>}
                    {p.status_locador === 'enviado' && (
                      <label className="btn-gold cursor-pointer flex items-center gap-1.5">
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

      {/* Payment detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detalhes do pagamento" size="md" footer={
        <>
          {selected?.comprovante_locatario_url && <a href={buildUploadUrl(selected.comprovante_locatario_url)} target="_blank" rel="noreferrer" className="btn-outline mr-auto"><FileDown size={14}/> Ver comprovante</a>}
          <button className="btn-ghost" onClick={() => setSelected(null)}>Fechar</button>
          {selected && selected.status_locatario !== 'pago' && selected.status_locatario !== 'rejeitado' && (
            <>
              <button className="btn-danger" onClick={() => { setRejectModal(selected); setSelected(null); setMotivoRejeicao('') }}><XCircle size={14}/> Rejeitar</button>
              <button className="btn-gold" onClick={() => approve(selected.id)}><CheckCircle2 size={14}/> Aprovar</button>
            </>
          )}
        </>
      }>
        {selected && (
          <div className="space-y-2 text-sm">
            <div><b>Locatário:</b> {selected.locatario?.nome}</div>
            <div><b>Imóvel:</b> {selected.property?.titulo}</div>
            <div><b>Mês referência:</b> {fmtMonth(selected.mes_referencia)}</div>
            <div><b>Vencimento:</b> {fmtShortDate(selected.data_vencimento)}</div>
            <div><b>Valor:</b> {currency(selected.valor)}</div>
            <div className="flex items-center gap-2 pt-1">
              <StatusBadge variant={variantForPaymentLocatario(selected.status_locatario)}>{statusLocatarioLabel(selected.status_locatario)}</StatusBadge>
            </div>
            {selected.motivo_rejeicao && (
              <div className="text-xs text-danger bg-danger-soft rounded p-2"><b>Motivo rejeição:</b> {selected.motivo_rejeicao}</div>
            )}
            <PaymentTimeline p={selected} />
          </div>
        )}
      </Modal>

      {/* Reject modal */}
      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Rejeitar comprovante" size="sm" footer={
        <>
          <button className="btn-ghost" onClick={() => setRejectModal(null)}>Cancelar</button>
          <button className="btn-danger" onClick={rejeitar}>Rejeitar e notificar</button>
        </>
      }>
        <div className="space-y-3">
          <p className="text-sm text-ink-secondary">O locatário será notificado para reenviar o comprovante.</p>
          <div>
            <label className="block text-sm font-medium mb-1">Motivo da rejeição</label>
            <input
              className="input-premium"
              placeholder="Ex: Comprovante ilegível, data incorreta..."
              value={motivoRejeicao}
              onChange={e => setMotivoRejeicao(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </AppLayout>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
      style={active ? {
        background: 'linear-gradient(135deg, #2E5F8A 0%, #1B3A5C 100%)',
        color: '#FFFFFF',
        border: '1px solid rgba(27,58,92,0.50)',
        boxShadow: '0 4px 12px rgba(27,58,92,0.25), inset 0 1px 1px rgba(255,255,255,0.15)',
      } : {
        background: 'rgba(255,255,255,0.60)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        color: '#1A1A2E',
        border: '1px solid rgba(226,221,214,0.70)',
        boxShadow: '0 1px 4px rgba(15,34,56,0.05)',
      }}
    >
      {label}
    </button>
  )
}

function KanbanSection({
  title, sectionKey, color, items, onPick, dragId, onDragStart, onDrop,
}: {
  title: string
  sectionKey: 'a_cobrar' | 'pago' | 'atrasado'
  color: 'success' | 'warning' | 'danger'
  items: Payment[]
  onPick: (p: Payment) => void
  dragId: string | null
  onDragStart: (id: string) => void
  onDrop: (section: 'a_cobrar' | 'pago' | 'atrasado') => void
}) {
  const [dragOver, setDragOver] = useState(false)
  const palette: Record<string, string> = {
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
  }
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div
      className="mb-2"
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={() => { setDragOver(false); onDrop(sectionKey) }}
      style={dragOver ? { outline: '2px dashed rgba(212,168,83,0.6)', borderRadius: 12 } : undefined}
    >
      <div className={`text-[11px] uppercase tracking-wider font-semibold mt-1 mb-1.5 px-1 ${palette[color]}`}>{title} · {items.length}</div>
      <div className="space-y-2">
        {items.length === 0 && <div className="text-[11px] text-ink-muted italic px-1 py-2">Vazio</div>}
        {items.map((p) => {
          const overdue5 = p.status_locatario === 'atrasado' && daysOverdue(p.data_vencimento) > 5
          return (
            <button
              key={p.id}
              draggable
              onDragStart={() => onDragStart(p.id)}
              onClick={() => onPick(p)}
              className="w-full text-left rounded-xl p-2.5 transition-all hover:scale-[1.01]"
              style={{ background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 2px 8px rgba(15,34,56,0.06), inset 0 1px 1px rgba(255,255,255,0.80)', cursor: 'grab' }}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="text-sm font-medium text-ink truncate">{p.locatario?.nome}</div>
                <span className="text-[11px] text-ink-secondary">{p.data_vencimento.slice(8, 10)}/{p.data_vencimento.slice(5, 7)}</span>
              </div>
              <div className="text-xs text-ink-secondary truncate">{p.property?.titulo}</div>
              <div className="flex items-center justify-between mt-1.5">
                <div className="text-sm font-semibold text-navy">{currency(p.valor)}</div>
                {overdue5 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-danger">
                    <AlertTriangle size={10}/> +5 dias atraso
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
