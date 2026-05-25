import { useState, useEffect, useRef } from 'react'
import { Bell, CheckCheck, FileText, CreditCard, FileCheck, Info } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { notificationService } from '@/services'
import type { Notification, NotificationType } from '@/types'

const POLL_MS = 30_000  // refresh every 30 s

function typeIcon(type: NotificationType) {
  switch (type) {
    case 'comprovante_enviado': return <CreditCard size={14} className="text-blue-500" />
    case 'pagamento_aprovado':  return <CheckCheck size={14} className="text-green-600" />
    case 'contrato_criado':     return <FileCheck size={14} style={{ color: '#D4A853' }} />
    default:                    return <Info size={14} className="text-ink-secondary" />
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export function NotificationBell() {
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  async function load() {
    try {
      setNotifs(await notificationService.list())
    } catch { /* ignore if backend unavailable */ }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, POLL_MS)
    return () => clearInterval(interval)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const unread = notifs.filter(n => !n.lida).length

  async function markAll() {
    await notificationService.markAllRead()
    setNotifs(prev => prev.map(n => ({ ...n, lida: true })))
  }

  async function handleClick(n: Notification) {
    if (!n.lida) {
      await notificationService.markRead(n.id)
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, lida: true } : x))
    }
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-xl transition-all"
        style={{
          background: open ? 'rgba(212,168,83,0.12)' : 'rgba(255,255,255,0.60)',
          border: open ? '1px solid rgba(212,168,83,0.35)' : '1px solid rgba(255,255,255,0.55)',
          color: open ? '#B8923A' : 'rgba(90,96,112,0.80)',
        }}
        aria-label="Notificações"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-white"
            style={{
              fontSize: '10px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #E05252 0%, #C0392B 100%)',
              boxShadow: '0 2px 6px rgba(192,57,43,0.50)',
              padding: '0 4px',
            }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-2xl overflow-hidden z-50 animate-fade-in"
          style={{
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(28px) saturate(180%)',
            WebkitBackdropFilter: 'blur(28px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.65)',
            boxShadow: '0 20px 50px rgba(9,22,40,0.20), 0 4px 12px rgba(9,22,40,0.08)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid rgba(226,221,214,0.60)' }}
          >
            <div className="flex items-center gap-2">
              <Bell size={15} style={{ color: '#D4A853' }} />
              <span className="text-sm font-semibold text-ink">Notificações</span>
              {unread > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                  style={{ background: '#E05252' }}
                >
                  {unread}
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={markAll}
                className="text-[11px] text-ink-muted hover:text-ink transition-colors flex items-center gap-1"
              >
                <CheckCheck size={13} /> Marcar todas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-ink-muted">
                Nenhuma notificação
              </div>
            ) : (
              notifs.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className="w-full text-left px-4 py-3 transition-all hover:bg-white/60 flex gap-3 items-start"
                  style={{
                    borderBottom: '1px solid rgba(226,221,214,0.40)',
                    background: n.lida ? 'transparent' : 'rgba(212,168,83,0.05)',
                  }}
                >
                  <div
                    className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.70)', border: '1px solid rgba(226,221,214,0.60)' }}
                  >
                    {typeIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <span className={`text-[13px] font-semibold leading-snug ${n.lida ? 'text-ink-secondary' : 'text-ink'}`}>
                        {n.title}
                      </span>
                      <span className="text-[10px] text-ink-muted flex-shrink-0">{timeAgo(n.created_at)}</span>
                    </div>
                    <p className="text-[12px] text-ink-secondary leading-relaxed mt-0.5 line-clamp-2">{n.body}</p>
                  </div>
                  {!n.lida && (
                    <div
                      className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: '#D4A853' }}
                    />
                  )}
                </button>
              ))
            )}
          </div>

          {notifs.length > 0 && (
            <div
              className="px-4 py-2 text-center"
              style={{ borderTop: '1px solid rgba(226,221,214,0.40)' }}
            >
              <span className="text-[11px] text-ink-muted">{notifs.length} notificação{notifs.length !== 1 ? 'ões' : ''} no total</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
