'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  completed: boolean
  /**
   * Duas ações sem argumento em vez de uma só com o novo estado — de
   * propósito: isso deixa cada uma virar uma referência de Server Action
   * pura (via .bind() no componente servidor que chama), o único jeito
   * confiável de passar uma Server Action de um Server Component pra um
   * Client Component. Uma arrow function fechando sobre argumentos
   * ("() => minhaAction(x, y)") não serializa nessa borda — só .bind()
   * ou a referência direta da função funcionam.
   */
  onComplete: () => Promise<unknown>
  onIncomplete: () => Promise<unknown>
  /** Nome do CustomEvent disparado a cada troca — o player de vídeo do modo "produto simples" escuta isso pra atualizar sem esperar o round-trip. */
  completionEventKey?: string
  fullWidth?: boolean
  /** Textos com concordância de gênero correta pro item (aula = feminino, produto/curso = masculino). */
  pendingLabel?: string
  doneLabel?: string
}

/** Botão de marcar/desmarcar conclusão — usado em aula e em produto (ver StarRating/CommentThread pro mesmo padrão de unificação). */
export function CompleteButton({
  completed: initial,
  onComplete,
  onIncomplete,
  completionEventKey,
  fullWidth = false,
  pendingLabel = 'Marcar como concluído',
  doneLabel = 'Concluído!',
}: Props) {
  const [completed, setCompleted] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    const next = !completed
    setCompleted(next)
    if (completionEventKey) {
      window.dispatchEvent(new CustomEvent(completionEventKey, { detail: { completed: next } }))
    }
    startTransition(async () => {
      await (next ? onComplete() : onIncomplete())
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-60 ${fullWidth ? 'w-full' : ''}`}
      style={completed
        ? { backgroundColor: '#22c55e', color: '#fff' }
        : { border: '2px solid var(--brand)', color: 'var(--brand)', backgroundColor: 'transparent' }
      }
    >
      {completed ? (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      {completed ? doneLabel : pendingLabel}
    </button>
  )
}
