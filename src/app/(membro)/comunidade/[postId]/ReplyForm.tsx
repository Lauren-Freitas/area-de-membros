'use client'
import { useRef, useState, useTransition } from 'react'
import { createReply } from '@/lib/actions/community'
import { Textarea } from '@/components/Textarea'

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
    <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] p-5 space-y-3">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Sua resposta</label>
      <Textarea
        ref={ref}
        value={body}
        onChange={e => setBody(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e as unknown as React.FormEvent) }}
        rows={3}
        placeholder="Escreva sua resposta... (⌘+Enter para enviar)"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{body.length}/1000</span>
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className="px-4 py-2 text-white text-sm font-semibold rounded-lg transition hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: 'var(--brand)' }}
        >
          {pending ? 'Enviando...' : 'Responder'}
        </button>
      </div>
    </form>
  )
}
