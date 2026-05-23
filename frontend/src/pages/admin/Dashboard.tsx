import { useEffect, useState } from 'react'
import { Building2, TrendingUp, AlertTriangle, Calendar, Users, DollarSign, UserCog, Receipt } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/common/PageHeader'
import { KPICard } from '@/components/common/KPICard'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { EmptyState } from '@/components/common/EmptyState'
import { StatusBadge, variantForPropertyStatus } from '@/components/common/StatusBadge'
import { dashboardService } from '@/services'
import type { AdminDashboard } from '@/types'
import { compactCurrency, currency, fmtMonth, fmtShortDate, propertyTypeLabel } from '@/lib/format'
import { useNavigate } from 'react-router-dom'

const PIE_COLORS = ['#1B3A5C', '#D4A853', '#2D7A4F', '#C17B2A', '#5A6070', '#2E5F8A']

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    dashboardService.admin().then(setData).catch(() => undefined).finally(() => setLoading(false))
  }, [])

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Visao geral"
        title="Dashboard da imobiliaria"
        description="Acompanhe a performance da operacao, agenda e financeiro em um unico lugar."
        actions={
          <button className="btn-gold" onClick={() => navigate('/admin/imoveis')}><Building2 size={16}/> Ver imoveis</button>
        }
      />
      {loading || !data ? (
        <LoadingScreen />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label="Imoveis cadastrados" value={data.kpis.total_imoveis} hint={`${data.kpis.imoveis_disponiveis} disponiveis · ${data.kpis.imoveis_alugados} alugados`} icon={<Building2 size={18}/>} accent="navy" />
            <KPICard label="Receita do mes" value={compactCurrency(data.kpis.receita_mes)} hint={`${data.kpis.locatarios} locatarios ativos`} icon={<DollarSign size={18}/>} accent="gold" />
            <KPICard label="Pagamentos atrasados" value={data.kpis.atrasados} hint={data.kpis.atrasados > 0 ? 'Atencao necessaria' : 'Em dia'} icon={<AlertTriangle size={18}/>} accent={data.kpis.atrasados > 0 ? 'danger' : 'success'} />
            <KPICard label="Agendamentos da semana" value={data.kpis.agendamentos_semana} hint={`${data.kpis.corretores} corretores ativos`} icon={<Calendar size={18}/>} accent="success" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KPICard label="Locatarios" value={data.kpis.locatarios} icon={<Users size={18}/>} accent="neutral" />
            <KPICard label="Locadores" value={data.kpis.locadores} icon={<Users size={18}/>} accent="neutral" />
            <KPICard label="Corretores" value={data.kpis.corretores} icon={<UserCog size={18}/>} accent="neutral" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="card-premium p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-lg text-ink">Receita mensal (ultimos 6 meses)</h3>
                <TrendingUp className="text-gold" size={18} />
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.receita_mensal.map((d) => ({ ...d, label: fmtMonth(d.mes).split(' ')[0] }))}>
                    <CartesianGrid stroke="#E2DDD6" strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fill: '#5A6070', fontSize: 12 }} />
                    <YAxis tickFormatter={(v: number) => compactCurrency(v)} tick={{ fill: '#5A6070', fontSize: 12 }} />
                    <Tooltip formatter={(v: number) => currency(v)} labelFormatter={(l) => `Mes: ${l}`} />
                    <Line type="monotone" dataKey="valor" stroke="#1B3A5C" strokeWidth={2.5} dot={{ r: 4, fill: '#D4A853', stroke: '#1B3A5C' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card-premium p-5">
              <h3 className="font-display text-lg text-ink mb-3">Imoveis por status</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.distribuicao_status}>
                    <CartesianGrid stroke="#E2DDD6" strokeDasharray="3 3" />
                    <XAxis dataKey="status" tick={{ fill: '#5A6070', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#5A6070', fontSize: 12 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#1B3A5C" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="card-premium p-5">
              <h3 className="font-display text-lg text-ink mb-3">Distribuicao por tipo</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip />
                    <Pie data={data.distribuicao_tipo} dataKey="total" nameKey="tipo" outerRadius={80} innerRadius={48} paddingAngle={2}>
                      {data.distribuicao_tipo.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {data.distribuicao_tipo.map((d, i) => (
                  <span key={d.tipo} className="text-xs text-ink-secondary flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {propertyTypeLabel(d.tipo)} · {d.total}
                  </span>
                ))}
              </div>
            </div>

            <div className="card-premium p-5 lg:col-span-2">
              <h3 className="font-display text-lg text-ink mb-3">Atividade recente</h3>
              {data.atividade_recente.imoveis.length === 0 && data.atividade_recente.pagamentos.length === 0 ? (
                <EmptyState description="Nenhuma atividade ainda. Os movimentos aparecem aqui em tempo real." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">Imoveis recentes</h4>
                    <ul className="space-y-2">
                      {data.atividade_recente.imoveis.slice(0, 5).map((p) => (
                        <li key={p.id} className="flex items-center justify-between gap-2 text-sm border-b border-line pb-2 last:border-0">
                          <span className="truncate">{p.titulo}</span>
                          <StatusBadge variant={variantForPropertyStatus(p.status)}>{p.status}</StatusBadge>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">Pagamentos recentes</h4>
                    <ul className="space-y-2">
                      {data.atividade_recente.pagamentos.slice(0, 5).map((pg) => (
                        <li key={pg.id} className="flex items-center justify-between gap-2 text-sm border-b border-line pb-2 last:border-0">
                          <span className="flex items-center gap-2 truncate"><Receipt size={14} className="text-gold" /> {fmtMonth(pg.mes_referencia)}</span>
                          <span className="font-medium text-ink">{currency(pg.valor)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
