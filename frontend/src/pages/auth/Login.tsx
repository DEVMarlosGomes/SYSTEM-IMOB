import { FormEvent, useState } from 'react'
import { Eye, EyeOff, LogIn, Building2 } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authService } from '@/services/auth'
import { useAuth } from '@/stores/auth'
import { defaultRouteFor } from '@/routes/PrivateRoute'
import { DEMO_CREDENTIALS, APP_NAME } from '@/lib/constants'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation() as any
  const { setSession } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('senha123')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await authService.login(email.trim().toLowerCase(), password)
      setSession(res.user, res.access_token)
      toast.success(`Ola, ${res.user.nome.split(' ')[0]}!`)
      const from = location.state?.from
      navigate(from && from !== '/login' ? from : defaultRouteFor(res.user.role), { replace: true })
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Credenciais invalidas.'
      setError(String(msg))
    } finally {
      setLoading(false)
    }
  }

  function applyDemo(em: string) {
    setEmail(em)
    setPassword('senha123')
    setError(null)
  }

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Visual side */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center text-white p-12 overflow-hidden"
           style={{ background: 'linear-gradient(135deg, #0F2238 0%, #1B3A5C 60%, #2E5F8A 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 20%, #D4A853 0%, transparent 60%), radial-gradient(circle at 80% 80%, #D4A853 0%, transparent 50%)',
        }} />
        <div className="relative max-w-md">
          <div className="h-12 w-12 rounded-xl bg-gold text-navy-800 flex items-center justify-center font-display text-xl font-bold mb-8 shadow-gold">I</div>
          <h1 className="font-display text-4xl leading-tight mb-4">Gestao imobiliaria com sofisticacao.</h1>
          <p className="text-white/75 mb-10">CRM, financeiro, agenda e contratos em uma unica plataforma premium para imobiliarias de alto padrao.</p>
          <ul className="space-y-3 text-sm">
            {['CRM completo de locatarios e locadores', 'Kanban financeiro por vencimento', 'Agenda inteligente com deteccao de conflitos', 'Chat realtime com locadores', 'Contratos em PDF com 1 clique'].map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gold" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Form side */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-navy text-gold flex items-center justify-center font-display text-lg font-bold"><Building2 size={18} /></div>
            <div>
              <div className="font-display text-xl text-navy">{APP_NAME}</div>
              <div className="text-xs uppercase tracking-[0.18em] text-gold-500">Premium</div>
            </div>
          </div>
          <h2 className="font-display text-3xl text-ink mb-2">Bem-vindo de volta</h2>
          <p className="text-ink-secondary mb-8">Acesse sua conta para continuar.</p>

          <form onSubmit={submit} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-premium"
                placeholder="voce@imobiliaria.com"
                autoComplete="email"
                data-testid="login-email"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-premium pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  data-testid="login-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink p-1"
                  aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && <div className="text-sm text-danger bg-danger-soft border border-danger/30 rounded-md px-3 py-2">{error}</div>}
            <button type="submit" className="btn-primary w-full" disabled={loading} data-testid="login-submit">
              <LogIn size={16} />
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          <div className="mt-8 border-t border-line pt-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-3">Acessos demo (senha: senha123)</div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_CREDENTIALS.map((d) => (
                <button
                  key={d.role}
                  type="button"
                  onClick={() => applyDemo(d.email)}
                  className="text-left px-3 py-2 rounded-md border border-line hover:border-navy hover:bg-navy-50 transition"
                  data-testid={`demo-${d.role}`}
                >
                  <div className="text-xs uppercase tracking-wider text-gold-600 font-semibold">{d.label}</div>
                  <div className="text-xs text-ink truncate">{d.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
