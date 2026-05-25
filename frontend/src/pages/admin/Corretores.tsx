import { useEffect, useState, type ReactNode } from 'react'
import { Plus, UserCog, ChevronRight, Phone, Instagram, Award, Pencil, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { EmptyState } from '@/components/common/EmptyState'
import { Modal } from '@/components/common/Modal'
import { Avatar } from '@/components/common/Avatar'
import { userService } from '@/services'
import type { User } from '@/types'
import { maskPhone } from '@/lib/format'
import { ROLE_OPTIONS } from '@/lib/constants'

const emptyForm = {
  nome: '', email: '', telefone: '', password: 'senha123',
  role: 'corretor' as User['role'], creci_sp: '', instagram: '',
}

export default function Corretores() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // create modal
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  // edit modal
  const [editUser, setEditUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({ nome: '', telefone: '', creci_sp: '', instagram: '' })
  const [editSaving, setEditSaving] = useState(false)

  async function load() {
    setLoading(true)
    try { setUsers(await userService.list()) }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  async function create() {
    if (!form.nome || !form.email) { toast.error('Nome e e-mail são obrigatórios.'); return }
    setSaving(true)
    try {
      await userService.create({ ...form, email: form.email.toLowerCase() })
      toast.success('Usuário criado.')
      setCreateOpen(false)
      setForm(emptyForm)
      await load()
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Erro ao criar usuário.')
    } finally { setSaving(false) }
  }

  function openEdit(u: User, e: React.MouseEvent) {
    e.stopPropagation()
    setEditUser(u)
    setEditForm({ nome: u.nome, telefone: u.telefone || '', creci_sp: u.creci_sp || '', instagram: u.instagram || '' })
  }

  async function saveEdit() {
    if (!editUser) return
    setEditSaving(true)
    try {
      await userService.update(editUser.id, editForm)
      toast.success('Usuário atualizado.')
      setEditUser(null)
      await load()
    } catch { toast.error('Erro ao salvar.') }
    finally { setEditSaving(false) }
  }

  async function remove(u: User, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`Desativar "${u.nome}"? O usuário perderá o acesso ao sistema.`)) return
    try {
      await userService.deactivate(u.id)
      toast.success('Usuário desativado.')
      await load()
    } catch { toast.error('Erro ao desativar.') }
  }

  const corretores = users.filter((u) => u.role === 'corretor')
  const outros = users.filter((u) => u.role !== 'corretor')

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Equipe"
        title="Corretores"
        description="Gerencie a equipe de corretores, visualize desempenho e comissões."
        actions={<button className="btn-gold" onClick={() => setCreateOpen(true)}><Plus size={16} /> Novo usuário</button>}
      />

      {loading ? <LoadingScreen /> : (
        <>
          {corretores.length === 0 ? (
            <EmptyState icon={<UserCog size={24} />} title="Nenhum corretor cadastrado" description="Crie o primeiro corretor para começar." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
              {corretores.map((c) => (
                <CorretorCard
                  key={c.id}
                  corretor={c}
                  onView={() => navigate(`/admin/corretores/${c.id}`)}
                  onEdit={(e) => openEdit(c, e)}
                  onRemove={(e) => remove(c, e)}
                />
              ))}
            </div>
          )}

          {outros.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-ink-secondary uppercase tracking-wider mb-3">Outros usuários</h2>
              <div className="card-premium overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-muted text-ink-secondary uppercase text-[11px] tracking-wider">
                      <th className="text-left px-4 py-3">Usuário</th>
                      <th className="text-left px-4 py-3">Perfil</th>
                      <th className="text-left px-4 py-3">Contato</th>
                      <th className="text-center px-4 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outros.map((u) => (
                      <tr key={u.id} className="border-t border-line hover:bg-surface-muted/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.nome} size={32} />
                            <div>
                              <div className="font-medium">{u.nome}</div>
                              <div className="text-xs text-ink-muted">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(46,95,138,0.10)', color: '#2E5F8A' }}>{u.role}</span>
                        </td>
                        <td className="px-4 py-3 text-ink-secondary">{u.telefone ? maskPhone(u.telefone) : '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <ActionBtn icon={<Pencil size={13} />} title="Editar" onClick={(e) => openEdit(u, e)} />
                            <ActionBtn icon={<Trash2 size={13} />} title="Desativar" danger onClick={(e) => remove(u, e)} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* Create modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Novo usuário"
        description="A senha padrão inicial é senha123."
        footer={
          <>
            <button className="btn-ghost" onClick={() => setCreateOpen(false)}>Cancelar</button>
            <button className="btn-primary" onClick={create} disabled={saving}>{saving ? 'Salvando…' : 'Criar usuário'}</button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Perfil</label>
            <select className="input-premium" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as any })}>
              {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nome completo</label>
            <input className="input-premium" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">E-mail</label>
            <input type="email" className="input-premium" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telefone</label>
            <input className="input-premium" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: maskPhone(e.target.value) })} />
          </div>
          {form.role === 'corretor' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">CRECI-SP</label>
                <input className="input-premium" value={form.creci_sp} onChange={(e) => setForm({ ...form, creci_sp: e.target.value })} placeholder="Ex: 12345-F" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Instagram</label>
                <input className="input-premium" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="@usuario" />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Senha inicial</label>
            <input className="input-premium" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!editUser}
        onClose={() => setEditUser(null)}
        title={`Editar — ${editUser?.nome ?? ''}`}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEditUser(null)}>Cancelar</button>
            <button className="btn-primary" onClick={saveEdit} disabled={editSaving}>{editSaving ? 'Salvando…' : 'Salvar'}</button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Nome completo</label>
            <input className="input-premium" value={editForm.nome} onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telefone</label>
            <input className="input-premium" value={editForm.telefone} onChange={(e) => setEditForm({ ...editForm, telefone: maskPhone(e.target.value) })} />
          </div>
          {editUser?.role === 'corretor' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">CRECI-SP</label>
                <input className="input-premium" value={editForm.creci_sp} onChange={(e) => setEditForm({ ...editForm, creci_sp: e.target.value })} placeholder="Ex: 12345-F" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Instagram</label>
                <input className="input-premium" value={editForm.instagram} onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })} placeholder="@usuario" />
              </div>
            </>
          )}
        </div>
      </Modal>
    </AppLayout>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function CorretorCard({ corretor, onView, onEdit, onRemove }: {
  corretor: User
  onView: () => void
  onEdit: (e: React.MouseEvent) => void
  onRemove: (e: React.MouseEvent) => void
}) {
  return (
    <div
      onClick={onView}
      className="group relative rounded-2xl p-5 cursor-pointer transition-all duration-200 select-none"
      style={{
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(226,221,214,0.70)',
        boxShadow: '0 2px 12px rgba(15,34,56,0.05)',
      }}
      onMouseEnter={(el) => {
        const t = el.currentTarget as HTMLDivElement
        t.style.boxShadow = '0 8px 32px rgba(15,34,56,0.12)'
        t.style.borderColor = 'rgba(46,95,138,0.25)'
        t.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(el) => {
        const t = el.currentTarget as HTMLDivElement
        t.style.boxShadow = '0 2px 12px rgba(15,34,56,0.05)'
        t.style.borderColor = 'rgba(226,221,214,0.70)'
        t.style.transform = 'translateY(0)'
      }}
    >
      {/* Action buttons — top right, stop propagation */}
      <div className="absolute top-3.5 right-3.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <ActionBtn icon={<Pencil size={12} />} title="Editar" onClick={onEdit} />
        <ActionBtn icon={<Trash2 size={12} />} title="Desativar" danger onClick={onRemove} />
      </div>

      {/* Avatar + name */}
      <div className="flex items-center gap-3 mb-4 pr-14">
        <Avatar name={corretor.nome} size={46} />
        <div className="min-w-0">
          <div className="font-semibold text-ink leading-tight truncate">{corretor.nome}</div>
          <div className="text-xs text-ink-muted mt-0.5 truncate">{corretor.email}</div>
        </div>
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
          style={corretor.active
            ? { background: 'rgba(39,174,96,0.12)', color: '#27AE60' }
            : { background: 'rgba(231,76,60,0.10)', color: '#E74C3C' }}
        >
          {corretor.active ? 'ativo' : 'inativo'}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(46,95,138,0.08)', color: '#2E5F8A' }}>
          corretor
        </span>
      </div>

      {/* Info rows */}
      <div className="space-y-1.5 mb-4">
        {corretor.telefone && (
          <div className="flex items-center gap-2 text-xs text-ink-secondary">
            <Phone size={11} className="text-ink-muted flex-shrink-0" />
            <span>{maskPhone(corretor.telefone)}</span>
          </div>
        )}
        {corretor.creci_sp && (
          <div className="flex items-center gap-2 text-xs text-ink-secondary">
            <Award size={11} className="text-ink-muted flex-shrink-0" />
            <span>CRECI-SP {corretor.creci_sp}</span>
          </div>
        )}
        {corretor.instagram && (
          <div className="flex items-center gap-2 text-xs text-ink-secondary">
            <Instagram size={11} className="text-ink-muted flex-shrink-0" />
            <span>{corretor.instagram}</span>
          </div>
        )}
      </div>

      {/* CTA strip */}
      <div
        className="flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-xl transition-colors"
        style={{ background: 'rgba(46,95,138,0.07)', color: '#2E5F8A' }}
      >
        Ver desempenho e comissões
        <ChevronRight size={13} />
      </div>
    </div>
  )
}

// ─── helper ───────────────────────────────────────────────────────────────────

function ActionBtn({ icon, title, onClick, danger }: {
  icon: ReactNode
  title: string
  onClick: (e: React.MouseEvent) => void
  danger?: boolean
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors"
      style={{
        background: danger ? 'rgba(231,76,60,0.08)' : 'rgba(46,95,138,0.08)',
        color: danger ? '#E74C3C' : '#2E5F8A',
        border: danger ? '1px solid rgba(231,76,60,0.15)' : '1px solid rgba(46,95,138,0.12)',
      }}
      onMouseEnter={(el) => {
        el.currentTarget.style.background = danger ? 'rgba(231,76,60,0.18)' : 'rgba(46,95,138,0.16)'
      }}
      onMouseLeave={(el) => {
        el.currentTarget.style.background = danger ? 'rgba(231,76,60,0.08)' : 'rgba(46,95,138,0.08)'
      }}
    >
      {icon}
    </button>
  )
}
