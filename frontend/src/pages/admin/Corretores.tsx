import { useEffect, useState } from 'react'
import { Plus, UserCog } from 'lucide-react'
import toast from 'react-hot-toast'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { EmptyState } from '@/components/common/EmptyState'
import { Modal } from '@/components/common/Modal'
import { Avatar } from '@/components/common/Avatar'
import { StatusBadge } from '@/components/common/StatusBadge'
import { userService } from '@/services'
import type { User } from '@/types'
import { maskPhone } from '@/lib/format'
import { ROLE_OPTIONS } from '@/lib/constants'

export default function Corretores() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', password: 'senha123', role: 'corretor' as User['role'] })
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const all = await userService.list()
      setUsers(all)
    } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  async function save() {
    if (!form.nome || !form.email) { toast.error('Nome e e-mail sao obrigatorios.'); return }
    setSaving(true)
    try {
      await userService.create({ ...form, email: form.email.toLowerCase() })
      toast.success('Usuario criado.')
      setOpen(false)
      setForm({ nome: '', email: '', telefone: '', password: 'senha123', role: 'corretor' })
      await load()
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Erro ao criar usuario.')
    } finally { setSaving(false) }
  }

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Equipe"
        title="Usuarios da imobiliaria"
        description="Gerencie corretores, locatarios e locadores da sua imobiliaria."
        actions={<button className="btn-gold" onClick={() => setOpen(true)}><Plus size={16}/> Novo usuario</button>}
      />
      {loading ? <LoadingScreen /> : users.length === 0 ? <EmptyState icon={<UserCog size={24}/>} /> : (
        <div className="card-premium overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-surface-muted text-ink-secondary uppercase text-[11px] tracking-wider">
              <th className="text-left px-4 py-3">Usuario</th>
              <th className="text-left px-4 py-3">Perfil</th>
              <th className="text-left px-4 py-3">Contato</th>
              <th className="text-center px-4 py-3">Status</th>
            </tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-line hover:bg-surface-muted/50">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar name={u.nome} size={32}/><div><div className="font-medium">{u.nome}</div><div className="text-xs text-ink-muted">{u.email}</div></div></div></td>
                  <td className="px-4 py-3"><StatusBadge variant="navy">{u.role}</StatusBadge></td>
                  <td className="px-4 py-3 text-ink-secondary">{u.telefone ? maskPhone(u.telefone) : '—'}</td>
                  <td className="px-4 py-3 text-center"><StatusBadge variant={u.active ? 'success' : 'warning'}>{u.active ? 'ativo' : 'inativo'}</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Novo usuario" description="Crie corretores, locatarios e locadores. A senha padrao inicial e senha123."
        footer={<><button className="btn-ghost" onClick={() => setOpen(false)}>Cancelar</button><button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Salvando…' : 'Criar usuario'}</button></>}>
        <div className="space-y-3">
          <div><label className="block text-sm font-medium mb-1">Perfil</label><select className="input-premium" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as any })}>{ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
          <div><label className="block text-sm font-medium mb-1">Nome completo</label><input className="input-premium" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
          <div><label className="block text-sm font-medium mb-1">E-mail</label><input type="email" className="input-premium" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="block text-sm font-medium mb-1">Telefone</label><input className="input-premium" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: maskPhone(e.target.value) })} /></div>
          <div><label className="block text-sm font-medium mb-1">Senha inicial</label><input className="input-premium" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
        </div>
      </Modal>
    </AppLayout>
  )
}
