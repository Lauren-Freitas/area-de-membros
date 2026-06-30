'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface Message {
  id?: string
  role: 'user' | 'assistant'
  content: string
  created_at?: string
}

const SUGGESTIONS = [
  'Como montar um café da manhã nutritivo?',
  'Quais alimentos ajudam a emagrecer?',
  'Como reduzir o consumo de açúcar?',
  'O que comer antes e depois do treino?',
]

export function ChatInterface({
  conversationId,
  initialMessages,
  title,
}: {
  conversationId: string
  initialMessages: Message[]
  title: string
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return
    const userMsg: Message = { role: 'user', content: text }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setStreaming(true)

    // Placeholder de resposta
    const assistantPlaceholder: Message = { role: 'assistant', content: '' }
    setMessages([...history, assistantPlaceholder])

    try {
      const res = await fetch('/api/assistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: text,
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          fullText += decoder.decode(value, { stream: true })
          setMessages(prev => {
            const next = [...prev]
            next[next.length - 1] = { role: 'assistant', content: fullText }
            return next
          })
        }
      }
    } catch {
      setMessages(prev => {
        const next = [...prev]
        next[next.length - 1] = { role: 'assistant', content: 'Erro ao conectar com o assistente. Tente novamente.' }
        return next
      })
    } finally {
      setStreaming(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <Link href="/assistente" className="text-gray-400 hover:text-gray-600 transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-base font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-xs text-gray-400">Assistente de Nutrição</p>
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            <div>
              <p className="text-4xl mb-3">🥗</p>
              <p className="font-semibold text-gray-700 dark:text-gray-300">Como posso ajudar?</p>
              <p className="text-sm text-gray-400 mt-1">Pergunte sobre alimentação, dietas ou hábitos saudáveis.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-left text-sm px-4 py-3 bg-white dark:bg-[#0d1020] rounded-xl border border-gray-100 dark:border-[#1e2030] hover:border-yellow-300 hover:bg-yellow-50 dark:hover:bg-gray-700 transition text-gray-600 dark:text-gray-300"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 mt-0.5" style={{ backgroundColor: '#f5efe3' }}>
                🤖
              </div>
            )}
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'text-white rounded-tr-sm'
                  : 'bg-white dark:bg-[#0d1020] text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-[#1e2030] rounded-tl-sm'
              }`}
              style={msg.role === 'user' ? { backgroundColor: '#b48840' } : {}}
            >
              {msg.content || (streaming && idx === messages.length - 1 ? (
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              ) : '')}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 pt-3 border-t border-gray-100 dark:border-[#1e2030]">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={streaming}
            placeholder="Pergunte algo sobre nutrição... (Enter para enviar)"
            className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 resize-none disabled:opacity-50"
            style={{ maxHeight: '120px' }}
            onInput={e => {
              const t = e.target as HTMLTextAreaElement
              t.style.height = 'auto'
              t.style.height = `${Math.min(t.scrollHeight, 120)}px`
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={streaming || !input.trim()}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition hover:opacity-90 disabled:opacity-40 shrink-0"
            style={{ backgroundColor: '#b48840' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5 text-center">
          IA pode cometer erros. Para orientações clínicas, consulte o Thiago.
        </p>
      </div>
    </div>
  )
}
