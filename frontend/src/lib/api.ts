import axios, { AxiosError } from 'axios'
import toast from 'react-hot-toast'

// Read backend URL from REACT_APP_BACKEND_URL (preserved by Vite envPrefix) or fallback.
const BACKEND_URL =
  import.meta.env.REACT_APP_BACKEND_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  ''

export const API_BASE = `${BACKEND_URL}/api`

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30_000,
})

const AUTH_STORAGE_KEY = 'imobsys:auth'

export function readStoredToken(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Zustand persist nests state inside `state`
    return parsed?.state?.token ?? parsed?.token ?? null
  } catch {
    return null
  }
}

api.interceptors.request.use((config) => {
  const token = readStoredToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (r) => r,
  (error: AxiosError<{ detail?: string }>) => {
    const status = error.response?.status
    const msg = error.response?.data?.detail || error.message || 'Erro inesperado'
    if (status === 401) {
      // Will be handled by RequireAuth guard; surface a softer toast only when not on login.
      if (!window.location.pathname.startsWith('/login')) {
        toast.error('Sessao expirada. Faca login novamente.')
        try {
          localStorage.removeItem(AUTH_STORAGE_KEY)
        } catch {
          // ignore
        }
        setTimeout(() => {
          window.location.href = '/login'
        }, 200)
      }
    } else if (status && status >= 500) {
      toast.error('Erro no servidor. Tente novamente em instantes.')
    } else if (status && status !== 409 && !String(error.config?.url || '').includes('/auth/login')) {
      // 409 (conflict) we surface contextually in the UI; login errors handled by the page itself
      toast.error(String(msg))
    }
    return Promise.reject(error)
  },
)

export function buildUploadUrl(path?: string | null): string {
  if (!path) return ''
  if (/^https?:/i.test(path)) return path
  if (path.startsWith('/api/')) return `${BACKEND_URL}${path}`
  return `${API_BASE}${path}`
}

export function wsUrl(path: string, token?: string | null) {
  const base = BACKEND_URL.replace(/^http/, 'ws')
  const url = new URL(`${base}/api${path}`)
  if (token) url.searchParams.set('token', token)
  return url.toString()
}

export { AUTH_STORAGE_KEY }
