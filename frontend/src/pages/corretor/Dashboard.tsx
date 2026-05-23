import { useEffect, useState } from 'react'
import { Building2, Calendar, BarChart3, ArrowRight } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/common/PageHeader'
import { KPICard } from '@/components/common/KPICard'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { StatusBadge, variantForPropertyStatus } from '@/components/common/StatusBadge'
import { dashboardService } from '@/services'
import type { CorretorDashboard } from '@/types'
import { Link } from 'react-router-dom'
import { currency, fmtShortDate } from '@/lib/format'
import { EmptyState } from '@/components/common/EmptyState'

export default function CorretorDashboardPage() {
  const [data, setData] = useState<CorretorDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardService.corretor().then((d) => setData(d as any)).catch(() => undefined).finally(() => setLoading(false))
  }, [])

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Bem-vindo de volta"
        title="Seu dia em foco"
        description="Tudo o que precisa para gerir sua carteira de imoveis e agenda."
        actions={<Link to="/corretor/imoveis" className="btn-gold"><Building2 size={16}/> Cadastrar imovel</Link>}
      />
      {loading || !data ? <LoadingScreen /> : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label="Meus imoveis" value={data.kpis.meus_imoveis} icon={<Building2 size={18}/>} accent="navy" />
            <KPICard label="Disponiveis" value={data.kpis.disponiveis} icon={<BarChart3 size={18}/>} accent="success" />
            <KPICard label="Alugados" value={data.kpis.alugados} icon={<Building2 size={18}/>} accent="gold" />
            <KPICard label="Visitas na semana" value={data.kpis.agendamentos_semana} icon={<Calendar size={18}/>} accent="neutral" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="card-premium p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg text-ink">Proximos agendamentos</h3>
                <Link to="/corretor/agenda" className="text-sm text-navy hover:underline flex items-center gap-1">Ver agenda <ArrowRight size={14}/></Link>
              </div>
              {data.proximos_agendamentos.length === 0 ? (
                <EmptyState description="Nenhuma visita agendada na semana. Que tal organizar uma?" />
              ) : (
                <ul className="space-y-3">
                  {data.proximos_agendamentos.map((a) => (
                    <li key={a.id} className="flex items-center gap-3 border-b border-line pb-3 last:border-0">
                      <div className="h-10 w-10 rounded-lg bg-navy-50 text-navy flex items-center justify-center font-medium text-sm">
                        {a.hora_inicio.slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-ink truncate">{a.nome_cliente}</div>
                        <div className="text-xs text-ink-secondary">{fmtShortDate(a.data)} · {a.hora_inicio} - {a.hora_fim}</div>
                      </div>
                      <StatusBadge variant="navy">{a.status}</StatusBadge>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card-premium p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg text-ink">Meus imoveis recentes</h3>
                <Link to="/corretor/imoveis" className="text-sm text-navy hover:underline flex items-center gap-1">Ver todos <ArrowRight size={14}/></Link>
              </div>
              {data.meus_imoveis.length === 0 ? (
                <EmptyState description="Cadastre seu primeiro imovel para comecar." />
              ) : (
                <ul className="space-y-3">
                  {data.meus_imoveis.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 border-b border-line pb-3 last:border-0">
                      <div className="h-14 w-14 rounded-lg overflow-hidden bg-surface-muted flex-shrink-0">
                        {p.fotos[0] ? <img src={p.fotos[0]} alt={p.titulo} className="h-full w-full object-cover" /> : <Building2 className="text-ink-muted m-auto mt-4" size={20}/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-ink truncate">{p.titulo}</div>
                        <div className="text-xs text-ink-secondary">{p.bairro} · {currency(p.valor_aluguel)}</div>
                      </div>
                      <StatusBadge variant={variantForPropertyStatus(p.status)}>{p.status}</StatusBadge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
