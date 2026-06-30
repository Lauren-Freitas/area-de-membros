'use client'
import { useRef, useState, useTransition } from 'react'
import { createReply } from '@/lib/actions/community'

export function ReplyForm({ postId }: { postId: string }) {
  const [body, setBody] = useState('')
  const [pending, startTransition] = useTransition()
  const ref = useRef<HTMLTextAreaElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    startTransition(async () => {
      await createReply(postId, body)
      setBody('')
      ref.current?.focus()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-[#0d1020] rounded-2xl border border-gray-100 dark:border-[#1e2030] p-5 space-y-3">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Sua resposta</label>
      <textarea
        ref={ref}
        value={body}
        onChange={e => setBody(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e as unknown as React.FormEvent) }}
        rows={3}
        placeholder="Escreva sua resposta... (⌘+Enter para enviar)"
        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 resize-none"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{body.length}/1000</span>
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className="px-4 py-2 text-white text-sm font-semibold rounded-lg transition hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#b48840' }}
        >
          {pending ? 'Enviando...' : 'Responder'}
        </button>
      </div>
    </form>
  )
}
