/** Tipos para Ficha Inquilino ImobVip */

export interface ClienteFicha {
  cpf: string
  nome_completo: string
  estado_civil: string
  rg: string
  email: string
  profissao: string
  endereco?: string  // exclusivo do Cliente 2
}

export interface ReferenciaFicha {
  label: string  // contato_1 | contato_2 | referencia_1 | referencia_2
  nome: string
  telefone: string
}

export interface FichaLocatario {
  id: string
  tenant_id: string
  corretor_id: string
  imovel_id?: string | null
  contrato_id?: string | null
  // Cabeçalho
  condominio: string
  unidade: string
  data_cadastro: string
  // Clientes
  cliente1: ClienteFicha
  cliente2?: ClienteFicha | null
  // Referências
  referencias: ReferenciaFicha[]
  // Dados profissionais
  empresa_trabalha: string
  endereco_trabalho: string
  tel_empresa_1: string
  tel_empresa_2?: string | null
  // Correspondência
  endereco_correspondencia: string
  // Valores
  valor_caucao: number
  valor_locacao: number
  // Autorizações LGPD
  autoriza_analise_documental: boolean
  autoriza_proposta_analise_inclusa: boolean
  autoriza_correspondencias: boolean
  // Datas
  data_prevista_entrega_chaves: string
  data_primeiro_aluguel_vencimento: string
  // Assinaturas
  assinatura_cliente1_url?: string | null
  assinatura_cliente2_url?: string | null
  // PDF
  ficha_pdf_url?: string | null
  // Status
  status: 'analise' | 'ativo' | 'inativo'
  created_at: string
  updated_at?: string | null
  // Enriched
  corretor?: { id: string; nome: string; email?: string } | null
  imovel?: { id: string; titulo: string; endereco: string } | null
}

export type FichaLocatarioCreate = Omit<FichaLocatario,
  'id' | 'tenant_id' | 'corretor_id' | 'created_at' | 'updated_at' |
  'corretor' | 'imovel' | 'status' | 'data_cadastro' |
  'assinatura_cliente1_url' | 'assinatura_cliente2_url' | 'ficha_pdf_url'
>

export const ESTADO_CIVIL_OPTIONS = [
  { value: 'solteiro', label: 'Solteiro(a)' },
  { value: 'casado', label: 'Casado(a)' },
  { value: 'divorciado', label: 'Divorciado(a)' },
  { value: 'viuvo', label: 'Viúvo(a)' },
  { value: 'uniao_estavel', label: 'União Estável' },
  { value: 'separado', label: 'Separado(a)' },
]

export const REFERENCIAS_LABELS = [
  { key: 'contato_1', label: 'Contato 1' },
  { key: 'contato_2', label: 'Contato 2' },
  { key: 'referencia_1', label: 'Referência 1' },
  { key: 'referencia_2', label: 'Referência 2' },
] as const

export const STATUS_FICHA: Record<FichaLocatario['status'], string> = {
  analise: 'Em análise',
  ativo: 'Ativo',
  inativo: 'Inativo',
}
