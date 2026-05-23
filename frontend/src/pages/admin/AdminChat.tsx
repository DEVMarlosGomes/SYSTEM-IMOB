import { useEffect, useRef, useState } from 'react'
import { Send, MessageSquare } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { EmptyState } from '@/components/common/EmptyState'
import { Avatar } from '@/components/common/Avatar'
import { chatService } from '@/services'
import type { ChatConversation, ChatMessage } from '@/types'
import { useAuth } from '@/stores/auth'
import { wsUrl } from '@/lib/api'

export default function AdminChat() {
  const { user, token } = useAuth()
  const [convs, setConvs] = useState<ChatConversation[]>([])
  const [selected, setSelected] = useState<ChatConversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const wsRef = useRef<WebSocket | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => { chatService.conversations().then((c) => { setConvs(c); setSelected(c[0] || null) }).finally(() => setLoading(false)) }, [])

  useEffect(() => {
    if (!selected) return
    const id = (selected as any).id || selected.locador_id!
    void chatService.messages(id).then(setMessages)
  }, [selected])

  useEffect(() => {
    if (!selected || !token) return
    const id = (selected as any).id || selected.locador_id!
    const ws = new WebSocket(wsUrl(`/chat/ws/${id}`, token))
    wsRef.current = ws
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data)
        if (data?.type === 'message' && data.data) setMessages((prev) => prev.find((p) => p.id === data.data.id) ? prev : [...prev, data.data])
      } catch { /* ignore */ }
    }
    return () => { ws.close() }
  }, [selected, token])

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }) }, [messages])

  async function send() {
    if (!text.trim() || !selected) return
    const id = (selected as any).id || selected.locador_id!
    const t = text.trim()
    setText('')
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ mensagem: t }))
    else {
      const m = await chatService.send(id, t)
      setMessages((prev) => [...prev, m])
    }
  }

  return (
    <AppLayout>
      <PageHeader eyebrow="Atendimento" title="Chat com locadores" description="Converse com os proprietarios da sua imobiliaria." />
      {loading ? <LoadingScreen /> : convs.length === 0 ? <EmptyState icon={<MessageSquare size={24}/>} description="Nenhum locador cadastrado." /> : (
        <div className="card-premium grid grid-cols-1 md:grid-cols-[280px_1fr] h-[72vh] overflow-hidden">
          {/* sidebar conversas */}
          <aside className="border-r border-line overflow-y-auto scrollbar-thin bg-surface">
            {convs.map((c) => {
              const id = (c as any).id || c.locador_id
              const active = selected && (((selected as any).id || selected.locador_id) === id)
              return (
                <button key={id} onClick={() => setSelected(c)} className={`w-full flex items-center gap-3 px-3 py-3 border-b border-line text-left hover:bg-white ${active ? 'bg-white' : ''}`}>
                  <Avatar name={c.nome} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-ink truncate">{c.nome}</div>
                    <div className="text-xs text-ink-secondary truncate">{c.last_message?.mensagem || 'Sem mensagens ainda'}</div>
                  </div>
                  {c.unread ? <span className="text-[10px] bg-gold text-navy-800 px-1.5 py-0.5 rounded-full">{c.unread}</span> : null}
                </button>
              )
            })}
          </aside>
          <div className="flex flex-col">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface scrollbar-thin">
              {messages.map((m) => {
                const mine = m.remetente_id === user?.id
                return (
                  <div key={m.id} className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                    {!mine && <Avatar name={m.remetente_nome || 'Locador'} size={28} />}
                    <div className={`max-w-[70%] rounded-2xl px-3.5 py-2 text-sm shadow-soft ${mine ? 'bg-navy text-white rounded-br-sm' : 'bg-white text-ink border border-line rounded-bl-sm'}`}>
                      <div className="text-[11px] opacity-70 mb-0.5">{m.remetente_nome || (mine ? 'Voce' : 'Locador')}</div>
                      <div>{m.mensagem}</div>
                      <div className="text-[10px] opacity-60 mt-1 text-right">{new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="p-3 border-t border-line bg-white flex items-center gap-2">
              <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send() }} className="input-premium flex-1" placeholder="Escreva uma mensagem…" />
              <button onClick={send} className="btn-primary"><Send size={16}/> Enviar</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
