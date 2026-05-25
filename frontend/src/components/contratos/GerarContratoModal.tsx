import { useState, useMemo } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { FileDown, FileText } from 'lucide-react'
import { Modal } from '@/components/common/Modal'
import { ContratoPDF } from '@/components/contratos/ContratoPDF'
import type { DadosContrato } from '@/types/contrato.types'
import type { Contract } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  contract: Contract
}

// ── Module-level helpers (stable identity, no focus issues) ──────────────────

function Field({
  label, value, onChange, type = 'text', className, placeholder,
}: {
  label: string
  value: string | number
  onChange: (v: string | number) => void
  type?: string
  className?: string
  placeholder?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label className="text-[11px] uppercase tracking-wider text-ink-muted font-medium">{label}</label>
      <input
        type={type}
        className="input-premium text-sm py-2"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
      />
    </div>
  )
}

function SelectField({
  label, value, onChange, options, className,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label className="text-[11px] uppercase tracking-wider text-ink-muted font-medium">{label}</label>
      <select
        className="input-premium text-sm py-2"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function SectionHeader({ children }: { children: string }) {
  return (
    <div
      className="text-[11px] font-bold uppercase tracking-widest pt-2 pb-1.5"
      style={{ color: '#B8923A', borderBottom: '1px solid rgba(212,168,83,0.25)' }}
    >
      {children}
    </div>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────────

export function GerarContratoModal({ open, onClose, contract: c }: Props) {
  const defaultMeses = useMemo(() => {
    if (!c.data_inicio || !c.data_fim) return 12
    const [y1, m1] = c.data_inicio.split('-').map(Number)
    const [y2, m2] = c.data_fim.split('-').map(Number)
    return Math.max(1, (y2 - y1) * 12 + (m2 - m1))
  }, [c.data_inicio, c.data_fim])

  const [dados, setDados] = useState<DadosContrato>(() => ({
    // Locador
    locador_nome: c.owner_profile?.nome ?? c.locador?.nome ?? '',
    locador_nacionalidade: 'brasileiro(a)',
    locador_estado_civil: 'casado(a)',
    locador_profissao: '',
    locador_rg: c.owner_profile?.rg ?? '',
    locador_cpf: c.owner_profile?.cpf ?? '',
    // Locatário
    locatario_nome: c.locatario?.nome ?? '',
    locatario_nacionalidade: 'brasileiro(a)',
    locatario_estado_civil: 'solteiro(a)',
    locatario_profissao: '',
    locatario_rg: '',
    locatario_cpf: '',
    locatario_email: c.locatario?.email ?? '',
    locatario_edp_unidade: '',
    locatario_link_vistoria: '',
    nomes_moradores: c.locatario?.nome ?? '',
    num_pessoas: 1,
    // Imóvel
    tipo_imovel: c.property?.tipo ?? 'Apartamento',
    tem_vaga_garagem: (c.property?.vagas ?? 0) > 0,
    identificacao_apto: '',
    nome_condominio: '',
    endereco_completo: [c.property?.endereco, c.property?.bairro, c.property?.cidade]
      .filter(Boolean).join(', '),
    finalidade: 'RESIDENCIAL',
    // Prazo
    prazo_meses: defaultMeses,
    data_inicio: c.data_inicio ?? '',
    data_termino: c.data_fim ?? '',
    // Valores
    valor_aluguel: c.valor_aluguel ?? 0,
    dia_vencimento: (([5,10,15,20,25,30].includes(c.dia_vencimento)
      ? c.dia_vencimento : 5) as DadosContrato['dia_vencimento']),
    indice_reajuste: (c.indice_reajuste === 'IPCA' ? 'IPCA' : 'IGPM'),
    // Encargos
    encargos_inclusos: 'NENHUM',
    // Caução
    valor_caucao: (c.valor_aluguel ?? 0) * 2,
    num_meses_caucao: 2,
    data_deposito_caucao: c.data_inicio ?? '',
    data_primeiro_aluguel: c.data_inicio ?? '',
    // Assinatura
    cidade_assinatura: 'Suzano',
    data_assinatura: new Date().toISOString().slice(0, 10),
    // Locatário 2 (opcional)
    locatario2_nome: '',
    locatario2_nacionalidade: 'brasileiro(a)',
    locatario2_estado_civil: 'solteiro(a)',
    locatario2_profissao: '',
    locatario2_rg: '',
    locatario2_cpf: '',
    // Extras
    clausulas_adicionais: c.clausulas ?? '',
  }))

  const [hasL2, setHasL2] = useState(false)
  const [ready, setReady] = useState(false)

  function upd<K extends keyof DadosContrato>(k: K, v: DadosContrato[K]) {
    setDados(d => ({ ...d, [k]: v }))
    if (ready) setReady(false)
  }

  const ESTADO_CIVIL = ['solteiro(a)', 'casado(a)', 'divorciado(a)', 'viúvo(a)', 'separado(a)', 'união estável']
  const VENCIMENTO_OPT = [5, 10, 15, 20, 25, 30].map(v => ({ value: String(v), label: `Dia ${v}` }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Gerar Contrato ImobVip"
      description="Revise e complete os dados para gerar o PDF oficial do contrato de locação."
      size="xl"
      footer={
        ready ? (
          <PDFDownloadLink
            document={<ContratoPDF dados={hasL2 ? dados : {
              ...dados,
              locatario2_nome: undefined, locatario2_nacionalidade: undefined,
              locatario2_estado_civil: undefined, locatario2_profissao: undefined,
              locatario2_rg: undefined, locatario2_cpf: undefined,
            }} />}
            fileName={`contrato-${dados.locatario_nome.replace(/\s+/g, '-').toLowerCase() || 'locatario'}.pdf`}
            className="btn-gold flex items-center gap-2"
          >
            {({ loading }) => <><FileDown size={16} />{loading ? 'Gerando PDF…' : 'Baixar Contrato PDF'}</>}
          </PDFDownloadLink>
        ) : (
          <button className="btn-primary flex items-center gap-2" onClick={() => setReady(true)}>
            <FileText size={16} /> Revisar → Gerar PDF
          </button>
        )
      }
    >
      <div className="space-y-5 text-sm">

        {/* ── I — Locador ── */}
        <SectionHeader>I — Locador</SectionHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome completo *" value={dados.locador_nome} onChange={v => upd('locador_nome', v as string)} className="col-span-2" />
          <Field label="Nacionalidade" value={dados.locador_nacionalidade} onChange={v => upd('locador_nacionalidade', v as string)} />
          <SelectField
            label="Estado civil"
            value={dados.locador_estado_civil}
            onChange={v => upd('locador_estado_civil', v)}
            options={ESTADO_CIVIL.map(e => ({ value: e, label: e }))}
          />
          <Field label="Profissão" value={dados.locador_profissao} onChange={v => upd('locador_profissao', v as string)} />
          <Field label="RG" value={dados.locador_rg} onChange={v => upd('locador_rg', v as string)} />
          <Field label="CPF" value={dados.locador_cpf} onChange={v => upd('locador_cpf', v as string)} placeholder="000.000.000-00" />
        </div>

        {/* ── II — Locatário ── */}
        <SectionHeader>II — Locatário</SectionHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome completo *" value={dados.locatario_nome} onChange={v => upd('locatario_nome', v as string)} className="col-span-2" />
          <Field label="Nacionalidade" value={dados.locatario_nacionalidade} onChange={v => upd('locatario_nacionalidade', v as string)} />
          <SelectField
            label="Estado civil"
            value={dados.locatario_estado_civil}
            onChange={v => upd('locatario_estado_civil', v)}
            options={ESTADO_CIVIL.map(e => ({ value: e, label: e }))}
          />
          <Field label="Profissão" value={dados.locatario_profissao} onChange={v => upd('locatario_profissao', v as string)} />
          <Field label="RG" value={dados.locatario_rg} onChange={v => upd('locatario_rg', v as string)} />
          <Field label="CPF" value={dados.locatario_cpf} onChange={v => upd('locatario_cpf', v as string)} placeholder="000.000.000-00" />
          <Field label="E-mail" value={dados.locatario_email} onChange={v => upd('locatario_email', v as string)} type="email" />
          <Field label="EDP Unidade Consumidora" value={dados.locatario_edp_unidade} onChange={v => upd('locatario_edp_unidade', v as string)} />
          <Field label="Nomes dos moradores" value={dados.nomes_moradores} onChange={v => upd('nomes_moradores', v as string)} className="col-span-2" />
          <Field label="Nº de pessoas" value={dados.num_pessoas} onChange={v => upd('num_pessoas', v as number)} type="number" />
          <Field label="Link da vistoria (opcional)" value={dados.locatario_link_vistoria ?? ''} onChange={v => upd('locatario_link_vistoria', v as string)} />
        </div>

        {/* ── II-B — Locatário 2 (opcional) ── */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => { setHasL2(h => !h); if (ready) setReady(false) }}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            style={hasL2
              ? { background: 'rgba(184,146,58,0.15)', color: '#B8923A', border: '1px solid rgba(184,146,58,0.4)' }
              : { background: 'rgba(0,0,0,0.04)', color: '#888', border: '1px solid rgba(0,0,0,0.1)' }
            }
          >
            {hasL2 ? '− Remover Locatário 2' : '+ Adicionar Locatário 2'}
          </button>
          {hasL2 && <span className="text-[11px] text-ink-muted">Preencha os dados do segundo locatário.</span>}
        </div>

        {hasL2 && (
          <>
            <SectionHeader>II-B — Locatário 2</SectionHeader>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nome completo *" value={dados.locatario2_nome ?? ''} onChange={v => upd('locatario2_nome', v as string)} className="col-span-2" />
              <Field label="Nacionalidade" value={dados.locatario2_nacionalidade ?? ''} onChange={v => upd('locatario2_nacionalidade', v as string)} />
              <SelectField
                label="Estado civil"
                value={dados.locatario2_estado_civil ?? 'solteiro(a)'}
                onChange={v => upd('locatario2_estado_civil', v)}
                options={ESTADO_CIVIL.map(e => ({ value: e, label: e }))}
              />
              <Field label="Profissão" value={dados.locatario2_profissao ?? ''} onChange={v => upd('locatario2_profissao', v as string)} />
              <Field label="RG" value={dados.locatario2_rg ?? ''} onChange={v => upd('locatario2_rg', v as string)} />
              <Field label="CPF" value={dados.locatario2_cpf ?? ''} onChange={v => upd('locatario2_cpf', v as string)} placeholder="000.000.000-00" />
            </div>
          </>
        )}

        {/* ── III — Imóvel ── */}
        <SectionHeader>III — Imóvel</SectionHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo do imóvel" value={dados.tipo_imovel} onChange={v => upd('tipo_imovel', v as string)} placeholder="ex: Apartamento" />
          <SelectField
            label="Vaga de garagem"
            value={dados.tem_vaga_garagem ? 'sim' : 'nao'}
            onChange={v => upd('tem_vaga_garagem', v === 'sim')}
            options={[{ value: 'sim', label: 'Com vaga de garagem' }, { value: 'nao', label: 'Sem vaga de garagem' }]}
          />
          <Field label="Identificação / Apto nº" value={dados.identificacao_apto} onChange={v => upd('identificacao_apto', v as string)} placeholder="ex: Apto 42, Bloco B" />
          <Field label="Nome do condomínio" value={dados.nome_condominio} onChange={v => upd('nome_condominio', v as string)} placeholder="ex: Res. das Flores" />
          <Field label="Endereço completo" value={dados.endereco_completo} onChange={v => upd('endereco_completo', v as string)} className="col-span-2" />
          <SelectField
            label="Finalidade"
            value={dados.finalidade}
            onChange={v => upd('finalidade', v)}
            options={[
              { value: 'RESIDENCIAL', label: 'Residencial' },
              { value: 'COMERCIAL', label: 'Comercial' },
              { value: 'MISTO', label: 'Misto' },
            ]}
          />
        </div>

        {/* ── IV–V — Prazo e Valores ── */}
        <SectionHeader>IV–V — Prazo e Valores</SectionHeader>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Prazo (meses)" value={dados.prazo_meses} onChange={v => upd('prazo_meses', v as number)} type="number" />
          <Field label="Data de início" value={dados.data_inicio} onChange={v => upd('data_inicio', v as string)} type="date" />
          <Field label="Data de término" value={dados.data_termino} onChange={v => upd('data_termino', v as string)} type="date" />
          <Field label="Valor do aluguel (R$)" value={dados.valor_aluguel} onChange={v => upd('valor_aluguel', v as number)} type="number" />
          <SelectField
            label="Dia de vencimento"
            value={String(dados.dia_vencimento)}
            onChange={v => upd('dia_vencimento', Number(v) as DadosContrato['dia_vencimento'])}
            options={VENCIMENTO_OPT}
          />
          <SelectField
            label="Índice de reajuste"
            value={dados.indice_reajuste}
            onChange={v => upd('indice_reajuste', v as 'IGPM' | 'IPCA')}
            options={[{ value: 'IGPM', label: 'IGP-M' }, { value: 'IPCA', label: 'IPCA' }]}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-wider text-ink-muted font-medium">
            Encargos inclusos no valor do aluguel
          </label>
          <input
            type="text"
            className="input-premium text-sm py-2"
            placeholder="ex: NENHUM  ou  IPTU, CONDOMÍNIO"
            value={dados.encargos_inclusos}
            onChange={e => upd('encargos_inclusos', e.target.value)}
          />
        </div>

        {/* ── VIII — Garantia / Caução ── */}
        <SectionHeader>VIII — Garantia / Caução</SectionHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor da caução (R$)" value={dados.valor_caucao} onChange={v => upd('valor_caucao', v as number)} type="number" />
          <Field label="Nº de meses caução" value={dados.num_meses_caucao} onChange={v => upd('num_meses_caucao', v as number)} type="number" />
          <Field label="Data do depósito da caução" value={dados.data_deposito_caucao} onChange={v => upd('data_deposito_caucao', v as string)} type="date" />
          <Field label="Data do primeiro aluguel" value={dados.data_primeiro_aluguel} onChange={v => upd('data_primeiro_aluguel', v as string)} type="date" />
        </div>

        {/* ── Assinatura ── */}
        <SectionHeader>Assinatura</SectionHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cidade" value={dados.cidade_assinatura} onChange={v => upd('cidade_assinatura', v as string)} />
          <Field label="Data da assinatura" value={dados.data_assinatura} onChange={v => upd('data_assinatura', v as string)} type="date" />
        </div>

        {/* ── Cláusulas adicionais ── */}
        <SectionHeader>Cláusulas adicionais (opcional)</SectionHeader>
        <textarea
          className="input-premium text-sm w-full"
          rows={3}
          placeholder="Descreva aqui quaisquer cláusulas adicionais ao contrato…"
          value={dados.clausulas_adicionais ?? ''}
          onChange={e => upd('clausulas_adicionais', e.target.value)}
        />

        {ready && (
          <div
            className="text-xs text-center py-2 rounded-lg"
            style={{ background: 'rgba(27,58,92,0.06)', color: '#1B3A5C', border: '1px solid rgba(27,58,92,0.12)' }}
          >
            Contrato pronto. Clique em <strong>Baixar Contrato PDF</strong> no rodapé para salvar.
          </div>
        )}
      </div>
    </Modal>
  )
}
