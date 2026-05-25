import { api } from '@/lib/api'
import type { Property, OwnerProfile, User, Appointment, Contract, Payment, PaymentKanban, AdminDashboard, CorretorDashboard, CRMLocatario, CRMLocador, ChatMessage, ChatConversation, Tenant, Notification, Comissao, CorretorStats } from '@/types'
import type { FichaLocatario, FichaLocatarioCreate } from '@/types/locatario.types'

// -------- properties --------
export const propertyService = {
  list: async (params?: Record<string, any>) => (await api.get<Property[]>('/properties', { params })).data,
  get: async (id: string) => (await api.get<Property>(`/properties/${id}`)).data,
  create: async (payload: Partial<Property>) => (await api.post<Property>('/properties', payload)).data,
  update: async (id: string, payload: Partial<Property>) => (await api.put<Property>(`/properties/${id}`, payload)).data,
  remove: async (id: string) => (await api.delete(`/properties/${id}`)).data,
}

// -------- owner profiles --------
export const ownerProfileService = {
  list: async () => (await api.get<OwnerProfile[]>('/owner-profiles')).data,
  get: async (id: string) => (await api.get<OwnerProfile>(`/owner-profiles/${id}`)).data,
  create: async (payload: Partial<OwnerProfile>) => (await api.post<OwnerProfile>('/owner-profiles', payload)).data,
  update: async (id: string, payload: Partial<OwnerProfile>) => (await api.put<OwnerProfile>(`/owner-profiles/${id}`, payload)).data,
}

// -------- users --------
export const userService = {
  list: async (params?: { role?: string }) => (await api.get<User[]>('/users', { params })).data,
  get: async (id: string) => (await api.get<User>(`/users/${id}`)).data,
  create: async (payload: any) => (await api.post<User>('/users', payload)).data,
  update: async (id: string, payload: any) => (await api.put<User>(`/users/${id}`, payload)).data,
  deactivate: async (id: string) => (await api.delete(`/users/${id}`)).data,
}

// -------- appointments --------
export const appointmentService = {
  list: async (params?: Record<string, any>) => (await api.get<Appointment[]>('/appointments', { params })).data,
  create: async (payload: Partial<Appointment> & { corretor_id?: string }) => (await api.post<Appointment>('/appointments', payload)).data,
  update: async (id: string, payload: Partial<Appointment>) => (await api.put<Appointment>(`/appointments/${id}`, payload)).data,
  remove: async (id: string) => (await api.delete(`/appointments/${id}`)).data,
}

// -------- contracts --------
export const contractService = {
  list: async () => (await api.get<Contract[]>('/contracts')).data,
  get: async (id: string) => (await api.get<Contract>(`/contracts/${id}`)).data,
  create: async (payload: any) => (await api.post<Contract>('/contracts', payload)).data,
  encerrar: async (id: string) => (await api.post(`/contracts/${id}/encerrar`)).data,
  setPdfUrl: async (id: string, pdf_url: string) => (await api.put(`/contracts/${id}/pdf-url`, { pdf_url })).data,
}

// -------- payments --------
export const paymentService = {
  list: async (params?: Record<string, any>) => (await api.get<Payment[]>('/payments', { params })).data,
  kanban: async (mes_referencia?: string) => (await api.get<PaymentKanban>('/payments/kanban', { params: mes_referencia ? { mes_referencia } : {} })).data,
  uploadComprovante: async (payment_id: string, url: string) => (await api.post<Payment>(`/payments/${payment_id}/upload-comprovante`, { url })).data,
  approve: async (payment_id: string) => (await api.post<Payment>(`/payments/${payment_id}/aprovar`)).data,
  rejeitar: async (payment_id: string, motivo: string) => (await api.post<Payment>(`/payments/${payment_id}/rejeitar`, { motivo })).data,
  update: async (payment_id: string, payload: any) => (await api.put<Payment>(`/payments/${payment_id}`, payload)).data,
}

// -------- CRM --------
export const crmService = {
  locatarios: async (search?: string) => (await api.get<CRMLocatario[]>('/crm/locatarios', { params: { search } })).data,
  locadores: async (search?: string) => (await api.get<CRMLocador[]>('/crm/locadores', { params: { search } })).data,
}

// -------- dashboard --------
export const dashboardService = {
  admin: async () => (await api.get<AdminDashboard>('/dashboard/admin')).data,
  corretor: async () => (await api.get<CorretorDashboard>('/dashboard/corretor')).data,
}

// -------- uploads --------
export const uploadService = {
  upload: async (file: File, kind: string = 'misc') => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('kind', kind)
    const { data } = await api.post<{ url: string; filename: string; size: number; content_type: string }>('/uploads', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
}

// -------- chat --------
export const chatService = {
  conversations: async () => (await api.get<ChatConversation[]>('/chat/conversations')).data,
  messages: async (locador_id: string, page = 1, limit = 100): Promise<ChatMessage[]> => {
    const res = await api.get(`/chat/messages/${locador_id}`, { params: { page, limit } })
    const data = res.data
    return Array.isArray(data) ? data : (data.items ?? [])
  },
  send: async (locador_id: string, mensagem: string) => (await api.post<ChatMessage>('/chat/messages', { locador_id, mensagem })).data,
}

// -------- fichas locatário --------
export const fichaLocatarioService = {
  list: async (params?: { status?: string; search?: string; page?: number; limit?: number }) =>
    (await api.get<{ items: FichaLocatario[]; total: number; page: number; limit: number }>('/fichas-locatario', { params })).data,
  get: async (id: string) => (await api.get<FichaLocatario>(`/fichas-locatario/${id}`)).data,
  create: async (payload: FichaLocatarioCreate) =>
    (await api.post<FichaLocatario>('/fichas-locatario', payload)).data,
  update: async (id: string, payload: Partial<FichaLocatario>) =>
    (await api.put<FichaLocatario>(`/fichas-locatario/${id}`, payload)).data,
  savePdfUrl: async (id: string, url: string) =>
    (await api.post(`/fichas-locatario/${id}/ficha-pdf-url`, { url })).data,
  uploadAssinatura1: async (id: string, url: string) =>
    (await api.post(`/fichas-locatario/${id}/assinatura-cliente1`, { url })).data,
  uploadAssinatura2: async (id: string, url: string) =>
    (await api.post(`/fichas-locatario/${id}/assinatura-cliente2`, { url })).data,
  vincularContrato: async (id: string, contrato_id: string) =>
    (await api.patch(`/fichas-locatario/${id}/vincular-contrato`, { contrato_id })).data,
}

// -------- corretores --------
export const corretorService = {
  stats: async (corretorId: string) => (await api.get<CorretorStats>(`/corretores/${corretorId}/stats`)).data,
  comissoes: async (corretorId: string) => (await api.get<Comissao[]>(`/corretores/${corretorId}/comissoes`)).data,
  createComissao: async (corretorId: string, payload: Omit<Comissao, 'id' | 'tenant_id' | 'created_at'>) =>
    (await api.post<Comissao>(`/corretores/${corretorId}/comissoes`, payload)).data,
  updateComissao: async (comissaoId: string, payload: Partial<Comissao>) =>
    (await api.put<Comissao>(`/corretores/comissoes/${comissaoId}`, payload)).data,
  deleteComissao: async (comissaoId: string) =>
    (await api.delete(`/corretores/comissoes/${comissaoId}`)).data,
}

// -------- notifications --------
export const notificationService = {
  list: async () => (await api.get<Notification[]>('/notifications')).data,
  markRead: async (id: string) => (await api.post(`/notifications/${id}/read`)).data,
  markAllRead: async () => (await api.post('/notifications/read-all')).data,
}

// -------- tenants --------
export const tenantService = {
  list: async () => (await api.get<Tenant[]>('/tenants')).data,
  me: async () => (await api.get<Tenant>('/tenants/me')).data,
  create: async (payload: Partial<Tenant>) => (await api.post<Tenant>('/tenants', payload)).data,
  update: async (id: string, payload: Partial<Tenant>) => (await api.put<Tenant>(`/tenants/${id}`, payload)).data,
}
