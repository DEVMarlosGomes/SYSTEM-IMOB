import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api, AUTH_STORAGE_KEY } from '@/lib/api'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  hydrated: boolean
  setSession: (user: User, token: string) => void
  refreshMe: () => Promise<User | null>
  logout: () => void
  setHydrated: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      hydrated: false,
      setSession: (user, token) => set({ user, token }),
      refreshMe: async () => {
        const token = get().token
        if (!token) return null
        try {
          set({ loading: true })
          const { data } = await api.get<User>('/auth/me')
          set({ user: data })
          return data
        } catch {
          set({ user: null, token: null })
          return null
        } finally {
          set({ loading: false })
        }
      },
      logout: () => {
        set({ user: null, token: null })
        try {
          localStorage.removeItem(AUTH_STORAGE_KEY)
        } catch {
          // ignore
        }
      },
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: (state) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated()
      },
    },
  ),
)
