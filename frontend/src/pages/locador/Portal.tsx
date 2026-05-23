import { useEffect, useState } from 'react'
import { Phone, Building2, MessageSquare } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { EmptyState } from '@/components/common/EmptyState'
import { paymentService, propertyService, userService } from '@/services'
import type { Payment, Property, User } from '@/types'
import { useAuth } from '@/stores/auth'
import { Avatar } from '@/components/common/Avatar'
import { currency, fmtMonth, fmtShortDate, maskPhone, statusLocadorLabel } from '@/lib/format'
import { StatusBadge, variantForPaymentLocador } from '@/components/common/StatusBadge'
import { buildUploadUrl } from '@/lib/api'

const PAYOUT_STEPS = [
  { key: 'em_esteira', label: 'Em esteira' },
  { key: 'gerando_impostos', label: 'Gerando impostos' },
  { key: 'pago', label: 'Pago' },
] as const

export default function LocadorPortal() {
  const { user } = useAuth()
  const [property, setProperty] = useState<Property | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [corretor, setCorretor] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([propertyService.list(), paymentService.list()]).then(async ([p, pays]) => {
      setProperty(p[0] || null)
      setPayments(pays)
      if (user?.corretor_id) { try { setCorretor(await userService.get(user.corretor_id)) } catch { /* ignore */ } }
    }).finally(() => setLoading(false))
  }, [user?.corretor_id])

  const current = payments.find((p) => p.status_locador !== 'pago') || payments[payments.length - 1]
  const idx = current ? PAYOUT_STEPS.findIndex((s) => s.key === current.status_locador) : -1

  if (loading) return <AppLayout><LoadingScreen /></AppLayout>

  return (
    <AppLayout>
      <PageHeader eyebrow={`Ola, ${user?.nome.split(' ')[0]}`} title="Seu portal de proprietario" description="Acompanhe o status do seu repasse e fale em tempo real com a imobiliaria." />
      {!property ? (
        <EmptyState icon={<Building2 size={24}/>} title="Nenhum imovel cadastrado" description="Quando um corretor cadastrar seu imovel, ele aparecera aqui." />
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
                <p className="text-sm text-ink-secondary mt-1">{property.endereco} · {property.bairro}</p>
                <div className="mt-3 inline-flex items-center gap-2 text-sm"><span className="text-ink-secondary">Aluguel mensal:</span><span className="font-semibold text-navy">{currency(property.valor_aluguel)}</span></div>
              </div>
            </div>

            {current && (
              <div className="card-premium p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg text-ink">Status do meu repasse</h3>
                  <StatusBadge variant={variantForPaymentLocador(current.status_locador)}>{statusLocadorLabel(current.status_locador)}</StatusBadge>
                </div>
                {/* progress */}
                <div className="flex items-center justify-between">
                  {PAYOUT_STEPS.map((s, i) => (
                    <div key={s.key} className="flex-1 flex items-center">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold border-2 ${i <= idx ? 'bg-navy text-white border-navy' : 'bg-white text-ink-muted border-line'}`}>{i + 1}</div>
                      {i < PAYOUT_STEPS.length - 1 && <div className={`flex-1 h-1 mx-1 rounded ${i < idx ? 'bg-navy' : 'bg-line'}`} />}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-ink-secondary">
                  {PAYOUT_STEPS.map((s) => <div key={s.key} className="flex-1 text-center">{s.label}</div>)}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div><div className="text-xs uppercase text-ink-muted">Mes</div><div className="font-medium">{fmtMonth(current.mes_referencia)}</div></div>
                  <div><div className="text-xs uppercase text-ink-muted">Previsao de credito</div><div className="font-medium">{current.data_repasse_prevista ? fmtShortDate(current.data_repasse_prevista) : 'ate 5 dias uteis'}</div></div>
                </div>
              </div>
            )}

            <div className="card-premium p-5">
              <h3 className="font-display text-lg text-ink mb-3">Historico de repasses</h3>
              {payments.length === 0 ? <EmptyState description="Sem historico ainda." /> : (
                <div className="divide-y divide-line">
                  {payments.map((p) => (
                    <div key={p.id} className="py-3 flex flex-col md:flex-row md:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{fmtMonth(p.mes_referencia)}</div>
                        <div className="text-xs text-ink-secondary">Vencimento {fmtShortDate(p.data_vencimento)}</div>
                      </div>
                      <div className="font-semibold">{currency(p.valor)}</div>
                      <StatusBadge variant={variantForPaymentLocador(p.status_locador)}>{statusLocadorLabel(p.status_locador)}</StatusBadge>
                      {p.comprovante_locador_url && <a href={buildUploadUrl(p.comprovante_locador_url)} target="_blank" rel="noreferrer" className="btn-outline">Recibo</a>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {corretor && (
              <div className="card-premium p-5">
                <div className="text-xs uppercase tracking-wider text-ink-muted mb-2">Corretor captador</div>
                <div className="flex items-center gap-3"><Avatar name={corretor.nome} size={44}/><div><div className="font-medium">{corretor.nome}</div><div className="text-xs text-ink-secondary">{corretor.email}</div></div></div>
                {corretor.telefone && <a href={`tel:${corretor.telefone}`} className="mt-3 btn-outline w-full justify-center"><Phone size={14}/> {maskPhone(corretor.telefone)}</a>}
              </div>
            )}
            <Link to="/locador/chat" className="card-premium p-5 hover:shadow-modal transition block">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-navy text-white flex items-center justify-center"><MessageSquare size={18}/></div>
                <div>
                  <div className="font-medium">Conversar com a imobiliaria</div>
                  <div className="text-xs text-ink-secondary">Chat em tempo real</div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
