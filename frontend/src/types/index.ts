// Centralised TypeScript types matching backend models.

export type Role = 'superadmin' | 'admin' | 'corretor' | 'locatario' | 'locador'
export type PropertyStatus = 'disponivel' | 'indisponivel' | 'alugado'
export type PropertyType = 'apartamento' | 'casa' | 'comercial' | 'terreno' | 'sala' | 'galpao'
export type ContractStatus = 'ativo' | 'encerrado' | 'rescindido'
export type PaymentStatusLocatario = 'pendente' | 'comprovante_enviado' | 'pago' | 'atrasado'
export type PaymentStatusLocador = 'em_esteira' | 'gerando_impostos' | 'pago'
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
  endereco: string
  bairro?: string | null
  cidade?: string | null
  cep?: string | null
  area_m2?: number | null
  quartos?: number | null
  banheiros?: number | null
  vagas?: number | null
  valor_aluguel: number
  valor_condominio?: number | null
  valor_iptu?: number | null
  aceita_pet?: boolean
  mobiliado?: boolean
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
}

export interface CRMLocador extends User {
  contract?: Contract | null
  property?: Property | null
  last_payout?: Payment | null
}
