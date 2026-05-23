import { api } from '@/lib/api'
import type { Property, OwnerProfile, User, Appointment, Contract, Payment, PaymentKanban, AdminDashboard, CorretorDashboard, CRMLocatario, CRMLocador, ChatMessage, ChatConversation, Tenant } from '@/types'

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
  kanban: async () => (await api.get<PaymentKanban>('/payments/kanban')).data,
  uploadComprovante: async (payment_id: string, url: string) => (await api.post<Payment>(`/payments/${payment_id}/upload-comprovante`, { url })).data,
  approve: async (payment_id: string) => (await api.post<Payment>(`/payments/${payment_id}/aprovar`)).data,
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
  messages: async (locador_id: string) => (await api.get<ChatMessage[]>(`/chat/messages/${locador_id}`)).data,
  send: async (locador_id: string, mensagem: string) => (await api.post<ChatMessage>('/chat/messages', { locador_id, mensagem })).data,
}

// -------- tenants --------
export const tenantService = {
  list: async () => (await api.get<Tenant[]>('/tenants')).data,
  me: async () => (await api.get<Tenant>('/tenants/me')).data,
  create: async (payload: Partial<Tenant>) => (await api.post<Tenant>('/tenants', payload)).data,
  update: async (id: string, payload: Partial<Tenant>) => (await api.put<Tenant>(`/tenants/${id}`, payload)).data,
}
