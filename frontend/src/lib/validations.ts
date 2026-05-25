/** Validações e máscaras — CPF, telefone, moeda */

// ── CPF ──────────────────────────────────────────────────────────────────────

export function validarCPF(cpf: string): boolean {
  const nums = cpf.replace(/\D/g, '')
  if (nums.length !== 11) return false
  if (/^(\d)\1{10}$/.test(nums)) return false  // all same digits

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(nums[i]) * (10 - i)
  let r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  if (r !== parseInt(nums[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(nums[i]) * (11 - i)
  r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  return r === parseInt(nums[10])
}

export function maskCPF(value: string): string {
  const n = value.replace(/\D/g, '').slice(0, 11)
  if (n.length <= 3) return n
  if (n.length <= 6) return `${n.slice(0, 3)}.${n.slice(3)}`
  if (n.length <= 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`
}

/** Mascarar CPF para listagem: ***.123.456-** */
export function mascaraCPFPublico(cpf: string): string {
  const n = cpf.replace(/\D/g, '')
  if (n.length !== 11) return cpf
  return `***.${n.slice(3, 6)}.${n.slice(6, 9)}-**`
}

// ── TELEFONE ──────────────────────────────────────────────────────────────────

export function maskPhone(value: string): string {
  const n = value.replace(/\D/g, '').slice(0, 11)
  if (n.length <= 2) return n.length ? `(${n}` : ''
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`
}

// ── MOEDA ─────────────────────────────────────────────────────────────────────

/** "R$ 1.550,00" → 1550 */
export function parseCurrency(masked: string): number {
  const cleaned = masked.replace(/\./g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

/** 1550 → "1.550,00" */
export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Input de moeda: converte string digitada em "1.550,00" */
export function maskCurrency(value: string): string {
  const nums = value.replace(/\D/g, '')
  if (!nums) return ''
  const num = parseInt(nums) / 100
  return formatCurrency(num)
}

// ── NOME COMPLETO ─────────────────────────────────────────────────────────────

export function validarNomeCompleto(nome: string): string | null {
  const trimmed = nome.trim()
  if (trimmed.length < 5) return 'Nome muito curto'
  const partes = trimmed.split(' ').filter(p => p.length > 0)
  if (partes.length < 2) return 'Informe o nome completo (mínimo 2 palavras)'
  if (trimmed.includes('.')) return 'Nome não deve conter abreviações (ex: J. Silva)'
  return null
}

// ── DATA ──────────────────────────────────────────────────────────────────────

/** "2026-05-23" → "23/05/2026" */
export function fmtDateBR(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/** "23/05/2026" → "2026-05-23" */
export function parseDateBR(br: string): string {
  const [d, m, y] = br.split('/')
  return `${y}-${m}-${d}`
}
