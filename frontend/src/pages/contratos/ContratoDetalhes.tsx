import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileDown, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { StatusBadge } from '@/components/common/StatusBadge'
import { contractService } from '@/services'
import type { Contract } from '@/types'
import { currency, fmtShortDate } from '@/lib/format'
import { useAuth } from '@/stores/auth'

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, lineHeight: 1.5, fontFamily: 'Helvetica' },
  h1: { fontSize: 18, marginBottom: 14, fontWeight: 700, color: '#1B3A5C' },
  h2: { fontSize: 12, marginTop: 14, marginBottom: 6, fontWeight: 700, color: '#1B3A5C', textTransform: 'uppercase' },
  small: { fontSize: 9, color: '#5A6070' },
  row: { flexDirection: 'row', gap: 12 },
  block: { marginBottom: 8 },
  divider: { borderBottomWidth: 1, borderBottomColor: '#E2DDD6', marginVertical: 8 },
  signLine: { borderTopWidth: 1, borderTopColor: '#1A1A2E', width: 220, marginTop: 36, paddingTop: 4 },
})

function ContratoPDF({ c }: { c: Contract }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Contrato de Locacao Residencial</Text>
        <Text style={styles.small}>{c.tenant?.nome} · CNPJ {c.tenant?.cnpj}</Text>

        <Text style={styles.h2}>1. Das Partes</Text>
        <Text style={styles.block}>
          <Text>LOCADOR: </Text>{c.locador?.nome} (e-mail: {c.locador?.email}).
        </Text>
        <Text style={styles.block}>
          <Text>LOCATARIO: </Text>{c.locatario?.nome} (e-mail: {c.locatario?.email}).
        </Text>
        <Text style={styles.block}>
          <Text>INTERMEDIARIA: </Text>{c.tenant?.nome}, representada por seu corretor {c.corretor?.nome}.
        </Text>

        <Text style={styles.h2}>2. Do Imovel</Text>
        <Text style={styles.block}>{c.property?.titulo} - {c.property?.endereco}, {c.property?.bairro}, {c.property?.cidade}. CEP {c.property?.cep || '-'}. Area {c.property?.area_m2 || '-'}m2.</Text>

        <Text style={styles.h2}>3. Do Prazo</Text>
        <Text style={styles.block}>O presente contrato tera vigencia de {fmtShortDate(c.data_inicio)} a {fmtShortDate(c.data_fim)}.</Text>

        <Text style={styles.h2}>4. Do Valor e Forma de Pagamento</Text>
        <Text style={styles.block}>Aluguel mensal de {currency(c.valor_aluguel)}, com vencimento todo dia {c.dia_vencimento}. Reajuste anual pelo indice {c.indice_reajuste || 'IGPM'}.</Text>

        <Text style={styles.h2}>5. Obrigacoes do Locatario</Text>
        <Text style={styles.block}>Pagar pontualmente o aluguel, conservar o imovel, comunicar danos e devolver ao final do contrato nas mesmas condicoes.</Text>

        <Text style={styles.h2}>6. Obrigacoes do Locador</Text>
        <Text style={styles.block}>Entregar o imovel em perfeitas condicoes, garantir o uso pacifico e responder por vicios anteriores a entrega.</Text>

        <Text style={styles.h2}>7. Rescisao</Text>
        <Text style={styles.block}>Em caso de rescisao antecipada, sera aplicada multa proporcional ao tempo restante do contrato, nos termos da Lei 8.245/91.</Text>

        <Text style={styles.h2}>8. Clausulas Adicionais</Text>
        <Text style={styles.block}>{c.clausulas || 'Sem clausulas adicionais.'}</Text>

        <View style={styles.divider} />
        <View style={[styles.row, { justifyContent: 'space-between', marginTop: 16 }] as any}>
          <View><Text style={styles.signLine}>Locador</Text><Text style={styles.small}>{c.locador?.nome}</Text></View>
          <View><Text style={styles.signLine}>Locatario</Text><Text style={styles.small}>{c.locatario?.nome}</Text></View>
        </View>
        <Text style={[styles.small, { marginTop: 18 }] as any}>{c.property?.cidade || 'Sao Paulo'}, {fmtShortDate(new Date().toISOString().slice(0, 10))}.</Text>
      </Page>
    </Document>
  )
}

export default function ContratoDetalhes() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [encerrando, setEncerrando] = useState(false)

  useEffect(() => { if (id) contractService.get(id).then(setData).finally(() => setLoading(false)) }, [id])

  async function encerrar() {
    if (!data) return
    if (!confirm('Encerrar este contrato? O imovel voltara para disponivel.')) return
    setEncerrando(true)
    try {
      await contractService.encerrar(data.id)
      toast.success('Contrato encerrado.')
      setData({ ...data, status: 'encerrado' })
    } finally { setEncerrando(false) }
  }

  if (loading) return <AppLayout><LoadingScreen /></AppLayout>
  if (!data) return <AppLayout><p className="text-ink-secondary">Contrato nao encontrado.</p></AppLayout>

  const base = user?.role === 'corretor' ? '/corretor/contratos' : '/admin/contratos'
  return (
    <AppLayout>
      <button onClick={() => navigate(base)} className="btn-ghost mb-4"><ArrowLeft size={16}/> Voltar para contratos</button>
      <PageHeader
        eyebrow="Contrato"
        title={`Contrato · ${data.property?.titulo}`}
        description={`${fmtShortDate(data.data_inicio)} ate ${fmtShortDate(data.data_fim)}`}
        actions={
          <>
            <StatusBadge variant={data.status === 'ativo' ? 'success' : 'neutral'}>{data.status}</StatusBadge>
            <PDFDownloadLink document={<ContratoPDF c={data} />} fileName={`contrato-${data.id}.pdf`} className="btn-primary">
              {({ loading }) => (<><FileDown size={16}/> {loading ? 'Gerando…' : 'Baixar PDF'}</>)}
            </PDFDownloadLink>
            {data.status === 'ativo' && (user?.role === 'admin' || user?.role === 'corretor') && (
              <button className="btn-danger" onClick={encerrar} disabled={encerrando}>{encerrando ? 'Encerrando…' : 'Encerrar contrato'}</button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card-premium p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Aluguel" value={currency(data.valor_aluguel)} />
            <Info label="Dia de vencimento" value={`Dia ${data.dia_vencimento}`} />
            <Info label="Indice de reajuste" value={data.indice_reajuste || '—'} />
            <Info label="Status" value={data.status} />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-ink-muted mb-1">Clausulas</div>
            <p className="text-sm text-ink whitespace-pre-wrap">{data.clausulas || 'Sem clausulas adicionais.'}</p>
          </div>
        </div>
        <div className="space-y-4">
          <Card title="Locatario"><div>{data.locatario?.nome}</div><div className="text-xs text-ink-muted">{data.locatario?.email}</div></Card>
          <Card title="Locador"><div>{data.locador?.nome}</div><div className="text-xs text-ink-muted">{data.locador?.email}</div></Card>
          <Card title="Corretor"><div>{data.corretor?.nome}</div><div className="text-xs text-ink-muted">{data.corretor?.email}</div></Card>
        </div>
      </div>
    </AppLayout>
  )
}

function Info({ label, value }: { label: string; value: any }) { return <div><div className="text-[11px] uppercase tracking-wider text-ink-muted">{label}</div><div className="font-medium text-ink">{value}</div></div> }
function Card({ title, children }: { title: string; children: any }) { return <div className="card-premium p-4"><div className="text-xs uppercase tracking-wider text-ink-muted mb-2">{title}</div><div className="text-sm">{children}</div></div> }
