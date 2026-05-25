import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, Key } from 'lucide-react'
import toast from 'react-hot-toast'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { StatusBadge } from '@/components/common/StatusBadge'
import { GerarContratoModal } from '@/components/contratos/GerarContratoModal'
import { TermoEntregaChavesModal } from '@/components/contratos/TermoEntregaChavesModal'
import { contractService } from '@/services'
import type { Contract } from '@/types'
import { currency, fmtShortDate } from '@/lib/format'
import { useAuth } from '@/stores/auth'

export default function ContratoDetalhes() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [encerrando, setEncerrando] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [termoOpen, setTermoOpen] = useState(false)

  useEffect(() => {
    if (id) contractService.get(id).then(setData).finally(() => setLoading(false))
  }, [id])

  async function encerrar() {
    if (!data) return
    if (!confirm('Encerrar este contrato? O imóvel voltará para disponível.')) return
    setEncerrando(true)
    try {
      await contractService.encerrar(data.id)
      toast.success('Contrato encerrado.')
      setData({ ...data, status: 'encerrado' })
    } finally { setEncerrando(false) }
  }

  if (loading) return <AppLayout><LoadingScreen /></AppLayout>
  if (!data) return <AppLayout><p className="text-ink-secondary">Contrato não encontrado.</p></AppLayout>

  const base = user?.role === 'corretor' ? '/corretor/contratos' : '/admin/contratos'

  return (
    <AppLayout>
      <button onClick={() => navigate(base)} className="btn-ghost mb-4 flex items-center gap-1.5">
        <ArrowLeft size={16} /> Voltar para contratos
      </button>

      <PageHeader
        eyebrow="Contrato"
        title={`Contrato · ${data.property?.titulo}`}
        description={`${fmtShortDate(data.data_inicio)} até ${fmtShortDate(data.data_fim)}`}
        actions={
          <>
            <StatusBadge variant={data.status === 'ativo' ? 'success' : 'neutral'}>{data.status}</StatusBadge>
            {(user?.role === 'admin' || user?.role === 'corretor') && (
              <>
                <button className="btn-gold flex items-center gap-2" onClick={() => setModalOpen(true)}>
                  <FileText size={16} /> Gerar Contrato PDF
                </button>
                <button className="btn-outline flex items-center gap-2" onClick={() => setTermoOpen(true)}>
                  <Key size={16} /> Termo de Chaves
                </button>
              </>
            )}
            {data.status === 'ativo' && (user?.role === 'admin' || user?.role === 'corretor') && (
              <button className="btn-danger" onClick={encerrar} disabled={encerrando}>
                {encerrando ? 'Encerrando…' : 'Encerrar contrato'}
              </button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card-premium p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Aluguel" value={currency(data.valor_aluguel)} />
            <Info label="Dia de vencimento" value={`Dia ${data.dia_vencimento}`} />
            <Info label="Índice de reajuste" value={data.indice_reajuste || '—'} />
            <Info label="Status" value={data.status} />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-ink-muted mb-1">Cláusulas</div>
            <p className="text-sm text-ink whitespace-pre-wrap">{data.clausulas || 'Sem cláusulas adicionais.'}</p>
          </div>
        </div>
        <div className="space-y-4">
          <Card title="Locatário">
            <div>{data.locatario?.nome}</div>
            <div className="text-xs text-ink-muted">{data.locatario?.email}</div>
          </Card>
          <Card title="Locador">
            <div>{data.locador?.nome}</div>
            <div className="text-xs text-ink-muted">{data.locador?.email}</div>
          </Card>
          <Card title="Corretor">
            <div>{data.corretor?.nome}</div>
            <div className="text-xs text-ink-muted">{data.corretor?.email}</div>
          </Card>
        </div>
      </div>

      {data && (
        <GerarContratoModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          contract={data}
        />
      )}
      {data && (
        <TermoEntregaChavesModal
          open={termoOpen}
          onClose={() => setTermoOpen(false)}
          contract={data}
        />
      )}
    </AppLayout>
  )
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-ink-muted">{label}</div>
      <div className="font-medium text-ink">{value}</div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: any }) {
  return (
    <div className="card-premium p-4">
      <div className="text-xs uppercase tracking-wider text-ink-muted mb-2">{title}</div>
      <div className="text-sm">{children}</div>
    </div>
  )
}
