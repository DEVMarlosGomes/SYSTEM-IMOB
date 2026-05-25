import { useEffect, useState, type ReactNode } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Phone, Mail, Instagram, Award, Home, Calendar,
  TrendingUp, DollarSign, CheckCircle2, Clock, XCircle,
  Plus, Pencil, Trash2, Save, X, Building2,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import toast from 'react-hot-toast'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { Avatar } from '@/components/common/Avatar'
import { Modal } from '@/components/common/Modal'
import { corretorService, userService } from '@/services'
import type { Comissao, CorretorStats } from '@/types'
import { maskPhone } from '@/lib/format'

// ─── helpers ──────────────────────────────────────────────────────────────────

const TIPO_LABELS: Record<string, string> = {
  locacao: 'Locação', captacao: 'Captação', gerencia: 'Gerência', premiacao: 'Premiação',
}
const TIPO_COLORS: Record<string, [string, string]> = {
  locacao:   ['rgba(46,95,138,0.12)',  '#2E5F8A'],
  captacao:  ['rgba(212,168,83,0.15)', '#B8923A'],
  gerencia:  ['rgba(39,174,96,0.12)',  '#27AE60'],
  premiacao: ['rgba(156,39,176,0.12)', '#9C27B0'],
}

const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

const fmtDate = (s: string) => {
  if (!s) return '—'
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}

const mesLabel = (ym: string) => {
  const [y, m] = ym.split('-')
  const names = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${names[parseInt(m, 10) - 1]}/${y.slice(2)}`
}

const currentYM = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// ─── component ────────────────────────────────────────────────────────────────

export default function CorretorDetalhes() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [stats, setStats] = useState<CorretorStats | null>(null)
  const [comissoes, setComissoes] = useState<Comissao[]>([])
  const [loading, setLoading] = useState(true)

  // Edit profile modal
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ nome: '', telefone: '', creci_sp: '', instagram: '', email: '' })
  const [editSaving, setEditSaving] = useState(false)

  // New commission modal
  const [comOpen, setComOpen] = useState(false)
  const [comForm, setComForm] = useState({
    tipo: 'locacao' as 'locacao' | 'captacao' | 'gerencia' | 'premiacao',
    descricao: '', percentual: '', valor_base: '', valor: '',
    mes_referencia: currentYM(), data_prevista: '', observacoes: '',
  })
  const [comSaving, setComSaving] = useState(false)

  // Edit commission
  const [editComissao, setEditComissao] = useState<Comissao | null>(null)
  const [editComForm, setEditComForm] = useState({
    tipo: 'locacao' as 'locacao' | 'captacao' | 'gerencia' | 'premiacao',
    percentual: '', valor_base: '', valor: '',
    data_prevista: '', data_pagamento: '', status: 'pendente' as 'pendente' | 'pago', observacoes: '',
  })
  const [editComSaving, setEditComSaving] = useState(false)

  async function load() {
    if (!id) return
    setLoading(true)
    try {
      const [s, c] = await Promise.all([
        corretorService.stats(id),
        corretorService.comissoes(id),
      ])
      setStats(s)
      setComissoes(c)
      const u = s.corretor
      setEditForm({ nome: u.nome, telefone: u.telefone || '', creci_sp: u.creci_sp || '', instagram: u.instagram || '', email: u.email })
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [id])

  async function saveProfile() {
    if (!id) return
    setEditSaving(true)
    try {
      await userService.update(id, {
        nome: editForm.nome,
        telefone: editForm.telefone,
        creci_sp: editForm.creci_sp,
        instagram: editForm.instagram,
      })
      toast.success('Perfil atualizado.')
      setEditOpen(false)
      await load()
    } catch { toast.error('Erro ao salvar.') }
    finally { setEditSaving(false) }
  }

  async function createComissao() {
    if (!id) return
    if (!comForm.descricao || !comForm.valor || !comForm.data_prevista) {
      toast.error('Preencha descrição, valor e data prevista.')
      return
    }
    setComSaving(true)
    try {
      await corretorService.createComissao(id, {
        corretor_id: id,
        tipo: comForm.tipo,
        descricao: comForm.descricao,
        percentual: comForm.percentual ? Number(comForm.percentual) : undefined,
        valor_base: comForm.valor_base ? Number(comForm.valor_base) : undefined,
        valor: Number(comForm.valor),
        mes_referencia: comForm.mes_referencia,
        data_prevista: comForm.data_prevista,
        observacoes: comForm.observacoes || undefined,
        status: 'pendente',
      } as any)
      toast.success('Comissão registrada.')
      setComOpen(false)
      setComForm({ tipo: 'locacao', descricao: '', percentual: '', valor_base: '', valor: '', mes_referencia: currentYM(), data_prevista: '', observacoes: '' })
      const [s, c] = await Promise.all([corretorService.stats(id), corretorService.comissoes(id)])
      setStats(s); setComissoes(c)
    } catch { toast.error('Erro ao registrar comissão.') }
    finally { setComSaving(false) }
  }

  async function saveEditComissao() {
    if (!editComissao) return
    setEditComSaving(true)
    try {
      const updates: any = {
        tipo: editComForm.tipo,
        status: editComForm.status,
        data_prevista: editComForm.data_prevista,
        valor: editComForm.valor ? Number(editComForm.valor) : editComissao.valor,
      }
      if (editComForm.percentual) updates.percentual = Number(editComForm.percentual)
      if (editComForm.valor_base) updates.valor_base = Number(editComForm.valor_base)
      if (editComForm.observacoes) updates.observacoes = editComForm.observacoes
      if (editComForm.status === 'pago' && editComForm.data_pagamento) updates.data_pagamento = editComForm.data_pagamento
      await corretorService.updateComissao(editComissao.id, updates)
      toast.success('Comissão atualizada.')
      setEditComissao(null)
      const [s, c] = await Promise.all([corretorService.stats(id!), corretorService.comissoes(id!)])
      setStats(s); setComissoes(c)
    } catch { toast.error('Erro ao atualizar.') }
    finally { setEditComSaving(false) }
  }

  async function deleteComissao(comId: string) {
    if (!confirm('Excluir esta comissão?')) return
    try {
      await corretorService.deleteComissao(comId)
      toast.success('Comissão removida.')
      setComissoes((prev) => prev.filter((c) => c.id !== comId))
      if (id) {
        const s = await corretorService.stats(id)
        setStats(s)
      }
    } catch { toast.error('Erro ao remover.') }
  }

  if (loading) return <AppLayout><LoadingScreen /></AppLayout>
  if (!stats) return <AppLayout><div className="p-8 text-center text-ink-muted">Corretor não encontrado.</div></AppLayout>

  const { corretor, kpis, comissao_mensal, agendamentos_recentes } = stats
  const chartData = comissao_mensal.map((m) => ({ ...m, mes: mesLabel(m.mes) }))

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Back ── */}
        <button className="btn-ghost text-sm" onClick={() => navigate('/admin/corretores')}>
          <ArrowLeft size={15} /> Voltar aos corretores
        </button>

        {/* ── Profile card ── */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(226,221,214,0.70)',
            boxShadow: '0 4px 24px rgba(15,34,56,0.06)',
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <Avatar name={corretor.nome} size={72} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-display font-semibold text-ink">{corretor.nome}</h1>
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={corretor.active ? { background: 'rgba(39,174,96,0.12)', color: '#27AE60' } : { background: 'rgba(231,76,60,0.10)', color: '#E74C3C' }}
                >
                  {corretor.active ? 'ativo' : 'inativo'}
                </span>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-2">
                {corretor.email && (
                  <span className="flex items-center gap-1.5 text-sm text-ink-secondary">
                    <Mail size={13} className="text-ink-muted" /> {corretor.email}
                  </span>
                )}
                {corretor.telefone && (
                  <span className="flex items-center gap-1.5 text-sm text-ink-secondary">
                    <Phone size={13} className="text-ink-muted" /> {maskPhone(corretor.telefone)}
                  </span>
                )}
                {corretor.creci_sp && (
                  <span className="flex items-center gap-1.5 text-sm text-ink-secondary">
                    <Award size={13} className="text-ink-muted" /> CRECI-SP {corretor.creci_sp}
                  </span>
                )}
                {corretor.instagram && (
                  <span className="flex items-center gap-1.5 text-sm text-ink-secondary">
                    <Instagram size={13} className="text-ink-muted" /> {corretor.instagram}
                  </span>
                )}
              </div>
            </div>

            <button className="btn-outline self-start" onClick={() => setEditOpen(true)}>
              <Pencil size={14} /> Editar perfil
            </button>
          </div>
        </div>

        {/* ── KPI cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={<Home size={18} />}
            label="Imóveis captados"
            value={kpis.imoveis_captados}
            sub={`${kpis.imoveis_alugados} alugados · ${kpis.imoveis_disponiveis} disponíveis`}
            accent="#2E5F8A"
          />
          <KpiCard
            icon={<Calendar size={18} />}
            label="Agendamentos"
            value={kpis.agendamentos_total}
            sub={`${kpis.agendamentos_realizados} realizados · ${kpis.agendamentos_pendentes} pendentes`}
            accent="#D4A853"
          />
          <KpiCard
            icon={<DollarSign size={18} />}
            label="Comissão pendente"
            value={BRL(kpis.comissao_pendente)}
            sub="a receber"
            accent="#E74C3C"
            valueSmall
          />
          <KpiCard
            icon={<TrendingUp size={18} />}
            label="Comissão paga"
            value={BRL(kpis.comissao_paga)}
            sub="total histórico"
            accent="#27AE60"
            valueSmall
          />
        </div>

        {/* ── Chart + Agendamentos ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Commission chart */}
          <div
            className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)', border: '1px solid rgba(226,221,214,0.70)', boxShadow: '0 4px 24px rgba(15,34,56,0.06)' }}
          >
            <h3 className="font-semibold text-ink mb-4">Comissões por mês</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={14} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v: number, name: string) => [BRL(v), name === 'pago' ? 'Pago' : 'Pendente']}
                  contentStyle={{ borderRadius: 12, border: '1px solid rgba(226,221,214,0.6)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', fontSize: 12 }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="pago" name="Pago" fill="#27AE60" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pendente" name="Pendente" fill="#D4A853" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent appointments */}
          <div
            className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)', border: '1px solid rgba(226,221,214,0.70)', boxShadow: '0 4px 24px rgba(15,34,56,0.06)' }}
          >
            <h3 className="font-semibold text-ink mb-4">Agendamentos recentes</h3>
            {agendamentos_recentes.length === 0 ? (
              <p className="text-sm text-ink-muted text-center py-8">Nenhum agendamento.</p>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {agendamentos_recentes.map((a: any) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    style={{ background: 'rgba(248,247,244,0.80)', border: '1px solid rgba(226,221,214,0.50)' }}
                  >
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: statusBg(a.status) }}
                    >
                      {statusIcon(a.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink truncate">{a.nome_cliente}</div>
                      <div className="text-xs text-ink-muted">{fmtDate(a.data)} · {a.hora_inicio}–{a.hora_fim}</div>
                      {a.property?.titulo && (
                        <div className="text-xs text-ink-secondary truncate flex items-center gap-1">
                          <Building2 size={10} /> {a.property.titulo}
                        </div>
                      )}
                    </div>
                    <StatusPill status={a.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Commissions table ── */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)', border: '1px solid rgba(226,221,214,0.70)', boxShadow: '0 4px 24px rgba(15,34,56,0.06)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-ink">Comissões</h3>
            <button className="btn-gold text-xs py-1.5 px-3" onClick={() => setComOpen(true)}>
              <Plus size={13} /> Nova comissão
            </button>
          </div>

          {comissoes.length === 0 ? (
            <p className="text-sm text-ink-muted text-center py-8">Nenhuma comissão registrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-ink-secondary uppercase text-[11px] tracking-wider border-b border-line">
                    <th className="text-left pb-3">Descrição</th>
                    <th className="text-left pb-3">Tipo</th>
                    <th className="text-center pb-3">%</th>
                    <th className="text-left pb-3">Mês ref.</th>
                    <th className="text-right pb-3">Valor</th>
                    <th className="text-center pb-3">Previsto</th>
                    <th className="text-center pb-3">Pago em</th>
                    <th className="text-center pb-3">Status</th>
                    <th className="text-center pb-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {comissoes.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-muted/40">
                      <td className="py-3 pr-3">
                        <div className="font-medium text-ink">{c.descricao}</div>
                        {c.observacoes && <div className="text-xs text-ink-muted mt-0.5">{c.observacoes}</div>}
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap"
                          style={{ background: TIPO_COLORS[c.tipo]?.[0] ?? 'rgba(200,200,200,0.15)', color: TIPO_COLORS[c.tipo]?.[1] ?? '#888' }}
                        >
                          {TIPO_LABELS[c.tipo] ?? c.tipo}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-center text-ink-secondary text-xs">
                        {c.percentual != null ? `${c.percentual}%` : '—'}
                      </td>
                      <td className="py-3 pr-3 text-ink-secondary">{mesLabel(c.mes_referencia)}</td>
                      <td className="py-3 pr-3 text-right font-semibold text-ink">{BRL(c.valor)}</td>
                      <td className="py-3 pr-3 text-center text-ink-secondary">{fmtDate(c.data_prevista)}</td>
                      <td className="py-3 pr-3 text-center text-ink-secondary">{c.data_pagamento ? fmtDate(c.data_pagamento) : '—'}</td>
                      <td className="py-3 pr-3 text-center">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={c.status === 'pago'
                            ? { background: 'rgba(39,174,96,0.12)', color: '#27AE60' }
                            : { background: 'rgba(212,168,83,0.15)', color: '#B8923A' }}
                        >
                          {c.status === 'pago' ? 'Pago' : 'Pendente'}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            className="h-7 w-7 rounded-lg flex items-center justify-center text-ink-muted hover:text-navy hover:bg-navy/08 transition"
                            onClick={() => {
                              setEditComissao(c)
                              setEditComForm({
                                tipo: c.tipo || 'locacao',
                                percentual: c.percentual?.toString() || '',
                                valor_base: c.valor_base?.toString() || '',
                                valor: c.valor.toString(),
                                data_prevista: c.data_prevista,
                                data_pagamento: c.data_pagamento || '',
                                status: c.status,
                                observacoes: c.observacoes || '',
                              })
                            }}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            className="h-7 w-7 rounded-lg flex items-center justify-center text-ink-muted hover:text-danger hover:bg-danger/08 transition"
                            onClick={() => deleteComissao(c.id)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Edit Profile Modal ── */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar perfil do corretor"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEditOpen(false)}>Cancelar</button>
            <button className="btn-primary" onClick={saveProfile} disabled={editSaving}>
              <Save size={14} /> {editSaving ? 'Salvando…' : 'Salvar'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Nome completo</label>
            <input className="input-premium" value={editForm.nome} onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telefone</label>
            <input className="input-premium" value={editForm.telefone} onChange={(e) => setEditForm({ ...editForm, telefone: maskPhone(e.target.value) })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">CRECI-SP</label>
            <input className="input-premium" value={editForm.creci_sp} onChange={(e) => setEditForm({ ...editForm, creci_sp: e.target.value })} placeholder="Ex: 12345-F" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Instagram</label>
            <input className="input-premium" value={editForm.instagram} onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })} placeholder="@usuario" />
          </div>
        </div>
      </Modal>

      {/* ── New Commission Modal ── */}
      <Modal
        open={comOpen}
        onClose={() => setComOpen(false)}
        title="Registrar comissão"
        description="Registre uma comissão a receber para este corretor."
        footer={
          <>
            <button className="btn-ghost" onClick={() => setComOpen(false)}>Cancelar</button>
            <button className="btn-gold" onClick={createComissao} disabled={comSaving}>
              <DollarSign size={14} /> {comSaving ? 'Salvando…' : 'Registrar'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          {/* Tipo selector */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Tipo de comissão</label>
            <div className="grid grid-cols-2 gap-2">
              {(['locacao', 'captacao', 'gerencia', 'premiacao'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setComForm({ ...comForm, tipo: t })}
                  className="py-2 px-3 rounded-xl text-xs font-semibold transition-all"
                  style={comForm.tipo === t
                    ? { background: TIPO_COLORS[t][0], color: TIPO_COLORS[t][1], border: `1.5px solid ${TIPO_COLORS[t][1]}60` }
                    : { background: 'rgba(248,247,244,0.8)', color: '#888', border: '1.5px solid rgba(226,221,214,0.6)' }}
                >
                  {TIPO_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descrição *</label>
            <input className="input-premium" value={comForm.descricao} onChange={(e) => setComForm({ ...comForm, descricao: e.target.value })} placeholder="Ex: Comissão contrato Rua das Flores 123" />
          </div>

          {/* Percentual + Base */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">% Comissão</label>
              <input
                type="number" min="0" max="100" step="0.01"
                className="input-premium" placeholder="Ex: 8.5"
                value={comForm.percentual}
                onChange={(e) => {
                  const p = e.target.value
                  const b = comForm.valor_base
                  const auto = p && b ? ((parseFloat(b) * parseFloat(p)) / 100).toFixed(2) : comForm.valor
                  setComForm({ ...comForm, percentual: p, valor: auto })
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Valor base (R$)</label>
              <input
                type="number" min="0" step="0.01"
                className="input-premium" placeholder="Ex: 1500.00"
                value={comForm.valor_base}
                onChange={(e) => {
                  const b = e.target.value
                  const p = comForm.percentual
                  const auto = b && p ? ((parseFloat(b) * parseFloat(p)) / 100).toFixed(2) : comForm.valor
                  setComForm({ ...comForm, valor_base: b, valor: auto })
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Valor da comissão (R$) *</label>
              <input type="number" min="0" step="0.01" className="input-premium" value={comForm.valor} onChange={(e) => setComForm({ ...comForm, valor: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mês referência</label>
              <input type="month" className="input-premium" value={comForm.mes_referencia} onChange={(e) => setComForm({ ...comForm, mes_referencia: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Data prevista de pagamento *</label>
            <input type="date" className="input-premium" value={comForm.data_prevista} onChange={(e) => setComForm({ ...comForm, data_prevista: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Observações</label>
            <input className="input-premium" value={comForm.observacoes} onChange={(e) => setComForm({ ...comForm, observacoes: e.target.value })} />
          </div>
        </div>
      </Modal>

      {/* ── Edit Commission Modal ── */}
      <Modal
        open={!!editComissao}
        onClose={() => setEditComissao(null)}
        title="Atualizar comissão"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEditComissao(null)}>Cancelar</button>
            <button className="btn-primary" onClick={saveEditComissao} disabled={editComSaving}>
              <Save size={14} /> {editComSaving ? 'Salvando…' : 'Salvar'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          {/* Tipo selector */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Tipo de comissão</label>
            <div className="grid grid-cols-2 gap-2">
              {(['locacao', 'captacao', 'gerencia', 'premiacao'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setEditComForm({ ...editComForm, tipo: t })}
                  className="py-2 px-3 rounded-xl text-xs font-semibold transition-all"
                  style={editComForm.tipo === t
                    ? { background: TIPO_COLORS[t][0], color: TIPO_COLORS[t][1], border: `1.5px solid ${TIPO_COLORS[t][1]}60` }
                    : { background: 'rgba(248,247,244,0.8)', color: '#888', border: '1.5px solid rgba(226,221,214,0.6)' }}
                >
                  {TIPO_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Percentual + Base + Valor */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">% Comissão</label>
              <input
                type="number" min="0" max="100" step="0.01"
                className="input-premium" placeholder="Ex: 8.5"
                value={editComForm.percentual}
                onChange={(e) => {
                  const p = e.target.value
                  const b = editComForm.valor_base
                  const auto = p && b ? ((parseFloat(b) * parseFloat(p)) / 100).toFixed(2) : editComForm.valor
                  setEditComForm({ ...editComForm, percentual: p, valor: auto })
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Valor base (R$)</label>
              <input
                type="number" min="0" step="0.01"
                className="input-premium"
                value={editComForm.valor_base}
                onChange={(e) => {
                  const b = e.target.value
                  const p = editComForm.percentual
                  const auto = b && p ? ((parseFloat(b) * parseFloat(p)) / 100).toFixed(2) : editComForm.valor
                  setEditComForm({ ...editComForm, valor_base: b, valor: auto })
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Valor (R$)</label>
              <input type="number" min="0" step="0.01" className="input-premium" value={editComForm.valor} onChange={(e) => setEditComForm({ ...editComForm, valor: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              className="input-premium"
              value={editComForm.status}
              onChange={(e) => setEditComForm({ ...editComForm, status: e.target.value as any })}
            >
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Data prevista</label>
            <input type="date" className="input-premium" value={editComForm.data_prevista} onChange={(e) => setEditComForm({ ...editComForm, data_prevista: e.target.value })} />
          </div>
          {editComForm.status === 'pago' && (
            <div>
              <label className="block text-sm font-medium mb-1">Data do pagamento</label>
              <input type="date" className="input-premium" value={editComForm.data_pagamento} onChange={(e) => setEditComForm({ ...editComForm, data_pagamento: e.target.value })} />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Observações</label>
            <input className="input-premium" value={editComForm.observacoes} onChange={(e) => setEditComForm({ ...editComForm, observacoes: e.target.value })} />
          </div>
        </div>
      </Modal>
    </AppLayout>
  )
}

// ─── sub-components ────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, accent, valueSmall }: {
  icon: ReactNode
  label: string
  value: string | number
  sub?: string
  accent: string
  valueSmall?: boolean
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)', border: '1px solid rgba(226,221,214,0.70)', boxShadow: '0 4px 24px rgba(15,34,56,0.06)' }}
    >
      <div
        className="h-9 w-9 rounded-xl flex items-center justify-center mb-3"
        style={{ background: `${accent}18`, color: accent }}
      >
        {icon}
      </div>
      <div className={`font-display font-bold text-ink mb-0.5 ${valueSmall ? 'text-xl' : 'text-3xl'}`}>{value}</div>
      <div className="text-xs font-medium text-ink-secondary">{label}</div>
      {sub && <div className="text-[11px] text-ink-muted mt-1">{sub}</div>}
    </div>
  )
}

function statusBg(s: string) {
  if (s === 'realizado') return 'rgba(39,174,96,0.12)'
  if (s === 'cancelado') return 'rgba(231,76,60,0.10)'
  return 'rgba(212,168,83,0.12)'
}
function statusIcon(s: string) {
  if (s === 'realizado') return <CheckCircle2 size={14} color="#27AE60" />
  if (s === 'cancelado') return <XCircle size={14} color="#E74C3C" />
  return <Clock size={14} color="#D4A853" />
}
function StatusPill({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    agendado: ['rgba(212,168,83,0.15)', '#B8923A'],
    realizado: ['rgba(39,174,96,0.12)', '#27AE60'],
    cancelado: ['rgba(231,76,60,0.10)', '#E74C3C'],
  }
  const [bg, color] = map[status] ?? ['rgba(200,200,200,0.15)', '#888']
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize" style={{ background: bg, color }}>
      {status}
    </span>
  )
}
