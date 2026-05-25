import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileDown, Edit2, FileCheck } from 'lucide-react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import toast from 'react-hot-toast'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { StatusBadge } from '@/components/common/StatusBadge'
import { FichaLocatarioPDF } from '@/components/locatarios/FichaLocatarioPDF'
import { fichaLocatarioService } from '@/services'
import type { FichaLocatario } from '@/types/locatario.types'
import { STATUS_FICHA, ESTADO_CIVIL_OPTIONS } from '@/types/locatario.types'
import { formatCurrency, fmtDateBR } from '@/lib/validations'
import { useAuth } from '@/stores/auth'

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-ink-muted">{label}</div>
      <div className="text-sm text-ink font-medium mt-0.5">{value || '—'}</div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-premium p-5 space-y-3">
      <div
        className="text-[11px] font-bold uppercase tracking-widest pb-2"
        style={{ color: '#B8923A', borderBottom: '1px solid rgba(212,168,83,0.20)' }}
      >
        {title}
      </div>
      {children}
    </div>
  )
}

function estadoCivilLabel(val: string) {
  return ESTADO_CIVIL_OPTIONS.find(o => o.value === val)?.label ?? val
}

function statusVariant(s: FichaLocatario['status']): 'success' | 'warning' | 'neutral' {
  if (s === 'ativo') return 'success'
  if (s === 'analise') return 'warning'
  return 'neutral'
}

export default function DetalhesLocatario() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [ficha, setFicha] = useState<FichaLocatario | null>(null)
  const [loading, setLoading] = useState(true)
  const [pdfReady, setPdfReady] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    if (id) fichaLocatarioService.get(id).then(setFicha).catch(() => toast.error('Ficha não encontrada.')).finally(() => setLoading(false))
  }, [id])

  async function changeStatus(status: FichaLocatario['status']) {
    if (!ficha) return
    setUpdatingStatus(true)
    try {
      const updated = await fichaLocatarioService.update(ficha.id, { status })
      setFicha(f => f ? { ...f, status: updated.status } : f)
      toast.success('Status atualizado.')
    } finally { setUpdatingStatus(false) }
  }

  const base = user?.role === 'corretor' ? '/corretor' : '/admin'

  if (loading) return <AppLayout><LoadingScreen /></AppLayout>
  if (!ficha) return <AppLayout><p className="text-ink-secondary p-8">Ficha não encontrada.</p></AppLayout>

  const c1 = ficha.cliente1
  const c2 = ficha.cliente2

  return (
    <AppLayout>
      <button onClick={() => navigate(`${base}/fichas-locatario`)} className="btn-ghost mb-4 flex items-center gap-1.5">
        <ArrowLeft size={16} /> Voltar para fichas
      </button>

      <PageHeader
        eyebrow="Ficha Inquilino"
        title={c1.nome_completo}
        description={`${ficha.condominio} · ${ficha.unidade} · ${fmtDateBR(ficha.data_cadastro)}`}
        actions={
          <>
            <StatusBadge variant={statusVariant(ficha.status)}>{STATUS_FICHA[ficha.status]}</StatusBadge>
            {(user?.role === 'admin' || user?.role === 'corretor') && (
              <>
                <button
                  className="btn-outline flex items-center gap-2 text-sm"
                  onClick={() => navigate(`${base}/fichas-locatario/${ficha.id}/editar`)}
                >
                  <Edit2 size={14} /> Editar
                </button>
                {pdfReady ? (
                  <PDFDownloadLink
                    document={<FichaLocatarioPDF ficha={ficha} />}
                    fileName={`ficha-${c1.nome_completo.replace(/\s+/g, '-').toLowerCase()}.pdf`}
                    className="btn-gold flex items-center gap-2"
                  >
                    {({ loading: pdfLoading }) => (
                      <><FileDown size={14} />{pdfLoading ? 'Gerando…' : 'Baixar Ficha PDF'}</>
                    )}
                  </PDFDownloadLink>
                ) : (
                  <button className="btn-primary flex items-center gap-2" onClick={() => setPdfReady(true)}>
                    <FileCheck size={14} /> Gerar PDF
                  </button>
                )}
              </>
            )}
          </>
        }
      />

      {/* Status actions (admin only) */}
      {user?.role === 'admin' && ficha.status === 'analise' && (
        <div
          className="mb-4 flex items-center gap-3 p-4 rounded-2xl text-sm"
          style={{ background: 'rgba(212,168,83,0.08)', border: '1px solid rgba(212,168,83,0.25)' }}
        >
          <span className="text-ink font-medium">Ficha em análise —</span>
          <button
            className="btn-primary text-xs py-1.5"
            onClick={() => changeStatus('ativo')}
            disabled={updatingStatus}
          >
            ✅ Aprovar
          </button>
          <button
            className="btn-danger text-xs py-1.5"
            onClick={() => changeStatus('inativo')}
            disabled={updatingStatus}
          >
            Recusar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          {/* Cliente 1 */}
          <Card title="👤 Cliente 1 — Inquilino Principal">
            <div className="grid grid-cols-2 gap-3">
              <Info label="CPF" value={c1.cpf} />
              <Info label="RG" value={c1.rg} />
              <Info label="Estado civil" value={estadoCivilLabel(c1.estado_civil)} />
              <Info label="Profissão" value={c1.profissao} />
              <Info label="E-mail" value={c1.email} />
            </div>
          </Card>

          {/* Cliente 2 */}
          {c2 && (
            <Card title="👤 Cliente 2 — Segundo Inquilino">
              <div className="grid grid-cols-2 gap-3">
                <Info label="CPF" value={c2.cpf} />
                <Info label="RG" value={c2.rg} />
                <Info label="Estado civil" value={estadoCivilLabel(c2.estado_civil)} />
                <Info label="Profissão" value={c2.profissao} />
                <Info label="E-mail" value={c2.email} />
                {c2.endereco && <Info label="Endereço" value={c2.endereco} />}
              </div>
            </Card>
          )}

          {/* Referências */}
          <Card title="📋 Referências">
            <div className="grid grid-cols-2 gap-2">
              {ficha.referencias.map(r => (
                <div key={r.label}>
                  <div className="text-[10px] uppercase tracking-wider text-ink-muted">{r.label.replace('_', ' ')}</div>
                  <div className="text-sm font-medium">{r.nome}</div>
                  <div className="text-xs text-ink-muted">{r.telefone}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Dados Profissionais */}
          <Card title="💼 Dados Profissionais">
            <div className="grid grid-cols-2 gap-3">
              <Info label="Empresa" value={ficha.empresa_trabalha} />
              <Info label="Tel. comercial 1" value={ficha.tel_empresa_1} />
              <Info label="Tel. comercial 2" value={ficha.tel_empresa_2} />
              <Info label="Endereço do trabalho" value={ficha.endereco_trabalho} />
              <Info label="Endereço de correspondência" value={ficha.endereco_correspondencia} />
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {/* Valores */}
          <Card title="💰 Valores">
            <Info label="Valor da locação" value={`R$ ${formatCurrency(ficha.valor_locacao)}`} />
            <Info label="Valor do caução" value={`R$ ${formatCurrency(ficha.valor_caucao)}`} />
          </Card>

          {/* Datas */}
          <Card title="📅 Datas">
            <Info label="Entrega das chaves" value={fmtDateBR(ficha.data_prevista_entrega_chaves)} />
            <Info label="1° aluguel vence" value={fmtDateBR(ficha.data_primeiro_aluguel_vencimento)} />
          </Card>

          {/* Autorizações */}
          <Card title="✅ Autorizações LGPD">
            {[
              { key: 'autoriza_analise_documental', label: 'Análise documental' },
              { key: 'autoriza_proposta_analise_inclusa', label: 'Proposta análise inclusa' },
              { key: 'autoriza_correspondencias', label: 'Correspondências' },
            ].map(item => (
              <div key={item.key} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded flex items-center justify-center text-[10px] flex-shrink-0"
                  style={{
                    background: (ficha as any)[item.key] ? 'rgba(212,168,83,0.20)' : 'rgba(90,96,112,0.10)',
                    border: `1px solid ${(ficha as any)[item.key] ? '#D4A853' : 'rgba(90,96,112,0.25)'}`,
                    color: '#B8923A',
                  }}
                >
                  {(ficha as any)[item.key] ? '✓' : ''}
                </div>
                <span className="text-xs text-ink-secondary">{item.label}</span>
              </div>
            ))}
          </Card>

          {/* Imóvel */}
          {ficha.imovel && (
            <Card title="🏠 Imóvel">
              <Info label="Título" value={ficha.imovel.titulo} />
              <Info label="Endereço" value={ficha.imovel.endereco} />
            </Card>
          )}

          {/* Contrato */}
          {ficha.contrato_id && (
            <button
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
              onClick={() => navigate(`${base}/contratos/${ficha.contrato_id}`)}
            >
              <FileCheck size={15} /> Ver contrato vinculado
            </button>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
