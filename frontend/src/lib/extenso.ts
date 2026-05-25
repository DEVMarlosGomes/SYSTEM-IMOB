/** Converte números para extenso em português (PT-BR). */

const UNIDADES = [
  '', 'um', 'dois', 'tres', 'quatro', 'cinco',
  'seis', 'sete', 'oito', 'nove', 'dez',
  'onze', 'doze', 'treze', 'quatorze', 'quinze',
  'dezesseis', 'dezessete', 'dezoito', 'dezenove',
]
const DEZENAS = [
  '', 'dez', 'vinte', 'trinta', 'quarenta', 'cinquenta',
  'sessenta', 'setenta', 'oitenta', 'noventa',
]
const CENTENAS = [
  '', 'cento', 'duzentos', 'trezentos', 'quatrocentos',
  'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos',
]

const DIAS_EXTENSO: Record<number, string> = {
  5: 'cinco',
  10: 'dez',
  15: 'quinze',
  20: 'vinte',
  25: 'vinte e cinco',
  30: 'trinta',
}

function dezenas(n: number): string {
  if (n < 20) return UNIDADES[n]
  const t = Math.floor(n / 10)
  const u = n % 10
  return u === 0 ? DEZENAS[t] : `${DEZENAS[t]} e ${UNIDADES[u]}`
}

function centenas(n: number): string {
  if (n === 0) return ''
  if (n === 100) return 'cem'
  const h = Math.floor(n / 100)
  const rest = n % 100
  if (rest === 0) return CENTENAS[h]
  return `${CENTENAS[h]} e ${dezenas(rest)}`
}

function converterInteiro(n: number): string {
  if (n === 0) return 'zero'
  if (n < 0) return `menos ${converterInteiro(-n)}`

  const partes: string[] = []

  const bi = Math.floor(n / 1_000_000_000)
  const mi = Math.floor((n % 1_000_000_000) / 1_000_000)
  const mil = Math.floor((n % 1_000_000) / 1_000)
  const resto = n % 1_000

  if (bi) partes.push(`${converterInteiro(bi)} ${bi === 1 ? 'bilhao' : 'bilhoes'}`)
  if (mi) partes.push(`${converterInteiro(mi)} ${mi === 1 ? 'milhao' : 'milhoes'}`)
  if (mil) {
    if (mil === 1) partes.push('mil')
    else partes.push(`${converterInteiro(mil)} mil`)
  }
  if (resto) partes.push(centenas(resto))

  return partes.join(' e ')
}

/** R$ 1.550,00 → "MIL E QUINHENTOS E CINQUENTA REAIS" */
export function valorExtenso(valor: number): string {
  const inteiro = Math.floor(valor)
  const centavos = Math.round((valor - inteiro) * 100)
  const parteReal = converterInteiro(inteiro)
  const sufixoReal = inteiro === 1 ? 'real' : 'reais'
  if (centavos === 0) return `${parteReal} ${sufixoReal}`.toUpperCase()
  const parteCentavos = converterInteiro(centavos)
  const sufixoCentavos = centavos === 1 ? 'centavo' : 'centavos'
  return `${parteReal} ${sufixoReal} e ${parteCentavos} ${sufixoCentavos}`.toUpperCase()
}

/** 12 → "doze" */
export function numeroPorExtenso(n: number): string {
  return converterInteiro(n)
}

/** Dia de vencimento → extenso (ex: 5 → "cinco") */
export function diaExtenso(dia: number): string {
  return DIAS_EXTENSO[dia] ?? numeroPorExtenso(dia)
}

const MESES_PT = [
  'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

/** "2026-05-23" → "23 de maio de 2026" */
export function dataExtenso(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${d} de ${MESES_PT[m - 1]} de ${y}`
}

/** "2026-05-23" → "Suzano, 23 de maio de 2026" */
export function dataAssinaturaExtenso(dateStr: string, cidade = 'Suzano'): string {
  return `${cidade}, ${dataExtenso(dateStr)}`
}
