import { useState } from 'react'
import { Key, Printer } from 'lucide-react'
import { Modal } from '@/components/common/Modal'
import type { Contract } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  contract: Contract
}

function today() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

function fmtDateBR(iso: string) {
  if (!iso) return ''
  const [y, m, day] = iso.split('-')
  return `${day}/${m}/${y}`
}

function buildAddress(p: Contract['property']) {
  if (!p) return ''
  const parts = [
    p.endereco,
    p.numero && `${p.numero}`,
    p.complemento,
    p.bairro,
    p.cidade && p.uf ? `${p.cidade} – ${p.uf}` : (p.cidade || p.uf),
    p.cep,
  ].filter(Boolean)
  return parts.join(', ').toUpperCase()
}

export function TermoEntregaChavesModal({ open, onClose, contract }: Props) {
  const [qtdChaves, setQtdChaves] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [cidade, setCidade] = useState(contract.property?.cidade?.toUpperCase() || '')
  const [data, setData] = useState(today())
  const [nomeResponsavel, setNomeResponsavel] = useState('')

  function gerar() {
    const locadorNome  = (contract.owner_profile?.nome || contract.locador?.nome || '').toUpperCase()
    const locadorCpf   = contract.owner_profile?.cpf || '___________________'
    const imovelEnd    = buildAddress(contract.property)
    const dataFmt      = fmtDateBR(data)

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>Termo de Entrega de Chaves</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 12pt; color: #000; background: #fff; padding: 40px 60px; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ccc; padding-bottom: 12px; margin-bottom: 24px; }
  .header-left { font-size: 10pt; color: #333; }
  .header-logo { font-size: 18pt; font-weight: bold; color: #000; letter-spacing: -1px; }
  .header-logo span { color: #B8923A; }
  .page-label { position: absolute; right: 20px; top: 50px; font-size: 9pt; color: #555; writing-mode: vertical-rl; transform: rotate(180deg); }
  h1 { text-align: center; font-size: 14pt; font-weight: bold; margin-bottom: 32px; text-decoration: underline; }
  .block { margin-bottom: 20px; }
  .block p { line-height: 1.7; }
  .label { font-weight: bold; }
  .line-field { display: inline-block; border-bottom: 1px solid #000; min-width: 200px; margin-left: 6px; }
  .signature-section { margin-top: 48px; }
  .sig-block { margin-bottom: 40px; }
  .sig-line { border-top: 1px solid #000; width: 300px; margin-bottom: 6px; margin-top: 36px; }
  .sig-label { font-weight: bold; font-size: 11pt; }
  .sig-name { font-size: 11pt; margin-top: 6px; }
  .obs-lines { margin-top: 8px; }
  .obs-line { border-bottom: 1px solid #000; height: 24px; width: 360px; margin-bottom: 10px; }
  .footer { text-align: center; font-size: 8pt; color: #555; border-top: 1px solid #ddd; margin-top: 60px; padding-top: 10px; }
  @media print {
    body { padding: 20px 40px; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
<div class="header">
  <div class="header-left">
    <div>IMOBVIP CONSULTORIA IMOBILIARIA &nbsp;&nbsp; CRECI 41.440-J</div>
  </div>
  <div class="header-logo">Imob<span>Vip</span></div>
</div>

<h1>TERMO DE ENTREGA DE CHAVES</h1>

<div class="block">
  <p><span class="label">IMOBILIÁRIA:</span> IMOBVIP CONSULTORIA IMOBILIARIA</p>
  <p><span class="label">CNPJ:</span> 47.142.042/0001-20</p>
</div>

<div class="block">
  <p><span class="label">PROPRIETÁRIA:</span> ${locadorNome}</p>
  <p><span class="label">CPF:</span> ${locadorCpf}</p>
</div>

<div class="block">
  <p><span class="label">IMÓVEL:</span> ${imovelEnd}</p>
</div>

<div class="block" style="margin-top:24px;">
  <p>Pelo presente instrumento, a imobiliária acima identificada declara que realizou nesta data a entrega das chaves do imóvel descrito acima à proprietária, em razão do encerramento da administração/locação do referido imóvel.</p>
</div>

<div class="block">
  <p>A proprietária declara receber o imóvel e suas respectivas chaves nas condições em que se encontram, dando plena quitação quanto à devolução das chaves pela imobiliária, nada tendo a reclamar posteriormente referente à posse das chaves entregues nesta data.</p>
</div>

<div class="block">
  <p><span class="label">Quantidade de chaves entregues:</span> ${qtdChaves || '___________________________________'}</p>
</div>

<div class="block">
  <p class="label">Observações:</p>
  <div class="obs-lines">
    <div class="obs-line">${observacoes || ''}</div>
    <div class="obs-line"></div>
    <div class="obs-line"></div>
  </div>
</div>

<div class="block" style="margin-top:32px;">
  <p><span class="label">Cidade:</span> ${cidade}</p>
  <p><span class="label">Data:</span> ${dataFmt}</p>
</div>

<div class="signature-section">
  <div class="sig-block">
    <div class="sig-line"></div>
    <div class="sig-label">IMOBILIÁRIA</div>
    <div class="sig-name">Nome do responsável: ${nomeResponsavel || '_________________________'}</div>
  </div>

  <div class="sig-block">
    <div class="sig-line"></div>
    <div class="sig-label">PROPRIETÁRIA</div>
    <div class="sig-name">Nome: ${locadorNome}</div>
  </div>

  <div class="sig-block">
    <div class="sig-line"></div>
    <div class="sig-label">TESTEMUNHA 1</div>
    <div class="sig-name">Nome: _______________________________</div>
    <div class="sig-name">CPF: ________________________________</div>
  </div>
</div>

<div class="footer">
  Escritório (11) 96656-1001 | WhatsApp: (11) 98220-2168<br/>
  EMAIL diretoria@imobvipimobiliaria.com.br | SITE www.imobvipimobiliaria.com.br<br/>
  Rua Benfeitor João Elias Camello, 41, Poá, São Paulo — ImobVip Empreendimentos Imobiliários LTDA. — Creci: 41.440-J
</div>

<script>window.onload = () => window.print()</script>
</body>
</html>`

    const win = window.open('', '_blank')
    if (win) { win.document.write(html); win.document.close() }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Termo de Entrega de Chaves"
      description="Preencha os dados variáveis. O documento abrirá pronto para impressão/PDF."
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-gold" onClick={gerar}>
            <Printer size={15} /> Gerar e Imprimir
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Quantidade de chaves entregues</label>
          <input
            className="input-premium"
            placeholder="Ex: 2 CHAVES COM 2 TAGS"
            value={qtdChaves}
            onChange={(e) => setQtdChaves(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Observações</label>
          <input
            className="input-premium"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Cidade</label>
            <input
              className="input-premium"
              value={cidade}
              onChange={(e) => setCidade(e.target.value.toUpperCase())}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Data</label>
            <input
              type="date"
              className="input-premium"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Nome do responsável (Imobiliária)</label>
          <input
            className="input-premium"
            placeholder="Ex: Marlos G."
            value={nomeResponsavel}
            onChange={(e) => setNomeResponsavel(e.target.value)}
          />
        </div>

        {/* Preview info */}
        <div className="mt-2 p-3 rounded-xl text-xs text-ink-secondary space-y-1" style={{ background: 'rgba(248,247,244,0.9)', border: '1px solid rgba(226,221,214,0.6)' }}>
          <div><span className="font-medium">Proprietária:</span> {contract.owner_profile?.nome || contract.locador?.nome || '—'}</div>
          <div><span className="font-medium">CPF:</span> {contract.owner_profile?.cpf || '—'}</div>
          <div><span className="font-medium">Imóvel:</span> {contract.property?.endereco || '—'}</div>
        </div>
      </div>
    </Modal>
  )
}
