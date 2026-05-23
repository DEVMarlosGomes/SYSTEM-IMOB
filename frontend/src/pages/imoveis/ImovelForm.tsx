import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Save, Upload, Image as ImageIcon, X, Trash2, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ownerProfileService, propertyService, uploadService } from '@/services'
import type { OwnerProfile, Property, PropertyType, PropertyStatus, TipoConta } from '@/types'
import { useAuth } from '@/stores/auth'
import { STATUS_IMOVEL_OPTIONS, TIPO_IMOVEL_OPTIONS } from '@/lib/constants'
import { useDropzone } from 'react-dropzone'
import { buildUploadUrl } from '@/lib/api'
import { maskCEP, maskCPF, maskPhone } from '@/lib/format'

interface FormState {
  titulo: string
  descricao: string
  tipo: PropertyType
  status: PropertyStatus
  endereco: string
  bairro: string
  cidade: string
  cep: string
  area_m2: string
  quartos: string
  banheiros: string
  vagas: string
  valor_aluguel: string
  valor_condominio: string
  valor_iptu: string
  aceita_pet: boolean
  mobiliado: boolean
  fotos: string[]
  // owner
  owner_profile_id?: string | null
  owner_nome: string
  owner_cpf: string
  owner_rg: string
  owner_telefone: string
  owner_email: string
  owner_endereco: string
  owner_banco: string
  owner_agencia: string
  owner_conta: string
  owner_tipo_conta: TipoConta
  owner_pix: string
}

const empty: FormState = {
  titulo: '', descricao: '', tipo: 'apartamento', status: 'disponivel',
  endereco: '', bairro: '', cidade: '', cep: '',
  area_m2: '', quartos: '', banheiros: '', vagas: '',
  valor_aluguel: '', valor_condominio: '', valor_iptu: '',
  aceita_pet: false, mobiliado: false,
  fotos: [],
  owner_profile_id: null,
  owner_nome: '', owner_cpf: '', owner_rg: '', owner_telefone: '', owner_email: '', owner_endereco: '',
  owner_banco: '', owner_agencia: '', owner_conta: '', owner_tipo_conta: 'corrente', owner_pix: '',
}

export default function ImovelForm() {
  const { id } = useParams<{ id?: string }>()
  const isEditing = !!id
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [form, setForm] = useState<FormState>(empty)
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  useEffect(() => {
    if (!id) return
    propertyService.get(id).then(async (p) => {
      const owner = p.owner_profile_id ? await ownerProfileService.get(p.owner_profile_id).catch(() => null) : null
      setForm({
        titulo: p.titulo,
        descricao: p.descricao || '',
        tipo: p.tipo,
        status: p.status,
        endereco: p.endereco,
        bairro: p.bairro || '',
        cidade: p.cidade || '',
        cep: p.cep || '',
        area_m2: p.area_m2?.toString() || '',
        quartos: p.quartos?.toString() || '',
        banheiros: p.banheiros?.toString() || '',
        vagas: p.vagas?.toString() || '',
        valor_aluguel: p.valor_aluguel?.toString() || '',
        valor_condominio: p.valor_condominio?.toString() || '',
        valor_iptu: p.valor_iptu?.toString() || '',
        aceita_pet: !!p.aceita_pet,
        mobiliado: !!p.mobiliado,
        fotos: p.fotos || [],
        owner_profile_id: p.owner_profile_id,
        owner_nome: owner?.nome || '',
        owner_cpf: owner?.cpf || '',
        owner_rg: owner?.rg || '',
        owner_telefone: owner?.telefone || '',
        owner_email: owner?.email || '',
        owner_endereco: owner?.endereco || '',
        owner_banco: owner?.banco || '',
        owner_agencia: owner?.agencia || '',
        owner_conta: owner?.conta || '',
        owner_tipo_conta: owner?.tipo_conta || 'corrente',
        owner_pix: owner?.pix || '',
      })
    }).catch(() => undefined).finally(() => setLoading(false))
  }, [id])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 15,
    maxSize: 5 * 1024 * 1024,
    onDrop: async (files) => {
      setUploadingPhoto(true)
      try {
        for (const file of files) {
          const res = await uploadService.upload(file, 'imoveis')
          setForm((f) => ({ ...f, fotos: [...f.fotos, res.url] }))
        }
        toast.success(`${files.length} foto(s) enviada(s).`)
      } catch (e: any) {
        toast.error('Falha no upload das fotos.')
      } finally {
        setUploadingPhoto(false)
      }
    },
  })

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function lookupCEP(cep: string) {
    const clean = cep.replace(/\D/g, '')
    if (clean.length !== 8) return
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
      const data = await res.json()
      if (data?.erro) return
      setForm((f) => ({
        ...f,
        endereco: data.logradouro || f.endereco,
        bairro: data.bairro || f.bairro,
        cidade: data.localidade || f.cidade,
      }))
    } catch {
      // ignore
    }
  }

  async function submit() {
    if (!form.titulo || !form.endereco || !form.valor_aluguel) {
      toast.error('Preencha titulo, endereco e valor de aluguel.')
      setStep(1)
      return
    }
    setSaving(true)
    try {
      let owner_profile_id = form.owner_profile_id || null
      // upsert owner profile if any data was provided
      if (form.owner_nome.trim()) {
        const payload = {
          nome: form.owner_nome,
          cpf: form.owner_cpf,
          rg: form.owner_rg,
          telefone: form.owner_telefone,
          email: form.owner_email || undefined,
          endereco: form.owner_endereco,
          banco: form.owner_banco,
          agencia: form.owner_agencia,
          conta: form.owner_conta,
          tipo_conta: form.owner_tipo_conta,
          pix: form.owner_pix,
        }
        if (owner_profile_id) {
          await ownerProfileService.update(owner_profile_id, payload as any)
        } else {
          const created = await ownerProfileService.create(payload as any)
          owner_profile_id = created.id
        }
      }

      const propPayload: any = {
        titulo: form.titulo,
        descricao: form.descricao,
        tipo: form.tipo,
        status: form.status,
        endereco: form.endereco,
        bairro: form.bairro,
        cidade: form.cidade,
        cep: form.cep,
        area_m2: form.area_m2 ? Number(form.area_m2) : null,
        quartos: form.quartos ? Number(form.quartos) : 0,
        banheiros: form.banheiros ? Number(form.banheiros) : 0,
        vagas: form.vagas ? Number(form.vagas) : 0,
        valor_aluguel: Number(form.valor_aluguel),
        valor_condominio: form.valor_condominio ? Number(form.valor_condominio) : 0,
        valor_iptu: form.valor_iptu ? Number(form.valor_iptu) : 0,
        aceita_pet: form.aceita_pet,
        mobiliado: form.mobiliado,
        fotos: form.fotos,
        owner_profile_id,
      }
      let saved: Property
      if (isEditing && id) {
        saved = await propertyService.update(id, propPayload)
        toast.success('Imovel atualizado.')
      } else {
        saved = await propertyService.create(propPayload)
        toast.success('Imovel cadastrado com sucesso!')
      }
      const base = user?.role === 'admin' ? '/admin/imoveis' : '/corretor/imoveis'
      navigate(`${base}/${saved.id}`)
    } catch (e: any) {
      toast.error('Erro ao salvar o imovel.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AppLayout><LoadingScreen /></AppLayout>

  return (
    <AppLayout>
      <PageHeader
        eyebrow={isEditing ? 'Editar' : 'Novo cadastro'}
        title={isEditing ? 'Editar imovel' : 'Novo imovel'}
        description="Preencha os dados em 3 etapas. Os dados do proprietario sao privados ao corretor que cadastra."
      />
      <div className="flex items-center gap-2 mb-6">
        {([1, 2, 3] as const).map((s) => (
          <button key={s} onClick={() => setStep(s)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition ${step === s ? 'bg-navy text-white border-navy' : 'bg-white text-ink border-line'}`}>
            <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[11px] ${step === s ? 'bg-gold text-navy-800' : 'bg-surface-muted text-ink-secondary'}`}>{s}</span>
            {s === 1 ? 'Informacoes' : s === 2 ? 'Fotos' : 'Proprietario'}
          </button>
        ))}
      </div>

      <div className="card-premium p-6">
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Titulo *" full><input className="input-premium" value={form.titulo} onChange={(e) => set('titulo', e.target.value)} data-testid="prop-titulo" /></Field>
            <Field label="Tipo *"><select className="input-premium" value={form.tipo} onChange={(e) => set('tipo', e.target.value as PropertyType)}>{TIPO_IMOVEL_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></Field>
            <Field label="Status"><select className="input-premium" value={form.status} onChange={(e) => set('status', e.target.value as PropertyStatus)}>{STATUS_IMOVEL_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></Field>
            <Field label="Descricao" full><textarea className="input-premium min-h-[100px]" value={form.descricao} onChange={(e) => set('descricao', e.target.value)} /></Field>
            <Field label="CEP"><input className="input-premium" value={form.cep} onChange={(e) => set('cep', maskCEP(e.target.value))} onBlur={(e) => lookupCEP(e.target.value)} placeholder="00000-000" /></Field>
            <Field label="Endereco *" full><input className="input-premium" value={form.endereco} onChange={(e) => set('endereco', e.target.value)} data-testid="prop-endereco" /></Field>
            <Field label="Bairro"><input className="input-premium" value={form.bairro} onChange={(e) => set('bairro', e.target.value)} /></Field>
            <Field label="Cidade"><input className="input-premium" value={form.cidade} onChange={(e) => set('cidade', e.target.value)} /></Field>
            <Field label="Area (m2)"><input type="number" className="input-premium" value={form.area_m2} onChange={(e) => set('area_m2', e.target.value)} /></Field>
            <Field label="Quartos"><input type="number" className="input-premium" value={form.quartos} onChange={(e) => set('quartos', e.target.value)} /></Field>
            <Field label="Banheiros"><input type="number" className="input-premium" value={form.banheiros} onChange={(e) => set('banheiros', e.target.value)} /></Field>
            <Field label="Vagas"><input type="number" className="input-premium" value={form.vagas} onChange={(e) => set('vagas', e.target.value)} /></Field>
            <Field label="Valor do aluguel (R$) *"><input type="number" className="input-premium" value={form.valor_aluguel} onChange={(e) => set('valor_aluguel', e.target.value)} data-testid="prop-valor" /></Field>
            <Field label="Condominio (R$)"><input type="number" className="input-premium" value={form.valor_condominio} onChange={(e) => set('valor_condominio', e.target.value)} /></Field>
            <Field label="IPTU (R$)"><input type="number" className="input-premium" value={form.valor_iptu} onChange={(e) => set('valor_iptu', e.target.value)} /></Field>
            <Field label="" full>
              <div className="flex items-center gap-6 mt-1">
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.aceita_pet} onChange={(e) => set('aceita_pet', e.target.checked)} className="h-4 w-4 accent-navy" /> Aceita pet</label>
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.mobiliado} onChange={(e) => set('mobiliado', e.target.checked)} className="h-4 w-4 accent-navy" /> Mobiliado</label>
              </div>
            </Field>
          </div>
        )}

        {step === 2 && (
          <div>
            <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-10 text-center transition ${isDragActive ? 'border-navy bg-navy-50' : 'border-line hover:border-navy-300 bg-surface-muted/40'}`}>
              <input {...getInputProps()} />
              <Upload className="mx-auto text-navy mb-3" size={28} />
              <p className="font-medium text-ink">Arraste fotos aqui ou clique para selecionar</p>
              <p className="text-xs text-ink-secondary mt-1">PNG, JPG, JPEG, WEBP · ate 5MB cada · ate 15 fotos</p>
              {uploadingPhoto && <p className="text-xs text-navy mt-3 animate-pulse-soft">Enviando…</p>}
            </div>
            {form.fotos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-5">
                {form.fotos.map((f, i) => (
                  <div key={f + i} className="relative group aspect-[4/3] rounded-lg overflow-hidden border border-line bg-surface-muted">
                    <img src={buildUploadUrl(f)} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                    <button onClick={() => set('fotos', form.fotos.filter((_, j) => j !== i))} className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/95 text-danger flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition"><Trash2 size={14}/></button>
                    {i === 0 && <div className="absolute bottom-2 left-2 text-[10px] bg-gold text-navy-800 font-semibold px-1.5 py-0.5 rounded">PRINCIPAL</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 mb-2 p-3 bg-gold/10 border border-gold/30 rounded-md text-xs text-navy-700">
              Estes dados sao visiveis apenas para voce (o corretor cadastrante) e para o administrador da imobiliaria. Demais corretores nao terao acesso.
            </div>
            <Field label="Nome do proprietario" full><input className="input-premium" value={form.owner_nome} onChange={(e) => set('owner_nome', e.target.value)} /></Field>
            <Field label="CPF"><input className="input-premium" value={form.owner_cpf} onChange={(e) => set('owner_cpf', maskCPF(e.target.value))} /></Field>
            <Field label="RG"><input className="input-premium" value={form.owner_rg} onChange={(e) => set('owner_rg', e.target.value)} /></Field>
            <Field label="Telefone"><input className="input-premium" value={form.owner_telefone} onChange={(e) => set('owner_telefone', maskPhone(e.target.value))} /></Field>
            <Field label="E-mail"><input type="email" className="input-premium" value={form.owner_email} onChange={(e) => set('owner_email', e.target.value)} /></Field>
            <Field label="Endereco" full><input className="input-premium" value={form.owner_endereco} onChange={(e) => set('owner_endereco', e.target.value)} /></Field>
            <Field label="Banco"><input className="input-premium" value={form.owner_banco} onChange={(e) => set('owner_banco', e.target.value)} /></Field>
            <Field label="Agencia"><input className="input-premium" value={form.owner_agencia} onChange={(e) => set('owner_agencia', e.target.value)} /></Field>
            <Field label="Conta"><input className="input-premium" value={form.owner_conta} onChange={(e) => set('owner_conta', e.target.value)} /></Field>
            <Field label="Tipo de conta"><select className="input-premium" value={form.owner_tipo_conta} onChange={(e) => set('owner_tipo_conta', e.target.value as TipoConta)}><option value="corrente">Corrente</option><option value="poupanca">Poupanca</option></select></Field>
            <Field label="PIX" full><input className="input-premium" value={form.owner_pix} onChange={(e) => set('owner_pix', e.target.value)} /></Field>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 mt-6 pt-5 border-t border-line">
          <button className="btn-ghost" onClick={() => navigate(-1)}><ArrowLeft size={16}/> Cancelar</button>
          <div className="flex items-center gap-3">
            {step > 1 && <button className="btn-outline" onClick={() => setStep((s) => (s - 1) as any)}><ArrowLeft size={16}/> Anterior</button>}
            {step < 3 && <button className="btn-primary" onClick={() => setStep((s) => (s + 1) as any)}>Proximo <ArrowRight size={16}/></button>}
            {step === 3 && <button className="btn-gold" onClick={submit} disabled={saving} data-testid="prop-save"><Save size={16}/> {saving ? 'Salvando…' : isEditing ? 'Salvar alteracoes' : 'Cadastrar imovel'}</button>}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

function Field({ label, children, full }: { label: string; children: any; full?: boolean }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      {label && <label className="block text-sm font-medium text-ink mb-1.5">{label}</label>}
      {children}
    </div>
  )
}
