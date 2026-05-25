import { useState, useEffect, ReactNode, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp, Plus, Trash2, Save, AlertCircle, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { fichaLocatarioService, propertyService } from '@/services'
import { useAuth } from '@/stores/auth'
import type { FichaLocatario, ClienteFicha, ReferenciaFicha } from '@/types/locatario.types'
import { ESTADO_CIVIL_OPTIONS, REFERENCIAS_LABELS } from '@/types/locatario.types'
import {
  validarCPF, maskCPF, maskPhone, maskCurrency, parseCurrency,
  validarNomeCompleto, formatCurrency,
} from '@/lib/validations'
import type { Property } from '@/types'
import { cn } from '@/lib/utils'

// ── Sub-components (module-level — stable identity) ──────────────────────────

function SectionCard({
  title, icon, children, collapsible, defaultOpen = true,
}: {
  title: string
  icon: string
  children: ReactNode
  collapsible?: boolean
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.60)',
        boxShadow: '0 2px 12px rgba(15,34,56,0.06)',
      }}
    >
      <button
        type="button"
        className={cn(
          'w-full flex items-center justify-between px-5 py-4 text-left',
          collapsible && 'cursor-pointer',
        )}
        style={{ borderBottom: open ? '1px solid rgba(226,221,214,0.55)' : 'none' }}
        onClick={() => collapsible && setOpen(v => !v)}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="font-semibold text-ink text-sm uppercase tracking-wide">{title}</span>
        </div>
        {collapsible && (
          open ? <ChevronUp size={16} className="text-ink-muted" /> : <ChevronDown size={16} className="text-ink-muted" />
        )}
      </button>
      {open && <div className="px-5 py-4">{children}</div>}
    </div>
  )
}

function Label({ children, required }: { children: string; required?: boolean }) {
  return (
    <label className="block text-[11px] uppercase tracking-wider text-ink-muted font-medium mb-1">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <div className="flex items-center gap-1 mt-1">
      <AlertCircle size={11} className="text-red-500 flex-shrink-0" />
      <span className="text-[11px] text-red-500">{msg}</span>
    </div>
  )
}

function Input({
  value, onChange, placeholder, type = 'text', error, className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  error?: string
  className?: string
}) {
  return (
    <div className={className}>
      <input
        type={type}
        className={cn(
          'input-premium text-sm py-2 w-full',
          error && 'border-red-300 bg-red-50/30',
        )}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
      />
      <FieldError msg={error} />
    </div>
  )
}

// ── Cliente block ─────────────────────────────────────────────────────────────

interface ClienteErrors {
  cpf?: string
  nome_completo?: string
  rg?: string
  email?: string
  profissao?: string
}

function ClienteBlock({
  num, data, onChange, errors, showEndereco,
}: {
  num: 1 | 2
  data: ClienteFicha
  onChange: (d: Partial<ClienteFicha>) => void
  errors: ClienteErrors
  showEndereco?: boolean
}) {
  function handleCPF(raw: string) {
    onChange({ cpf: maskCPF(raw) })
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label required>CPF</Label>
          <input
            className={cn('input-premium text-sm py-2 w-full', errors.cpf && 'border-red-300 bg-red-50/30')}
            value={data.cpf}
            onChange={e => handleCPF(e.target.value)}
            placeholder="000.000.000-00"
            maxLength={14}
          />
          <FieldError msg={errors.cpf} />
        </div>
        <div>
          <Label required>Nome completo {num === 1 ? '(sem abreviações)' : ''}</Label>
          <input
            className={cn('input-premium text-sm py-2 w-full', errors.nome_completo && 'border-red-300 bg-red-50/30')}
            value={data.nome_completo}
            onChange={e => onChange({ nome_completo: e.target.value })}
            placeholder="Nome completo sem abreviações"
          />
          <FieldError msg={errors.nome_completo} />
        </div>
        <div>
          <Label required>Estado civil</Label>
          <select
            className="input-premium text-sm py-2 w-full"
            value={data.estado_civil}
            onChange={e => onChange({ estado_civil: e.target.value })}
          >
            <option value="">Selecione…</option>
            {ESTADO_CIVIL_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <Label required>RG</Label>
          <input
            className={cn('input-premium text-sm py-2 w-full', errors.rg && 'border-red-300 bg-red-50/30')}
            value={data.rg}
            onChange={e => onChange({ rg: e.target.value })}
            placeholder="RG"
          />
          <FieldError msg={errors.rg} />
        </div>
        <div>
          <Label required>E-mail</Label>
          <input
            type="email"
            className={cn('input-premium text-sm py-2 w-full', errors.email && 'border-red-300 bg-red-50/30')}
            value={data.email}
            onChange={e => onChange({ email: e.target.value })}
            placeholder="email@exemplo.com"
          />
          <FieldError msg={errors.email} />
        </div>
        <div>
          <Label required>Profissão</Label>
          <input
            className={cn('input-premium text-sm py-2 w-full', errors.profissao && 'border-red-300 bg-red-50/30')}
            value={data.profissao}
            onChange={e => onChange({ profissao: e.target.value })}
            placeholder="Ex: Engenheiro, Professora"
          />
          <FieldError msg={errors.profissao} />
        </div>
      </div>
      {showEndereco && (
        <div>
          <Label>Endereço residencial atual</Label>
          <input
            className="input-premium text-sm py-2 w-full"
            value={data.endereco ?? ''}
            onChange={e => onChange({ endereco: e.target.value })}
            placeholder="Rua, número, bairro, cidade"
          />
        </div>
      )}
    </div>
  )
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const emptyCliente = (): ClienteFicha => ({
  cpf: '', nome_completo: '', estado_civil: '', rg: '', email: '', profissao: '',
})

const emptyRefs = (): ReferenciaFicha[] =>
  REFERENCIAS_LABELS.map(r => ({ label: r.key, nome: '', telefone: '' }))

// ── Main form ─────────────────────────────────────────────────────────────────

interface Props {
  /** If provided, we are editing an existing ficha */
  initial?: FichaLocatario
  onSaved?: (ficha: FichaLocatario) => void
}

export function FichaLocatarioForm({ initial, onSaved }: Props) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [imoveis, setImoveis] = useState<Property[]>([])
  const [hasCliente2, setHasCliente2] = useState(!!initial?.cliente2)

  // ── Form state
  const [condominio, setCondominio] = useState(initial?.condominio ?? '')
  const [unidade, setUnidade] = useState(initial?.unidade ?? '')
  const [imovelId, setImovelId] = useState(initial?.imovel_id ?? '')
  const [cliente1, setCliente1] = useState<ClienteFicha>(initial?.cliente1 ?? emptyCliente())
  const [cliente2, setCliente2] = useState<ClienteFicha>(initial?.cliente2 ?? emptyCliente())
  const [refs, setRefs] = useState<ReferenciaFicha[]>(initial?.referencias?.length ? initial.referencias : emptyRefs())
  const [empresa, setEmpresa] = useState(initial?.empresa_trabalha ?? '')
  const [endTrabalho, setEndTrabalho] = useState(initial?.endereco_trabalho ?? '')
  const [tel1, setTel1] = useState(initial?.tel_empresa_1 ?? '')
  const [tel2, setTel2] = useState(initial?.tel_empresa_2 ?? '')
  const [endCorr, setEndCorr] = useState(initial?.endereco_correspondencia ?? '')
  const [valorLocacaoStr, setValorLocacaoStr] = useState(
    initial?.valor_locacao ? formatCurrency(initial.valor_locacao) : ''
  )
  const [valorCaucaoStr, setValorCaucaoStr] = useState(
    initial?.valor_caucao ? formatCurrency(initial.valor_caucao) : ''
  )
  const [dtChaves, setDtChaves] = useState(initial?.data_prevista_entrega_chaves ?? '')
  const [dtAluguel, setDtAluguel] = useState(initial?.data_primeiro_aluguel_vencimento ?? '')
  const [autorizaDoc, setAutorizaDoc] = useState(initial?.autoriza_analise_documental ?? false)
  const [autorizaProp, setAutorizaProp] = useState(initial?.autoriza_proposta_analise_inclusa ?? false)
  const [autorizaCorr, setAutorizaCorr] = useState(initial?.autoriza_correspondencias ?? false)

  // ── Errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Auto-suggest caução = 2x locação
  useEffect(() => {
    const locacao = parseCurrency(valorLocacaoStr)
    if (locacao > 0 && !valorCaucaoStr) {
      setValorCaucaoStr(formatCurrency(locacao * 2))
    }
  }, [valorLocacaoStr]) // eslint-disable-line

  // Load available properties for this corretor
  useEffect(() => {
    propertyService.list({ status: 'disponivel' }).then(setImoveis).catch(() => undefined)
  }, [])

  // ── Validation ────────────────────────────────────────────────────────────

  function validateCliente(c: ClienteFicha, prefix: string): boolean {
    const e: Record<string, string> = {}
    if (!validarCPF(c.cpf)) e[`${prefix}.cpf`] = 'CPF inválido'
    const nomeErr = validarNomeCompleto(c.nome_completo)
    if (nomeErr) e[`${prefix}.nome_completo`] = nomeErr
    if (!c.rg.trim()) e[`${prefix}.rg`] = 'RG obrigatório'
    if (!c.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e[`${prefix}.email`] = 'E-mail inválido'
    if (!c.profissao.trim() || c.profissao.trim().length < 2) e[`${prefix}.profissao`] = 'Profissão obrigatória'
    return Object.keys(e).length === 0 ? true : (setErrors(prev => ({ ...prev, ...e })), false)
  }

  function validate(): boolean {
    setErrors({})
    let ok = true
    if (!condominio.trim()) { setErrors(p => ({ ...p, condominio: 'Informe o condomínio' })); ok = false }
    if (!unidade.trim()) { setErrors(p => ({ ...p, unidade: 'Informe a unidade' })); ok = false }
    if (!validateCliente(cliente1, 'c1')) ok = false
    if (hasCliente2 && !validateCliente(cliente2, 'c2')) ok = false
    const temRef = refs.some(r => r.nome.trim() && r.telefone.trim())
    if (!temRef) { setErrors(p => ({ ...p, refs: 'Informe ao menos 1 referência' })); ok = false }
    if (!empresa.trim()) { setErrors(p => ({ ...p, empresa: 'Informe a empresa' })); ok = false }
    if (!endTrabalho.trim()) { setErrors(p => ({ ...p, endTrabalho: 'Informe o endereço de trabalho' })); ok = false }
    if (!tel1.trim()) { setErrors(p => ({ ...p, tel1: 'Informe o telefone da empresa' })); ok = false }
    if (!endCorr.trim()) { setErrors(p => ({ ...p, endCorr: 'Informe o endereço de correspondência' })); ok = false }
    if (parseCurrency(valorLocacaoStr) <= 0) { setErrors(p => ({ ...p, locacao: 'Informe o valor da locação' })); ok = false }
    if (parseCurrency(valorCaucaoStr) <= 0) { setErrors(p => ({ ...p, caucao: 'Informe o valor do caução' })); ok = false }
    if (!dtChaves) { setErrors(p => ({ ...p, dtChaves: 'Informe a data prevista de entrega' })); ok = false }
    if (!dtAluguel) { setErrors(p => ({ ...p, dtAluguel: 'Informe a data do 1° aluguel' })); ok = false }
    if (!autorizaDoc && !autorizaProp && !autorizaCorr) {
      setErrors(p => ({ ...p, lgpd: 'Marque ao menos uma autorização para prosseguir' })); ok = false
    }
    return ok
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) {
      toast.error('Corrija os erros antes de salvar.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        imovel_id: imovelId || null,
        condominio,
        unidade,
        cliente1,
        cliente2: hasCliente2 ? cliente2 : null,
        referencias: refs.filter(r => r.nome.trim()),
        empresa_trabalha: empresa,
        endereco_trabalho: endTrabalho,
        tel_empresa_1: tel1,
        tel_empresa_2: tel2 || null,
        endereco_correspondencia: endCorr,
        valor_locacao: parseCurrency(valorLocacaoStr),
        valor_caucao: parseCurrency(valorCaucaoStr),
        autoriza_analise_documental: autorizaDoc,
        autoriza_proposta_analise_inclusa: autorizaProp,
        autoriza_correspondencias: autorizaCorr,
        data_prevista_entrega_chaves: dtChaves,
        data_primeiro_aluguel_vencimento: dtAluguel,
      }

      let saved: FichaLocatario
      if (initial?.id) {
        saved = await fichaLocatarioService.update(initial.id, payload)
      } else {
        saved = await fichaLocatarioService.create(payload as any)
      }

      toast.success('✅ Ficha do inquilino cadastrada!')
      onSaved?.(saved)

      // Prompt for contract generation
      const gerarContrato = window.confirm('Deseja gerar o contrato de locação agora?')
      if (gerarContrato) {
        const base = user?.role === 'corretor' ? '/corretor' : '/admin'
        navigate(`${base}/contratos/novo`)
      } else {
        const base = user?.role === 'corretor' ? '/corretor' : '/admin'
        navigate(`${base}/fichas-locatario`)
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? 'Erro ao salvar ficha.')
    } finally {
      setSaving(false)
    }
  }

  // ── Ref helpers ───────────────────────────────────────────────────────────

  function updateRef(i: number, field: 'nome' | 'telefone', value: string) {
    setRefs(prev => prev.map((r, idx) =>
      idx === i ? { ...r, [field]: field === 'telefone' ? maskPhone(value) : value } : r
    ))
  }

  const caucaoSugerido = parseCurrency(valorLocacaoStr) * 2

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">

      {/* ── CABEÇALHO ── */}
      <SectionCard title="Ficha Inquilino" icon="🏠">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label required>Condomínio / Empreendimento</Label>
            <input
              className={cn('input-premium text-sm py-2 w-full', errors.condominio && 'border-red-300')}
              value={condominio}
              onChange={e => setCondominio(e.target.value)}
              placeholder="Ex: Res. das Palmeiras"
            />
            <FieldError msg={errors.condominio} />
          </div>
          <div>
            <Label required>Unidade</Label>
            <input
              className={cn('input-premium text-sm py-2 w-full', errors.unidade && 'border-red-300')}
              value={unidade}
              onChange={e => setUnidade(e.target.value)}
              placeholder="Ex: Apto 201, Casa 3"
            />
            <FieldError msg={errors.unidade} />
          </div>
          <div>
            <Label>Corretor responsável</Label>
            <input className="input-premium text-sm py-2 w-full bg-surface-muted" value={user?.nome ?? ''} readOnly />
          </div>
          <div>
            <Label>Imóvel vinculado (opcional)</Label>
            <select
              className="input-premium text-sm py-2 w-full"
              value={imovelId}
              onChange={e => setImovelId(e.target.value)}
            >
              <option value="">— Selecione —</option>
              {imoveis.map(p => (
                <option key={p.id} value={p.id}>{p.titulo} — {p.endereco}</option>
              ))}
            </select>
          </div>
        </div>
      </SectionCard>

      {/* ── CLIENTE 1 ── */}
      <SectionCard title="Cliente 1 (Inquilino Principal)" icon="👤">
        <ClienteBlock
          num={1}
          data={cliente1}
          onChange={d => setCliente1(p => ({ ...p, ...d }))}
          errors={{
            cpf: errors['c1.cpf'],
            nome_completo: errors['c1.nome_completo'],
            rg: errors['c1.rg'],
            email: errors['c1.email'],
            profissao: errors['c1.profissao'],
          }}
        />
      </SectionCard>

      {/* ── CLIENTE 2 ── */}
      <SectionCard title="Cliente 2 (Segundo Inquilino)" icon="👤" collapsible defaultOpen={hasCliente2}>
        {!hasCliente2 ? (
          <button
            type="button"
            className="btn-outline flex items-center gap-2 text-sm"
            onClick={() => setHasCliente2(true)}
          >
            <Plus size={15} /> Adicionar segundo inquilino
          </button>
        ) : (
          <div className="space-y-4">
            <ClienteBlock
              num={2}
              data={cliente2}
              onChange={d => setCliente2(p => ({ ...p, ...d }))}
              errors={{
                cpf: errors['c2.cpf'],
                nome_completo: errors['c2.nome_completo'],
                rg: errors['c2.rg'],
                email: errors['c2.email'],
                profissao: errors['c2.profissao'],
              }}
              showEndereco
            />
            <button
              type="button"
              className="btn-ghost text-sm flex items-center gap-1.5 text-red-500 hover:text-red-600"
              onClick={() => { setHasCliente2(false); setCliente2(emptyCliente()) }}
            >
              <Trash2 size={13} /> Remover segundo inquilino
            </button>
          </div>
        )}
      </SectionCard>

      {/* ── REFERÊNCIAS ── */}
      <SectionCard title="Referências Pessoais" icon="📋">
        {errors.refs && (
          <div className="mb-3 text-xs text-red-500 flex items-center gap-1">
            <AlertCircle size={12} /> {errors.refs}
          </div>
        )}
        <div className="space-y-3">
          {REFERENCIAS_LABELS.map((rl, i) => (
            <div key={rl.key} className="grid grid-cols-2 gap-3 items-end">
              <div>
                <Label>{rl.label}</Label>
                <input
                  className="input-premium text-sm py-2 w-full"
                  value={refs[i]?.nome ?? ''}
                  onChange={e => updateRef(i, 'nome', e.target.value)}
                  placeholder="Nome"
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <input
                  className="input-premium text-sm py-2 w-full"
                  value={refs[i]?.telefone ?? ''}
                  onChange={e => updateRef(i, 'telefone', e.target.value)}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── DADOS PROFISSIONAIS ── */}
      <SectionCard title="Dados Profissionais" icon="💼">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label required>Empresa onde trabalha</Label>
            <input
              className={cn('input-premium text-sm py-2 w-full', errors.empresa && 'border-red-300')}
              value={empresa}
              onChange={e => setEmpresa(e.target.value)}
              placeholder="Razão social da empresa"
            />
            <FieldError msg={errors.empresa} />
          </div>
          <div>
            <Label required>Tel. comercial 1</Label>
            <input
              className={cn('input-premium text-sm py-2 w-full', errors.tel1 && 'border-red-300')}
              value={tel1}
              onChange={e => setTel1(maskPhone(e.target.value))}
              placeholder="(00) 0000-0000"
              maxLength={15}
            />
            <FieldError msg={errors.tel1} />
          </div>
          <div>
            <Label>Tel. comercial 2 (opcional)</Label>
            <input
              className="input-premium text-sm py-2 w-full"
              value={tel2}
              onChange={e => setTel2(maskPhone(e.target.value))}
              placeholder="(00) 0000-0000"
              maxLength={15}
            />
          </div>
          <div className="sm:col-span-2">
            <Label required>Endereço do trabalho</Label>
            <input
              className={cn('input-premium text-sm py-2 w-full', errors.endTrabalho && 'border-red-300')}
              value={endTrabalho}
              onChange={e => setEndTrabalho(e.target.value)}
              placeholder="Rua, número, bairro, cidade"
            />
            <FieldError msg={errors.endTrabalho} />
          </div>
          <div className="sm:col-span-2">
            <Label required>Endereço de correspondência</Label>
            <input
              className={cn('input-premium text-sm py-2 w-full', errors.endCorr && 'border-red-300')}
              value={endCorr}
              onChange={e => setEndCorr(e.target.value)}
              placeholder="Onde enviar correspondências e encomendas"
            />
            <FieldError msg={errors.endCorr} />
          </div>
        </div>
      </SectionCard>

      {/* ── VALORES ── */}
      <SectionCard title="Valores da Locação" icon="💰">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label required>Valor da locação</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-muted font-medium">R$</span>
              <input
                className={cn('input-premium text-sm py-2 pl-9 w-full', errors.locacao && 'border-red-300')}
                value={valorLocacaoStr}
                onChange={e => setValorLocacaoStr(maskCurrency(e.target.value))}
                placeholder="0,00"
              />
            </div>
            <FieldError msg={errors.locacao} />
          </div>
          <div>
            <Label required>Valor do caução</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-muted font-medium">R$</span>
              <input
                className={cn('input-premium text-sm py-2 pl-9 w-full', errors.caucao && 'border-red-300')}
                value={valorCaucaoStr}
                onChange={e => setValorCaucaoStr(maskCurrency(e.target.value))}
                placeholder="0,00"
              />
            </div>
            <FieldError msg={errors.caucao} />
            {caucaoSugerido > 0 && (
              <div
                className="mt-1.5 text-[11px] flex items-center gap-1 px-2 py-1 rounded-lg"
                style={{ background: 'rgba(212,168,83,0.10)', color: '#B8923A' }}
              >
                <CheckCircle2 size={11} />
                Caução sugerido: R$ {formatCurrency(caucaoSugerido)} (equivalente a 2 meses)
                {parseCurrency(valorCaucaoStr) !== caucaoSugerido && (
                  <button
                    type="button"
                    className="ml-auto underline text-[10px]"
                    onClick={() => setValorCaucaoStr(formatCurrency(caucaoSugerido))}
                  >
                    Usar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ── DATAS ── */}
      <SectionCard title="Datas do Contrato" icon="📅">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label required>Data prevista de entrega das chaves</Label>
            <input
              type="date"
              className={cn('input-premium text-sm py-2 w-full', errors.dtChaves && 'border-red-300')}
              value={dtChaves}
              min={new Date().toISOString().slice(0, 10)}
              onChange={e => setDtChaves(e.target.value)}
            />
            <FieldError msg={errors.dtChaves} />
          </div>
          <div>
            <Label required>1° aluguel vence em</Label>
            <input
              type="date"
              className={cn('input-premium text-sm py-2 w-full', errors.dtAluguel && 'border-red-300')}
              value={dtAluguel}
              min={new Date().toISOString().slice(0, 10)}
              onChange={e => setDtAluguel(e.target.value)}
            />
            <FieldError msg={errors.dtAluguel} />
          </div>
        </div>
      </SectionCard>

      {/* ── AUTORIZAÇÕES LGPD ── */}
      <SectionCard title="Autorizações (LGPD)" icon="✅">
        {errors.lgpd && (
          <div className="mb-3 text-xs text-red-500 flex items-center gap-1">
            <AlertCircle size={12} /> {errors.lgpd}
          </div>
        )}
        <div className="space-y-3">
          {[
            {
              key: 'doc' as const,
              value: autorizaDoc,
              set: setAutorizaDoc,
              text: 'AUTORIZO MINHA ANÁLISE DOCUMENTAL PARA EFETIVAR A PROPOSTA COMERCIAL DE LOCAÇÃO.',
            },
            {
              key: 'prop' as const,
              value: autorizaProp,
              set: setAutorizaProp,
              text: 'EFETIVAR MINHA PROPOSTA, ANÁLISE INCLUSA.',
            },
            {
              key: 'corr' as const,
              value: autorizaCorr,
              set: setAutorizaCorr,
              text: 'AUTORIZO EM CASO DE NECESSIDADES ENVIAR CORRESPONDÊNCIAS E ENCOMENDAS PARA O ENDEREÇO REFERIDO NESSA FICHA.',
            },
          ].map(item => (
            <label
              key={item.key}
              className="flex items-start gap-3 cursor-pointer group"
            >
              <div className="relative mt-0.5 flex-shrink-0">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={item.value}
                  onChange={e => item.set(e.target.checked)}
                />
                <div
                  className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all"
                  style={{
                    borderColor: item.value ? '#D4A853' : 'rgba(90,96,112,0.30)',
                    background: item.value ? 'rgba(212,168,83,0.15)' : 'rgba(255,255,255,0.60)',
                  }}
                >
                  {item.value && <CheckCircle2 size={13} style={{ color: '#B8923A' }} />}
                </div>
              </div>
              <span className="text-xs text-ink-secondary leading-relaxed group-hover:text-ink transition-colors">
                {item.text}
              </span>
            </label>
          ))}
        </div>
        <div
          className="mt-4 px-3 py-2.5 rounded-xl text-[10px] italic leading-relaxed"
          style={{ background: 'rgba(226,221,214,0.35)', color: 'rgba(90,96,112,0.80)' }}
        >
          Essa ficha cadastral está de acordo com a Lei Geral de Proteção de Dados (LGPD), Lei nº 13.709, de 14 de agosto de 2018, que regulamenta o tratamento de dados pessoais no Brasil.
        </div>
      </SectionCard>

      {/* ── ACTIONS ── */}
      <div
        className="flex items-center justify-between pt-2 pb-4"
        style={{ borderTop: '1px solid rgba(226,221,214,0.55)' }}
      >
        <button
          type="button"
          className="btn-ghost"
          onClick={() => navigate(-1)}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn-gold flex items-center gap-2"
          disabled={saving}
        >
          <Save size={16} />
          {saving ? 'Salvando…' : initial?.id ? 'Salvar alterações' : 'Salvar Ficha Inquilino'}
        </button>
      </div>
    </form>
  )
}
