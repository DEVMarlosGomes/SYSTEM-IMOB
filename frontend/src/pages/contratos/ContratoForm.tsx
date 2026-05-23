import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Save } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { contractService, propertyService, userService } from '@/services'
import type { Property, User } from '@/types'
import { useAuth } from '@/stores/auth'
import { DUE_DAYS } from '@/lib/constants'

export default function ContratoForm() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as any
  const [properties, setProperties] = useState<Property[]>([])
  const [locatarios, setLocatarios] = useState<User[]>([])
  const [locadores, setLocadores] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    property_id: location?.state?.property_id || '',
    locatario_id: '',
    locador_id: '',
    data_inicio: new Date().toISOString().slice(0, 10),
    data_fim: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
    valor_aluguel: '',
    dia_vencimento: 10,
    indice_reajuste: 'IGPM',
    clausulas: 'Reajuste anual pelo IGPM. Caucao equivalente a 1 (um) aluguel.',
  })

  useEffect(() => {
    Promise.all([
      propertyService.list({ status: 'disponivel' }),
      userService.list({ role: 'locatario' }),
      userService.list({ role: 'locador' }),
    ]).then(([p, lt, lo]) => {
      setProperties(p)
      setLocatarios(lt)
      setLocadores(lo)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!form.property_id) return
    const p = properties.find((x) => x.id === form.property_id)
    if (p && !form.valor_aluguel) setForm((f) => ({ ...f, valor_aluguel: String(p.valor_aluguel) }))
  }, [form.property_id, properties])

  async function submit() {
    if (!form.property_id || !form.locatario_id || !form.locador_id || !form.valor_aluguel) {
      toast.error('Preencha todos os campos obrigatorios.')
      return
    }
    setSaving(true)
    try {
      const created = await contractService.create({
        property_id: form.property_id,
        locatario_id: form.locatario_id,
        locador_id: form.locador_id,
        data_inicio: form.data_inicio,
        data_fim: form.data_fim,
        valor_aluguel: Number(form.valor_aluguel),
        dia_vencimento: form.dia_vencimento,
        indice_reajuste: form.indice_reajuste,
        clausulas: form.clausulas,
      })
      toast.success('Contrato criado. Imovel marcado como alugado e parcelas geradas.')
      const base = user?.role === 'corretor' ? '/corretor/contratos' : '/admin/contratos'
      navigate(`${base}/${created.id}`)
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Erro ao criar contrato.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AppLayout><LoadingScreen /></AppLayout>

  return (
    <AppLayout>
      <PageHeader eyebrow="Novo" title="Novo contrato de locacao" description="Ao criar, o imovel sera marcado como alugado e as parcelas mensais serao geradas automaticamente." />
      <div className="card-premium p-6 max-w-3xl space-y-4">
        <Row><Label>Imovel disponivel *</Label>
          <select className="input-premium" value={form.property_id} onChange={(e) => setForm({ ...form, property_id: e.target.value })}>
            <option value="">Selecione um imovel</option>
            {properties.map((p) => <option key={p.id} value={p.id}>{p.titulo}</option>)}
          </select>
        </Row>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><Label>Locatario *</Label><select className="input-premium" value={form.locatario_id} onChange={(e) => setForm({ ...form, locatario_id: e.target.value })}><option value="">Selecione</option>{locatarios.map((u) => <option key={u.id} value={u.id}>{u.nome} · {u.email}</option>)}</select></div>
          <div><Label>Locador *</Label><select className="input-premium" value={form.locador_id} onChange={(e) => setForm({ ...form, locador_id: e.target.value })}><option value="">Selecione</option>{locadores.map((u) => <option key={u.id} value={u.id}>{u.nome} · {u.email}</option>)}</select></div>
          <div><Label>Inicio *</Label><input type="date" className="input-premium" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} /></div>
          <div><Label>Fim *</Label><input type="date" className="input-premium" value={form.data_fim} onChange={(e) => setForm({ ...form, data_fim: e.target.value })} /></div>
          <div><Label>Valor aluguel (R$) *</Label><input type="number" className="input-premium" value={form.valor_aluguel} onChange={(e) => setForm({ ...form, valor_aluguel: e.target.value })} /></div>
          <div><Label>Dia de vencimento *</Label><select className="input-premium" value={form.dia_vencimento} onChange={(e) => setForm({ ...form, dia_vencimento: Number(e.target.value) })}>{DUE_DAYS.map((d) => <option key={d} value={d}>Dia {d}</option>)}</select></div>
          <div><Label>Indice de reajuste</Label><select className="input-premium" value={form.indice_reajuste} onChange={(e) => setForm({ ...form, indice_reajuste: e.target.value })}><option value="IGPM">IGPM</option><option value="IPCA">IPCA</option></select></div>
        </div>
        <Row><Label>Clausulas adicionais</Label><textarea className="input-premium min-h-[120px]" value={form.clausulas} onChange={(e) => setForm({ ...form, clausulas: e.target.value })} /></Row>
        <div className="pt-4 flex justify-end gap-3 border-t border-line">
          <button className="btn-ghost" onClick={() => navigate(-1)}>Cancelar</button>
          <button className="btn-gold" onClick={submit} disabled={saving}><Save size={16}/> {saving ? 'Salvando…' : 'Criar contrato'}</button>
        </div>
      </div>
    </AppLayout>
  )
}

function Row({ children }: { children: any }) { return <div>{children}</div> }
function Label({ children }: { children: any }) { return <label className="block text-sm font-medium mb-1.5">{children}</label> }
