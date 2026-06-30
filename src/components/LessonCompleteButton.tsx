'use client'
import { useTransition } from 'react'
import { toggleLessonComplete } from '@/lib/actions/progress'

interface Props {
  lessonId: string
  productId: string
  completed: boolean
}

export function LessonCompleteButton({ lessonId, productId, completed }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(() => toggleLessonComplete(lessonId, productId, completed))
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-60"
      style={completed
        ? { backgroundColor: '#22c55e', color: '#fff' }
        : { border: '2px solid #b48840', color: '#b48840', backgroundColor: 'transparent' }
      }
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      {isPending ? 'Atualizando...' : completed ? 'Concluída' : 'Marcar como concluída'}
    </button>
  )
}
