import { format, parseISO, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function currency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(Number(value))) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
}

export function compactCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'R$ 0'
  const n = Number(value)
  if (Math.abs(n) >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `R$ ${(n / 1_000).toFixed(1)}K`
  return currency(n)
}

export function fmtDate(d?: string | Date | null, pattern = "dd 'de' MMMM 'de' yyyy"): string {
  if (!d) return '\u2014'
  const date = typeof d === 'string' ? parseISO(d) : d
  if (!isValid(date)) return '\u2014'
  return format(date, pattern, { locale: ptBR })
}

export function fmtShortDate(d?: string | Date | null): string {
  return fmtDate(d, 'dd/MM/yyyy')
}

export function fmtMonth(yyyy_mm: string | null | undefined): string {
  if (!yyyy_mm) return '\u2014'
  const [y, m] = yyyy_mm.split('-')
  const date = new Date(Number(y), Number(m) - 1, 1)
  return format(date, "MMMM 'de' yyyy", { locale: ptBR })
}

export function maskCPF(value?: string | null): string {
  if (!value) return ''
  const v = value.replace(/\D/g, '').slice(0, 11)
  return v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function maskCNPJ(value?: string | null): string {
  if (!value) return ''
  const v = value.replace(/\D/g, '').slice(0, 14)
  return v
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

export function maskPhone(value?: string | null): string {
  if (!value) return ''
  const v = value.replace(/\D/g, '').slice(0, 11)
  if (v.length <= 10) {
    return v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
  }
  return v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
}

export function maskCEP(value?: string | null): string {
  if (!value) return ''
  return value.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2')
}

export function initials(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function roleLabel(role: string): string {
  const map: Record<string, string> = {
    superadmin: 'Super Admin',
    admin: 'Administrador',
    corretor: 'Corretor',
    locatario: 'Locatario',
    locador: 'Locador',
  }
  return map[role] || role
}

export function propertyTypeLabel(t: string): string {
  const map: Record<string, string> = {
    apartamento: 'Apartamento',
    casa: 'Casa',
    comercial: 'Comercial',
    terreno: 'Terreno',
    sala: 'Sala comercial',
    galpao: 'Galpao',
  }
  return map[t] || t
}

export function statusLocatarioLabel(s: string) {
  const map: Record<string, string> = {
    pendente: 'Pendente',
    comprovante_enviado: 'Comprovante enviado',
    pago: 'Pago',
    atrasado: 'Atrasado',
    rejeitado: 'Rejeitado',
  }
  return map[s] || s
}

export function statusLocadorLabel(s: string) {
  const map: Record<string, string> = {
    em_esteira: 'Em esteira',
    gerando_impostos: 'Gerando impostos',
    enviado: 'Enviado',
    pago: 'Pago',
  }
  return map[s] || s
}
