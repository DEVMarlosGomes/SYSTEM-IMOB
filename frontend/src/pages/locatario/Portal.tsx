import { useEffect, useState } from 'react'
import { Copy, Phone, Upload, Building2, Mail, Download, MessageCircle, ExternalLink, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
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

function isImageUrl(url: string) {
  return /\.(png|jpe?g|webp|gif|bmp)(\?.*)?$/i.test(url)
}

function whatsappLink(phone: string) {
  const digits = phone.replace(/\D/g, '')
  const num = digits.startsWith('55') ? digits : `55${digits}`
  return `https://wa.me/${num}`
}

// ── 6-month payment bar chart ─────────────────────────────────────────────────
function PaymentHistoryChart({ payments }: { payments: Payment[] }) {
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    return d.toISOString().slice(0, 7) // YYYY-MM
  })

  const byMonth = Object.fromEntries(payments.map(p => [p.mes_referencia, p]))

  const color = (s?: string) => {
    if (!s) return 'rgba(226,221,214,0.6)'
    if (s === 'pago') return '#27AE60'
    if (s === 'atrasado' || s === 'rejeitado') return '#E53E3E'
    if (s === 'comprovante_enviado') return '#2E5F8A'
    return '#D4A853'
  }

  const label = (ym: string) => {
    const [y, m] = ym.split('-')
    const names = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
    return `${names[Number(m) - 1]}/${y.slice(2)}`
  }

  return (
    <div className="card-premium p-5">
      <h3 className="font-display text-lg text-ink mb-4">Histórico dos últimos 6 meses</h3>
      <div className="flex items-end gap-2 h-24">
        {months.map(ym => {
          const p = byMonth[ym]
          const filled = !!p
          return (
            <div key={ym} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-md transition-all"
                style={{
                  height: filled ? '72px' : '16px',
                  background: color(p?.status_locatario),
                  opacity: filled ? 1 : 0.35,
                }}
                title={p ? statusLocatarioLabel(p.status_locatario) : 'Sem registro'}
              />
              <span className="text-[10px] text-ink-muted">{label(ym)}</span>
            </div>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-3 mt-3 text-[11px] text-ink-secondary">
        {[['#27AE60','Pago'],['#D4A853','Pendente'],['#2E5F8A','Enviado'],['#E53E3E','Atrasado/Rejeitado']].map(([c,l]) => (
          <span key={l} className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: c }} />{l}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function LocatarioPortal() {
  const { user } = useAuth()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [property, setProperty] = useState<Property | null>(null)
  const [corretor, setCorretor] = useState<User | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

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
      toast.success('Comprovante enviado. Aguarde aprovação da imobiliária.')
      await load()
    } catch { toast.error('Falha no envio do comprovante.') }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => toast.success('Copiado!'))
  }

  if (loading) return <AppLayout><LoadingScreen /></AppLayout>

  return (
    <AppLayout>
      <PageHeader
        eyebrow={`Olá, ${user?.nome.split(' ')[0]}`}
        title="Seu portal de locação"
        description="Acompanhe seu imóvel, pague seu aluguel e fale com seu corretor."
      />
      {!property ? (
        <EmptyState icon={<Building2 size={24}/>} title="Nenhum imóvel vinculado ainda" description="Quando um contrato for criado, ele aparecerá aqui." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {/* Property card */}
            <div className="card-premium overflow-hidden">
              <div className="relative aspect-[16/9] bg-surface-muted">
                {property.fotos[0]
                  ? <img src={property.fotos[0]} alt={property.titulo} className="h-full w-full object-cover" />
                  : <div className="flex h-full items-center justify-center text-ink-muted">Sem fotos</div>}
              </div>
              <div className="p-5">
                <div className="text-xs uppercase tracking-wider text-gold-500 font-semibold mb-1">Meu imóvel</div>
                <h2 className="font-display text-2xl text-ink">{property.titulo}</h2>
                <p className="text-sm text-ink-secondary mt-1">{property.endereco} · {property.bairro} · {property.cidade}</p>
              </div>
            </div>

            {/* Payments list */}
            <div className="card-premium p-5">
              <h3 className="font-display text-lg text-ink mb-3">Meus pagamentos</h3>
              {payments.length === 0 ? <EmptyState description="Nenhum pagamento gerado ainda." /> : (
                <div className="divide-y divide-line">
                  {payments.map((p) => {
                    const rawUrl = p.comprovante_locatario_url
                    const fullUrl = rawUrl ? buildUploadUrl(rawUrl) : null
                    const isImg = fullUrl ? isImageUrl(fullUrl) : false
                    const canUpload = p.status_locatario === 'pendente' || p.status_locatario === 'atrasado' || p.status_locatario === 'rejeitado'

                    return (
                      <div key={p.id} className="py-4 space-y-2">
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-ink">{fmtMonth(p.mes_referencia)}</div>
                            <div className="text-xs text-ink-secondary">Vencimento: {fmtShortDate(p.data_vencimento)}</div>
                          </div>
                          <div className="font-semibold text-ink">{currency(p.valor)}</div>
                          <StatusBadge variant={variantForPaymentLocatario(p.status_locatario)}>
                            {statusLocatarioLabel(p.status_locatario)}
                          </StatusBadge>
                          {canUpload && (
                            <label className="btn-gold cursor-pointer flex items-center gap-1.5">
                              <Upload size={14}/> {p.status_locatario === 'rejeitado' ? 'Reenviar' : 'Enviar comprovante'}
                              <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden"
                                onChange={(e) => e.target.files?.[0] && onUpload(p, e.target.files[0])} />
                            </label>
                          )}
                          {fullUrl && !canUpload && (
                            <div className="flex items-center gap-1.5">
                              {isImg && (
                                <button className="btn-outline flex items-center gap-1" onClick={() => setPreviewUrl(fullUrl)}>
                                  <ExternalLink size={13}/> Ver
                                </button>
                              )}
                              <a href={fullUrl} download target="_blank" rel="noreferrer" className="btn-outline flex items-center gap-1">
                                <Download size={13}/> Baixar
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Motivo rejeição */}
                        {p.status_locatario === 'rejeitado' && p.motivo_rejeicao && (
                          <div className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs" style={{ background: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.25)', color: '#C53030' }}>
                            <AlertCircle size={13} className="mt-0.5 shrink-0" />
                            <span><strong>Motivo:</strong> {p.motivo_rejeicao}</span>
                          </div>
                        )}

                        {/* Inline image preview */}
                        {isImg && fullUrl && previewUrl === fullUrl && (
                          <div className="relative rounded-xl overflow-hidden border border-line" style={{ maxHeight: 220 }}>
                            <img src={fullUrl} alt="Comprovante" className="w-full object-contain" style={{ maxHeight: 220 }} />
                            <button
                              onClick={() => setPreviewUrl(null)}
                              className="absolute top-2 right-2 btn-ghost text-xs px-2 py-1"
                              style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}
                            >✕ Fechar</button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 6-month chart */}
            <PaymentHistoryChart payments={payments} />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {tenant?.chave_pix && (
              <div className="card-premium p-5 border-gold/40 bg-gradient-to-br from-gold/10 to-white">
                <div className="text-xs uppercase tracking-wider text-gold-600 font-semibold">Pague seu aluguel via PIX</div>
                <div className="text-sm text-ink-secondary mt-1">Chave PIX da imobiliária:</div>
                <div className="flex items-center justify-between gap-2 mt-2 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(212,168,83,0.25)' }}>
                  <code className="text-sm text-navy break-all">{tenant.chave_pix}</code>
                  <button onClick={() => copy(tenant.chave_pix!)} className="btn-outline"><Copy size={14}/></button>
                </div>
                <div className="text-xs text-ink-secondary mt-2">{tenant.nome}</div>
              </div>
            )}

            {corretor && (
              <div className="card-premium p-5">
                <div className="text-xs uppercase tracking-wider text-ink-muted mb-2">Seu corretor</div>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={corretor.nome} size={44}/>
                  <div>
                    <div className="font-medium text-ink">{corretor.nome}</div>
                    <div className="text-xs text-ink-secondary flex items-center gap-1"><Mail size={12}/> {corretor.email}</div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {corretor.telefone && (
                    <>
                      <a href={`tel:${corretor.telefone}`} className="btn-outline w-full justify-center flex items-center gap-2">
                        <Phone size={14}/> {maskPhone(corretor.telefone)}
                      </a>
                      <a
                        href={whatsappLink(corretor.telefone)}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-medium transition-all"
                        style={{ background: '#25D366', color: '#fff' }}
                      >
                        <MessageCircle size={14}/> WhatsApp
                      </a>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="card-premium p-5">
              <div className="text-xs uppercase tracking-wider text-ink-muted mb-2">Contato da imobiliária</div>
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
