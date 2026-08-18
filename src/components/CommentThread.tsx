'use client'

import { useState, useTransition } from 'react'
import { timeAgo } from '@/lib/time'

export interface CommentRow {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: { name: string } | null
}

interface Props {
  initialComments: CommentRow[]
  currentUserId: string
  isAdmin: boolean
  userInitials?: string
  userAvatarUrl?: string | null
  onSubmit: (content: string) => Promise<unknown>
  onDelete: (commentId: string) => Promise<{ error?: string } | unknown>
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase() || 'U'
}

/** Thread de comentários — usada em aula e em produto (ver StarRating pro mesmo padrão: casca genérica + ação injetada por quem chama). */
export function CommentThread({ initialComments, currentUserId, isAdmin, userInitials = 'EU', userAvatarUrl, onSubmit, onDelete }: Props) {
  const [comments, setComments] = useState(initialComments)
  const [text, setText] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handlePost() {
    const content = text.trim()
    if (!content) return
    const optimistic: CommentRow = {
      id: crypto.randomUUID(),
      content,
      created_at: new Date().toISOString(),
      user_id: currentUserId,
      profiles: null,
    }
    setComments(prev => [...prev, optimistic])
    setText('')
    startTransition(async () => { await onSubmit(content) })
  }

  function handleDelete(commentId: string) {
    setDeleteError(null)
    const removed = comments.find(c => c.id === commentId)
    setComments(prev => prev.filter(c => c.id !== commentId))
    startTransition(async () => {
      const result = await onDelete(commentId)
      const error = (result as { error?: string } | undefined)?.error
      if (error && removed) {
        // Delete falhou de verdade (não só otimista) — devolve o comentário
        // pra lista em vez de deixar a UI mentir que foi excluído.
        setComments(prev => [...prev, removed].sort((a, b) => a.created_at.localeCompare(b.created_at)))
        setDeleteError(error)
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost()
  }

  return (
    <div>
      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
        Comentários {comments.length > 0 && <span className="text-gray-400 font-normal">({comments.length})</span>}
      </h3>

      {deleteError && (
        <p className="text-xs text-red-500 mb-3">Não foi possível excluir: {deleteError}</p>
      )}

      {/* Form */}
      <div className="flex gap-3 mb-6">
        {userAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={userAvatarUrl} alt="Você" className="w-8 h-8 rounded-full shrink-0 object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: 'var(--brand)' }}>
            {userInitials}
          </div>
        )}
        <div className="flex-1">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escreva um comentário... (Cmd+Enter para enviar)"
            rows={3}
            maxLength={1000}
            className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 resize-none bg-card text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ '--tw-ring-color': 'var(--brand)' } as React.CSSProperties}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">{text.length}/1000</span>
            <button
              onClick={handlePost}
              disabled={!text.trim() || isPending}
              className="px-4 py-1.5 text-sm font-semibold text-white rounded-lg transition disabled:opacity-40 hover:opacity-90"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              Publicar
            </button>
          </div>
        </div>
      </div>

      {/* Lista */}
      {comments.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
          Nenhum comentário ainda. Seja o primeiro!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map(comment => {
            const isMine = comment.user_id === currentUserId
            const name = isMine ? 'Você' : (comment.profiles?.name ?? 'Membro')
            const canDelete = isAdmin || isMine
            return (
              <div key={comment.id} className="flex gap-3">
                <div
                  className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: 'var(--brand)' }}
                >
                  {initials(name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{name}</span>
                    <span className="text-xs text-gray-400">{timeAgo(comment.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">{comment.content}</p>
                </div>
                {canDelete && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="shrink-0 p-1 text-gray-300 hover:text-red-400 transition"
                    title="Excluir comentário"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
