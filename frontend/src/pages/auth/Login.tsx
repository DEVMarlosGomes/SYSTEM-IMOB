import { FormEvent, useState } from 'react'
import { Eye, EyeOff, LogIn, Home, DollarSign } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authService } from '@/services/auth'
import { useAuth } from '@/stores/auth'
import { defaultRouteFor } from '@/routes/PrivateRoute'
import { DEMO_CREDENTIALS } from '@/lib/constants'

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
    <div className="min-h-screen flex overflow-hidden">
      {/* ——— LEFT — Dark glass hero ——— */}
      <div
        className="hidden lg:flex flex-1 relative items-center justify-center p-12 overflow-hidden"
        style={{ background: 'linear-gradient(150deg, #091628 0%, #0F2238 45%, #1B3A5C 100%)' }}
      >
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute -top-20 -left-20 h-[500px] w-[500px] rounded-full opacity-20 animate-float"
            style={{ background: 'radial-gradient(circle, #2E5F8A 0%, transparent 70%)' }}
          />
          <div
            className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full opacity-15 animate-float"
            style={{ background: 'radial-gradient(circle, #D4A853 0%, transparent 65%)', animationDelay: '3s' }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #4E739F 0%, transparent 60%)' }}
          />
        </div>

        {/* Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative max-w-md z-10">
          {/* Logo */}
          <div className="mb-10">
            <div
              className="inline-flex rounded-2xl px-5 py-3"
              style={{
                background: '#fff',
                boxShadow: '0 8px 32px rgba(0,0,0,0.30)',
              }}
            >
              <img src="/logo.png" alt="ImobVip Consultoria Imobiliária" className="h-16 object-contain" />
            </div>
          </div>

          <h1 className="font-display text-4xl leading-tight mb-3 text-white">
            Gestao imobiliaria<br />com sofisticacao.
          </h1>
          <p className="mb-10" style={{ color: 'rgba(255,255,255,0.60)', lineHeight: '1.65', fontSize: '15px' }}>
            CRM, financeiro, agenda e contratos em uma unica plataforma premium para imobiliarias de alto padrao.
          </p>

          {/* Feature cards */}
          <div className="space-y-3">
            {[
              { icon: Home, text: 'CRM completo de locatarios e locadores' },
              { icon: DollarSign, text: 'Kanban financeiro com controle de repasses' },
              { icon: LogIn, text: 'Contratos em PDF com clausulas padrao ImobVip' },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.09)',
                }}
              >
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'rgba(212,168,83,0.15)',
                    border: '1px solid rgba(212,168,83,0.25)',
                  }}
                >
                  <Icon size={16} style={{ color: '#D4A853' }} />
                </div>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>{text}</span>
              </div>
            ))}
          </div>

          {/* CRECI badge */}
          <div className="mt-8 flex items-center gap-2">
            <div
              className="h-px flex-1"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(212,168,83,0.25), transparent)' }}
            />
            <span className="text-[11px] px-3 py-1 rounded-full" style={{ color: 'rgba(212,168,83,0.55)', border: '1px solid rgba(212,168,83,0.15)' }}>
              CRECI SP 41.440-J
            </span>
            <div
              className="h-px flex-1"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(212,168,83,0.25), transparent)' }}
            />
          </div>
        </div>
      </div>

      {/* ——— RIGHT — Glass form ——— */}
      <div
        className="flex-1 flex items-center justify-center p-6 md:p-12 relative"
        style={{
          background: 'rgba(248,247,244,0.92)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
        }}
      >
        {/* Subtle background blobs in form area */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute top-0 right-0 h-64 w-64 rounded-full opacity-30"
            style={{ background: 'radial-gradient(circle, rgba(46,95,138,0.12) 0%, transparent 70%)' }}
          />
          <div
            className="absolute bottom-0 left-0 h-48 w-48 rounded-full opacity-25"
            style={{ background: 'radial-gradient(circle, rgba(212,168,83,0.10) 0%, transparent 70%)' }}
          />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <img src="/logo.png" alt="ImobVip Consultoria Imobiliária" className="h-14 object-contain" />
          </div>

          {/* Heading */}
          <h2 className="font-display text-3xl text-ink mb-1">Bem-vindo de volta</h2>
          <p className="text-ink-secondary mb-8 text-sm">Acesse sua conta para continuar.</p>

          {/* Form card */}
          <div
            className="rounded-2xl p-6 mb-6"
            style={{
              background: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.60)',
              boxShadow: '0 8px 32px rgba(15,34,56,0.07), inset 0 1px 1px rgba(255,255,255,0.90)',
            }}
          >
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
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink p-1 rounded-lg transition"
                    aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="text-sm rounded-xl px-3 py-2.5 flex items-center gap-2"
                  style={{
                    background: 'rgba(176,58,46,0.08)',
                    border: '1px solid rgba(176,58,46,0.20)',
                    color: '#B03A2E',
                  }}
                >
                  <span className="flex-shrink-0 h-4 w-4 rounded-full bg-danger/20 flex items-center justify-center text-[10px] font-bold">!</span>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary w-full mt-2"
                disabled={loading}
                data-testid="login-submit"
              >
                <LogIn size={16} />
                {loading ? 'Entrando…' : 'Entrar'}
              </button>
            </form>
          </div>

          {/* Demo credentials */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.55)',
              boxShadow: '0 4px 16px rgba(15,34,56,0.05)',
            }}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-3">
              Acessos demo — senha: senha123
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_CREDENTIALS.map((d) => (
                <button
                  key={d.role}
                  type="button"
                  onClick={() => applyDemo(d.email)}
                  className="text-left px-3 py-2.5 rounded-xl transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.60)',
                    border: '1px solid rgba(226,221,214,0.70)',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.background = 'rgba(255,255,255,0.90)'
                    el.style.borderColor = 'rgba(212,168,83,0.30)'
                    el.style.boxShadow = '0 2px 8px rgba(212,168,83,0.12)'
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.background = 'rgba(255,255,255,0.60)'
                    el.style.borderColor = 'rgba(226,221,214,0.70)'
                    el.style.boxShadow = 'none'
                  }}
                  data-testid={`demo-${d.role}`}
                >
                  <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#B8923A' }}>{d.label}</div>
                  <div className="text-xs text-ink mt-0.5 truncate">{d.email}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-[11px] text-ink-muted">
            ImobVip Consultoria Imobiliária &nbsp;·&nbsp; CNPJ 47.142.042/0001-20
          </p>
        </div>
      </div>
    </div>
  )
}
