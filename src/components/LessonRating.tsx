'use client'

import { useState, useTransition } from 'react'
import { rateLesson } from '@/lib/actions/ratings'

interface Props {
  lessonId: string
  productId: string
  initialRating: number | null
}

export function LessonRating({ lessonId, productId, initialRating }: Props) {
  const [rating, setRating] = useState(initialRating ?? 0)
  const [hovered, setHovered] = useState(0)
  const [isPending, startTransition] = useTransition()

  function handleRate(value: number) {
    const next = rating === value ? 0 : value
    setRating(next)
    startTransition(async () => {
      if (next > 0) await rateLesson(lessonId, productId, next)
    })
  }

  const display = hovered || rating

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-400 mr-0.5">Avaliar:</span>
      {[1, 2, 3, 4, 5].map(v => (
        <button
          key={v}
          onClick={() => handleRate(v)}
          onMouseEnter={() => setHovered(v)}
          onMouseLeave={() => setHovered(0)}
          disabled={isPending}
          className="transition-transform hover:scale-110 disabled:opacity-50"
          aria-label={`${v} estrela${v > 1 ? 's' : ''}`}
        >
          <svg
            className="w-5 h-5 transition-colors"
            viewBox="0 0 24 24"
            fill={display >= v ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={1.8}
            style={{ color: display >= v ? '#b48840' : '#d1d5db' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        </button>
      ))}
      {rating > 0 && (
        <span className="text-xs ml-1" style={{ color: '#b48840' }}>
          {rating}/5
        </span>
      )}
    </div>
  )
}
