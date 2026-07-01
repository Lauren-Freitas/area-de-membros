'use client'
import { useState, useTransition, useEffect } from 'react'
import { postComment, deleteComment } from '@/lib/actions/comments'
import { LessonComment } from '@/types'

interface Props {
  lessonId: string
  productId: string
  currentUserId: string
  isAdmin: boolean
  initialComments: LessonComment[]
  userInitials?: string
  userAvatarUrl?: string | null
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'agora mesmo'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `há ${days} dia${days > 1 ? 's' : ''}`
  const months = Math.floor(days / 30)
  return `há ${months} ${months > 1 ? 'meses' : 'mês'}`
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export function LessonComments({ lessonId, productId, currentUserId, isAdmin, initialComments, userInitials = 'EU', userAvatarUrl }: Props) {
  const [comments, setComments] = useState(initialComments)
  const [text, setText] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setComments(initialComments)
  }, [initialComments])

  function handlePost() {
    if (!text.trim()) return
    const content = text.trim()
    setText('')
    startTransition(async () => {
      await postComment(lessonId, productId, content)
    })
  }

  function handleDelete(commentId: string) {
    setComments(prev => prev.filter(c => c.id !== commentId))
    startTransition(async () => {
      await deleteComment(commentId, lessonId, productId)
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost()
  }

  return (
    <div className="mt-8">
      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">
        Comentários {comments.length > 0 && <span className="text-gray-400 font-normal">({comments.length})</span>}
      </h3>

      {/* Form */}
      <div className="flex gap-3 mb-6">
        {userAvatarUrl ? (
          <img src={userAvatarUrl} alt="Você" className="w-8 h-8 rounded-full shrink-0 object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#b48840' }}>
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
            className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 resize-none bg-white dark:bg-[#0d1020] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ '--tw-ring-color': '#b48840' } as React.CSSProperties}
            maxLength={1000}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">{text.length}/1000</span>
            <button
              onClick={handlePost}
              disabled={!text.trim() || isPending}
              className="px-4 py-1.5 text-sm font-semibold text-white rounded-lg transition disabled:opacity-40 hover:opacity-90"
              style={{ backgroundColor: '#b48840' }}
            >
              {isPending ? 'Enviando...' : 'Enviar'}
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
            const name = comment.profiles?.name ?? 'Usuário'
            const canDelete = isAdmin || comment.user_id === currentUserId
            return (
              <div key={comment.id} className="flex gap-3">
                <div
                  className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: '#7c6f3e' }}
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
