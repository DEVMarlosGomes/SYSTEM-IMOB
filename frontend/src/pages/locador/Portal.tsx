import { useEffect, useState } from 'react'
import { Phone, Building2, MessageSquare, Download } from 'lucide-react'
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

const TAXA_IMOBILIARIA = 0.10

const PAYOUT_STEPS = [
  { key: 'em_esteira',      label: 'Em esteira' },
  { key: 'gerando_impostos', label: 'Gerando impostos' },
  { key: 'enviado',         label: 'Enviado' },
  { key: 'pago',            label: 'Pago' },
] as const

// Calculates next business day +N from a date string YYYY-MM-DD
function addBusinessDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + 'T12:00:00')
  let added = 0
  while (added < days) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() !== 0 && d.getDay() !== 6) added++
  }
  return d.toISOString().slice(0, 10)
}

function fmtDateBR(iso: string) {
  if (!iso) return '—'
  const [y, m, day] = iso.split('-')
  return `${day}/${m}/${y}`
}

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

  // Extrato para pagamento atual
  const bruto = current?.valor ?? 0
  const taxa = bruto * TAXA_IMOBILIARIA
  const impostos = 0 // reservado para futura configuração
  const liquido = bruto - taxa - impostos

  // Data prevista de crédito
  const dataCreditoISO = current?.data_repasse_prevista
    ?? (current?.data_pagamento ? addBusinessDays(current.data_pagamento, 5) : null)

  if (loading) return <AppLayout><LoadingScreen /></AppLayout>

  return (
    <AppLayout>
      <PageHeader
        eyebrow={`Olá, ${user?.nome.split(' ')[0]}`}
        title="Seu portal de proprietário"
        description="Acompanhe o status do seu repasse e fale em tempo real com a imobiliária."
      />
      {!property ? (
        <EmptyState icon={<Building2 size={24}/>} title="Nenhum imóvel cadastrado" description="Quando um corretor cadastrar seu imóvel, ele aparecerá aqui." />
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
                <p className="text-sm text-ink-secondary mt-1">{property.endereco} · {property.bairro}</p>
                <div className="mt-3 inline-flex items-center gap-2 text-sm">
                  <span className="text-ink-secondary">Aluguel mensal:</span>
                  <span className="font-semibold text-navy">{currency(property.valor_aluguel)}</span>
                </div>
              </div>
            </div>

            {/* Status repasse + 4-step progress */}
            {current && (
              <div className="card-premium p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg text-ink">Status do meu repasse</h3>
                  <StatusBadge variant={variantForPaymentLocador(current.status_locador)}>
                    {statusLocadorLabel(current.status_locador)}
                  </StatusBadge>
                </div>

                {/* 4-step progress bar */}
                <div>
                  <div className="flex items-center">
                    {PAYOUT_STEPS.map((s, i) => (
                      <div key={s.key} className="flex-1 flex items-center">
                        <div
                          className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                          style={i <= idx ? {
                            background: 'linear-gradient(135deg, #E1BD5C 0%, #D4A853 100%)',
                            color: '#1B3A5C',
                            boxShadow: '0 4px 12px rgba(212,168,83,0.40)',
                            border: '2px solid rgba(212,168,83,0.60)',
                          } : {
                            background: 'rgba(255,255,255,0.60)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            color: 'rgba(139,145,161,0.80)',
                            border: '2px solid rgba(226,221,214,0.70)',
                          }}
                        >{i + 1}</div>
                        {i < PAYOUT_STEPS.length - 1 && (
                          <div
                            className="flex-1 h-1 mx-1 rounded-full"
                            style={i < idx ? {
                              background: 'linear-gradient(90deg, #D4A853, #E1BD5C)',
                              boxShadow: '0 1px 4px rgba(212,168,83,0.30)',
                            } : { background: 'rgba(226,221,214,0.60)' }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center mt-2 text-[11px] text-ink-secondary">
                    {PAYOUT_STEPS.map((s) => (
                      <div key={s.key} className="flex-1 text-center">{s.label}</div>
                    ))}
                  </div>
                </div>

                {/* Info row */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs uppercase text-ink-muted">Mês</div>
                    <div className="font-medium">{fmtMonth(current.mes_referencia)}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-ink-muted">Previsão de crédito</div>
                    <div className="font-medium">
                      {dataCreditoISO ? fmtDateBR(dataCreditoISO) : 'Até 5 dias úteis após aprovação'}
                    </div>
                  </div>
                </div>

                {/* Extrato detalhado */}
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(226,221,214,0.7)' }}>
                  <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest" style={{ background: 'rgba(248,247,244,0.9)', color: '#B8923A', borderBottom: '1px solid rgba(226,221,214,0.6)' }}>
                    Extrato do repasse
                  </div>
                  <div className="divide-y" style={{ divideColor: 'rgba(226,221,214,0.5)' }}>
                    {[
                      { label: 'Aluguel bruto', value: bruto, bold: false },
                      { label: 'Taxa ImobVip (10%)', value: -taxa, bold: false, danger: true },
                      { label: 'Impostos', value: -impostos, bold: false, muted: true },
                      { label: 'Líquido a receber', value: liquido, bold: true },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between px-4 py-2.5 text-sm" style={{ background: 'rgba(255,255,255,0.6)' }}>
                        <span className={row.bold ? 'font-semibold text-ink' : 'text-ink-secondary'}>{row.label}</span>
                        <span className={row.bold ? 'font-bold text-navy' : row.danger ? 'text-danger' : 'text-ink-muted'}>
                          {row.danger || (!row.bold && row.value < 0) ? `-${currency(Math.abs(row.value))}` : currency(Math.abs(row.value))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Payment history */}
            <div className="card-premium p-5">
              <h3 className="font-display text-lg text-ink mb-3">Histórico de repasses</h3>
              {payments.length === 0 ? <EmptyState description="Sem histórico ainda." /> : (
                <div className="divide-y divide-line">
                  {payments.map((p) => {
                    const rawUrl = p.comprovante_locador_url
                    const fullUrl = rawUrl ? buildUploadUrl(rawUrl) : null
                    return (
                      <div key={p.id} className="py-3 flex flex-col md:flex-row md:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{fmtMonth(p.mes_referencia)}</div>
                          <div className="text-xs text-ink-secondary">Vencimento {fmtShortDate(p.data_vencimento)}</div>
                        </div>
                        <div className="font-semibold">{currency(p.valor)}</div>
                        <StatusBadge variant={variantForPaymentLocador(p.status_locador)}>
                          {statusLocadorLabel(p.status_locador)}
                        </StatusBadge>
                        {fullUrl && (
                          <a href={fullUrl} download target="_blank" rel="noreferrer" className="btn-outline flex items-center gap-1.5">
                            <Download size={13}/> Recibo
                          </a>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {corretor && (
              <div className="card-premium p-5">
                <div className="text-xs uppercase tracking-wider text-ink-muted mb-2">Corretor captador</div>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={corretor.nome} size={44}/>
                  <div>
                    <div className="font-medium">{corretor.nome}</div>
                    <div className="text-xs text-ink-secondary">{corretor.email}</div>
                  </div>
                </div>
                {corretor.telefone && (
                  <a href={`tel:${corretor.telefone}`} className="btn-outline w-full justify-center flex items-center gap-2">
                    <Phone size={14}/> {maskPhone(corretor.telefone)}
                  </a>
                )}
              </div>
            )}
            <Link to="/locador/chat" className="card-premium p-5 hover:shadow-modal transition block">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-navy text-white flex items-center justify-center">
                  <MessageSquare size={18}/>
                </div>
                <div>
                  <div className="font-medium">Conversar com a imobiliária</div>
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
