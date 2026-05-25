import { useEffect, useState } from 'react'
import { Building2, TrendingUp, AlertTriangle, Calendar, Users, DollarSign, UserCog, Receipt, ArrowUpRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts'
import { AppLayout } from '@/components/layout/AppLayout'
import { KPICard } from '@/components/common/KPICard'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { EmptyState } from '@/components/common/EmptyState'
import { StatusBadge, variantForPropertyStatus } from '@/components/common/StatusBadge'
import { dashboardService } from '@/services'
import type { AdminDashboard } from '@/types'
import { compactCurrency, currency, fmtMonth, fmtShortDate, propertyTypeLabel } from '@/lib/format'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/stores/auth'

const PIE_COLORS = ['#1B3A5C', '#D4A853', '#2D7A4F', '#C17B2A', '#5A6070', '#2E5F8A']

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="liquid-card px-3 py-2 text-sm shadow-xl" style={{ minWidth: 130 }}>
      <div className="text-ink-muted text-[11px] mb-1">{label}</div>
      <div className="font-semibold text-ink">{currency(payload[0].value)}</div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    dashboardService.admin().then(setData).catch(() => undefined).finally(() => setLoading(false))
  }, [])

  if (loading || !data) return <AppLayout><LoadingScreen /></AppLayout>

  const firstName = user?.nome?.split(' ')[0] ?? 'Admin'

  return (
    <AppLayout>
      <div className="space-y-7 animate-fade-up">

        {/* ── Hero liquid surface ── */}
        <div className="liquid-surface px-7 py-6">
          {/* blobs decorativos */}
          <div className="liquid-blob" style={{ width: 260, height: 260, top: -80, right: -60, background: 'radial-gradient(circle, rgba(46,95,138,0.14) 0%, transparent 70%)', animationDuration: '12s' }} />
          <div className="liquid-blob-alt" style={{ width: 180, height: 180, bottom: -60, left: 80, background: 'radial-gradient(circle, rgba(212,168,83,0.12) 0%, transparent 70%)', animationDuration: '16s' }} />
          <div className="liquid-blob" style={{ width: 120, height: 120, top: 10, left: '45%', background: 'radial-gradient(circle, rgba(45,122,79,0.08) 0%, transparent 70%)', animationDuration: '9s', animationDelay: '-5s' }} />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-1" style={{ color: 'rgba(212,168,83,0.80)' }}>
                {greeting()}, {firstName}
              </div>
              <h1 className="font-display text-2xl md:text-3xl text-ink leading-tight">
                Dashboard da imobiliária
              </h1>
              <p className="text-sm mt-1.5" style={{ color: 'rgba(90,96,112,0.75)' }}>
                Performance, agenda e financeiro em um único lugar.
              </p>
            </div>
            <button
              className="btn-gold self-start md:self-auto flex-shrink-0"
              onClick={() => navigate('/admin/imoveis')}
            >
              <Building2 size={15} />
              Ver imóveis
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        {/* ── KPIs principais — liquidmorphism ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Imóveis cadastrados"
            value={data.kpis.total_imoveis}
            hint={`${data.kpis.imoveis_disponiveis} disponíveis · ${data.kpis.imoveis_alugados} alugados`}
            icon={<Building2 size={18}/>}
            accent="navy"
          />
          <KPICard
            label="Receita do mês"
            value={compactCurrency(data.kpis.receita_mes)}
            hint={`${data.kpis.locatarios} locatários ativos`}
            icon={<DollarSign size={18}/>}
            accent="gold"
          />
          <KPICard
            label="Pagamentos atrasados"
            value={data.kpis.atrasados}
            hint={data.kpis.atrasados > 0 ? 'Atenção necessária' : 'Em dia'}
            icon={<AlertTriangle size={18}/>}
            accent={data.kpis.atrasados > 0 ? 'danger' : 'success'}
          />
          <KPICard
            label="Agendamentos da semana"
            value={data.kpis.agendamentos_semana}
            hint={`${data.kpis.corretores} corretores ativos`}
            icon={<Calendar size={18}/>}
            accent="success"
          />
        </div>

        {/* ── KPIs secundários ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KPICard label="Locatários" value={data.kpis.locatarios} icon={<Users size={18}/>} accent="neutral" />
          <KPICard label="Locadores"  value={data.kpis.locadores}  icon={<Users size={18}/>} accent="neutral" />
          <KPICard label="Corretores" value={data.kpis.corretores} icon={<UserCog size={18}/>} accent="neutral" />
        </div>

        {/* ── Gráficos ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Linha — receita mensal */}
          <div className="card-premium p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-display text-lg text-ink">Receita mensal</h3>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(90,96,112,0.65)' }}>Últimos 6 meses</p>
              </div>
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(27,58,92,0.08)', border: '1px solid rgba(27,58,92,0.10)' }}
              >
                <TrendingUp size={15} style={{ color: '#1B3A5C' }} />
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.receita_mensal.map((d) => ({ ...d, label: fmtMonth(d.mes).split(' ')[0] }))} margin={{ left: -10, right: 8 }}>
                  <CartesianGrid stroke="rgba(226,221,214,0.50)" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#8B91A1', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v: number) => compactCurrency(v)} tick={{ fill: '#8B91A1', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#2E5F8A" />
                      <stop offset="100%" stopColor="#1B3A5C" />
                    </linearGradient>
                  </defs>
                  <Line type="monotone" dataKey="valor" stroke="url(#lineGrad)" strokeWidth={2.5}
                    dot={{ r: 4, fill: '#D4A853', stroke: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#D4A853', stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Barra — status */}
          <div className="card-premium p-6">
            <div className="mb-5">
              <h3 className="font-display text-lg text-ink">Por status</h3>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(90,96,112,0.65)' }}>Distribuição atual</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.distribuicao_status} margin={{ left: -20, right: 4 }}>
                  <CartesianGrid stroke="rgba(226,221,214,0.50)" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="status" tick={{ fill: '#8B91A1', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#8B91A1', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'rgba(27,58,92,0.04)' }} />
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2E5F8A" />
                      <stop offset="100%" stopColor="#1B3A5C" />
                    </linearGradient>
                  </defs>
                  <Bar dataKey="total" fill="url(#barGrad)" radius={[8, 8, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── Distribuição + Atividade recente ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Donut — tipo */}
          <div className="card-premium p-6">
            <div className="mb-4">
              <h3 className="font-display text-lg text-ink">Por tipo</h3>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(90,96,112,0.65)' }}>Portfólio atual</p>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip formatter={(v: any) => [v, 'imóveis']} />
                  <Pie data={data.distribuicao_tipo} dataKey="total" nameKey="tipo" outerRadius={72} innerRadius={44} paddingAngle={3}>
                    {data.distribuicao_tipo.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3">
              {data.distribuicao_tipo.map((d, i) => (
                <span key={d.tipo} className="text-[11px] text-ink-secondary flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {propertyTypeLabel(d.tipo)} · {d.total}
                </span>
              ))}
            </div>
          </div>

          {/* Atividade recente */}
          <div className="card-premium p-6 lg:col-span-2">
            <div className="mb-4">
              <h3 className="font-display text-lg text-ink">Atividade recente</h3>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(90,96,112,0.65)' }}>Últimas movimentações</p>
            </div>
            {data.atividade_recente.imoveis.length === 0 && data.atividade_recente.pagamentos.length === 0 ? (
              <EmptyState description="Nenhuma atividade ainda." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(90,96,112,0.65)' }}>
                    Imóveis recentes
                  </div>
                  <ul className="space-y-2.5">
                    {data.atividade_recente.imoveis.slice(0, 5).map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-2 text-sm pb-2.5 border-b last:border-0" style={{ borderColor: 'rgba(226,221,214,0.55)' }}>
                        <span className="truncate text-ink-secondary">{p.titulo}</span>
                        <StatusBadge variant={variantForPropertyStatus(p.status)}>{p.status}</StatusBadge>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(90,96,112,0.65)' }}>
                    Pagamentos recentes
                  </div>
                  <ul className="space-y-2.5">
                    {data.atividade_recente.pagamentos.slice(0, 5).map((pg) => (
                      <li key={pg.id} className="flex items-center justify-between gap-2 text-sm pb-2.5 border-b last:border-0" style={{ borderColor: 'rgba(226,221,214,0.55)' }}>
                        <span className="flex items-center gap-2 text-ink-secondary truncate">
                          <Receipt size={13} style={{ color: '#D4A853', flexShrink: 0 }} />
                          {fmtMonth(pg.mes_referencia)}
                        </span>
                        <span className="font-medium text-ink flex-shrink-0">{currency(pg.valor)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
