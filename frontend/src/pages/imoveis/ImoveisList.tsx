import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MapPin, BedDouble, Bath, Car, Maximize2, PawPrint, Sofa } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { EmptyState } from '@/components/common/EmptyState'
import { StatusBadge, variantForPropertyStatus } from '@/components/common/StatusBadge'
import { propertyService } from '@/services'
import type { Property, PropertyStatus, PropertyType } from '@/types'
import { useAuth } from '@/stores/auth'
import { currency, propertyTypeLabel } from '@/lib/format'
import { Avatar } from '@/components/common/Avatar'
import { STATUS_IMOVEL_OPTIONS, TIPO_IMOVEL_OPTIONS } from '@/lib/constants'
import { useDebounce } from '@/hooks/useDebounce'

export default function ImoveisList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search, 350)
  const [status, setStatus] = useState<PropertyStatus | ''>('')
  const [tipo, setTipo] = useState<PropertyType | ''>('')
  const [data, setData] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    propertyService
      .list({ search: debounced || undefined, status: status || undefined, tipo: tipo || undefined })
      .then(setData)
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, [debounced, status, tipo])

  const basePath = user?.role === 'admin' ? '/admin/imoveis' : '/corretor/imoveis'

  return (
    <AppLayout search={search} onSearch={setSearch} searchPlaceholder="Buscar por titulo, endereco, bairro…">
      <PageHeader
        eyebrow="Portfolio"
        title="Imoveis"
        description={user?.role === 'corretor' ? 'Suas listagens e dos demais corretores. Os dados do proprietario sao privados.' : 'Visao consolidada de todos os imoveis da imobiliaria.'}
        actions={
          (user?.role === 'corretor' || user?.role === 'admin') && (
            <button className="btn-gold" onClick={() => navigate(`${basePath}/novo`)} data-testid="new-property"><Plus size={16}/> Novo imovel</button>
          )
        }
      />

      {/* Filters */}
      <div className="card-premium p-4 mb-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <FilterChip label="Todos" active={!status} onClick={() => setStatus('')} />
          {STATUS_IMOVEL_OPTIONS.map((s) => (
            <FilterChip key={s.value} label={s.label} active={status === s.value} onClick={() => setStatus(status === s.value ? '' : (s.value as PropertyStatus))} />
          ))}
        </div>
        <div className="h-6 w-px bg-line hidden md:block" />
        <select className="input-premium max-w-[220px]" value={tipo} onChange={(e) => setTipo(e.target.value as any)}>
          <option value="">Todos os tipos</option>
          {TIPO_IMOVEL_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <div className="ml-auto text-xs text-ink-secondary">{data.length} imovel(is) encontrado(s)</div>
      </div>

      {loading ? (
        <LoadingScreen />
      ) : data.length === 0 ? (
        <EmptyState
          title="Nenhum imovel encontrado"
          description="Ajuste os filtros ou cadastre o primeiro imovel."
          action={(user?.role === 'corretor' || user?.role === 'admin') && (
            <button className="btn-primary" onClick={() => navigate(`${basePath}/novo`)}><Plus size={16}/> Cadastrar imovel</button>
          )}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {data.map((p) => (
            <PropertyCard key={p.id} property={p} basePath={basePath} />
          ))}
        </div>
      )}
    </AppLayout>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
      style={active ? {
        background: 'linear-gradient(135deg, #2E5F8A 0%, #1B3A5C 100%)',
        color: '#FFFFFF',
        border: '1px solid rgba(27,58,92,0.50)',
        boxShadow: '0 2px 8px rgba(27,58,92,0.20)',
      } : {
        background: 'rgba(255,255,255,0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        color: '#1A1A2E',
        border: '1px solid rgba(226,221,214,0.70)',
      }}
    >
      {label}
    </button>
  )
}

function PropertyCard({ property: p, basePath }: { property: Property; basePath: string }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(`${basePath}/${p.id}`)}
      className="card-premium overflow-hidden text-left hover:shadow-modal transition group"
      data-testid={`property-${p.id}`}
    >
      <div className="relative aspect-[4/3] bg-surface-muted overflow-hidden">
        {p.fotos?.[0] ? (
          <img src={p.fotos[0]} alt={p.titulo} className="h-full w-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-ink-muted">Sem foto</div>
        )}
        <div className="absolute top-3 left-3">
          <StatusBadge variant={variantForPropertyStatus(p.status)} className="shadow-soft">{p.status}</StatusBadge>
        </div>
        <div className="absolute bottom-3 right-3 bg-navy/85 text-white text-xs uppercase tracking-wider px-2 py-1 rounded-md">
          {propertyTypeLabel(p.tipo)}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg text-ink leading-tight line-clamp-1">{p.titulo}</h3>
        <div className="text-xs text-ink-secondary flex items-center gap-1 mt-1">
          <MapPin size={12} /> {[p.bairro, p.cidade].filter(Boolean).join(' · ') || p.endereco}
        </div>
        <div className="flex items-center gap-3 text-xs text-ink-secondary mt-3">
          {p.area_m2 && <span className="flex items-center gap-1"><Maximize2 size={12}/> {p.area_m2}m²</span>}
          {!!p.quartos && <span className="flex items-center gap-1"><BedDouble size={12}/> {p.quartos}</span>}
          {!!p.banheiros && <span className="flex items-center gap-1"><Bath size={12}/> {p.banheiros}</span>}
          {!!p.vagas && <span className="flex items-center gap-1"><Car size={12}/> {p.vagas}</span>}
          {p.aceita_pet && <span className="flex items-center gap-1 text-success"><PawPrint size={12}/> pet</span>}
          {p.mobiliado && <span className="flex items-center gap-1 text-gold-600"><Sofa size={12}/> mob</span>}
        </div>
        <div className="mt-4 flex items-end justify-between gap-2">
          <div>
            <div className="text-[11px] text-ink-muted uppercase">aluguel</div>
            <div className="font-display text-xl text-navy">{currency(p.valor_aluguel)}</div>
          </div>
          {p.corretor && (
            <div className="flex items-center gap-2 max-w-[140px]">
              <Avatar name={p.corretor.nome} src={p.corretor.avatar_url || undefined} size={28} />
              <div className="text-[11px] text-ink-secondary truncate">{p.corretor.nome.split(' ')[0]}</div>
            </div>
          )}
        </div>
      </div>
    </button>
  )
}
