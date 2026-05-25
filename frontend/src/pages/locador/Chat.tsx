import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { Avatar } from '@/components/common/Avatar'
import { chatService } from '@/services'
import { useAuth } from '@/stores/auth'
import type { ChatMessage } from '@/types'
import { wsUrl } from '@/lib/api'
import { fmtShortDate } from '@/lib/format'

export default function LocadorChat() {
  const { user, token } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const wsRef = useRef<WebSocket | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return
    void chatService.messages(user.id).then((m) => setMessages(m)).finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    if (!user || !token) return
    const ws = new WebSocket(wsUrl(`/chat/ws/${user.id}`, token))
    wsRef.current = ws
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data)
        if (data?.type === 'message' && data.data) {
          setMessages((prev) => prev.find((p) => p.id === data.data.id) ? prev : [...prev, data.data])
        }
      } catch { /* ignore */ }
    }
    return () => { ws.close() }
  }, [user, token])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!text.trim() || !user) return
    const t = text.trim()
    setText('')
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ mensagem: t }))
    } else {
      const m = await chatService.send(user.id, t)
      setMessages((prev) => [...prev, m])
    }
  }

  return (
    <AppLayout>
      <PageHeader eyebrow="Atendimento" title="Chat com a imobiliaria" description="Tire duvidas e acompanhe seus repasses em tempo real." />
      <div className="card-premium flex flex-col h-[70vh] max-h-[720px] overflow-hidden">
        {loading ? <LoadingScreen /> : (
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin" style={{ background: 'rgba(248,247,244,0.40)' }}>
            {messages.map((m) => {
              const mine = m.remetente_id === user?.id
              return (
                <div key={m.id} className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                  {!mine && <Avatar name={m.remetente_nome || 'Imobiliaria'} size={28} />}
                  <div className={`max-w-[70%] rounded-2xl px-3.5 py-2 text-sm ${mine ? 'rounded-br-sm' : 'rounded-bl-sm'}`} style={mine ? { background: 'linear-gradient(135deg, #2E5F8A 0%, #1B3A5C 100%)', color: '#FFFFFF', boxShadow: '0 4px 12px rgba(27,58,92,0.25)' } : { background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.60)', boxShadow: '0 2px 8px rgba(15,34,56,0.06)', color: '#1A1A2E' }}>
                    <div className="text-[11px] opacity-70 mb-0.5">{m.remetente_nome || (mine ? 'Voce' : 'Imobiliaria')}</div>
                    <div>{m.mensagem}</div>
                    <div className="text-[10px] opacity-60 mt-1 text-right">{new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div className="p-3 flex items-center gap-2" style={{ borderTop: '1px solid rgba(226,221,214,0.50)', background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send() }} className="input-premium flex-1" placeholder="Escreva uma mensagem…" data-testid="chat-input" />
          <button onClick={send} className="btn-primary" data-testid="chat-send"><Send size={16}/> Enviar</button>
        </div>
      </div>
    </AppLayout>
  )
}
