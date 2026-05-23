import { useEffect, useState } from 'react'
import { Copy, Phone, Upload, Building2, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { StatusBadge, variantForPaymentLocatario } from '@/components/common/StatusBadge'
import { paymentService, propertyService, tenantService, userService, uploadService } from '@/services'
import type { Payment, Property, Tenant, User } from '@/types'
import { useAuth } from '@/stores/auth'
import { currency, fmtMonth, fmtShortDate, maskPhone, statusLocatarioLabel } from '@/lib/format'
import { Avatar } from '@/components/common/Avatar'
import { EmptyState } from '@/components/common/EmptyState'
import { buildUploadUrl } from '@/lib/api'

export default function LocatarioPortal() {
  const { user } = useAuth()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [property, setProperty] = useState<Property | null>(null)
  const [corretor, setCorretor] = useState<User | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const [t, props, pays] = await Promise.all([
        tenantService.me(),
        propertyService.list(),
        paymentService.list(),
      ])
      setTenant(t)
      setProperty(props[0] || null)
      setPayments(pays)
      if (user?.corretor_id) {
        try { const c = await userService.get(user.corretor_id); setCorretor(c) } catch { /* ignore */ }
      }
    } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  async function onUpload(p: Payment, file: File) {
    try {
      const res = await uploadService.upload(file, 'comprovantes-locatario')
      await paymentService.uploadComprovante(p.id, res.url)
      toast.success('Comprovante enviado. Aguarde aprovacao da imobiliaria.')
      await load()
    } catch { toast.error('Falha no envio do comprovante.') }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => toast.success('Copiado!'))
  }

  if (loading) return <AppLayout><LoadingScreen /></AppLayout>

  return (
    <AppLayout>
      <PageHeader eyebrow={`Ola, ${user?.nome.split(' ')[0]}`} title="Seu portal de locacao" description="Acompanhe seu imovel, pague seu aluguel e fale com seu corretor." />
      {!property ? (
        <EmptyState icon={<Building2 size={24}/>} title="Nenhum imovel vinculado ainda" description="Quando um contrato for criado, ele aparecera aqui." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <div className="card-premium overflow-hidden">
              <div className="relative aspect-[16/9] bg-surface-muted">
                {property.fotos[0] ? <img src={property.fotos[0]} alt={property.titulo} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-ink-muted">Sem fotos</div>}
              </div>
              <div className="p-5">
                <div className="text-xs uppercase tracking-wider text-gold-500 font-semibold mb-1">Meu imovel</div>
                <h2 className="font-display text-2xl text-ink">{property.titulo}</h2>
                <p className="text-sm text-ink-secondary mt-1">{property.endereco} · {property.bairro} · {property.cidade}</p>
              </div>
            </div>

            <div className="card-premium p-5">
              <h3 className="font-display text-lg text-ink mb-3">Meus pagamentos</h3>
              {payments.length === 0 ? <EmptyState description="Nenhum pagamento gerado ainda." /> : (
                <div className="divide-y divide-line">
                  {payments.map((p) => (
                    <div key={p.id} className="py-3 flex flex-col md:flex-row md:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-ink">{fmtMonth(p.mes_referencia)}</div>
                        <div className="text-xs text-ink-secondary">Vencimento: {fmtShortDate(p.data_vencimento)}</div>
                      </div>
                      <div className="font-semibold text-ink">{currency(p.valor)}</div>
                      <StatusBadge variant={variantForPaymentLocatario(p.status_locatario)}>{statusLocatarioLabel(p.status_locatario)}</StatusBadge>
                      {(p.status_locatario === 'pendente' || p.status_locatario === 'atrasado') ? (
                        <label className="btn-gold cursor-pointer">
                          <Upload size={14}/> Enviar comprovante
                          <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(p, e.target.files[0])} data-testid={`upload-${p.id}`} />
                        </label>
                      ) : p.comprovante_locatario_url ? (
                        <a href={buildUploadUrl(p.comprovante_locatario_url)} target="_blank" rel="noreferrer" className="btn-outline">Ver comprovante</a>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {tenant?.chave_pix && (
              <div className="card-premium p-5 border-gold/40 bg-gradient-to-br from-gold/10 to-white">
                <div className="text-xs uppercase tracking-wider text-gold-600 font-semibold">Pague seu aluguel via PIX</div>
                <div className="text-sm text-ink-secondary mt-1">Chave PIX da imobiliaria:</div>
                <div className="flex items-center justify-between gap-2 mt-2 p-3 bg-white border border-gold/30 rounded-md">
                  <code className="text-sm text-navy break-all">{tenant.chave_pix}</code>
                  <button onClick={() => copy(tenant.chave_pix!)} className="btn-outline" data-testid="copy-pix"><Copy size={14}/></button>
                </div>
                <div className="text-xs text-ink-secondary mt-2">{tenant.nome}</div>
              </div>
            )}
            {corretor && (
              <div className="card-premium p-5">
                <div className="text-xs uppercase tracking-wider text-ink-muted mb-2">Seu corretor</div>
                <div className="flex items-center gap-3"><Avatar name={corretor.nome} size={44}/><div><div className="font-medium text-ink">{corretor.nome}</div><div className="text-xs text-ink-secondary flex items-center gap-1"><Mail size={12}/> {corretor.email}</div></div></div>
                {corretor.telefone && <a href={`tel:${corretor.telefone}`} className="mt-3 btn-outline w-full justify-center"><Phone size={14}/> {maskPhone(corretor.telefone)}</a>}
              </div>
            )}
            <div className="card-premium p-5">
              <div className="text-xs uppercase tracking-wider text-ink-muted mb-2">Contato da imobiliaria</div>
              <div className="text-sm font-medium text-ink">{tenant?.nome}</div>
              {tenant?.telefone && <div className="text-xs text-ink-secondary mt-1">{maskPhone(tenant.telefone)}</div>}
              {tenant?.endereco && <div className="text-xs text-ink-secondary mt-1">{tenant.endereco}</div>}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
