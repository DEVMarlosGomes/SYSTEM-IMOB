import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import type { FichaLocatario } from '@/types/locatario.types'
import { ESTADO_CIVIL_OPTIONS, REFERENCIAS_LABELS } from '@/types/locatario.types'
import { formatCurrency, fmtDateBR } from '@/lib/validations'

const GOLD = '#B8923A'
const NAVY = '#1B3A5C'
const GOLD_BG = '#FFF8DC'

const s = StyleSheet.create({
  page: {
    paddingTop: 42,
    paddingBottom: 50,
    paddingHorizontal: 42,
    fontSize: 9,
    fontFamily: 'Times-Roman',
    color: '#111111',
    lineHeight: 1.5,
  },
  // Header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, alignItems: 'flex-start' },
  headerLeft: { flex: 1 },
  headerRight: { flex: 1, alignItems: 'flex-end' },
  headerTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 11,
    color: NAVY,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  headerSub: { fontSize: 8, color: '#5A6070' },
  fichaTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 13,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: NAVY,
    marginBottom: 2,
    marginTop: 4,
  },
  divider: { borderBottomWidth: 0.75, borderBottomColor: GOLD, marginBottom: 8, marginTop: 4 },
  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    marginTop: 10,
    paddingVertical: 3,
    paddingHorizontal: 6,
    backgroundColor: GOLD_BG,
    borderLeftWidth: 2.5,
    borderLeftColor: GOLD,
  },
  sectionTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: NAVY,
  },
  // Grid rows
  gridRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  gridCol: { flex: 1 },
  fieldLabel: {
    fontFamily: 'Times-Bold',
    fontSize: 7.5,
    textTransform: 'uppercase',
    color: '#5A6070',
    marginBottom: 1,
  },
  fieldValue: {
    fontSize: 9,
    paddingBottom: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#CCCCCC',
    minHeight: 14,
  },
  // Checkboxes
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  checkBox: {
    width: 11,
    height: 11,
    borderWidth: 1,
    borderColor: '#5A6070',
    marginRight: 5,
    marginTop: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkBoxChecked: { backgroundColor: GOLD_BG, borderColor: GOLD },
  checkMark: { fontFamily: 'Times-Bold', fontSize: 8, color: GOLD },
  checkText: { flex: 1, fontSize: 8, lineHeight: 1.4 },
  // Signature
  sigRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  sigBlock: { width: '42%', alignItems: 'center' },
  sigLine: {
    borderTopWidth: 1,
    borderTopColor: '#888888',
    width: '100%',
    paddingTop: 4,
    textAlign: 'center',
    fontSize: 8.5,
    color: '#5A6070',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 42,
    right: 42,
    borderTopWidth: 0.5,
    borderTopColor: '#CCCCCC',
    paddingTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 7, color: '#888888' },
  lgpd: { fontSize: 7, fontStyle: 'italic', color: '#777777', marginTop: 4, lineHeight: 1.4 },
  bold: { fontFamily: 'Times-Bold' },
})

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.gridCol}>
      <Text style={s.fieldLabel}>{label}</Text>
      <Text style={s.fieldValue}>{value || '—'}</Text>
    </View>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  )
}

function CheckItem({ checked, text }: { checked: boolean; text: string }) {
  return (
    <View style={s.checkRow}>
      <View style={[s.checkBox, checked ? s.checkBoxChecked : {}]}>
        {checked && <Text style={s.checkMark}>✓</Text>}
      </View>
      <Text style={s.checkText}>{text}</Text>
    </View>
  )
}

function estadoCivilLabel(val: string): string {
  return ESTADO_CIVIL_OPTIONS.find(o => o.value === val)?.label ?? val
}

export function FichaLocatarioPDF({ ficha }: { ficha: FichaLocatario }) {
  const c1 = ficha.cliente1
  const c2 = ficha.cliente2

  const refsMap = Object.fromEntries(ficha.referencias.map(r => [r.label, r]))

  return (
    <Document title={`Ficha Inquilino - ${c1.nome_completo}`} author="ImobVip Consultoria Imobiliária">
      <Page size="A4" style={s.page}>

        {/* Footer fixed */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>ImobVip Empreendimentos Imobiliários LTDA. | CRECI SP 41.440-J</Text>
          <Text style={s.footerText}>Rua Benfeitor João Elias Camello, 41, Poá, São Paulo</Text>
        </View>

        {/* Header */}
        <View style={s.headerRow}>
          <View style={s.headerLeft}>
            <Text style={s.headerTitle}>ImobVip Consultoria Imobiliária</Text>
            <Text style={s.headerSub}>CNPJ 47.142.042/0001-20 | CRECI SP 41.440-J</Text>
            <Text style={s.headerSub}>Rua Baruel, 417, Sl 10, Centro, Suzano-SP | CEP 08674-010</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerSub}>CORRETOR: {ficha.corretor?.nome ?? '—'}</Text>
            <Text style={s.headerSub}>DATA: {fmtDateBR(ficha.data_cadastro)}</Text>
            <Text style={s.headerSub}>CONDOMÍNIO: {ficha.condominio}</Text>
            <Text style={s.headerSub}>UNIDADE: {ficha.unidade}</Text>
          </View>
        </View>

        <Text style={s.fichaTitle}>Ficha Inquilino</Text>
        <View style={s.divider} />

        {/* Cliente 1 */}
        <SectionHeader title="Cliente 1 — Inquilino Principal" />
        <View style={s.gridRow}>
          <Field label="CPF" value={c1.cpf} />
          <Field label="Nome completo (sem abreviações)" value={c1.nome_completo} />
          <Field label="Estado civil" value={estadoCivilLabel(c1.estado_civil)} />
        </View>
        <View style={s.gridRow}>
          <Field label="RG" value={c1.rg} />
          <Field label="E-mail" value={c1.email} />
          <Field label="Profissão" value={c1.profissao} />
        </View>

        {/* Cliente 2 */}
        {c2 && (
          <>
            <SectionHeader title="Cliente 2 — Segundo Inquilino" />
            <View style={s.gridRow}>
              <Field label="CPF" value={c2.cpf} />
              <Field label="Nome completo (sem abreviações)" value={c2.nome_completo} />
              <Field label="Estado civil" value={estadoCivilLabel(c2.estado_civil)} />
            </View>
            <View style={s.gridRow}>
              <Field label="RG" value={c2.rg} />
              <Field label="E-mail" value={c2.email} />
              <Field label="Profissão" value={c2.profissao} />
            </View>
            {c2.endereco && (
              <View style={s.gridRow}>
                <Field label="Endereço residencial" value={c2.endereco} />
              </View>
            )}
          </>
        )}

        {/* Referências + Dados Profissionais (2 colunas) */}
        <SectionHeader title="Referências e Dados Profissionais" />
        <View style={s.gridRow}>
          {/* Referências — left column */}
          <View style={s.gridCol}>
            {REFERENCIAS_LABELS.map(rl => {
              const ref = refsMap[rl.key]
              return (
                <View key={rl.key} style={{ marginBottom: 4 }}>
                  <Text style={s.fieldLabel}>{rl.label}</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <View style={{ flex: 2 }}>
                      <Text style={s.fieldValue}>{ref?.nome || '—'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.fieldValue}>{ref?.telefone || '—'}</Text>
                    </View>
                  </View>
                </View>
              )
            })}
          </View>
          {/* Dados profissionais — right column */}
          <View style={s.gridCol}>
            <View style={{ marginBottom: 4 }}>
              <Text style={s.fieldLabel}>Empresa que trabalha</Text>
              <Text style={s.fieldValue}>{ficha.empresa_trabalha || '—'}</Text>
            </View>
            <View style={{ marginBottom: 4 }}>
              <Text style={s.fieldLabel}>Tel. Empresa (1)</Text>
              <Text style={s.fieldValue}>{ficha.tel_empresa_1 || '—'}</Text>
            </View>
            <View style={{ marginBottom: 4 }}>
              <Text style={s.fieldLabel}>Tel. Empresa (2)</Text>
              <Text style={s.fieldValue}>{ficha.tel_empresa_2 || '—'}</Text>
            </View>
            <View style={{ marginBottom: 4 }}>
              <Text style={s.fieldLabel}>Endereço do trabalho</Text>
              <Text style={s.fieldValue}>{ficha.endereco_trabalho || '—'}</Text>
            </View>
            <View style={{ marginBottom: 4 }}>
              <Text style={s.fieldLabel}>Endereço de correspondência</Text>
              <Text style={s.fieldValue}>{ficha.endereco_correspondencia || '—'}</Text>
            </View>
          </View>
        </View>

        {/* Valores */}
        <SectionHeader title="Valores da Locação" />
        <View style={s.gridRow}>
          <Field label="Valor do Caução" value={`R$ ${formatCurrency(ficha.valor_caucao)}`} />
          <Field label="Valor da Locação" value={`R$ ${formatCurrency(ficha.valor_locacao)}`} />
          <View style={s.gridCol} />
        </View>

        {/* Datas */}
        <SectionHeader title="Datas" />
        <View style={s.gridRow}>
          <Field label="Data prevista para entrega das chaves" value={fmtDateBR(ficha.data_prevista_entrega_chaves)} />
          <Field label="1° Aluguel vencimento em" value={fmtDateBR(ficha.data_primeiro_aluguel_vencimento)} />
          <View style={s.gridCol} />
        </View>

        {/* Autorizações LGPD */}
        <SectionHeader title="Autorizações (LGPD)" />
        <CheckItem
          checked={ficha.autoriza_analise_documental}
          text="AUTORIZO MINHA ANÁLISE DOCUMENTAL PARA EFETIVAR A PROPOSTA COMERCIAL DE LOCAÇÃO."
        />
        <CheckItem
          checked={ficha.autoriza_proposta_analise_inclusa}
          text="EFETIVAR MINHA PROPOSTA, ANÁLISE INCLUSA."
        />
        <CheckItem
          checked={ficha.autoriza_correspondencias}
          text="AUTORIZO EM CASO DE NECESSIDADES ENVIAR CORRESPONDÊNCIAS E ENCOMENDAS PARA O ENDEREÇO REFERIDO NESSA FICHA."
        />
        <Text style={s.lgpd}>
          Essa ficha cadastral está de acordo com a Lei Geral de Proteção de Dados (LGPD) — Lei nº 13.709, de 14 de agosto de 2018, que regulamenta o tratamento de dados pessoais no Brasil.
        </Text>

        {/* Assinaturas */}
        <SectionHeader title="Assinaturas" />
        <View style={s.sigRow}>
          <View style={s.sigBlock}>
            {ficha.assinatura_cliente1_url ? (
              <Image src={ficha.assinatura_cliente1_url} style={{ width: 100, height: 40, objectFit: 'contain', marginBottom: 4 }} />
            ) : (
              <View style={{ height: 44 }} />
            )}
            <Text style={s.sigLine}>Assinatura do Cliente (1)</Text>
            <Text style={{ fontSize: 8, color: '#5A6070', textAlign: 'center', marginTop: 2 }}>{c1.nome_completo}</Text>
          </View>
          <View style={s.sigBlock}>
            {c2 && (
              <>
                {ficha.assinatura_cliente2_url ? (
                  <Image src={ficha.assinatura_cliente2_url} style={{ width: 100, height: 40, objectFit: 'contain', marginBottom: 4 }} />
                ) : (
                  <View style={{ height: 44 }} />
                )}
                <Text style={s.sigLine}>Assinatura do Cliente (2)</Text>
                <Text style={{ fontSize: 8, color: '#5A6070', textAlign: 'center', marginTop: 2 }}>{c2.nome_completo}</Text>
              </>
            )}
          </View>
        </View>

      </Page>
    </Document>
  )
}
