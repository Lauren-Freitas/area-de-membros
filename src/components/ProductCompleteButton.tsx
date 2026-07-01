'use client'

import { useState, useTransition } from 'react'
import { markProductComplete, unmarkProductComplete } from '@/lib/actions/product-actions'

interface Props {
  productId: string
  completed: boolean
}

export function ProductCompleteButton({ productId, completed: initial }: Props) {
  const [completed, setCompleted] = useState(initial)
  const [isPending, startTransition] = useTransition()

  function toggle() {
    setCompleted(v => !v)
    startTransition(async () => {
      if (!completed) await markProductComplete(productId)
      else await unmarkProductComplete(productId)
    })
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-60"
      style={completed
        ? { backgroundColor: '#22c55e', color: '#fff' }
        : { border: '2px solid #b48840', color: '#b48840', backgroundColor: 'transparent' }
      }
    >
      {completed ? (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Concluído!
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Marcar como concluído
        </>
      )}
    </button>
  )
}
