// Centralised TypeScript types matching backend models.

export type Role = 'superadmin' | 'admin' | 'corretor' | 'locatario' | 'locador'
export type PropertyStatus = 'disponivel' | 'indisponivel' | 'alugado'
export type PropertyType = 'apartamento' | 'casa' | 'comercial' | 'terreno' | 'sala' | 'galpao'
export type ContractStatus = 'ativo' | 'encerrado' | 'rescindido'
export type PaymentStatusLocatario = 'pendente' | 'comprovante_enviado' | 'pago' | 'atrasado' | 'rejeitado'
export type PaymentStatusLocador = 'em_esteira' | 'gerando_impostos' | 'enviado' | 'pago'
export type AppointmentStatus = 'agendado' | 'realizado' | 'cancelado'
export type TipoConta = 'corrente' | 'poupanca'

export interface User {
  id: string
  role: Role
  nome: string
  email: string
  telefone?: string | null
  avatar_url?: string | null
  tenant_id?: string | null
  active?: boolean
  corretor_id?: string | null
  creci_sp?: string | null
  instagram?: string | null
}

export type ComissaoStatus = 'pendente' | 'pago'
export type TipoComissao = 'locacao' | 'captacao' | 'gerencia' | 'premiacao'

export interface Comissao {
  id: string
  tenant_id: string
  corretor_id: string
  contrato_id?: string | null
  imovel_id?: string | null
  tipo: TipoComissao
  descricao: string
  percentual?: number | null
  valor_base?: number | null
  valor: number
  mes_referencia: string
  data_prevista: string
  data_pagamento?: string | null
  status: ComissaoStatus
  observacoes?: string | null
  created_at?: string
}

export interface CorretorStats {
  corretor: User
  kpis: {
    imoveis_captados: number
    imoveis_alugados: number
    imoveis_disponiveis: number
    agendamentos_total: number
    agendamentos_realizados: number
    agendamentos_pendentes: number
    agendamentos_cancelados: number
    comissao_pendente: number
    comissao_paga: number
  }
  comissao_mensal: { mes: string; pendente: number; pago: number }[]
  agendamentos_recentes: Appointment[]
}

export interface Tenant {
  id: string
  nome: string
  slug?: string | null
  cnpj?: string | null
  logo_url?: string | null
  chave_pix?: string | null
  telefone?: string | null
  endereco?: string | null
  created_at?: string
}

export interface OwnerProfile {
  id: string
  tenant_id: string
  corretor_id: string
  nome: string
  cpf?: string | null
  rg?: string | null
  telefone?: string | null
  email?: string | null
  profissao?: string | null
  endereco?: string | null
  banco?: string | null
  agencia?: string | null
  conta?: string | null
  tipo_conta?: TipoConta | null
  pix?: string | null
  locador_user_id?: string | null
}

export interface Property {
  id: string
  tenant_id: string
  corretor_id: string
  owner_profile_id?: string | null
  titulo: string
  descricao?: string | null
  tipo: PropertyType
  status: PropertyStatus
  // Ficha Captação
  finalidade?: string | null
  categoria?: string | null
  situacao_imovel?: string | null
  // Endereço
  endereco: string
  numero?: string | null
  complemento?: string | null
  lote?: string | null
  quadra?: string | null
  bairro?: string | null
  cidade?: string | null
  uf?: string | null
  cep?: string | null
  // Construção
  ano_construcao?: number | null
  construtora?: string | null
  tipo_construcao?: string | null
  pavimentos?: number | null
  face?: string | null
  posicao?: string | null
  // Medidas
  medidas_x?: number | null
  medidas_y?: number | null
  area_m2?: number | null
  area_construida?: number | null
  area_terreno?: number | null
  area_total?: number | null
  // Cômodos
  quartos?: number | null
  banheiros?: number | null
  vagas?: number | null
  garagem_tipo?: string | null
  // Valores
  valor_aluguel: number
  valor_venda?: number | null
  valor_condominio?: number | null
  valor_iptu?: number | null
  exclusividade?: boolean
  exclusividade_data?: string | null
  financia?: boolean
  // Flags
  aceita_pet?: boolean
  mobiliado?: boolean
  placa?: boolean
  placa_padrao?: string | null
  placa_localizacao?: string | null
  // Infraestrutura
  energia_empresa?: string | null
  energia_instalacao?: string | null
  gas_empresa?: string | null
  gas_instalacao?: string | null
  agua_empresa?: string | null
  agua_rgi?: string | null
  agua_fornecimento?: string | null
  // Documentação
  cadastro_prefeitura?: string | null
  cartorio_imoveis?: string | null
  documentacao?: string | null
  local_chaves?: string | null
  // Dependências
  dep_dormitorios?: number
  dep_suites?: number
  dep_armarios_planejados?: boolean
  dep_closet?: boolean
  dep_suite_master?: boolean
  dep_sala?: boolean
  dep_sala_2_ambientes?: boolean
  dep_sala_jantar?: boolean
  dep_sala_estar?: boolean
  dep_sala_tv?: boolean
  dep_varanda?: boolean
  dep_banheiros?: number
  dep_arm_banheiros?: boolean
  dep_box_banheiros?: boolean
  dep_lavabos?: number
  dep_banheiro_empregada?: boolean
  dep_cozinha?: boolean
  dep_cozinha_planejada?: boolean
  dep_despensa?: boolean
  dep_area_servico?: boolean
  dep_empregada?: boolean
  dep_quintal_privativo?: boolean
  dep_varanda_gourmet?: boolean
  // Pisos
  piso_dormitorios?: string | null
  piso_sala?: string | null
  piso_banheiros?: string | null
  piso_cozinha?: string | null
  piso_quintal?: string | null
  // Listas
  perto_de?: string[]
  amenidades?: string[]
  // Misc
  observacoes?: string | null
  fotos: string[]
  created_at?: string
  corretor?: { id: string; nome: string; telefone?: string | null; avatar_url?: string | null; email?: string }
  owner_profile?: OwnerProfile | null
}

export interface Appointment {
  id: string
  tenant_id: string
  corretor_id: string
  property_id?: string | null
  nome_cliente: string
  data: string
  hora_inicio: string
  hora_fim: string
  observacoes?: string | null
  status: AppointmentStatus
  corretor?: { id: string; nome: string }
}

export interface Contract {
  id: string
  tenant_id: string
  property_id: string
  locatario_id: string
  locador_id: string
  corretor_id: string
  owner_profile_id?: string | null
  data_inicio: string
  data_fim: string
  valor_aluguel: number
  dia_vencimento: number
  indice_reajuste?: string | null
  clausulas?: string | null
  status: ContractStatus
  pdf_url?: string | null
  property?: Property
  locatario?: User
  locador?: User
  corretor?: User
  owner_profile?: OwnerProfile | null
  tenant?: Tenant
}

export interface Payment {
  id: string
  tenant_id: string
  contract_id: string
  locatario_id: string
  locador_id: string
  mes_referencia: string
  valor: number
  data_vencimento: string
  data_pagamento?: string | null
  status_locatario: PaymentStatusLocatario
  status_locador: PaymentStatusLocador
  comprovante_locatario_url?: string | null
  comprovante_locador_url?: string | null
  data_repasse_prevista?: string | null
  observacoes?: string | null
  motivo_rejeicao?: string | null
  locatario?: User
  locador?: User
  contract?: Contract
  property?: Property
}

export interface ChatMessage {
  id: string
  locador_id: string
  tenant_id: string
  remetente_id: string
  remetente_nome?: string | null
  remetente_role?: Role | null
  mensagem: string
  lida: boolean
  created_at: string
}

export interface ChatConversation {
  id: string
  nome: string
  avatar_url?: string | null
  last_message?: ChatMessage | null
  unread?: number
  locador_id?: string
}

export interface KPIs {
  total_imoveis: number
  imoveis_disponiveis: number
  imoveis_alugados: number
  imoveis_indisponiveis: number
  locatarios: number
  locadores: number
  corretores: number
  receita_mes: number
  atrasados: number
  agendamentos_semana: number
}

export interface AdminDashboard {
  kpis: KPIs
  distribuicao_status: { status: string; total: number }[]
  distribuicao_tipo: { tipo: string; total: number }[]
  receita_mensal: { mes: string; valor: number }[]
  atividade_recente: {
    imoveis: Property[]
    pagamentos: Payment[]
  }
}

export interface CorretorDashboard {
  kpis: { meus_imoveis: number; disponiveis: number; alugados: number; agendamentos_semana: number }
  proximos_agendamentos: Appointment[]
  meus_imoveis: Property[]
}

export interface PaymentKanban {
  [bucket: string]: {
    a_cobrar: Payment[]
    pago: Payment[]
    atrasado: Payment[]
  }
}

export interface CRMLocatario extends User {
  contract?: Contract | null
  property?: Property | null
  last_payment?: Payment | null
  cpf?: string | null
  meses_atraso?: number
  dias_para_vencer?: number | null
}

export interface CRMLocador extends User {
  contract?: Contract | null
  property?: Property | null
  last_payout?: Payment | null
  banco?: string | null
  pix?: string | null
  taxa_adm?: number
  valor_liquido?: number
}

export type NotificationType =
  | 'comprovante_enviado'
  | 'pagamento_aprovado'
  | 'contrato_criado'
  | 'info'

export interface Notification {
  id: string
  tenant_id: string
  recipient_id: string
  type: NotificationType
  title: string
  body: string
  lida: boolean
  link?: string | null
  created_at: string
}
