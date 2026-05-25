import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Save, Upload, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ownerProfileService, propertyService, uploadService } from '@/services'
import type { OwnerProfile, Property, PropertyType, PropertyStatus, TipoConta } from '@/types'
import { useAuth } from '@/stores/auth'
import { STATUS_IMOVEL_OPTIONS, TIPO_IMOVEL_OPTIONS } from '@/lib/constants'
import { useDropzone } from 'react-dropzone'
import { buildUploadUrl } from '@/lib/api'
import { maskCEP, maskCPF, maskPhone } from '@/lib/format'

// ─── constants ────────────────────────────────────────────────────────────────

const FINALIDADE_OPTIONS = [
  { value: 'locacao', label: 'Locação' },
  { value: 'venda', label: 'Venda' },
  { value: 'permuta', label: 'Permuta' },
  { value: 'temporada', label: 'Locação Temporada' },
]

const CATEGORIA_OPTIONS = [
  { value: 'residencial', label: 'Residencial' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'rural', label: 'Rural' },
  { value: 'lancamento', label: 'Lançamento' },
]

const SITUACAO_OPTIONS = [
  { value: 'pronto', label: 'Pronto' },
  { value: 'na_planta', label: 'Na planta' },
  { value: 'em_construcao', label: 'Em construção' },
]

const FACE_OPTIONS = ['Norte', 'Sul', 'Leste', 'Oeste', 'Nordeste', 'Noroeste', 'Sudeste', 'Sudoeste']
const POSICAO_OPTIONS = ['Frente', 'Fundos', 'Lateral', 'Esquina', 'Meio']
const TIPO_CONSTRUCAO_OPTIONS = ['Alvenaria', 'Madeira', 'Mista', 'Metálica', 'Concreto pré-moldado']
const GARAGEM_TIPO_OPTIONS = ['Coberta', 'Descoberta', 'Mista']
const PISO_OPTIONS = ['Cerâmica', 'Porcelanato', 'Madeira', 'Laminado', 'Cimento', 'Granito', 'Mármore', 'Vinílico', 'Carpete']

const PERTO_DE_OPTIONS = [
  'Açougue', 'Escola 1° grau', 'Escola 2° grau', 'Escola infantil / creche',
  'Colégio particular', 'Faculdade / universidade', 'Hospital', 'UPA / pronto-socorro',
  'Clínica médica', 'Farmácia', 'Mercado / mercearia', 'Supermercado',
  'Padaria', 'Restaurantes', 'Banco / caixa eletrônico', 'Lotérica',
  'Posto de combustível', 'Correios', 'Cartório', 'Cinema',
  'Shopping center', 'Clube / associação', 'Academia', 'Quadra esportiva',
  'Praça / jardim', 'Parque', 'Metrô / trem', 'Ponto de ônibus',
  'Ciclovia', 'Orla / praia',
]

const AMENIDADES_OPTIONS = [
  'Academia de ginástica', 'Aquecedor solar', 'Aquecimento a gás', 'Ar condicionado central',
  'Ar condicionado split', 'Alarme', 'Automação residencial', 'Bicicletário',
  'Banheira de hidromassagem', 'Box banheiro', 'Câmeras de segurança', 'Cave / adega',
  'Churrasqueira', 'Condomínio fechado', 'Copa', 'Coworking',
  'Cozinha gourmet', 'Depósito / guarda-volumes', 'Elevador', 'Elevador de serviço',
  'Espaço gourmet', 'Espaço pet / pet place', 'Fibra óptica', 'Garagem coberta',
  'Garagem descoberta', 'Gás encanado', 'Gerador', 'Guarita de segurança',
  'Heliponto', 'Home theater', 'Interfone / porteiro eletrônico', 'Jacuzzi',
  'Jardim', 'Lareira', 'Lavanderia coletiva', 'Painel solar',
  'Piscina adulto', 'Piscina aquecida', 'Piscina infantil', 'Piso radiante',
  'Playground', 'Portaria 24h', 'Quadra de tênis', 'Quadra poliesportiva',
  'Quarto de hóspedes', 'Rampa de acesso / acessibilidade', 'Salão de festas', 'Salão de jogos',
  'Sauna', 'Sky lobby', 'Terraço', 'Vaga extra',
  'Varanda gourmet', 'Vista para o mar', 'Vista para montanha', 'Vista para cidade',
  'Zelador', 'Brinquedoteca', 'Aspiração central', 'Cobertura duplex',
]

// ─── form state ───────────────────────────────────────────────────────────────

interface FormState {
  // Step 1 — Identificação & Localização
  titulo: string
  tipo: PropertyType
  status: PropertyStatus
  finalidade: string
  categoria: string
  situacao_imovel: string
  cep: string
  endereco: string
  numero: string
  complemento: string
  lote: string
  quadra: string
  bairro: string
  cidade: string
  uf: string
  // Step 2 — Características
  ano_construcao: string
  construtora: string
  tipo_construcao: string
  pavimentos: string
  face: string
  posicao: string
  medidas_x: string
  medidas_y: string
  area_m2: string
  area_construida: string
  area_terreno: string
  area_total: string
  quartos: string
  banheiros: string
  vagas: string
  garagem_tipo: string
  mobiliado: boolean
  aceita_pet: boolean
  valor_aluguel: string
  valor_venda: string
  valor_condominio: string
  valor_iptu: string
  exclusividade: boolean
  exclusividade_data: string
  financia: boolean
  // Step 3 — Infraestrutura & Docs
  energia_empresa: string
  energia_instalacao: string
  gas_empresa: string
  gas_instalacao: string
  agua_empresa: string
  agua_rgi: string
  agua_fornecimento: string
  cadastro_prefeitura: string
  cartorio_imoveis: string
  documentacao: string
  local_chaves: string
  placa: boolean
  placa_padrao: string
  placa_localizacao: string
  // Step 4 — Dependências & Pisos
  dep_dormitorios: string
  dep_suites: string
  dep_armarios_planejados: boolean
  dep_closet: boolean
  dep_suite_master: boolean
  dep_sala: boolean
  dep_sala_2_ambientes: boolean
  dep_sala_jantar: boolean
  dep_sala_estar: boolean
  dep_sala_tv: boolean
  dep_varanda: boolean
  dep_banheiros: string
  dep_arm_banheiros: boolean
  dep_box_banheiros: boolean
  dep_lavabos: string
  dep_banheiro_empregada: boolean
  dep_cozinha: boolean
  dep_cozinha_planejada: boolean
  dep_despensa: boolean
  dep_area_servico: boolean
  dep_empregada: boolean
  dep_quintal_privativo: boolean
  dep_varanda_gourmet: boolean
  piso_dormitorios: string
  piso_sala: string
  piso_banheiros: string
  piso_cozinha: string
  piso_quintal: string
  observacoes: string
  // Step 5 — Amenidades
  perto_de: string[]
  amenidades: string[]
  // Step 6 — Fotos
  fotos: string[]
  // Step 7 — Proprietário
  owner_profile_id?: string | null
  owner_nome: string
  owner_cpf: string
  owner_rg: string
  owner_telefone: string
  owner_email: string
  owner_profissao: string
  owner_endereco: string
  owner_banco: string
  owner_agencia: string
  owner_conta: string
  owner_tipo_conta: TipoConta
  owner_pix: string
}

const empty: FormState = {
  titulo: '', tipo: 'apartamento', status: 'disponivel',
  finalidade: 'locacao', categoria: 'residencial', situacao_imovel: 'pronto',
  cep: '', endereco: '', numero: '', complemento: '', lote: '', quadra: '',
  bairro: '', cidade: '', uf: '',
  ano_construcao: '', construtora: '', tipo_construcao: '', pavimentos: '',
  face: '', posicao: '',
  medidas_x: '', medidas_y: '', area_m2: '', area_construida: '', area_terreno: '', area_total: '',
  quartos: '', banheiros: '', vagas: '', garagem_tipo: '',
  mobiliado: false, aceita_pet: false,
  valor_aluguel: '', valor_venda: '', valor_condominio: '', valor_iptu: '',
  exclusividade: false, exclusividade_data: '', financia: false,
  energia_empresa: '', energia_instalacao: '',
  gas_empresa: '', gas_instalacao: '',
  agua_empresa: '', agua_rgi: '', agua_fornecimento: '',
  cadastro_prefeitura: '', cartorio_imoveis: '', documentacao: '',
  local_chaves: '', placa: false, placa_padrao: '', placa_localizacao: '',
  dep_dormitorios: '0', dep_suites: '0',
  dep_armarios_planejados: false, dep_closet: false, dep_suite_master: false,
  dep_sala: false, dep_sala_2_ambientes: false, dep_sala_jantar: false,
  dep_sala_estar: false, dep_sala_tv: false, dep_varanda: false,
  dep_banheiros: '0', dep_arm_banheiros: false, dep_box_banheiros: false,
  dep_lavabos: '0', dep_banheiro_empregada: false,
  dep_cozinha: false, dep_cozinha_planejada: false, dep_despensa: false,
  dep_area_servico: false, dep_empregada: false, dep_quintal_privativo: false,
  dep_varanda_gourmet: false,
  piso_dormitorios: '', piso_sala: '', piso_banheiros: '', piso_cozinha: '', piso_quintal: '',
  observacoes: '',
  perto_de: [], amenidades: [],
  fotos: [],
  owner_profile_id: null,
  owner_nome: '', owner_cpf: '', owner_rg: '', owner_telefone: '', owner_email: '',
  owner_profissao: '', owner_endereco: '', owner_banco: '', owner_agencia: '', owner_conta: '',
  owner_tipo_conta: 'corrente', owner_pix: '',
}

const STEPS = [
  { n: 1, label: 'Identificação' },
  { n: 2, label: 'Características' },
  { n: 3, label: 'Infraestrutura' },
  { n: 4, label: 'Dependências' },
  { n: 5, label: 'Amenidades' },
  { n: 6, label: 'Fotos' },
  { n: 7, label: 'Proprietário' },
] as const

type StepNum = typeof STEPS[number]['n']

// ─── component ────────────────────────────────────────────────────────────────

export default function ImovelForm() {
  const { id } = useParams<{ id?: string }>()
  const isEditing = !!id
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<StepNum>(1)
  const [form, setForm] = useState<FormState>(empty)
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  useEffect(() => {
    if (!id) return
    propertyService.get(id).then(async (p: Property) => {
      const owner = p.owner_profile_id ? await ownerProfileService.get(p.owner_profile_id).catch(() => null) : null
      const pp = p as any
      setForm({
        titulo: p.titulo,
        tipo: p.tipo,
        status: p.status,
        finalidade: pp.finalidade || 'locacao',
        categoria: pp.categoria || 'residencial',
        situacao_imovel: pp.situacao_imovel || 'pronto',
        cep: p.cep || '',
        endereco: p.endereco,
        numero: pp.numero || '',
        complemento: pp.complemento || '',
        lote: pp.lote || '',
        quadra: pp.quadra || '',
        bairro: p.bairro || '',
        cidade: p.cidade || '',
        uf: pp.uf || '',
        ano_construcao: pp.ano_construcao?.toString() || '',
        construtora: pp.construtora || '',
        tipo_construcao: pp.tipo_construcao || '',
        pavimentos: pp.pavimentos?.toString() || '',
        face: pp.face || '',
        posicao: pp.posicao || '',
        medidas_x: pp.medidas_x?.toString() || '',
        medidas_y: pp.medidas_y?.toString() || '',
        area_m2: p.area_m2?.toString() || '',
        area_construida: pp.area_construida?.toString() || '',
        area_terreno: pp.area_terreno?.toString() || '',
        area_total: pp.area_total?.toString() || '',
        quartos: p.quartos?.toString() || '',
        banheiros: p.banheiros?.toString() || '',
        vagas: p.vagas?.toString() || '',
        garagem_tipo: pp.garagem_tipo || '',
        mobiliado: !!p.mobiliado,
        aceita_pet: !!p.aceita_pet,
        valor_aluguel: p.valor_aluguel?.toString() || '',
        valor_venda: pp.valor_venda?.toString() || '',
        valor_condominio: p.valor_condominio?.toString() || '',
        valor_iptu: p.valor_iptu?.toString() || '',
        exclusividade: !!pp.exclusividade,
        exclusividade_data: pp.exclusividade_data || '',
        financia: !!pp.financia,
        energia_empresa: pp.energia_empresa || '',
        energia_instalacao: pp.energia_instalacao || '',
        gas_empresa: pp.gas_empresa || '',
        gas_instalacao: pp.gas_instalacao || '',
        agua_empresa: pp.agua_empresa || '',
        agua_rgi: pp.agua_rgi || '',
        agua_fornecimento: pp.agua_fornecimento || '',
        cadastro_prefeitura: pp.cadastro_prefeitura || '',
        cartorio_imoveis: pp.cartorio_imoveis || '',
        documentacao: pp.documentacao || '',
        local_chaves: pp.local_chaves || '',
        placa: !!pp.placa,
        placa_padrao: pp.placa_padrao || '',
        placa_localizacao: pp.placa_localizacao || '',
        dep_dormitorios: pp.dep_dormitorios?.toString() || '0',
        dep_suites: pp.dep_suites?.toString() || '0',
        dep_armarios_planejados: !!pp.dep_armarios_planejados,
        dep_closet: !!pp.dep_closet,
        dep_suite_master: !!pp.dep_suite_master,
        dep_sala: !!pp.dep_sala,
        dep_sala_2_ambientes: !!pp.dep_sala_2_ambientes,
        dep_sala_jantar: !!pp.dep_sala_jantar,
        dep_sala_estar: !!pp.dep_sala_estar,
        dep_sala_tv: !!pp.dep_sala_tv,
        dep_varanda: !!pp.dep_varanda,
        dep_banheiros: pp.dep_banheiros?.toString() || '0',
        dep_arm_banheiros: !!pp.dep_arm_banheiros,
        dep_box_banheiros: !!pp.dep_box_banheiros,
        dep_lavabos: pp.dep_lavabos?.toString() || '0',
        dep_banheiro_empregada: !!pp.dep_banheiro_empregada,
        dep_cozinha: !!pp.dep_cozinha,
        dep_cozinha_planejada: !!pp.dep_cozinha_planejada,
        dep_despensa: !!pp.dep_despensa,
        dep_area_servico: !!pp.dep_area_servico,
        dep_empregada: !!pp.dep_empregada,
        dep_quintal_privativo: !!pp.dep_quintal_privativo,
        dep_varanda_gourmet: !!pp.dep_varanda_gourmet,
        piso_dormitorios: pp.piso_dormitorios || '',
        piso_sala: pp.piso_sala || '',
        piso_banheiros: pp.piso_banheiros || '',
        piso_cozinha: pp.piso_cozinha || '',
        piso_quintal: pp.piso_quintal || '',
        observacoes: pp.observacoes || '',
        perto_de: pp.perto_de || [],
        amenidades: pp.amenidades || [],
        fotos: p.fotos || [],
        owner_profile_id: p.owner_profile_id,
        owner_nome: owner?.nome || '',
        owner_cpf: owner?.cpf || '',
        owner_rg: owner?.rg || '',
        owner_telefone: owner?.telefone || '',
        owner_email: owner?.email || '',
        owner_profissao: owner?.profissao || '',
        owner_endereco: owner?.endereco || '',
        owner_banco: owner?.banco || '',
        owner_agencia: owner?.agencia || '',
        owner_conta: owner?.conta || '',
        owner_tipo_conta: owner?.tipo_conta || 'corrente',
        owner_pix: owner?.pix || '',
      })
    }).catch(() => undefined).finally(() => setLoading(false))
  }, [id])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 15,
    maxSize: 5 * 1024 * 1024,
    onDrop: async (files) => {
      setUploadingPhoto(true)
      try {
        for (const file of files) {
          const res = await uploadService.upload(file, 'imoveis')
          setForm((f) => ({ ...f, fotos: [...f.fotos, res.url] }))
        }
        toast.success(`${files.length} foto(s) enviada(s).`)
      } catch {
        toast.error('Falha no upload das fotos.')
      } finally {
        setUploadingPhoto(false)
      }
    },
  })

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function toggleList(key: 'perto_de' | 'amenidades', value: string) {
    setForm((f) => {
      const list = f[key] as string[]
      return { ...f, [key]: list.includes(value) ? list.filter((x) => x !== value) : [...list, value] }
    })
  }

  async function lookupCEP(cep: string) {
    const clean = cep.replace(/\D/g, '')
    if (clean.length !== 8) return
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
      const data = await res.json()
      if (data?.erro) return
      setForm((f) => ({
        ...f,
        endereco: data.logradouro || f.endereco,
        bairro: data.bairro || f.bairro,
        cidade: data.localidade || f.cidade,
        uf: data.uf || f.uf,
      }))
    } catch { /* ignore */ }
  }

  async function submit() {
    if (!form.titulo || !form.endereco) {
      toast.error('Preencha título e endereço.')
      setStep(1)
      return
    }
    setSaving(true)
    try {
      let owner_profile_id = form.owner_profile_id || null
      if (form.owner_nome.trim()) {
        const ownerPayload = {
          nome: form.owner_nome, cpf: form.owner_cpf, rg: form.owner_rg,
          telefone: form.owner_telefone, email: form.owner_email || undefined,
          profissao: form.owner_profissao || undefined,
          endereco: form.owner_endereco, banco: form.owner_banco,
          agencia: form.owner_agencia, conta: form.owner_conta,
          tipo_conta: form.owner_tipo_conta, pix: form.owner_pix,
        }
        if (owner_profile_id) {
          await ownerProfileService.update(owner_profile_id, ownerPayload as any)
        } else {
          const created = await ownerProfileService.create(ownerPayload as any)
          owner_profile_id = created.id
        }
      }

      const n = (v: string) => (v ? Number(v) : null)
      const ni = (v: string) => (v ? parseInt(v, 10) : 0)

      const payload: any = {
        titulo: form.titulo, tipo: form.tipo, status: form.status,
        finalidade: form.finalidade, categoria: form.categoria, situacao_imovel: form.situacao_imovel,
        endereco: form.endereco, numero: form.numero, complemento: form.complemento,
        lote: form.lote, quadra: form.quadra, bairro: form.bairro,
        cidade: form.cidade, uf: form.uf, cep: form.cep,
        ano_construcao: n(form.ano_construcao), construtora: form.construtora,
        tipo_construcao: form.tipo_construcao, pavimentos: n(form.pavimentos),
        face: form.face, posicao: form.posicao,
        medidas_x: n(form.medidas_x), medidas_y: n(form.medidas_y),
        area_m2: n(form.area_m2), area_construida: n(form.area_construida),
        area_terreno: n(form.area_terreno), area_total: n(form.area_total),
        quartos: ni(form.quartos), banheiros: ni(form.banheiros), vagas: ni(form.vagas),
        garagem_tipo: form.garagem_tipo, mobiliado: form.mobiliado, aceita_pet: form.aceita_pet,
        valor_aluguel: n(form.valor_aluguel) ?? 0, valor_venda: n(form.valor_venda),
        valor_condominio: n(form.valor_condominio) ?? 0, valor_iptu: n(form.valor_iptu) ?? 0,
        exclusividade: form.exclusividade, exclusividade_data: form.exclusividade_data || null,
        financia: form.financia,
        energia_empresa: form.energia_empresa, energia_instalacao: form.energia_instalacao,
        gas_empresa: form.gas_empresa, gas_instalacao: form.gas_instalacao,
        agua_empresa: form.agua_empresa, agua_rgi: form.agua_rgi, agua_fornecimento: form.agua_fornecimento,
        cadastro_prefeitura: form.cadastro_prefeitura, cartorio_imoveis: form.cartorio_imoveis,
        documentacao: form.documentacao, local_chaves: form.local_chaves,
        placa: form.placa, placa_padrao: form.placa_padrao, placa_localizacao: form.placa_localizacao,
        dep_dormitorios: ni(form.dep_dormitorios), dep_suites: ni(form.dep_suites),
        dep_armarios_planejados: form.dep_armarios_planejados, dep_closet: form.dep_closet,
        dep_suite_master: form.dep_suite_master, dep_sala: form.dep_sala,
        dep_sala_2_ambientes: form.dep_sala_2_ambientes, dep_sala_jantar: form.dep_sala_jantar,
        dep_sala_estar: form.dep_sala_estar, dep_sala_tv: form.dep_sala_tv,
        dep_varanda: form.dep_varanda, dep_banheiros: ni(form.dep_banheiros),
        dep_arm_banheiros: form.dep_arm_banheiros, dep_box_banheiros: form.dep_box_banheiros,
        dep_lavabos: ni(form.dep_lavabos), dep_banheiro_empregada: form.dep_banheiro_empregada,
        dep_cozinha: form.dep_cozinha, dep_cozinha_planejada: form.dep_cozinha_planejada,
        dep_despensa: form.dep_despensa, dep_area_servico: form.dep_area_servico,
        dep_empregada: form.dep_empregada, dep_quintal_privativo: form.dep_quintal_privativo,
        dep_varanda_gourmet: form.dep_varanda_gourmet,
        piso_dormitorios: form.piso_dormitorios, piso_sala: form.piso_sala,
        piso_banheiros: form.piso_banheiros, piso_cozinha: form.piso_cozinha, piso_quintal: form.piso_quintal,
        observacoes: form.observacoes,
        perto_de: form.perto_de, amenidades: form.amenidades,
        fotos: form.fotos, owner_profile_id,
      }

      let saved: Property
      if (isEditing && id) {
        saved = await propertyService.update(id, payload)
        toast.success('Imóvel atualizado.')
      } else {
        saved = await propertyService.create(payload)
        toast.success('Imóvel cadastrado com sucesso!')
      }
      const base = user?.role === 'admin' ? '/admin/imoveis' : '/corretor/imoveis'
      navigate(`${base}/${saved.id}`)
    } catch {
      toast.error('Erro ao salvar o imóvel.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AppLayout><LoadingScreen /></AppLayout>

  return (
    <AppLayout>
      <PageHeader
        eyebrow={isEditing ? 'Editar' : 'Novo cadastro'}
        title={isEditing ? 'Editar imóvel' : 'Novo imóvel'}
        description="Ficha completa de captação — preencha todas as seções disponíveis."
      />

      {/* Step tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STEPS.map(({ n, label }) => (
          <button
            key={n}
            onClick={() => setStep(n)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={step === n
              ? { background: 'linear-gradient(135deg,#2E5F8A 0%,#1B3A5C 100%)', color: '#fff', border: '1px solid rgba(27,58,92,0.5)', boxShadow: '0 2px 8px rgba(27,58,92,0.2)' }
              : { background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(8px)', color: '#1A1A2E', border: '1px solid rgba(226,221,214,0.7)' }}
          >
            <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[11px] font-bold ${step === n ? 'bg-gold text-navy-800' : 'bg-surface-muted text-ink-secondary'}`}>{n}</span>
            {label}
          </button>
        ))}
      </div>

      <div className="card-premium p-6">

        {/* ── Step 1: Identificação & Localização ── */}
        {step === 1 && (
          <div className="space-y-6">
            <Section title="Identificação">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Título *" full>
                  <input className="input-premium" value={form.titulo} onChange={(e) => set('titulo', e.target.value)} data-testid="prop-titulo" />
                </Field>
                <Field label="Tipo">
                  <select className="input-premium" value={form.tipo} onChange={(e) => set('tipo', e.target.value as PropertyType)}>
                    {TIPO_IMOVEL_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Field>
                <Field label="Finalidade">
                  <select className="input-premium" value={form.finalidade} onChange={(e) => set('finalidade', e.target.value)}>
                    {FINALIDADE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Field>
                <Field label="Categoria">
                  <select className="input-premium" value={form.categoria} onChange={(e) => set('categoria', e.target.value)}>
                    {CATEGORIA_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Field>
                <Field label="Situação">
                  <select className="input-premium" value={form.situacao_imovel} onChange={(e) => set('situacao_imovel', e.target.value)}>
                    {SITUACAO_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Field>
                <Field label="Status">
                  <select className="input-premium" value={form.status} onChange={(e) => set('status', e.target.value as PropertyStatus)}>
                    {STATUS_IMOVEL_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Field>
              </div>
            </Section>

            <Section title="Endereço">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="CEP">
                  <input className="input-premium" value={form.cep} onChange={(e) => set('cep', maskCEP(e.target.value))} onBlur={(e) => lookupCEP(e.target.value)} placeholder="00000-000" />
                </Field>
                <Field label="Rua / Logradouro *" full>
                  <input className="input-premium" value={form.endereco} onChange={(e) => set('endereco', e.target.value)} data-testid="prop-endereco" />
                </Field>
                <Field label="Número">
                  <input className="input-premium" value={form.numero} onChange={(e) => set('numero', e.target.value)} />
                </Field>
                <Field label="Complemento">
                  <input className="input-premium" value={form.complemento} onChange={(e) => set('complemento', e.target.value)} placeholder="Apto, Bloco, etc." />
                </Field>
                <Field label="Lote">
                  <input className="input-premium" value={form.lote} onChange={(e) => set('lote', e.target.value)} />
                </Field>
                <Field label="Quadra">
                  <input className="input-premium" value={form.quadra} onChange={(e) => set('quadra', e.target.value)} />
                </Field>
                <Field label="Bairro">
                  <input className="input-premium" value={form.bairro} onChange={(e) => set('bairro', e.target.value)} />
                </Field>
                <Field label="Cidade">
                  <input className="input-premium" value={form.cidade} onChange={(e) => set('cidade', e.target.value)} />
                </Field>
                <Field label="UF">
                  <input className="input-premium uppercase" maxLength={2} value={form.uf} onChange={(e) => set('uf', e.target.value.toUpperCase())} placeholder="SP" />
                </Field>
              </div>
            </Section>
          </div>
        )}

        {/* ── Step 2: Características ── */}
        {step === 2 && (
          <div className="space-y-6">
            <Section title="Construção">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Ano de construção">
                  <input type="number" className="input-premium" value={form.ano_construcao} onChange={(e) => set('ano_construcao', e.target.value)} placeholder="Ex: 2010" />
                </Field>
                <Field label="Construtora">
                  <input className="input-premium" value={form.construtora} onChange={(e) => set('construtora', e.target.value)} />
                </Field>
                <Field label="Tipo de construção">
                  <select className="input-premium" value={form.tipo_construcao} onChange={(e) => set('tipo_construcao', e.target.value)}>
                    <option value="">Selecione...</option>
                    {TIPO_CONSTRUCAO_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Pavimentos">
                  <input type="number" className="input-premium" value={form.pavimentos} onChange={(e) => set('pavimentos', e.target.value)} />
                </Field>
                <Field label="Face">
                  <select className="input-premium" value={form.face} onChange={(e) => set('face', e.target.value)}>
                    <option value="">Selecione...</option>
                    {FACE_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </Field>
                <Field label="Posição">
                  <select className="input-premium" value={form.posicao} onChange={(e) => set('posicao', e.target.value)}>
                    <option value="">Selecione...</option>
                    {POSICAO_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>
              </div>
            </Section>

            <Section title="Medidas">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Medida X (m)">
                  <input type="number" step="0.01" className="input-premium" value={form.medidas_x} onChange={(e) => set('medidas_x', e.target.value)} />
                </Field>
                <Field label="Medida Y (m)">
                  <input type="number" step="0.01" className="input-premium" value={form.medidas_y} onChange={(e) => set('medidas_y', e.target.value)} />
                </Field>
                <Field label="Área construída (m²)">
                  <input type="number" step="0.01" className="input-premium" value={form.area_construida} onChange={(e) => set('area_construida', e.target.value)} />
                </Field>
                <Field label="Área terreno (m²)">
                  <input type="number" step="0.01" className="input-premium" value={form.area_terreno} onChange={(e) => set('area_terreno', e.target.value)} />
                </Field>
                <Field label="Área total / útil (m²)">
                  <input type="number" step="0.01" className="input-premium" value={form.area_m2} onChange={(e) => set('area_m2', e.target.value)} />
                </Field>
              </div>
            </Section>

            <Section title="Garagem">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Vagas">
                  <input type="number" className="input-premium" value={form.vagas} onChange={(e) => set('vagas', e.target.value)} />
                </Field>
                <Field label="Tipo de garagem">
                  <select className="input-premium" value={form.garagem_tipo} onChange={(e) => set('garagem_tipo', e.target.value)}>
                    <option value="">Selecione...</option>
                    {GARAGEM_TIPO_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </Field>
              </div>
            </Section>

            <Section title="Valores">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Preço de locação (R$)">
                  <input type="number" className="input-premium" value={form.valor_aluguel} onChange={(e) => set('valor_aluguel', e.target.value)} data-testid="prop-valor" />
                </Field>
                <Field label="Preço de venda (R$)">
                  <input type="number" className="input-premium" value={form.valor_venda} onChange={(e) => set('valor_venda', e.target.value)} />
                </Field>
                <Field label="Condomínio (R$)">
                  <input type="number" className="input-premium" value={form.valor_condominio} onChange={(e) => set('valor_condominio', e.target.value)} />
                </Field>
                <Field label="IPTU (R$)">
                  <input type="number" className="input-premium" value={form.valor_iptu} onChange={(e) => set('valor_iptu', e.target.value)} />
                </Field>
                <Field label="Data de exclusividade">
                  <input type="date" className="input-premium" value={form.exclusividade_data} onChange={(e) => set('exclusividade_data', e.target.value)} disabled={!form.exclusividade} />
                </Field>
              </div>
              <div className="flex flex-wrap gap-5 mt-3">
                <Checkbox label="Mobiliado" checked={form.mobiliado} onChange={(v) => set('mobiliado', v)} />
                <Checkbox label="Aceita pet" checked={form.aceita_pet} onChange={(v) => set('aceita_pet', v)} />
                <Checkbox label="Exclusividade" checked={form.exclusividade} onChange={(v) => set('exclusividade', v)} />
                <Checkbox label="Financia" checked={form.financia} onChange={(v) => set('financia', v)} />
              </div>
            </Section>
          </div>
        )}

        {/* ── Step 3: Infraestrutura & Docs ── */}
        {step === 3 && (
          <div className="space-y-6">
            <Section title="Energia elétrica">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Empresa fornecedora">
                  <input className="input-premium" value={form.energia_empresa} onChange={(e) => set('energia_empresa', e.target.value)} />
                </Field>
                <Field label="Nº de instalação">
                  <input className="input-premium" value={form.energia_instalacao} onChange={(e) => set('energia_instalacao', e.target.value)} />
                </Field>
              </div>
            </Section>

            <Section title="Gás">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Empresa fornecedora">
                  <input className="input-premium" value={form.gas_empresa} onChange={(e) => set('gas_empresa', e.target.value)} />
                </Field>
                <Field label="Nº de instalação">
                  <input className="input-premium" value={form.gas_instalacao} onChange={(e) => set('gas_instalacao', e.target.value)} />
                </Field>
              </div>
            </Section>

            <Section title="Água e saneamento">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Empresa / SAAE">
                  <input className="input-premium" value={form.agua_empresa} onChange={(e) => set('agua_empresa', e.target.value)} />
                </Field>
                <Field label="Nº RGI">
                  <input className="input-premium" value={form.agua_rgi} onChange={(e) => set('agua_rgi', e.target.value)} />
                </Field>
                <Field label="Nº de fornecimento">
                  <input className="input-premium" value={form.agua_fornecimento} onChange={(e) => set('agua_fornecimento', e.target.value)} />
                </Field>
              </div>
            </Section>

            <Section title="Documentação">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Cadastro prefeitura">
                  <input className="input-premium" value={form.cadastro_prefeitura} onChange={(e) => set('cadastro_prefeitura', e.target.value)} />
                </Field>
                <Field label="Cartório de imóveis">
                  <input className="input-premium" value={form.cartorio_imoveis} onChange={(e) => set('cartorio_imoveis', e.target.value)} />
                </Field>
                <Field label="Documentação" full>
                  <input className="input-premium" value={form.documentacao} onChange={(e) => set('documentacao', e.target.value)} placeholder="Ex: Escritura, RGI, etc." />
                </Field>
                <Field label="Local das chaves" full>
                  <input className="input-premium" value={form.local_chaves} onChange={(e) => set('local_chaves', e.target.value)} placeholder="Ex: Na imobiliária, com o proprietário..." />
                </Field>
              </div>
            </Section>

            <Section title="Placa">
              <div className="flex flex-wrap gap-4 items-start">
                <Checkbox label="Possui placa" checked={form.placa} onChange={(v) => set('placa', v)} />
                {form.placa && (
                  <>
                    <Field label="Padrão da placa">
                      <input className="input-premium" value={form.placa_padrao} onChange={(e) => set('placa_padrao', e.target.value)} placeholder="Ex: ImobVip padrão" />
                    </Field>
                    <Field label="Localização da placa">
                      <input className="input-premium" value={form.placa_localizacao} onChange={(e) => set('placa_localizacao', e.target.value)} placeholder="Ex: Frente do imóvel" />
                    </Field>
                  </>
                )}
              </div>
            </Section>
          </div>
        )}

        {/* ── Step 4: Dependências & Pisos ── */}
        {step === 4 && (
          <div className="space-y-6">
            <Section title="Dependências">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <Field label="Dormitórios">
                  <input type="number" min="0" className="input-premium" value={form.dep_dormitorios} onChange={(e) => set('dep_dormitorios', e.target.value)} />
                </Field>
                <Field label="Quartos">
                  <input type="number" min="0" className="input-premium" value={form.quartos} onChange={(e) => set('quartos', e.target.value)} />
                </Field>
                <Field label="Suítes">
                  <input type="number" min="0" className="input-premium" value={form.dep_suites} onChange={(e) => set('dep_suites', e.target.value)} />
                </Field>
                <Field label="Banheiros">
                  <input type="number" min="0" className="input-premium" value={form.dep_banheiros} onChange={(e) => set('dep_banheiros', e.target.value)} />
                </Field>
                <Field label="Lavabo(s)">
                  <input type="number" min="0" className="input-premium" value={form.dep_lavabos} onChange={(e) => set('dep_lavabos', e.target.value)} />
                </Field>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-3 mt-4">
                {([
                  ['dep_armarios_planejados', 'Armários planejados'],
                  ['dep_closet', 'Closet'],
                  ['dep_suite_master', 'Suíte master'],
                  ['dep_sala', 'Sala'],
                  ['dep_sala_2_ambientes', 'Sala 2 ambientes'],
                  ['dep_sala_jantar', 'Sala de jantar'],
                  ['dep_sala_estar', 'Sala de estar'],
                  ['dep_sala_tv', 'Sala de TV'],
                  ['dep_varanda', 'Varanda'],
                  ['dep_arm_banheiros', 'Arm. banheiro(s)'],
                  ['dep_box_banheiros', 'Box banheiro(s)'],
                  ['dep_banheiro_empregada', 'Banheiro empregada'],
                  ['dep_cozinha', 'Cozinha'],
                  ['dep_cozinha_planejada', 'Cozinha planejada'],
                  ['dep_despensa', 'Despensa'],
                  ['dep_area_servico', 'Área de serviço'],
                  ['dep_empregada', 'Dep. empregada'],
                  ['dep_quintal_privativo', 'Quintal privativo'],
                  ['dep_varanda_gourmet', 'Varanda gourmet'],
                ] as [keyof FormState, string][]).map(([key, label]) => (
                  <Checkbox key={key} label={label} checked={form[key] as boolean} onChange={(v) => set(key, v as any)} />
                ))}
              </div>
            </Section>

            <Section title="Pisos por cômodo">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {([
                  ['piso_dormitorios', 'Dormitórios'],
                  ['piso_sala', 'Sala'],
                  ['piso_banheiros', 'Banheiro(s)'],
                  ['piso_cozinha', 'Cozinha'],
                  ['piso_quintal', 'Quintal'],
                ] as [keyof FormState, string][]).map(([key, label]) => (
                  <Field key={key} label={label}>
                    <select className="input-premium" value={form[key] as string} onChange={(e) => set(key, e.target.value as any)}>
                      <option value="">Selecione...</option>
                      {PISO_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </Field>
                ))}
              </div>
            </Section>

            <Section title="Observações">
              <textarea
                className="input-premium min-h-[120px] w-full"
                value={form.observacoes}
                onChange={(e) => set('observacoes', e.target.value)}
                placeholder="Informações adicionais sobre o imóvel..."
              />
            </Section>
          </div>
        )}

        {/* ── Step 5: Amenidades & Proximidade ── */}
        {step === 5 && (
          <div className="space-y-6">
            <Section title="O que tem perto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-3">
                {PERTO_DE_OPTIONS.map((item) => (
                  <Checkbox
                    key={item}
                    label={item}
                    checked={form.perto_de.includes(item)}
                    onChange={() => toggleList('perto_de', item)}
                  />
                ))}
              </div>
            </Section>

            <Section title="Detalhes / Amenidades">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-3">
                {AMENIDADES_OPTIONS.map((item) => (
                  <Checkbox
                    key={item}
                    label={item}
                    checked={form.amenidades.includes(item)}
                    onChange={() => toggleList('amenidades', item)}
                  />
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* ── Step 6: Fotos ── */}
        {step === 6 && (
          <div>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-10 text-center transition ${isDragActive ? 'border-navy bg-navy-50' : 'border-line hover:border-navy-300 bg-surface-muted/40'}`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto text-navy mb-3" size={28} />
              <p className="font-medium text-ink">Arraste fotos aqui ou clique para selecionar</p>
              <p className="text-xs text-ink-secondary mt-1">PNG, JPG, JPEG, WEBP · até 5 MB cada · até 15 fotos</p>
              {uploadingPhoto && <p className="text-xs text-navy mt-3 animate-pulse-soft">Enviando…</p>}
            </div>
            {form.fotos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-5">
                {form.fotos.map((f, i) => (
                  <div key={f + i} className="relative group aspect-[4/3] rounded-lg overflow-hidden border border-line bg-surface-muted">
                    <img src={buildUploadUrl(f)} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                    <button
                      onClick={() => set('fotos', form.fotos.filter((_, j) => j !== i))}
                      className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/95 text-danger flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                    {i === 0 && <div className="absolute bottom-2 left-2 text-[10px] bg-gold text-navy-800 font-semibold px-1.5 py-0.5 rounded">PRINCIPAL</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Step 7: Proprietário ── */}
        {step === 7 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 p-3 bg-gold/10 border border-gold/30 rounded-md text-xs text-navy-700">
              Estes dados são visíveis apenas para você (o corretor cadastrante) e para o administrador da imobiliária.
            </div>
            <Field label="Nome do proprietário" full>
              <input className="input-premium" value={form.owner_nome} onChange={(e) => set('owner_nome', e.target.value)} />
            </Field>
            <Field label="CPF">
              <input className="input-premium" value={form.owner_cpf} onChange={(e) => set('owner_cpf', maskCPF(e.target.value))} />
            </Field>
            <Field label="RG">
              <input className="input-premium" value={form.owner_rg} onChange={(e) => set('owner_rg', e.target.value)} />
            </Field>
            <Field label="Telefone">
              <input className="input-premium" value={form.owner_telefone} onChange={(e) => set('owner_telefone', maskPhone(e.target.value))} />
            </Field>
            <Field label="E-mail">
              <input type="email" className="input-premium" value={form.owner_email} onChange={(e) => set('owner_email', e.target.value)} />
            </Field>
            <Field label="Profissão">
              <input className="input-premium" value={form.owner_profissao} onChange={(e) => set('owner_profissao', e.target.value)} />
            </Field>
            <Field label="Endereço" full>
              <input className="input-premium" value={form.owner_endereco} onChange={(e) => set('owner_endereco', e.target.value)} />
            </Field>
            <Field label="Banco">
              <input className="input-premium" value={form.owner_banco} onChange={(e) => set('owner_banco', e.target.value)} />
            </Field>
            <Field label="Agência">
              <input className="input-premium" value={form.owner_agencia} onChange={(e) => set('owner_agencia', e.target.value)} />
            </Field>
            <Field label="Conta">
              <input className="input-premium" value={form.owner_conta} onChange={(e) => set('owner_conta', e.target.value)} />
            </Field>
            <Field label="Tipo de conta">
              <select className="input-premium" value={form.owner_tipo_conta} onChange={(e) => set('owner_tipo_conta', e.target.value as TipoConta)}>
                <option value="corrente">Corrente</option>
                <option value="poupanca">Poupança</option>
              </select>
            </Field>
            <Field label="PIX" full>
              <input className="input-premium" value={form.owner_pix} onChange={(e) => set('owner_pix', e.target.value)} />
            </Field>
          </div>
        )}

        {/* Nav buttons */}
        <div className="flex items-center justify-between gap-3 mt-6 pt-5 border-t border-line">
          <button className="btn-ghost" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Cancelar</button>
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button className="btn-outline" onClick={() => setStep((s) => (s - 1) as StepNum)}>
                <ArrowLeft size={16} /> Anterior
              </button>
            )}
            {step < 7 && (
              <button className="btn-primary" onClick={() => setStep((s) => (s + 1) as StepNum)}>
                Próximo <ArrowRight size={16} />
              </button>
            )}
            {step === 7 && (
              <button className="btn-gold" onClick={submit} disabled={saving} data-testid="prop-save">
                <Save size={16} /> {saving ? 'Salvando…' : isEditing ? 'Salvar alterações' : 'Cadastrar imóvel'}
              </button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink mb-3 pb-1.5 border-b border-line">{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, children, full }: { label: string; children: ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      {label && <label className="block text-sm font-medium text-ink mb-1.5">{label}</label>}
      {children}
    </div>
  )
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm cursor-pointer select-none">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-navy rounded" />
      {label}
    </label>
  )
}
