import { api } from '@/lib/api'
import type { User } from '@/types'

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

export const authService = {
  login: async (email: string, password: string) => (await api.post<LoginResponse>('/auth/login', { email, password })).data,
  me: async () => (await api.get<User>('/auth/me')).data,
  impersonate: async (user_id: string) => (await api.post<LoginResponse>(`/auth/impersonate/${user_id}`)).data,
}
