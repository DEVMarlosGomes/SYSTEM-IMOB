import { useEffect, useMemo, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import ptBrLocale from '@fullcalendar/core/locales/pt-br'
import toast from 'react-hot-toast'
import { Plus, CalendarDays, Printer } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/common/PageHeader'
import { Modal } from '@/components/common/Modal'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { EmptyState } from '@/components/common/EmptyState'
import { appointmentService, propertyService, userService } from '@/services'
import type { Appointment, Property, User } from '@/types'
import { useAuth } from '@/stores/auth'

interface FormState {
  id?: string
  nome_cliente: string
  property_id?: string
  data: string
  hora_inicio: string
  hora_fim: string
  observacoes: string
  corretor_id?: string
  status: 'agendado' | 'realizado' | 'cancelado'
}

function emptyForm(date?: Date): FormState {
  const d = date || new Date()
  return {
    nome_cliente: '',
    property_id: undefined,
    data: d.toISOString().slice(0, 10),
    hora_inicio: '09:00',
    hora_fim: '10:00',
    observacoes: '',
    status: 'agendado',
  }
}

function addHour(h: string): string {
  const [hh, mm] = h.split(':').map(Number)
  return `${String(hh + 1).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

const STATUS_COLORS: Record<string, string> = {
  agendado: '#1B3A5C',
  realizado: '#2D7A4F',
  cancelado: '#B03A2E',
}

const STATUS_LABELS: Record<string, string> = {
  agendado: 'Agendado',
  realizado: 'Realizado',
  cancelado: 'Cancelado',
}

// ── Week PDF export ───────────────────────────────────────────────────────────
function exportWeekPDF(appts: Appointment[], startOfWeek: Date, corretorMap: Record<string, string>) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek)
    d.setDate(d.getDate() + i)
    return d
  })
  const weekStr = `${days[0].toLocaleDateString('pt-BR')} – ${days[6].toLocaleDateString('pt-BR')}`

  const byDay: Record<string, Appointment[]> = {}
  days.forEach(d => { byDay[d.toISOString().slice(0, 10)] = [] })
  appts.forEach(a => { if (byDay[a.data]) byDay[a.data].push(a) })

  const rows = days.map(d => {
    const key = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })
    const items = (byDay[key] || []).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
    const itemsHtml = items.length === 0
      ? '<div style="color:#aaa;font-size:11px;padding:4px 0">Sem agendamentos</div>'
      : items.map(a => `
        <div style="margin:4px 0;padding:6px 10px;border-radius:6px;background:${STATUS_COLORS[a.status]}22;border-left:3px solid ${STATUS_COLORS[a.status]}">
          <div style="font-weight:600;font-size:12px">${a.hora_inicio}–${a.hora_fim} · ${a.nome_cliente}</div>
          ${a.observacoes ? `<div style="font-size:11px;color:#555;margin-top:2px">${a.observacoes}</div>` : ''}
          ${corretorMap[a.corretor_id] ? `<div style="font-size:10px;color:#888;margin-top:2px">Corretor: ${corretorMap[a.corretor_id]}</div>` : ''}
        </div>`).join('')
    return `<tr><td style="padding:10px;border-bottom:1px solid #eee;vertical-align:top;width:120px;font-weight:600;font-size:12px;color:#1B3A5C">${label}</td><td style="padding:10px;border-bottom:1px solid #eee">${itemsHtml}</td></tr>`
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"/>
<title>Agenda da Semana — ${weekStr}</title>
<style>* { margin:0; padding:0; box-sizing:border-box; } body { font-family:Arial,sans-serif; font-size:13px; padding:30px 40px; }
.header { display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #B8923A; padding-bottom:10px; margin-bottom:20px; }
.logo { font-size:20px; font-weight:bold; } .logo span { color:#B8923A; }
@media print { .no-print { display:none; } }
</style></head>
<body>
<div class="header">
  <div class="logo">Imob<span>Vip</span> · Agenda</div>
  <div style="font-size:12px;color:#555">Semana: ${weekStr}</div>
</div>
<table style="width:100%;border-collapse:collapse">${rows}</table>
<div style="text-align:center;font-size:9px;color:#aaa;margin-top:30px">
  ImobVip Consultoria Imobiliária — CRECI 41.440-J
</div>
<script>window.onload=()=>window.print()</script>
</body></html>`

  const win = window.open('', '_blank')
  if (win) { win.document.write(html); win.document.close() }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AgendaPage() {
  const { user } = useAuth()
  const [appts, setAppts] = useState<Appointment[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [corretores, setCorretores] = useState<User[]>([])
  const [filterCorretor, setFilterCorretor] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [conflict, setConflict] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date()
    const day = d.getDay()
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
    d.setHours(0, 0, 0, 0)
    return d
  })

  async function load() {
    setLoading(true)
    try {
      const params: any = {}
      if (filterCorretor) params.corretor_id = filterCorretor
      const [a, p] = await Promise.all([appointmentService.list(params), propertyService.list()])
      setAppts(a)
      setProperties(p)
      if (user?.role === 'admin') {
        const us = await userService.list({ role: 'corretor' })
        setCorretores(us)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() /* eslint-disable-next-line */ }, [filterCorretor])

  const corretorMap = useMemo(
    () => Object.fromEntries(corretores.map(c => [c.id, c.nome])),
    [corretores],
  )

  const events = useMemo(
    () => appts.map((a) => ({
      id: a.id,
      title: a.nome_cliente,
      start: `${a.data}T${a.hora_inicio}:00`,
      end: `${a.data}T${a.hora_fim}:00`,
      backgroundColor: STATUS_COLORS[a.status] ?? '#1B3A5C',
      borderColor: 'transparent',
      textColor: '#FFFFFF',
      extendedProps: { ...a },
    })),
    [appts],
  )

  function openNew(date?: Date) {
    setForm(emptyForm(date))
    setConflict(null)
    setOpen(true)
  }

  function openEdit(a: Appointment) {
    setForm({
      id: a.id,
      nome_cliente: a.nome_cliente,
      property_id: a.property_id || undefined,
      data: a.data,
      hora_inicio: a.hora_inicio,
      hora_fim: a.hora_fim,
      observacoes: a.observacoes || '',
      corretor_id: a.corretor_id,
      status: a.status,
    })
    setConflict(null)
    setOpen(true)
  }

  async function save() {
    if (!form.nome_cliente) { toast.error('Informe o nome do cliente.'); return }
    if (form.hora_fim <= form.hora_inicio) { toast.error('Hora final deve ser maior que inicial.'); return }
    setSaving(true)
    setConflict(null)
    try {
      const payload: any = {
        nome_cliente: form.nome_cliente,
        property_id: form.property_id,
        data: form.data,
        hora_inicio: form.hora_inicio,
        hora_fim: form.hora_fim,
        observacoes: form.observacoes,
        status: form.status,
      }
      if (user?.role === 'admin' && form.corretor_id) payload.corretor_id = form.corretor_id
      if (form.id) await appointmentService.update(form.id, payload)
      else await appointmentService.create(payload)
      toast.success('Agendamento salvo.')
      setOpen(false)
      await load()
    } catch (e: any) {
      if (e?.response?.status === 409) {
        setConflict(e.response.data?.detail || 'Conflito de horário.')
      } else {
        toast.error('Erro ao salvar agendamento.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function removeAppt() {
    if (!form.id) return
    if (!confirm('Cancelar este agendamento?')) return
    await appointmentService.remove(form.id)
    toast.success('Agendamento removido.')
    setOpen(false)
    await load()
  }

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Operação"
        title="Agenda"
        description={user?.role === 'corretor' ? 'Suas visitas e compromissos.' : 'Agenda consolidada de todos os corretores. Filtre por profissional.'}
        actions={
          <div className="flex items-center gap-2">
            <button
              className="btn-outline flex items-center gap-2"
              onClick={() => exportWeekPDF(appts, currentWeekStart, corretorMap)}
            >
              <Printer size={15}/> Exportar semana
            </button>
            <button className="btn-gold flex items-center gap-2" onClick={() => openNew()}>
              <Plus size={16}/> Novo agendamento
            </button>
          </div>
        }
      />

      {/* Admin filter + legend */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        {user?.role === 'admin' && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-secondary">Corretor:</span>
            <select className="input-premium max-w-xs" value={filterCorretor} onChange={(e) => setFilterCorretor(e.target.value)}>
              <option value="">Todos</option>
              {corretores.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
        )}
        {/* Status legend */}
        <div className="flex items-center gap-3 ml-auto">
          {Object.entries(STATUS_COLORS).map(([k, color]) => (
            <span key={k} className="flex items-center gap-1.5 text-xs text-ink-secondary">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: color }} />
              {STATUS_LABELS[k]}
            </span>
          ))}
        </div>
      </div>

      <div className="card-premium p-3 md:p-5">
        {loading ? <LoadingScreen /> : (
          <FullCalendar
            plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            locale={ptBrLocale}
            headerToolbar={{ left: 'prev,next today', center: 'title', right: 'timeGridDay,timeGridWeek,dayGridMonth' }}
            slotMinTime="08:00:00"
            slotMaxTime="19:00:00"
            allDaySlot={false}
            height="auto"
            slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            events={events}
            selectable
            select={(arg) => openNew(arg.start)}
            eventClick={(arg) => openEdit(arg.event.extendedProps as any)}
            nowIndicator
            slotDuration="01:00:00"
            firstDay={1}
            datesSet={(arg) => {
              const d = new Date(arg.start)
              d.setHours(0, 0, 0, 0)
              setCurrentWeekStart(d)
            }}
          />
        )}
        {!loading && appts.length === 0 && (
          <div className="mt-4">
            <EmptyState description="Nenhum agendamento na agenda atual." icon={<CalendarDays size={24}/>} />
          </div>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? 'Editar agendamento' : 'Novo agendamento'}
        description="Slots disponíveis das 09h às 17h. Validamos conflitos automaticamente."
        size="md"
        footer={
          <>
            {form.id && <button onClick={removeAppt} className="btn-danger mr-auto">Cancelar agendamento</button>}
            <button className="btn-ghost" onClick={() => setOpen(false)}>Fechar</button>
            <button className="btn-primary" onClick={save} disabled={saving} data-testid="appt-save">{saving ? 'Salvando…' : 'Salvar'}</button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Nome do cliente *</label>
            <input className="input-premium" value={form.nome_cliente} onChange={(e) => setForm({ ...form, nome_cliente: e.target.value })} data-testid="appt-nome" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Imóvel</label>
            <select className="input-premium" value={form.property_id || ''} onChange={(e) => setForm({ ...form, property_id: e.target.value || undefined })}>
              <option value="">Sem imóvel vinculado</option>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.titulo}</option>)}
            </select>
          </div>
          {user?.role === 'admin' && (
            <div>
              <label className="block text-sm font-medium mb-1">Corretor</label>
              <select className="input-premium" value={form.corretor_id || ''} onChange={(e) => setForm({ ...form, corretor_id: e.target.value || undefined })}>
                <option value="">Selecionar</option>
                {corretores.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          )}

          {/* Status inline — editável */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Status</label>
            <div className="flex gap-2">
              {(['agendado', 'realizado', 'cancelado'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm({ ...form, status: s })}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={form.status === s ? {
                    background: STATUS_COLORS[s],
                    color: '#fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  } : {
                    background: `${STATUS_COLORS[s]}18`,
                    color: STATUS_COLORS[s],
                    border: `1px solid ${STATUS_COLORS[s]}40`,
                  }}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Data</label>
              <input type="date" className="input-premium" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Início</label>
              <select className="input-premium" value={form.hora_inicio} onChange={(e) => setForm({ ...form, hora_inicio: e.target.value, hora_fim: addHour(e.target.value) })}>
                {['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'].map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fim</label>
              <select className="input-premium" value={form.hora_fim} onChange={(e) => setForm({ ...form, hora_fim: e.target.value })}>
                {['10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'].map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Observações</label>
            <textarea className="input-premium min-h-[80px]" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
          </div>
          {conflict && <div className="text-sm text-danger bg-danger-soft border border-danger/30 rounded-md px-3 py-2">{conflict}</div>}
        </div>
      </Modal>
    </AppLayout>
  )
}
