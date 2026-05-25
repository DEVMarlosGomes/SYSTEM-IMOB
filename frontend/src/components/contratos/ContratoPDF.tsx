import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { DadosContrato } from '@/types/contrato.types'
import { valorExtenso, numeroPorExtenso, diaExtenso, dataExtenso } from '@/lib/extenso'

// ── helpers ───────────────────────────────────────────────────────────────────

function dataBR(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function dataAssinaturaBR(iso: string, cidade: string): string {
  if (!iso) return ''
  const MESES = ['janeiro','fevereiro','março','abril','maio','junho',
    'julho','agosto','setembro','outubro','novembro','dezembro']
  const [y, m, d] = iso.split('-').map(Number)
  return `${cidade}, ${d} de ${MESES[m - 1].toUpperCase()} de ${y}.`
}

// ── styles ────────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    paddingTop: 90,
    paddingBottom: 55,
    paddingHorizontal: 60,
    fontSize: 10,
    lineHeight: 1.55,
    fontFamily: 'Times-Roman',
    color: '#000',
  },
  // ── Fixed header / footer ──
  header: {
    position: 'absolute',
    top: 18,
    left: 60,
    right: 60,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 3,
  },
  headerCompany: { fontSize: 9, fontFamily: 'Times-Bold', textTransform: 'uppercase' },
  headerCreci:   { fontSize: 9 },
  headerRight:   { fontSize: 9, fontFamily: 'Times-Bold', color: '#1B3A5C' },
  headerLine:    { borderBottomWidth: 0.75, borderBottomColor: '#000', marginBottom: 3 },
  headerContact: { fontSize: 7.5, textAlign: 'center', color: '#333' },

  footer: {
    position: 'absolute',
    bottom: 18,
    left: 60,
    right: 60,
    borderTopWidth: 0.5,
    borderTopColor: '#888',
    paddingTop: 4,
  },
  footerContact: { fontSize: 7.5, textAlign: 'center', color: '#444' },
  footerPage:    { fontSize: 7.5, textAlign: 'right', color: '#666', marginTop: 2 },

  // ── Title ──
  title: {
    fontFamily: 'Times-Bold',
    fontSize: 16,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 14,
    letterSpacing: 1,
  },

  // ── Sections (I–VIII) ──
  secNum: {
    fontFamily: 'Times-Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 2,
  },
  secBody: { fontSize: 10, textAlign: 'justify', marginBottom: 3 },
  secIndent: { fontSize: 10, textAlign: 'justify', marginLeft: 12, marginBottom: 2 },

  // ── Clauses ──
  clauseTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 3,
  },
  clauseBody: { fontSize: 10, textAlign: 'justify', marginBottom: 5, lineHeight: 1.6 },
  paraTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 10,
    marginTop: 6,
    marginBottom: 2,
  },

  divider: { borderBottomWidth: 0.5, borderBottomColor: '#888', marginVertical: 10 },

  // ── Signatures ──
  sigSection: { marginTop: 36 },
  sigClosing: { fontSize: 10, textAlign: 'justify', marginBottom: 6, lineHeight: 1.6 },
  sigDate: { fontSize: 10, textAlign: 'center', marginBottom: 32, marginTop: 6 },
  sigRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  sigBlock: { width: '45%', alignItems: 'center' },
  sigBlockFull: { width: '90%', alignItems: 'center', marginHorizontal: 'auto' },
  sigLine: {
    borderTopWidth: 1, borderTopColor: '#000', width: '100%',
    paddingTop: 5, textAlign: 'center', fontSize: 10, fontFamily: 'Times-Bold',
  },
  sigName: { fontSize: 9, textAlign: 'center', marginTop: 2 },

  bold: { fontFamily: 'Times-Bold' },
})

function B({ c }: { c: string }) {
  return <Text style={S.bold}>{c}</Text>
}

// ── Fixed Header & Footer (every page) ───────────────────────────────────────

function PageHeader() {
  return (
    <View style={S.header} fixed>
      <View style={S.headerRow}>
        <View>
          <Text style={S.headerCompany}>IMOBVIP CONSULTORIA IMOBILIARIA</Text>
          <Text style={S.headerCreci}>CRECI 41.440-J</Text>
        </View>
        <Text style={S.headerRight}>ImobVip</Text>
      </View>
      <View style={S.headerLine} />
      <Text style={S.headerContact}>
        Escritório (11) 96656-1001 | WhatsApp: (11) 98220-2168{'\n'}
        EMAIL diretoria@imobvipimobiliaria.com.br | SITE www.imobvipimobiliaria.com.br
      </Text>
      <View style={{ borderBottomWidth: 0.5, borderBottomColor: '#ccc', marginTop: 3 }} />
    </View>
  )
}

function PageFooter() {
  return (
    <View style={S.footer} fixed>
      <Text style={S.footerContact}>
        Escritório (11) 96656-1001 | WhatsApp: (11) 98220-2168{'\n'}
        EMAIL diretoria@imobvipimobiliaria.com.br | SITE www.imobvipimobiliaria.com.br
      </Text>
      <Text
        style={S.footerPage}
        render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
      />
    </View>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function ContratoPDF({ dados }: { dados: DadosContrato }) {
  const vEx    = valorExtenso(dados.valor_aluguel)
  const cEx    = valorExtenso(dados.valor_caucao)
  const mEx    = numeroPorExtenso(dados.prazo_meses).toUpperCase()
  const cmEx   = numeroPorExtenso(dados.num_meses_caucao).toUpperCase()
  const pesEx  = numeroPorExtenso(dados.num_pessoas).toUpperCase()
  const diaEx  = diaExtenso(dados.dia_vencimento).toUpperCase()
  const dIn    = dataBR(dados.data_inicio)
  const dFim   = dataBR(dados.data_termino)
  const dCauc  = dataBR(dados.data_deposito_caucao)
  const dPrim  = dataBR(dados.data_primeiro_aluguel)
  const hasL2  = !!dados.locatario2_nome?.trim()

  const garagem = dados.tem_vaga_garagem
    ? `COM ${dados.identificacao_apto}`
    : dados.identificacao_apto

  return (
    <Document
      title={`Contrato de Locação - ${dados.locatario_nome}`}
      author="ImobVip Consultoria Imobiliaria"
    >
      <Page size="A4" style={S.page}>
        <PageHeader />
        <PageFooter />

        {/* ── Título ── */}
        <Text style={S.title}>CONTRATO DE LOCAÇÃO</Text>

        {/* ── I — Locadora ── */}
        <Text style={S.secNum}>I - LOCADORA:</Text>
        <Text style={S.secBody}>
          <B c={`${dados.locador_nome},`} />{' '}
          {dados.locador_nacionalidade}, {dados.locador_estado_civil},{' '}
          <B c={dados.locador_profissao.toUpperCase() + ','} />{' '}
          portador do <B c={`RG nº ${dados.locador_rg}`} />, e{' '}
          <B c={`CPF nº ${dados.locador_cpf}`} />
        </Text>

        {/* ── II — Locatário(s) ── */}
        <Text style={S.secNum}>II - LOCATÁRIO 1:</Text>
        <Text style={S.secBody}>
          <B c={`${dados.locatario_nome},`} />{' '}
          {dados.locatario_nacionalidade}, {dados.locatario_estado_civil},{' '}
          <B c={dados.locatario_profissao.toUpperCase() + ','} />{' '}
          portador do <B c={`RG nº ${dados.locatario_rg}`} />, e{' '}
          <B c={`CPF nº ${dados.locatario_cpf}.`} />
        </Text>

        {hasL2 && (
          <>
            <Text style={S.secNum}>LOCATÁRIO 2:</Text>
            <Text style={S.secBody}>
              <B c={`${dados.locatario2_nome!},`} />{' '}
              {dados.locatario2_nacionalidade}, {dados.locatario2_estado_civil},{' '}
              <B c={(dados.locatario2_profissao || '').toUpperCase() + ','} />{' '}
              portador do <B c={`RG nº ${dados.locatario2_rg}`} />, e{' '}
              <B c={`CPF nº ${dados.locatario2_cpf}.`} />
            </Text>
          </>
        )}

        {/* ── III — Objeto ── */}
        <Text style={S.secNum}>III - OBJETO DO CONTRATO:</Text>
        <Text style={S.secIndent}>
          - Tipo: {dados.tipo_imovel}.–COM{'  '}<B c={garagem} />
        </Text>
        <Text style={S.secIndent}>
          {'-Local:  '}
          <B c={`${dados.nome_condominio} – ${dados.endereco_completo}`} />
        </Text>
        <Text style={S.secIndent}>
          {'- Finalidade: '}
          <B c={dados.finalidade.toUpperCase()} />
          {' apenas'}
        </Text>

        {/* ── IV — Prazo ── */}
        <Text style={S.secNum}>IV - PRAZO</Text>
        <Text style={S.secIndent}>{'- TOTAL: '}<B c={`${dados.prazo_meses} (${mEx}) MESES`} /></Text>
        <Text style={S.secIndent}>{'- INÍCIO: '}<B c={dIn} /></Text>
        <Text style={S.secIndent}>{'-TÉRMINO: '}<B c={dFim} /></Text>

        {/* ── V — Valores ── */}
        <Text style={S.secNum}>V - VALORES</Text>
        <Text style={S.secIndent}>
          {'-VALOR:  '}
          <B c={`R$ ${dados.valor_aluguel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${vEx}).`} />
        </Text>
        <Text style={S.secIndent}>
          {'-DATA DE PAGAMENTO:  '}
          <B c={`TODO DIA ${dados.dia_vencimento} (${diaEx}) DE CADA MÊS`} />
        </Text>
        <Text style={S.secIndent}>
          {'-REAJUSTE:  '}
          <B c="DE 01 (UM) ANO, OU CONFORME ALTERAÇÃO DA LEI" />
        </Text>
        <Text style={S.secIndent}>
          {'-ÍNDICE DE REAJUSTE:  '}
          <B c={`ANUAL/${dados.indice_reajuste}`} />
        </Text>

        {/* ── VI — Utilização ── */}
        <Text style={S.secNum}>VI – UTILIZAÇÃO DO IMOVEL</Text>
        <Text style={S.secBody}>
          {dados.finalidade}, para {dados.num_pessoas}({pesEx}) pessoa(s), ou seja,{'  '}
          <B c={dados.nomes_moradores.toUpperCase() + '.'} />
        </Text>

        {/* ── VII — Vistoria ── */}
        <Text style={S.secNum}>VII –</Text>
        <Text style={S.secBody}>
          Declaro que{' '}
          <B c="vistoriei o imóvel no ato da assinatura" />
          {' '}e concordo entregar nas condições que encontrei, inclusive estou ciente do estado, e estou satisfeito com as condições atuais do imóvel e irei devolver nas mesmas condições paredes, pintura, elétrica e hidráulica.
        </Text>

        {/* ── VIII — Garantia ── */}
        <Text style={S.secNum}>VIII – GARANTIA</Text>
        <Text style={S.secBody}>
          Como garantia de fiança o{' '}
          <B c="LOCATÁRIO (a)" />
          {' '}depositará no ato de assinatura do contrato uma caução no valor de{' '}
          <B c={`R$ ${dados.valor_caucao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${cEx})`} />
          {', '}equivalente a{' '}
          <B c={`${dados.num_meses_caucao} (${cmEx})`} />
          {' '}meses de aluguel, no dia{' '}
          {dCauc}
          {' '}na conta corrente regulamentada para esse fim, conta nº{' '}
          <B c="35120-2" />
          {', '}Agencia{' '}
          <B c="0100" />
          {' '}do{' '}
          <B c="Banco Bradesco" />
          {' '}ou{' '}
          <B c="PIX 11 98220-2168 NUBANK" />
          {' '}em nome da ADMINISTRADORA que fará o repasse para o proprietário.
        </Text>
        <Text style={S.secBody}>
          Fica combinado Locador e locatário pagamento do primeiro aluguel com vencimento a partir de:{' '}
          <B c={dPrim + '.'} />
        </Text>

        {/* ── Parágrafos da Caução ── */}
        <Text style={S.paraTitle}>Parágrafo Primeiro:</Text>
        <Text style={S.clauseBody}>
          Ao final do presente contrato ou, em havendo rescisão unilateral por parte do{' '}
          <B c="LOCATÁRIO (a)" />
          {' '}nas condições especificadas na{' '}
          <B c="CLÁUSULA DÉCIMA" />
          {', '}o mesmo levantará a importância referente à caução{' '}
          <B c={`R$ ${dados.valor_caucao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${cEx})`} />
          {', '}acrescida da incidência de correção monetária e juros nos termos da regulamentação da caderneta de poupança, desde que em dia com os seus alugueres.
        </Text>

        <Text style={S.paraTitle}>Parágrafo Segundo:</Text>
        <Text style={S.clauseBody}>
          A importância depositada na conta poupança, aberta somente em nome do LOCADOR, não pode ser movimentada unilateralmente pelas partes, estando as obrigações contratuais em dia.
        </Text>

        <Text style={S.paraTitle}>Parágrafo Terceiro:</Text>
        <Text style={S.clauseBody}>
          Se o valor inadvertidamente sobrepujar o valor dos três alugueres, poderá o{' '}
          <B c="LOCATÁRIO (a)" />
          {' '}pleitear o levantamento do excesso. Por outro lado, toda vez que o valor do aluguel for reajustado, além dos índices de correção, poderá a{' '}
          <B c="LOCADOR" />
          {' '}exigir o complemento da caução, sob pena de essa garantia se tornar insuficiente e ineficaz.
        </Text>

        {/* ── CLÁUSULA PRIMEIRA ── */}
        <Text style={S.clauseTitle}>CLÁUSULA PRIMEIRA:</Text>
        <Text style={S.clauseBody}>
          O prazo da locação é o constante no item{' '}
          <B c="IV" />
          {', '}iniciando-se no dia{' '}
          <B c={dIn} />
          {' '}e findando-se em{' '}
          <B c={dFim} />
          {', '}quando então será considerada finda, independentemente de notificação judicial ou extrajudicial, obrigando-se o(a){' '}
          <B c="LOCATÁRIO(A)" />
          {' '}a restituir o imóvel, completamente livre e desocupado de bens e pessoas, nas condições previstas neste contrato, sob pena de incorrer da multa da cláusula 9°, e de se sujeitar ao disposto no artigo 565 ao 578 da Lei No. 10.406 de 10 de janeiro de 2002 do Novo Código Civil Brasileiro;
        </Text>

        <Text style={S.paraTitle}>PARÁGRAFO PRIMEIRO:</Text>
        <Text style={S.clauseBody}>
          Caso o{' '}
          <B c="LOCATARIO" />
          {' '}pretenda continuar no imóvel, deverá comunicar por escrito, com antecedência mínima de{' '}
          <B c="60 (SESSENTA)" />
          {' '}dias, antes do término do contrato acima estipulado. Se houver interesse do{' '}
          <B c="LOCADOR" />
          {' '}na continuidade, serão estudadas novas bases e condições do contrato, do qual não fica o{' '}
          <B c="LOCADOR" />
          {' '}obrigado a renovar.
        </Text>

        <Text style={S.paraTitle}>PARÁGRAFO SEGUNDO:</Text>
        <Text style={S.clauseBody}>
          Caso o{' '}
          <B c="LOCATARIO" />
          {' '}pretenda desocupar o imóvel, deverá comunicar por escrito, com antecedência mínima de{' '}
          <B c="30 (TRINTA)" />
          {' '}dias, a fim de tomar conhecimento dos procedimentos, bem como agendamento de vistorias de saída.
        </Text>

        <Text style={S.paraTitle}>PARÁGRAFO TERCEIRO:</Text>
        <Text style={S.clauseBody}>
          Qualquer benfeitoria ou construção realizada no imóvel, sejam elas necessárias, úteis ou voluptuárias, à este ficará incorporado, renunciando o{' '}
          <B c="LOCATARIO" />
          {', '}desde já a qualquer direito à indenização ou pagamento pelas mesmas.
        </Text>

        {/* ── CLÁUSULA SEGUNDA ── */}
        <Text style={S.clauseTitle}>CLÁUSULA SEGUNDA:</Text>
        <Text style={S.clauseBody}>
          O aluguel convencionado é de{' '}
          <B c={`R$ ${dados.valor_aluguel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${vEx})`} />
          {', '}mensais, devendo ser pago até o dia{' '}
          <B c={`${dados.dia_vencimento} (${diaEx})`} />
          {' '}do mês subsequente ao vencido.
        </Text>

        <Text style={S.paraTitle}>PARÁGRAFO PRIMEIRO:</Text>
        <Text style={S.clauseBody}>
          O valor do aluguel será anualmente reajustado, segundo os índices do IGP-M acumulados no período e, no caso de sua extinção, de forma alternativa e subsidiária, outro índice correspondente;
        </Text>

        <Text style={S.paraTitle}>PARÁGRAFO SEGUNDO:</Text>
        <Text style={S.clauseBody}>
          O aluguel será pago através de depósito na conta do administrador{' '}
          <B c="BANCO BRADESCO – AG 0100 – CC 35120-2" />
          {', '}ou{' '}
          <B c="BOLETO BANCARIO OU PIX NUBANK." />
        </Text>

        <Text style={S.paraTitle}>PARÁGRAFO TERCEIRO:</Text>
        <Text style={S.clauseBody}>
          O não pagamento do aluguel até a data estipulada pelo caput da Cláusula Segunda acarretará no acréscimo de 20% (vinte por cento) sobre o valor do aluguel, até o limite de 19 (dezenove) dias, quando a multa será de 30% (trinta por cento), acrescidos, ainda, de juros de mora de 01% (um por cento) ao mês ou fração e atualização monetária pelo IGP-M ao dia.
        </Text>

        {/* ── CLÁUSULA TERCEIRA ── */}
        <Text style={S.clauseTitle}>CLÁUSULA TERCEIRA:</Text>
        <Text style={S.clauseBody}>
          Além do aluguel, obriga-se o(a){' '}
          <B c="LOCATÁRIO(a)" />
          {' '}a efetuar o pagamento dos seguintes encargos, que serão exigidos juntamente com o aluguel:
        </Text>
        <Text style={S.clauseBody}>{'a- '}O consumo de água, energia elétrica, gás. (Caso haja individualização)</Text>
        <Text style={S.clauseBody}>
          {'b- '}O prêmio de seguro contra incêndio, que deverá ser feito pelo valor do mercado do imóvel, nele figurando o(a) LOCADOR(a) como beneficiário(a), caso não haja contratação em 30 dias a partir da data de início considerar imediata rescisão do contrato e devida multa aplicada.
        </Text>
        <Text style={S.clauseBody}>{'c- '}As taxas de condomínio.</Text>
        <Text style={S.clauseBody}>
          {'d- '}Os demais encargos e tributos que normalmente incidem ou venham a incidir sobre o imóvel.
        </Text>

        <Text style={S.paraTitle}>PARÁGRAFO PRIMEIRO:</Text>
        <Text style={S.clauseBody}>
          <B c="Foi acordado entre o LOCADOR/LOCATÁRIO, que o pagamento do IPTU E CONDOMINIO já estão inclusos no valor da locação/pacote." />
        </Text>

        <Text style={S.paraTitle}>PARÁGRAFO SEGUNDO:</Text>
        <Text style={S.clauseBody}>
          O não pagamento desses encargos nas épocas próprias, facultará ao(a) LOCADOR(A) ajustar e cusar ao recebimento dos alugueres, sujeitando-se o(a) LOCATÁRIO(A) ao pagamento dos ônus decorrentes do inadimplemento, previstos para cada débito, independentemente de eventual ação de despejo.
        </Text>

        <Text style={S.paraTitle}>PARÁGRAFO TERCEIRO:</Text>
        <Text style={S.clauseBody}>
          Desde já, o{' '}
          <B c="LOCATÁRIO" />
          {' '}autoriza a transferência para o seu nome junto a concessionária fornecedora as contas de consumo correspondentes ao imóvel, Energia Elétrica e outros que ficarão sob sua responsabilidade enquanto a locação estiver vigente.
        </Text>

        <Text style={S.paraTitle}>PARÁGRAFO QUARTO:</Text>
        <Text style={S.clauseBody}>
          No pagamento de aluguéis e encargos, o locatário obriga-se a apresentar cópia dos recibos quitados referentes às taxas que ficaram sob sua responsabilidade (água, luz, condomínio e outros) sob pena da cobrança dos débitos por via judicial, adotado para o presente contrato, os recibos de quitação da água e condomínio serão fornecidos pelo LOCADOR no ato do pagamento do aluguel junto a imobiliária;
        </Text>

        {/* ── CLÁUSULA QUARTA ── */}
        <Text style={S.clauseTitle}>CLÁUSULA QUARTA:</Text>
        <Text style={S.clauseBody}>
          O imóvel objeto deste instrumento é locado exclusivamente para{' '}
          <B c="RESIDENCIAIS" />
          {' '}do(a) LOCATÁRIO(a) não podendo sua destinação ser alterada, substituída ou acrescida de qualquer outra, sem prévia e expressa anuência do(a) LOCADOR(A).
        </Text>

        <Text style={S.paraTitle}>PARÁGRAFO PRIMEIRO:</Text>
        <Text style={S.clauseBody}>
          Fica vedado, outrossim, a sublocação, cessão ou transferência desse contrato, bem como o empréstimo, parcial ou total do imóvel locado, que dependerão também de prévia e expressa anuência do(a) LOCADOR(A).
        </Text>

        <Text style={S.paraTitle}>PARÁGRAFO SEGUNDO:</Text>
        <Text style={S.clauseBody}>
          O(a) LOCATÁRIO(a) não poderá fazer no imóvel ou em suas dependências, quaisquer obras ou benfeitorias, sem prévia e expressa anuência do(a) LOCADOR(a), não lhe cabendo direito de retenção, por aquelas que, mesmo necessária ou consentidas, venham a ser realizadas.
        </Text>

        {/* ── CLÁUSULA QUINTA ── */}
        <Text style={S.clauseTitle}>CLÁUSULA QUINTA:</Text>
        <Text style={S.clauseBody}>
          O locatário declara para todos os fins e efeitos de direito, que recebe o imóvel locado no estado em que se encontra de conservação e uso, identificado no Relatório referente ao estado de uso e conservação do imóvel o qual é parte integrante deste contrato assinado por todos os contratantes, obrigando-se a devolvê-lo, uma vez finda a locação, nas mesmas condições em que o recebeu, razão pela qual, no momento da restituição das chaves, proceder-se-á a uma nova vistoria.
        </Text>

        <Text style={S.paraTitle}>PARÁGRAFO PRIMEIRO:</Text>
        <Text style={S.clauseBody}>
          Constatadas eventuais irregularidades e a necessidade de reparos no imóvel em decorrência de uso indevido, fará o(a) Locador(a) apresentar de imediato ao(à) Locatário(a), um orçamento prévio assinado por profissional do ramo, sendo-lhe facultado pagar o valor nele declinado, liberando-se assim de eventuais ônus em razão de demora e/ou imperfeições nos serviços. Caso contrário, poderá contratar por sua própria conta e risco mão de obra especializada, arcando nessa condição com os riscos de eventuais imperfeições dos serviços e pelo pagamento do aluguel dos dias despendidos para a sua execução, cessando a locação unicamente com o "Termo de Entrega de Chaves e Vistoria", firmado pelo(a) Locador(a).
        </Text>

        <Text style={S.paraTitle}>PARÁGRAFO SEGUNDO:</Text>
        <Text style={S.clauseBody}>
          Caso a irregularidade se der em virtude de defeito no imóvel, cuja obrigação pelo reparo seja do(a) LOCADOR(a), deverá o(a) LOCATÁRIO(a) protocolizar reclamação ao LOCADOR(a), qual tomará providências no sentido de que venha a sanar o defeito, desde que confirmada a sua responsabilidade.
        </Text>

        <Text style={S.paraTitle}>PARÁGRAFO TERCEIRO:</Text>
        <Text style={S.clauseBody}>
          O(a) LOCATÁRIO(a) está plenamente ciente que o imóvel locado encontra-se em área sujeita a grande incidência de umidade, fato que poderá ocasionar efeitos indesejados nas paredes e na pintura do imóvel, bem como nos móveis, vestuário e utensílios de uso geral, responsabilizando-se pela devida ventilação do imóvel, qual é notória nesta Comarca de Itaquaquecetuba.
        </Text>

        {/* ── CLÁUSULA SEXTA ── */}
        <Text style={S.clauseTitle}>CLÁUSULA SEXTA:</Text>
        <Text style={S.clauseBody}>
          O Locatário declara e confessa que verificou junto ao Poder Público a possibilidade de utilizar o imóvel para a finalidade desejada, tendo constatado ser possível essa utilização e a mesma não contrariar as normas vigentes, inclusive no tocante a Lei de zoneamento, uso ocupação e restrições bem como no tocante a regularidade de edificação, isentando o(a) LOCADOR(a) de toda e quaisquer penalidades aplicadas, bem como aquelas previstas neste instrumento de contrato em razão da infração as suas cláusulas, não cabendo direito de rescisão deste contrato.
        </Text>

        <Text style={S.paraTitle}>PARÁGRAFO PRIMEIRO:</Text>
        <Text style={S.clauseBody}>
          Obriga-se o(a) LOCATÁRIO(A) a manter o imóvel sempre limpo e bem cuidado na vigência da locação, correndo por sua conta e risco, não só os pequenos reparos tendentes a sua conservação, mas também as multas a que der causa, por inobservância de quaisquer leis, decretos e/ou regulamentos.
        </Text>

        <Text style={S.paraTitle}>PARÁGRAFO SEGUNDO:</Text>
        <Text style={S.clauseBody}>
          Nenhuma intimação do Serviço Sanitário ou da Vigilância Sanitária será motivo para o locatário abandonar o imóvel ou pedir rescisão deste contrato, salvo procedendo vistoria judicial que apure estar a construção ameaçando ruir;
        </Text>

        <Text style={S.paraTitle}>PARÁGRAFO TERCEIRO:</Text>
        <Text style={S.clauseBody}>
          Obriga-se desde já o(a) locatário(a), a respeitar os regulamentos e as leis vigentes, bem como o direito de vizinhança, evitando a prática de quaisquer atos que possam perturbar a tranquilidade ou ameaçar a saúde pública.
        </Text>

        {/* ── CLÁUSULA SÉTIMA ── */}
        <Text style={S.clauseTitle}>CLÁUSULA SÉTIMA:</Text>
        <Text style={S.clauseBody}>
          O locatário desde já autoriza o locador, ou seu representante legal, a examinar ou vistoriar o imóvel locado, quando este último entender conveniente;
        </Text>

        {/* ── CLÁUSULA OITAVA ── */}
        <Text style={S.clauseTitle}>CLÁUSULA OITAVA:</Text>
        <Text style={S.clauseBody}>
          No caso de inobservância pelo{' '}
          <B c="LOCATÁRIO" />
          {', '}de quaisquer das cláusulas do presente contrato, fica o{' '}
          <B c="LOCADOR" />
          {', '}desde já, autorizado a resgatar o valor caucionado, a qualquer momento, mesmo antes do prazo final deste contrato, inclusive com a correção devida, independentemente de interpelação judicial ou extrajudicial, pagando-se de qualquer importância que lhe seja devida, fazendo a restituição ao{' '}
          <B c="LOCATÁRIO" />
          {' '}do saldo que porventura haja em seu favor. Na hipótese de ser contestado pelo{' '}
          <B c="LOCATÁRIO" />
          {' '}o valor apresentado, e ser ajuizada a competente ação de prestação de contas, correrão por conta deste todas as despesas, custas e honorários de advocatícios.
        </Text>

        {/* ── CLÁUSULA NONA ── */}
        <Text style={S.clauseTitle}>CLÁUSULA NONA:</Text>
        <Text style={S.clauseBody}>
          No caso de morte, falência, insolvência, ou inadimplência declarada, mudança de domicílio ou outra situação modificativa das condições originais do caucionante, o{' '}
          <B c="LOCATÁRIO" />
          {' '}(a) se obriga, dentro do prazo de 30 (trinta) dias, a dar substituto idôneo, a juízo do{' '}
          <B c="LOCADOR" />
          {' '}(a), podendo considerar simultaneamente rescindido o contrato;
        </Text>

        {/* ── CLÁUSULA DÉCIMA ── */}
        <Text style={S.clauseTitle}>CLÁUSULA DÉCIMA:</Text>
        <Text style={S.clauseBody}>
          A falta de cumprimento de qualquer cláusula ou condição deste instrumento implicará na sua imediata rescisão, ficando a parte infratora, sujeita ao pagamento de uma multa, equivalente a{' '}
          <B c="03 (TRÊS)" />
          {' '}meses de aluguel, pelo valor vigente à época da infração, além de perdas e danos;
        </Text>

        {/* ── CLÁUSULA DÉCIMA PRIMEIRA ── */}
        <Text style={S.clauseTitle}>CLÁUSULA DÉCIMA PRIMEIRA:</Text>
        <Text style={S.clauseBody}>
          Ficam ainda, as duas partes cientes que se a desocupação ocorrer antes do período determinado, a multa conforme a clausula décima, será cobrada proporcionalmente ao tempo restante para o término do contrato.
        </Text>
        <Text style={S.paraTitle}>PARÁGRAFO ÚNICO:</Text>
        <Text style={S.clauseBody}>
          <B c="Fica facultado ao LOCADOR(a) em caso de rescisão após 12 (DOZE) meses a isenção da cobrança referente a multa disposta na CLÁUSULA DÉCIMA." />
        </Text>

        {/* ── CLÁUSULA DÉCIMA SEGUNDA ── */}
        <Text style={S.clauseTitle}>CLÁUSULA DÉCIMA SEGUNDA:</Text>
        <Text style={S.clauseBody}>
          O(s) locatário(s) autoriza(m) a inclusão de seu(s) nome(s) em banco de dados de proteção ao crédito (S.P.C., SERASA, etc.) enquanto perdurar a existência de eventual débito decorrente da presente locação, por consequência de ações judiciais.
        </Text>
        <Text style={S.paraTitle}>PARÁGRAFO ÚNICO:</Text>
        <Text style={S.clauseBody}>
          OS (as) LOCATÁRIOS (as) declaram-se solidários entre si, concedendo uns aos outros poderes para recebimento de citação.
        </Text>

        {/* ── CLÁUSULA DÉCIMA TERCEIRA ── */}
        <Text style={S.clauseTitle}>CLÁUSULA DÉCIMA TERCEIRA:</Text>
        <Text style={S.clauseBody}>
          Caso o imóvel venha a ser abandonado pelo locatário e estando está em mora com os aluguéis, fica o locador desde já autorizado a ocupa-lo, independentemente de ação de imissão na posse, sem quaisquer formalidades e sem prejuízo da aplicação das demais cláusulas deste contrato.
        </Text>

        {/* ── CLÁUSULA DÉCIMA QUARTA ── */}
        <Text style={S.clauseTitle}>CLÁUSULA DÉCIMA QUARTA:</Text>
        <Text style={S.clauseBody}>
          Sempre que as partes forem obrigadas a se valer de medidas judiciais para a defesa de direitos e obrigações decorrentes deste instrumento, o valor devido a título de honorários será de 20% (vinte por cento) sobre o valor da causa e se houver acordo extrajudicial será devido pelo locatário os honorários advocatícios em base de 10% (dez por cento);
        </Text>
        <Text style={S.clauseBody}>
          Bem como no caso de alienação do imóvel locado, autorizo expressamente a exposição do mesmo à terceiros interessados mediante prévio agendamento.
        </Text>

        {/* ── CLÁUSULA DÉCIMA QUINTA ── */}
        <Text style={S.clauseTitle}>CLÁUSULA DÉCIMA QUINTA:</Text>
        <Text style={S.clauseBody}>
          A LOCATARIA, confessa haver vistoriado o imóvel, verificando encontrar-se em perfeitas condições de uso, conforme relatório de vistoria em anexo.
        </Text>
        <Text style={S.paraTitle}>PARÁGRAFO ÚNICO:</Text>
        <Text style={S.clauseBody}>
          A LOCATARIA desde já faculta a LOCADORA a examinar ou vistoriar o imóvel, sempre que entender conveniente, desde que previamente acordados dia e hora.
        </Text>

        {/* ── Cláusulas adicionais ── */}
        {dados.clausulas_adicionais?.trim() && (
          <>
            <Text style={S.clauseTitle}>CLÁUSULA ADICIONAL:</Text>
            <Text style={S.clauseBody}>{dados.clausulas_adicionais}</Text>
          </>
        )}

        <View style={S.divider} />

        {/* ── Procuração ── */}
        <Text style={S.clauseBody}>
          O(s) LOCADOR (es)/LOCATARIO(s) nomeia e constitui seu bastante procurador{' '}
          <B c="MARLOS GOMES DE FREITAS JUNIOR, brasileiro, inscrito no CPF Nº 398.779.638-33, estabelecido à Rua Baruel, nº 417 – Sl 10, Centro, Suzano, São Paulo, CEP 08674-010" />
          {' '}para o fim especial a alteração de titularidade, religação, ligação nova, retirada de relógio ou quaisquer serviços solicitados pelos órgãos BANDEIRANTE ENERGIA S.A e SABESP, de propriedade do outorgante, podendo, para tal fim, representa-lo perante a SABESP Companhia de Saneamento Básico do Estado de São Paulo e a EDP Bandeirante Energia S/A.
        </Text>

        <View style={S.divider} />

        {/* ── Assinaturas ── */}
        <View style={S.sigSection}>
          <Text style={S.sigClosing}>
            E por estarem assim justas e contratadas, assinam o presente, em 03 (três) vias, de igual teor e forma, na presença das testemunhas retro, em 06 (SEIS) páginas impressas, para que surta seus legais e jurídicos efeitos, obrigando-se por si, seus herdeiros e/ou sucessores, ao fiel cumprimento de todas as suas cláusulas e condições.
          </Text>

          <Text style={S.sigDate}>{dataAssinaturaBR(dados.data_assinatura, dados.cidade_assinatura)}</Text>

          {/* Locador */}
          <View style={[S.sigRow, { justifyContent: 'center' }]}>
            <View style={{ width: '60%', alignItems: 'center' }}>
              <View style={{ borderTopWidth: 1, borderTopColor: '#000', width: '100%', paddingTop: 5 }}>
                <Text style={{ fontSize: 10, fontFamily: 'Times-Bold', textAlign: 'center' }}>LOCADORA</Text>
                <Text style={S.sigName}>{dados.locador_nome.toUpperCase()}</Text>
              </View>
            </View>
          </View>

          {/* Locatário 1 */}
          <View style={[S.sigRow, { justifyContent: hasL2 ? 'space-between' : 'center', marginTop: 28 }]}>
            <View style={{ width: hasL2 ? '45%' : '60%', alignItems: 'center' }}>
              <View style={{ borderTopWidth: 1, borderTopColor: '#000', width: '100%', paddingTop: 5 }}>
                <Text style={{ fontSize: 10, fontFamily: 'Times-Bold', textAlign: 'center' }}>LOCATÁRIA</Text>
                <Text style={S.sigName}>{dados.locatario_nome.toUpperCase()}</Text>
              </View>
            </View>

            {/* Locatário 2 */}
            {hasL2 && (
              <View style={{ width: '45%', alignItems: 'center' }}>
                <View style={{ borderTopWidth: 1, borderTopColor: '#000', width: '100%', paddingTop: 5 }}>
                  <Text style={{ fontSize: 10, fontFamily: 'Times-Bold', textAlign: 'center' }}>LOCATÁRIO</Text>
                  <Text style={S.sigName}>{dados.locatario2_nome!.toUpperCase()}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

      </Page>
    </Document>
  )
}
