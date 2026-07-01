'use client'

import { useState, useRef, useEffect } from 'react'

type Message = { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  'O que comer antes de treinar?',
  'Como calcular minhas proteínas?',
  'Sugestão de café da manhã saudável',
]

const RobotIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25V5" />
    <circle cx="12" cy="2" r="1" fill="currentColor" stroke="none" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 5h15A1.5 1.5 0 0121 6.5v10A1.5 1.5 0 0119.5 18h-15A1.5 1.5 0 013 16.5v-10A1.5 1.5 0 014.5 5z" />
    <rect x="7.5" y="8.5" width="3" height="3" rx="0.75" stroke="currentColor" strokeWidth={1.8} />
    <rect x="13.5" y="8.5" width="3" height="3" rx="0.75" stroke="currentColor" strokeWidth={1.8} />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.5h6" />
    <path strokeLinecap="round" d="M3 11H1.5M22.5 11H21" />
  </svg>
)

export function ProteinoFAB({ userId: _userId }: { userId?: string }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return
    const history = messages.map(m => ({ role: m.role, content: m.content }))
    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '' }])
    setInput('')
    setStreaming(true)

    try {
      const res = await fetch('/api/assistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: null, message: text, history }),
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: accumulated }
          return updated
        })
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: 'Ocorreu um erro. Tente novamente.' }
        return updated
      })
    } finally {
      setStreaming(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <>
      {/* FAB */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setOpen(v => !v)}
          aria-label="Abrir Proteíno"
          className="w-12 h-12 rounded-full text-white shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
          style={{ backgroundColor: '#b48840' }}
        >
          {open ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <RobotIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Side Panel */}
      {open && (
        <>
          {/* Backdrop mobile */}
          <div
            className="fixed inset-0 bg-black/30 z-40 sm:hidden"
            onClick={() => setOpen(false)}
          />

          <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[380px] bg-white dark:bg-[#0d1020] z-50 flex flex-col shadow-2xl border-l border-gray-100 dark:border-[#1e2030]">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-[#1e2030] shrink-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#b48840' }}
              >
                <RobotIcon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-900 dark:text-white">Proteíno</p>
                <p className="text-xs text-gray-400">Assistente de nutrição</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center pt-8 px-2">
                  <div
                    className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-3"
                    style={{ backgroundColor: '#f5efe3' }}
                  >
                    <RobotIcon className="w-7 h-7" style={{ color: '#b48840' } as React.CSSProperties} />
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Olá! Sou o Proteíno</p>
                  <p className="text-xs text-gray-400 mt-1 mb-5">Seu assistente de nutrição. Como posso ajudar?</p>

                  <div className="flex flex-col gap-2 text-left">
                    {SUGGESTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="text-xs px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-[#b48840] hover:text-[#7a5c10] dark:hover:text-[#b48840] transition text-left"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'text-white rounded-tr-sm'
                        : 'bg-gray-100 dark:bg-[#1a1f35] text-gray-800 dark:text-gray-200 rounded-tl-sm'
                    }`}
                    style={msg.role === 'user' ? { backgroundColor: '#b48840' } : undefined}
                  >
                    {msg.content || (
                      <span className="flex gap-1 py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-100 dark:border-[#1e2030] shrink-0">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Pergunte algo..."
                  rows={1}
                  disabled={streaming}
                  className="flex-1 resize-none text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#1a1f35] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition disabled:opacity-60"
                  style={{ '--tw-ring-color': '#b48840' } as React.CSSProperties}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || streaming}
                  className="w-9 h-9 shrink-0 rounded-xl text-white flex items-center justify-center transition hover:opacity-90 disabled:opacity-40"
                  style={{ backgroundColor: '#b48840' }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-2 text-center">Enter para enviar · Shift+Enter nova linha</p>
            </div>
          </div>
        </>
      )}
    </>
  )
}
