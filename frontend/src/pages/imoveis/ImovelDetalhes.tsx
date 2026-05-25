import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, BedDouble, Bath, Car, Maximize2, PawPrint, Sofa, Edit, FileText, Lock, Phone, Mail } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { StatusBadge, variantForPropertyStatus } from '@/components/common/StatusBadge'
import { propertyService } from '@/services'
import type { Property } from '@/types'
import { useAuth } from '@/stores/auth'
import { Avatar } from '@/components/common/Avatar'
import { currency, propertyTypeLabel, maskCPF, maskPhone } from '@/lib/format'
import { buildUploadUrl } from '@/lib/api'

export default function ImovelDetalhes() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [photo, setPhoto] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    propertyService.get(id).then((p) => { setData(p); setPhoto(p.fotos?.[0] || null) }).catch(() => undefined).finally(() => setLoading(false))
  }, [id])

  if (loading) return <AppLayout><LoadingScreen /></AppLayout>
  if (!data) return <AppLayout><p className="text-ink-secondary">Imovel nao encontrado.</p></AppLayout>

  const basePath = user?.role === 'admin' ? '/admin/imoveis' : '/corretor/imoveis'
  const canEdit = user?.role === 'admin' || (user?.role === 'corretor' && data.corretor_id === user.id)
  const canSeeOwner = user?.role === 'admin' || (user?.role === 'corretor' && data.corretor_id === user.id)

  return (
    <AppLayout>
      <button onClick={() => navigate(basePath)} className="btn-ghost mb-4"><ArrowLeft size={16}/> Voltar para imoveis</button>
      <PageHeader
        eyebrow={propertyTypeLabel(data.tipo)}
        title={data.titulo}
        description={data.endereco + (data.bairro ? ` · ${data.bairro}` : '') + (data.cidade ? ` · ${data.cidade}` : '')}
        actions={
          <>
            <StatusBadge variant={variantForPropertyStatus(data.status)}>{data.status}</StatusBadge>
            {canEdit && <button className="btn-primary" onClick={() => navigate(`${basePath}/${data.id}/editar`)}><Edit size={16}/> Editar</button>}
            {canEdit && data.status === 'disponivel' && <button className="btn-gold" onClick={() => navigate('/admin/contratos/novo', { state: { property_id: data.id } })}><FileText size={16}/> Gerar contrato</button>}
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* gallery */}
          <div className="aspect-[16/10] bg-surface-muted rounded-xl overflow-hidden border border-line">
            {photo ? <img src={photo} alt={data.titulo} className="h-full w-full object-cover" /> : <div className="h-full flex items-center justify-center text-ink-muted">Sem fotos</div>}
          </div>
          {data.fotos.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {data.fotos.slice(0, 10).map((f, i) => (
                <button key={f + i} onClick={() => setPhoto(f)} className={`aspect-[4/3] rounded-md overflow-hidden border-2 ${photo === f ? 'border-gold' : 'border-line'}`}>
                  <img src={f} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          {data.descricao && (
            <div className="card-premium p-5">
              <h3 className="font-display text-lg text-ink mb-2">Descricao</h3>
              <p className="text-ink-secondary whitespace-pre-wrap">{data.descricao}</p>
            </div>
          )}
          <div className="card-premium p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Spec icon={<Maximize2 size={16}/>} label="Area" value={data.area_m2 ? `${data.area_m2} m²` : '-'} />
            <Spec icon={<BedDouble size={16}/>} label="Quartos" value={data.quartos ?? '-'} />
            <Spec icon={<Bath size={16}/>} label="Banheiros" value={data.banheiros ?? '-'} />
            <Spec icon={<Car size={16}/>} label="Vagas" value={data.vagas ?? '-'} />
            <Spec icon={<PawPrint size={16}/>} label="Aceita pet" value={data.aceita_pet ? 'Sim' : 'Nao'} />
            <Spec icon={<Sofa size={16}/>} label="Mobiliado" value={data.mobiliado ? 'Sim' : 'Nao'} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="card-premium p-5">
            <div className="text-xs uppercase tracking-wider text-ink-muted">Aluguel</div>
            <div className="font-display text-3xl text-navy mt-1">{currency(data.valor_aluguel)}</div>
            <div className="mt-2 text-sm text-ink-secondary space-y-1">
              <div>Condominio: {currency(data.valor_condominio || 0)}</div>
              <div>IPTU: {currency(data.valor_iptu || 0)}</div>
              <div className="pt-2 border-t border-line font-medium text-ink">Total: {currency((data.valor_aluguel || 0) + (data.valor_condominio || 0) + (data.valor_iptu || 0))}</div>
            </div>
          </div>
          {data.corretor && (
            <div className="card-premium p-5">
              <div className="text-xs uppercase tracking-wider text-ink-muted mb-2">Corretor responsavel</div>
              <div className="flex items-center gap-3">
                <Avatar name={data.corretor.nome} src={data.corretor.avatar_url || undefined} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-ink">{data.corretor.nome}</div>
                  <div className="text-xs text-ink-secondary">{data.corretor.email}</div>
                </div>
              </div>
              {data.corretor.telefone && (
                <a href={`tel:${data.corretor.telefone}`} className="mt-3 btn-outline w-full justify-center"><Phone size={14}/> {maskPhone(data.corretor.telefone)}</a>
              )}
            </div>
          )}
          <div className="card-premium p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs uppercase tracking-wider text-ink-muted">Ficha do proprietario</div>
              <Lock size={14} className="text-gold-500" />
            </div>
            {canSeeOwner && data.owner_profile ? (
              <ul className="space-y-1.5 text-sm">
                <li><span className="text-ink-muted">Nome:</span> <span className="text-ink font-medium">{data.owner_profile.nome}</span></li>
                {data.owner_profile.cpf && <li><span className="text-ink-muted">CPF:</span> {maskCPF(data.owner_profile.cpf)}</li>}
                {data.owner_profile.telefone && <li><span className="text-ink-muted">Telefone:</span> {maskPhone(data.owner_profile.telefone)}</li>}
                {data.owner_profile.email && <li><span className="text-ink-muted">E-mail:</span> {data.owner_profile.email}</li>}
                {data.owner_profile.banco && <li><span className="text-ink-muted">Banco:</span> {data.owner_profile.banco} · ag. {data.owner_profile.agencia} · cc. {data.owner_profile.conta}</li>}
                {data.owner_profile.pix && <li><span className="text-ink-muted">PIX:</span> {data.owner_profile.pix}</li>}
              </ul>
            ) : (
              <div className="text-xs text-ink-secondary">
                {data.owner_profile_id ? 'Os dados do proprietario sao privados a este corretor.' : 'Sem ficha de proprietario cadastrada ainda.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

function Spec({ icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(226,221,214,0.65)' }}>
      <div className="h-8 w-8 rounded-md bg-navy-50 text-navy flex items-center justify-center">{icon}</div>
      <div>
        <div className="text-[11px] uppercase text-ink-muted">{label}</div>
        <div className="text-sm font-medium text-ink">{value}</div>
      </div>
    </div>
  )
}
