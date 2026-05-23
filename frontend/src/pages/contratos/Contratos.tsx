import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, FileText, ArrowRight } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { EmptyState } from '@/components/common/EmptyState'
import { StatusBadge } from '@/components/common/StatusBadge'
import { contractService } from '@/services'
import type { Contract } from '@/types'
import { currency, fmtShortDate } from '@/lib/format'
import { useAuth } from '@/stores/auth'

export default function Contratos() {
  const [data, setData] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const navigate = useNavigate()
  const base = user?.role === 'corretor' ? '/corretor/contratos' : '/admin/contratos'

  useEffect(() => { contractService.list().then(setData).finally(() => setLoading(false)) }, [])
  return (
    <AppLayout>
      <PageHeader
        eyebrow="Documentacao"
        title="Contratos de locacao"
        description="Liste, gere e exporte contratos em PDF. Ao criar um contrato o imovel muda para alugado automaticamente."
        actions={<button className="btn-gold" onClick={() => navigate(`${base}/novo`)}><Plus size={16}/> Novo contrato</button>}
      />
      {loading ? <LoadingScreen /> : data.length === 0 ? (
        <EmptyState icon={<FileText size={24}/>} title="Nenhum contrato cadastrado" description="Crie um contrato a partir de um imovel disponivel." action={<button className="btn-primary" onClick={() => navigate(`${base}/novo`)}><Plus size={16}/> Novo contrato</button>} />
      ) : (
        <div className="card-premium overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-surface-muted text-ink-secondary uppercase text-[11px] tracking-wider">
              <th className="text-left px-4 py-3">Imovel</th>
              <th className="text-left px-4 py-3">Locatario</th>
              <th className="text-left px-4 py-3">Locador</th>
              <th className="text-right px-4 py-3">Aluguel</th>
              <th className="text-center px-4 py-3">Vigencia</th>
              <th className="text-center px-4 py-3">Status</th>
              <th className="text-right px-4 py-3"></th>
            </tr></thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id} className="border-t border-line hover:bg-surface-muted/40">
                  <td className="px-4 py-3"><div className="font-medium">{c.property?.titulo}</div><div className="text-xs text-ink-muted">{c.property?.bairro}</div></td>
                  <td className="px-4 py-3">{c.locatario?.nome}</td>
                  <td className="px-4 py-3">{c.locador?.nome}</td>
                  <td className="px-4 py-3 text-right font-medium">{currency(c.valor_aluguel)}</td>
                  <td className="px-4 py-3 text-center text-xs text-ink-secondary">{fmtShortDate(c.data_inicio)} → {fmtShortDate(c.data_fim)}</td>
                  <td className="px-4 py-3 text-center"><StatusBadge variant={c.status === 'ativo' ? 'success' : c.status === 'encerrado' ? 'neutral' : 'danger'}>{c.status}</StatusBadge></td>
                  <td className="px-4 py-3 text-right"><Link to={`${base}/${c.id}`} className="btn-outline">Detalhes <ArrowRight size={14}/></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  )
}
