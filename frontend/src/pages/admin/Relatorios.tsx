import { useEffect, useState } from 'react'
import { BarChart2, AlertTriangle, Building2, Users, Printer } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/common/PageHeader'
import { KPICard } from '@/components/common/KPICard'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { EmptyState } from '@/components/common/EmptyState'
import { api } from '@/lib/api'

interface ReportData {
  gerado_em: string
  mes_referencia: string
  kpis: {
    receita_mes: number
    total_inadimplencia: number
    imoveis_vagos: number
    locatarios_inadimplentes: number
  }
  inadimplencia: {
    locatario: string
    email: string
    telefone: string
    imovel: string
    mes_referencia: string
    data_vencimento: string
    dias_atraso: number
    valor: number
  }[]
  imoveis_vagos: {
    titulo: string
    endereco: string
    bairro: string
    tipo: string
    valor_aluguel: number
    status: string
    dias_vago: number | null
    ultimo_contrato_fim: string | null
  }[]
  receita_corretores: {
    corretor: string
    email: string
    contratos_ativos: number
    recebido_mes: number
    taxa_mes: number
    historico_total: number
  }[]
}

type Tab = 'inadimplencia' | 'vagos' | 'corretores'

const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (d: string | null) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—'
const MES_LABEL: Record<string, string> = {
  '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
  '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
  '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro',
}
function mesLabel(ym: string) {
  const [y, m] = ym.split('-')
  return `${MES_LABEL[m] || m} ${y}`
}

function printInadimplencia(data: ReportData) {
  const rows = data.inadimplencia.map((r) => `
    <tr>
      <td>${r.locatario}</td>
      <td>${r.imovel}</td>
      <td>${fmtDate(r.data_vencimento)}</td>
      <td style="color:#c0392b;font-weight:700">${r.dias_atraso}d</td>
      <td style="text-align:right">${BRL(r.valor)}</td>
    </tr>`).join('')
  openPrint(
    `Relatório de Inadimplência — ${mesLabel(data.mes_referencia)}`,
    `<p style="color:#888;margin-bottom:16px">Gerado em ${fmtDate(data.gerado_em)} · ${data.inadimplencia.length} locatário(s) · Total: ${BRL(data.kpis.total_inadimplencia)}</p>
    <table>
      <thead><tr><th>Locatário</th><th>Imóvel</th><th>Vencimento</th><th>Atraso</th><th style="text-align:right">Valor</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`,
  )
}

function printVagos(data: ReportData) {
  const rows = data.imoveis_vagos.map((r) => `
    <tr>
      <td>${r.titulo}</td>
      <td>${r.endereco}${r.bairro ? ', ' + r.bairro : ''}</td>
      <td>${r.tipo}</td>
      <td style="text-align:right">${BRL(r.valor_aluguel)}</td>
      <td style="text-align:center">${r.dias_vago != null ? r.dias_vago + 'd' : 'Nunca alugado'}</td>
      <td>${fmtDate(r.ultimo_contrato_fim)}</td>
    </tr>`).join('')
  openPrint(
    `Relatório de Imóveis Vagos — ${mesLabel(data.mes_referencia)}`,
    `<p style="color:#888;margin-bottom:16px">Gerado em ${fmtDate(data.gerado_em)} · ${data.imoveis_vagos.length} imóvel(is) vago(s)</p>
    <table>
      <thead><tr><th>Imóvel</th><th>Endereço</th><th>Tipo</th><th style="text-align:right">Aluguel</th><th style="text-align:center">Dias Vago</th><th>Último Contrato</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`,
  )
}

function printCorretores(data: ReportData) {
  const rows = data.receita_corretores.map((r) => `
    <tr>
      <td>${r.corretor}</td>
      <td>${r.contratos_ativos}</td>
      <td style="text-align:right">${BRL(r.recebido_mes)}</td>
      <td style="text-align:right;color:#c0392b">${BRL(r.taxa_mes)}</td>
      <td style="text-align:right">${BRL(r.historico_total)}</td>
    </tr>`).join('')
  openPrint(
    `Receita por Corretor — ${mesLabel(data.mes_referencia)}`,
    `<p style="color:#888;margin-bottom:16px">Gerado em ${fmtDate(data.gerado_em)} · ${data.receita_corretores.length} corretor(es)</p>
    <table>
      <thead><tr><th>Corretor</th><th>Contratos Ativos</th><th style="text-align:right">Recebido no Mês</th><th style="text-align:right">Taxa (10%)</th><th style="text-align:right">Histórico Total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`,
  )
}

function printMensal(data: ReportData) {
  openPrint(
    `Relatório Mensal — ${mesLabel(data.mes_referencia)}`,
    `<p style="color:#888;margin-bottom:20px">Gerado em ${fmtDate(data.gerado_em)}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">
      <div style="border:1px solid #e0e0e0;border-radius:8px;padding:16px">
        <div style="font-size:12px;color:#888;margin-bottom:4px">Receita do Mês</div>
        <div style="font-size:22px;font-weight:700;color:#1B3A5C">${BRL(data.kpis.receita_mes)}</div>
      </div>
      <div style="border:1px solid #e0e0e0;border-radius:8px;padding:16px">
        <div style="font-size:12px;color:#888;margin-bottom:4px">Total Inadimplência</div>
        <div style="font-size:22px;font-weight:700;color:#c0392b">${BRL(data.kpis.total_inadimplencia)}</div>
      </div>
      <div style="border:1px solid #e0e0e0;border-radius:8px;padding:16px">
        <div style="font-size:12px;color:#888;margin-bottom:4px">Imóveis Vagos</div>
        <div style="font-size:22px;font-weight:700;color:#D4A853">${data.kpis.imoveis_vagos}</div>
      </div>
      <div style="border:1px solid #e0e0e0;border-radius:8px;padding:16px">
        <div style="font-size:12px;color:#888;margin-bottom:4px">Locatários Inadimplentes</div>
        <div style="font-size:22px;font-weight:700;color:#c0392b">${data.kpis.locatarios_inadimplentes}</div>
      </div>
    </div>
    <h3 style="font-size:14px;margin-bottom:8px">Top inadimplentes</h3>
    <table>
      <thead><tr><th>Locatário</th><th>Imóvel</th><th>Dias Atraso</th><th style="text-align:right">Valor</th></tr></thead>
      <tbody>${data.inadimplencia.slice(0, 10).map((r) => `<tr><td>${r.locatario}</td><td>${r.imovel}</td><td style="color:#c0392b">${r.dias_atraso}d</td><td style="text-align:right">${BRL(r.valor)}</td></tr>`).join('')}</tbody>
    </table>`,
  )
}

function openPrint(title: string, body: string) {
  const w = window.open('', '_blank', 'width=900,height=700')
  if (!w) return
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>${title}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#1a1a1a;padding:32px}
      h1{font-size:20px;font-weight:700;color:#1B3A5C;margin-bottom:4px}
      h3{color:#1B3A5C}
      table{width:100%;border-collapse:collapse;margin-top:8px}
      th{background:#1B3A5C;color:#fff;padding:8px 10px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em}
      td{padding:7px 10px;border-bottom:1px solid #f0f0f0;font-size:12px}
      tr:nth-child(even) td{background:#fafafa}
      @media print{body{padding:16px}}
    </style>
  </head><body>
    <h1>${title}</h1>
    ${body}
  </body></html>`)
  w.document.close()
  w.onload = () => w.print()
}

export default function Relatorios() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('inadimplencia')

  useEffect(() => {
    api.get('/reports/admin').then((r) => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <AppLayout><LoadingScreen /></AppLayout>
  if (!data) return (
    <AppLayout>
      <EmptyState icon={<BarChart2 size={24} />} description="Não foi possível carregar os relatórios." />
    </AppLayout>
  )

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'inadimplencia', label: 'Inadimplência', icon: <AlertTriangle size={15} /> },
    { key: 'vagos', label: 'Imóveis Vagos', icon: <Building2 size={15} /> },
    { key: 'corretores', label: 'Receita Corretores', icon: <Users size={15} /> },
  ]

  return (
    <AppLayout>
      <PageHeader
        eyebrow={`Ref. ${mesLabel(data.mes_referencia)} · Gerado em ${fmtDate(data.gerado_em)}`}
        title="Relatórios"
        description="Visão consolidada de desempenho da imobiliária."
        actions={
          <button onClick={() => printMensal(data)} className="btn-secondary flex items-center gap-2">
            <Printer size={15} /> PDF Mensal
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard label="Receita do Mês" value={BRL(data.kpis.receita_mes)} accent="success" />
        <KPICard label="Inadimplência" value={BRL(data.kpis.total_inadimplencia)} accent="danger" />
        <KPICard label="Imóveis Vagos" value={String(data.kpis.imoveis_vagos)} accent="warning" />
        <KPICard label="Inadimplentes" value={String(data.kpis.locatarios_inadimplentes)} accent="danger" />
      </div>

      {/* Tabs */}
      <div className="card-premium overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-0 gap-3 flex-wrap">
          <div className="flex gap-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm font-medium transition-all"
                style={tab === t.key
                  ? { background: 'rgba(212,168,83,0.12)', color: '#D4A853', borderBottom: '2px solid #D4A853' }
                  : { color: 'rgba(26,26,46,0.55)', borderBottom: '2px solid transparent' }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          {tab === 'inadimplencia' && (
            <button onClick={() => printInadimplencia(data)} className="btn-secondary flex items-center gap-1.5 text-sm">
              <Printer size={14} /> Imprimir
            </button>
          )}
          {tab === 'vagos' && (
            <button onClick={() => printVagos(data)} className="btn-secondary flex items-center gap-1.5 text-sm">
              <Printer size={14} /> Imprimir
            </button>
          )}
          {tab === 'corretores' && (
            <button onClick={() => printCorretores(data)} className="btn-secondary flex items-center gap-1.5 text-sm">
              <Printer size={14} /> Imprimir
            </button>
          )}
        </div>
        <div style={{ borderTop: '1px solid rgba(226,221,214,0.40)' }} className="p-5">
          {tab === 'inadimplencia' && (
            data.inadimplencia.length === 0
              ? <EmptyState icon={<AlertTriangle size={20} />} description="Nenhuma inadimplência no momento." />
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '2px solid rgba(226,221,214,0.50)' }}>
                        {['Locatário', 'Imóvel', 'Mês Ref.', 'Vencimento', 'Atraso', 'Valor'].map((h) => (
                          <th key={h} className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(26,26,46,0.45)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.inadimplencia.map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(226,221,214,0.30)' }}>
                          <td className="py-2.5 px-3 font-medium">{r.locatario}</td>
                          <td className="py-2.5 px-3 text-ink-secondary">{r.imovel}</td>
                          <td className="py-2.5 px-3 text-ink-secondary">{r.mes_referencia}</td>
                          <td className="py-2.5 px-3 text-ink-secondary">{fmtDate(r.data_vencimento)}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(192,57,43,0.12)', color: '#c0392b' }}>
                              {r.dias_atraso}d
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-right" style={{ color: '#c0392b' }}>{BRL(r.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-3 text-right text-sm font-semibold" style={{ color: '#c0392b' }}>
                    Total: {BRL(data.kpis.total_inadimplencia)}
                  </div>
                </div>
              )
          )}

          {tab === 'vagos' && (
            data.imoveis_vagos.length === 0
              ? <EmptyState icon={<Building2 size={20} />} description="Nenhum imóvel vago no momento." />
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '2px solid rgba(226,221,214,0.50)' }}>
                        {['Imóvel', 'Endereço', 'Tipo', 'Aluguel', 'Dias Vago', 'Último Contrato'].map((h) => (
                          <th key={h} className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(26,26,46,0.45)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.imoveis_vagos.map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(226,221,214,0.30)' }}>
                          <td className="py-2.5 px-3 font-medium">{r.titulo}</td>
                          <td className="py-2.5 px-3 text-ink-secondary text-xs">{r.endereco}{r.bairro ? `, ${r.bairro}` : ''}</td>
                          <td className="py-2.5 px-3 text-ink-secondary">{r.tipo}</td>
                          <td className="py-2.5 px-3 font-medium">{BRL(r.valor_aluguel)}</td>
                          <td className="py-2.5 px-3">
                            {r.dias_vago != null
                              ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(212,168,83,0.12)', color: '#D4A853' }}>{r.dias_vago}d</span>
                              : <span className="text-ink-secondary text-xs">Nunca alugado</span>}
                          </td>
                          <td className="py-2.5 px-3 text-ink-secondary">{fmtDate(r.ultimo_contrato_fim)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
          )}

          {tab === 'corretores' && (
            data.receita_corretores.length === 0
              ? <EmptyState icon={<Users size={20} />} description="Nenhum corretor cadastrado." />
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '2px solid rgba(226,221,214,0.50)' }}>
                        {['Corretor', 'Contratos Ativos', 'Recebido no Mês', 'Taxa (10%)', 'Histórico Total'].map((h) => (
                          <th key={h} className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(26,26,46,0.45)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.receita_corretores.map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(226,221,214,0.30)' }}>
                          <td className="py-2.5 px-3 font-medium">{r.corretor}</td>
                          <td className="py-2.5 px-3 text-center">{r.contratos_ativos}</td>
                          <td className="py-2.5 px-3 font-semibold" style={{ color: '#1B3A5C' }}>{BRL(r.recebido_mes)}</td>
                          <td className="py-2.5 px-3 text-sm" style={{ color: '#c0392b' }}>{BRL(r.taxa_mes)}</td>
                          <td className="py-2.5 px-3 text-ink-secondary">{BRL(r.historico_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
          )}
        </div>
      </div>
    </AppLayout>
  )
}
