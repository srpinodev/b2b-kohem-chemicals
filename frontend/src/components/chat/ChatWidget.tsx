import { useEffect, useRef, useState } from 'react'
import { sendChatMessage } from '../../services/api/notifications'

interface Message {
  id: number
  from: 'user' | 'bot'
  text: string
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, from: 'bot', text: '¡Hola! Soy el asistente de Kohem Chemicals. ¿En qué puedo ayudarte?' },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sessionId, setSessionId] = useState<string | undefined>()
  const bottomRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(1)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return

    const userMsg: Message = { id: nextId.current++, from: 'user', text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setSending(true)

    try {
      const res = await sendChatMessage(text, sessionId)
      setSessionId(res.data.session_id)
      setMessages((prev) => [...prev, { id: nextId.current++, from: 'bot', text: res.data.reply }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: nextId.current++, from: 'bot', text: 'Lo siento, ocurrió un error. Intenta de nuevo.' },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-dust-200 flex flex-col overflow-hidden" style={{ height: 460 }}>
          <div className="bg-gunmetal-600 text-dust-100 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gold-400 text-gunmetal-800 flex items-center justify-center font-bold text-sm">
                  K
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-pine-300 rounded-full border-2 border-gunmetal-600" />
              </div>
              <div>
                <p className="font-semibold text-sm text-dust-50">Soporte Kohem</p>
                <p className="text-[10px] text-gold-300">En línea</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-dust-300 hover:text-gold-300 transition w-7 h-7 flex items-center justify-center rounded"
              aria-label="Cerrar chat"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-dust-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={[
                    'max-w-[80%] px-3.5 py-2 rounded-2xl text-sm shadow-sm',
                    msg.from === 'user'
                      ? 'bg-gunmetal-600 text-dust-50 rounded-br-sm'
                      : 'bg-white text-gunmetal-800 rounded-bl-sm border border-dust-200',
                  ].join(' ')}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-white border border-dust-200 px-3.5 py-2 rounded-2xl rounded-bl-sm">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-gunmetal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gunmetal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gunmetal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-dust-200 p-3 flex gap-2 bg-white">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Escribe tu consulta..."
              className="flex-1 text-sm bg-dust-50 border border-dust-300 rounded-full px-4 py-2 text-gunmetal-800 placeholder:text-gunmetal-300 focus:border-pine-400 focus:ring-2 focus:ring-pine-400/30 focus:bg-white transition"
              maxLength={500}
            />
            <button
              onClick={send}
              disabled={sending || !input.trim()}
              className="bg-gold-400 hover:bg-gold-500 text-gunmetal-800 rounded-full w-10 h-10 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
              aria-label="Enviar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 bg-gold-400 hover:bg-gold-500 text-gunmetal-800 rounded-full shadow-lg flex items-center justify-center transition hover:scale-105"
        aria-label={open ? 'Cerrar chat' : 'Abrir chat de soporte'}
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>
    </div>
  )
}
