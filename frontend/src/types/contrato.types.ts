/** Dados completos para geração do Contrato de Locação ImobVip. */
export interface DadosContrato {
  // Locador (Locadora)
  locador_nome: string
  locador_nacionalidade: string
  locador_estado_civil: string
  locador_profissao: string
  locador_rg: string
  locador_cpf: string

  // Locatário 1
  locatario_nome: string
  locatario_nacionalidade: string
  locatario_estado_civil: string
  locatario_profissao: string
  locatario_rg: string
  locatario_cpf: string
  locatario_email: string
  locatario_edp_unidade: string
  locatario_link_vistoria?: string

  // Locatário 2 (opcional)
  locatario2_nome?: string
  locatario2_nacionalidade?: string
  locatario2_estado_civil?: string
  locatario2_profissao?: string
  locatario2_rg?: string
  locatario2_cpf?: string

  // Utilização
  nomes_moradores: string
  num_pessoas: number

  // Imóvel
  tipo_imovel: string
  tem_vaga_garagem: boolean
  identificacao_apto: string
  nome_condominio: string
  endereco_completo: string
  finalidade: string

  // Prazo
  prazo_meses: number
  data_inicio: string
  data_termino: string

  // Valores
  valor_aluguel: number
  dia_vencimento: 5 | 10 | 15 | 20 | 25 | 30
  indice_reajuste: 'IGPM' | 'IPCA'

  // Encargos
  encargos_inclusos: string

  // Caução
  valor_caucao: number
  num_meses_caucao: number
  data_deposito_caucao: string
  data_primeiro_aluguel: string

  // Assinatura
  cidade_assinatura: string
  data_assinatura: string

  // Extras opcionais
  clausulas_adicionais?: string
}
