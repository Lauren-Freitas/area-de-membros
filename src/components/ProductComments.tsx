'use client'

import { useState, useTransition } from 'react'
import { addProductComment, deleteProductComment } from '@/lib/actions/product-actions'

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: { name: string } | null
}

interface Props {
  productId: string
  currentUserId: string
  isAdmin: boolean
  initialComments: Comment[]
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'agora'
  const m = Math.floor(seconds / 60)
  if (m < 60) return `${m}min atrás`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}

export function ProductComments({ productId, currentUserId, isAdmin, initialComments }: Props) {
  const [comments, setComments] = useState(initialComments)
  const [text, setText] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    const optimistic: Comment = {
      id: crypto.randomUUID(),
      content: text.trim(),
      created_at: new Date().toISOString(),
      user_id: currentUserId,
      profiles: null,
    }
    setComments(prev => [...prev, optimistic])
    setText('')
    startTransition(async () => {
      await addProductComment(productId, optimistic.content)
    })
  }

  function handleDelete(id: string) {
    setComments(prev => prev.filter(c => c.id !== id))
    startTransition(async () => {
      await deleteProductComment(id, productId)
    })
  }

  return (
    <div>
      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
        Comentários {comments.length > 0 && <span className="text-gray-400 font-normal">({comments.length})</span>}
      </h3>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Escreva seu comentário..."
          rows={3}
          className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#1a1f35] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent resize-none transition"
          style={{ '--tw-ring-color': '#b48840' } as React.CSSProperties}
        />
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={isPending || !text.trim()}
            className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#b48840' }}
          >
            Publicar
          </button>
        </div>
      </form>

      {/* Lista */}
      {comments.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">Nenhum comentário ainda. Seja o primeiro!</p>
      ) : (
        <div className="space-y-4">
          {comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#b48840' }}>
                {(c.profiles?.name ?? 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{c.profiles?.name ?? 'Você'}</span>
                  <span className="text-xs text-gray-400">{timeAgo(c.created_at)}</span>
                  {(isAdmin || c.user_id === currentUserId) && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition ml-auto"
                    >
                      Excluir
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
