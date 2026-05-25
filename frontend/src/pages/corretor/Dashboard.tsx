import { useEffect, useState } from 'react'
import { Building2, Calendar, BarChart3, ArrowRight, MapPin, DollarSign } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { KPICard } from '@/components/common/KPICard'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { StatusBadge, variantForPropertyStatus } from '@/components/common/StatusBadge'
import { dashboardService } from '@/services'
import type { CorretorDashboard } from '@/types'
import { Link } from 'react-router-dom'
import { currency, fmtShortDate } from '@/lib/format'
import { EmptyState } from '@/components/common/EmptyState'
import { useAuth } from '@/stores/auth'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function CorretorDashboardPage() {
  const [data, setData] = useState<CorretorDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    dashboardService.corretor().then((d) => setData(d as any)).catch(() => undefined).finally(() => setLoading(false))
  }, [])

  if (loading || !data) return <AppLayout><LoadingScreen /></AppLayout>

  const firstName = user?.nome?.split(' ')[0] ?? 'Corretor'

  return (
    <AppLayout>
      <div className="space-y-7 animate-fade-up">

        {/* ── Hero liquid surface ── */}
        <div className="liquid-surface px-7 py-6">
          <div className="liquid-blob" style={{ width: 220, height: 220, top: -70, right: -50, background: 'radial-gradient(circle, rgba(46,95,138,0.13) 0%, transparent 70%)', animationDuration: '11s' }} />
          <div className="liquid-blob-alt" style={{ width: 160, height: 160, bottom: -50, left: 60, background: 'radial-gradient(circle, rgba(212,168,83,0.10) 0%, transparent 70%)', animationDuration: '15s' }} />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-1" style={{ color: 'rgba(212,168,83,0.80)' }}>
                {greeting()}, {firstName}
              </div>
              <h1 className="font-display text-2xl md:text-3xl text-ink leading-tight">
                Seu dia em foco
              </h1>
              <p className="text-sm mt-1.5" style={{ color: 'rgba(90,96,112,0.75)' }}>
                Gerencie sua carteira, agenda e contratos.
              </p>
            </div>
            <Link to="/corretor/imoveis" className="btn-gold self-start md:self-auto flex-shrink-0">
              <Building2 size={15} /> Cadastrar imóvel
            </Link>
          </div>
        </div>

        {/* ── KPIs — liquidmorphism ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard label="Meus imóveis"   value={data.kpis.meus_imoveis}        icon={<Building2 size={18}/>}  accent="navy"    />
          <KPICard label="Disponíveis"    value={data.kpis.disponiveis}          icon={<BarChart3 size={18}/>}  accent="success" />
          <KPICard label="Alugados"       value={data.kpis.alugados}             icon={<DollarSign size={18}/>} accent="gold"    />
          <KPICard label="Visitas na semana" value={data.kpis.agendamentos_semana} icon={<Calendar size={18}/>} accent="neutral" />
        </div>

        {/* ── Painéis ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Agendamentos */}
          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-display text-lg text-ink">Próximos agendamentos</h3>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(90,96,112,0.65)' }}>Esta semana</p>
              </div>
              <Link to="/corretor/agenda" className="text-xs font-medium flex items-center gap-1 transition-colors hover:text-navy" style={{ color: 'rgba(90,96,112,0.70)' }}>
                Ver agenda <ArrowRight size={12}/>
              </Link>
            </div>
            {data.proximos_agendamentos.length === 0 ? (
              <EmptyState description="Nenhuma visita agendada. Que tal organizar uma?" />
            ) : (
              <ul className="space-y-3">
                {data.proximos_agendamentos.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 pb-3 border-b last:border-0" style={{ borderColor: 'rgba(226,221,214,0.55)' }}>
                    <div
                      className="h-11 w-11 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-center"
                      style={{ background: 'rgba(27,58,92,0.07)', border: '1px solid rgba(27,58,92,0.10)' }}
                    >
                      <span className="font-semibold text-navy text-sm leading-none">{a.hora_inicio.slice(0, 2)}</span>
                      <span className="text-[9px] text-navy-400 leading-none mt-0.5">h</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-ink truncate text-sm">{a.nome_cliente}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: 'rgba(90,96,112,0.70)' }}>
                        {fmtShortDate(a.data)} · {a.hora_inicio} – {a.hora_fim}
                      </div>
                    </div>
                    <StatusBadge variant="navy">{a.status}</StatusBadge>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Imóveis recentes */}
          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-display text-lg text-ink">Meus imóveis</h3>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(90,96,112,0.65)' }}>Cadastros recentes</p>
              </div>
              <Link to="/corretor/imoveis" className="text-xs font-medium flex items-center gap-1 transition-colors hover:text-navy" style={{ color: 'rgba(90,96,112,0.70)' }}>
                Ver todos <ArrowRight size={12}/>
              </Link>
            </div>
            {data.meus_imoveis.length === 0 ? (
              <EmptyState description="Cadastre seu primeiro imóvel para começar." />
            ) : (
              <ul className="space-y-3">
                {data.meus_imoveis.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 pb-3 border-b last:border-0" style={{ borderColor: 'rgba(226,221,214,0.55)' }}>
                    <div className="h-14 w-16 rounded-xl overflow-hidden bg-surface-muted flex-shrink-0">
                      {p.fotos[0]
                        ? <img src={p.fotos[0]} alt={p.titulo} className="h-full w-full object-cover" />
                        : <div className="h-full w-full flex items-center justify-center"><Building2 className="text-ink-muted" size={18}/></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-ink truncate text-sm">{p.titulo}</div>
                      <div className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: 'rgba(90,96,112,0.70)' }}>
                        <MapPin size={10}/> {p.bairro} · {currency(p.valor_aluguel)}/mês
                      </div>
                    </div>
                    <StatusBadge variant={variantForPropertyStatus(p.status)}>{p.status}</StatusBadge>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      </div>
    </AppLayout>
  )
}
