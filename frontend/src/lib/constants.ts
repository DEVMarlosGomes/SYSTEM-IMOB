export const APP_NAME = 'ImobVip'

export const ROLE_OPTIONS = [
  { value: 'admin', label: 'Administrador' },
  { value: 'corretor', label: 'Corretor' },
  { value: 'locatario', label: 'Locatario' },
  { value: 'locador', label: 'Locador' },
] as const

export const TIPO_IMOVEL_OPTIONS = [
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'casa', label: 'Casa' },
  { value: 'sala', label: 'Sala comercial' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'galpao', label: 'Galpao' },
] as const

export const STATUS_IMOVEL_OPTIONS = [
  { value: 'disponivel', label: 'Disponivel' },
  { value: 'indisponivel', label: 'Indisponivel' },
  { value: 'alugado', label: 'Alugado' },
] as const

export const DUE_DAYS = [5, 10, 15, 20, 25, 30] as const

export const AGENDA_HORAS: string[] = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-warning-soft text-warning border border-warning/30',
  comprovante_enviado: 'bg-navy-50 text-navy border border-navy-200',
  pago: 'bg-success-soft text-success border border-success/30',
  atrasado: 'bg-danger-soft text-danger border border-danger/30',
  em_esteira: 'bg-navy-50 text-navy border border-navy-200',
  gerando_impostos: 'bg-warning-soft text-warning border border-warning/30',
}

export const PROPERTY_STATUS_COLORS: Record<string, string> = {
  disponivel: 'bg-success-soft text-success border border-success/30',
  indisponivel: 'bg-warning-soft text-warning border border-warning/30',
  alugado: 'bg-navy-50 text-navy border border-navy-200',
}

export const DEMO_CREDENTIALS = [
  { role: 'admin', label: 'Administrador', email: 'admin@teste.com' },
  { role: 'corretor', label: 'Corretor', email: 'corretor@teste.com' },
  { role: 'locatario', label: 'Locatario', email: 'locatario@teste.com' },
  { role: 'locador', label: 'Locador', email: 'locador@teste.com' },
  { role: 'superadmin', label: 'Super Admin', email: 'super@teste.com' },
] as const
