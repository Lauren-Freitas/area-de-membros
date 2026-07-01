'use client'

import { useState } from 'react'
import Link from 'next/link'

interface SidebarLesson {
  id: string
  title: string
  lesson_type: string
  sort_order: number
  completed: boolean
}

interface Props {
  productId: string
  moduleTitle: string
  lessons: SidebarLesson[]
  currentLessonId: string
}

const typeLabel: Record<string, string> = {
  video: 'Vídeo',
  text: 'Texto',
  file: 'Arquivo',
  link: 'Link',
}

export function LessonSidebar({ productId, moduleTitle, lessons, currentLessonId }: Props) {
  const [open, setOpen] = useState(true)

  const completedCount = lessons.filter(l => l.completed).length
  const pct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0

  return (
    <aside className="bg-white dark:bg-[#0d1020] rounded-2xl border border-gray-100 dark:border-[#1e2030] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-start justify-between gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-[#1e2030] hover:bg-gray-50 dark:hover:bg-[#1a1f35] transition"
      >
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Módulo atual</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white leading-snug">{moduleTitle}</p>
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>{completedCount}/{lessons.length} aulas</span>
              <span style={{ color: '#b48840' }}>{pct}%</span>
            </div>
            <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: '#b48840' }}
              />
            </div>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 shrink-0 mt-1 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Lista de aulas */}
      {open && (
        <div className="divide-y divide-gray-50 dark:divide-[#1a1f35] max-h-[60vh] overflow-y-auto">
          {lessons.map((lesson, idx) => {
            const isActive = lesson.id === currentLessonId
            return (
              <Link
                key={lesson.id}
                href={`/produto/${productId}/aula/${lesson.id}`}
                className={`flex items-start gap-3 px-4 py-3 transition group ${
                  isActive
                    ? 'bg-[#f5efe3] dark:bg-[#1e1a00]'
                    : 'hover:bg-gray-50 dark:hover:bg-[#1a1f35]'
                }`}
              >
                {/* Ícone de status */}
                <div className="shrink-0 mt-0.5">
                  {lesson.completed ? (
                    <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#22c55e' }}>
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  ) : isActive ? (
                    <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: '#b48840' }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#b48840' }} />
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full border-2 border-gray-200 dark:border-gray-600" />
                  )}
                </div>

                {/* Texto */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs leading-snug ${
                      isActive
                        ? 'font-semibold'
                        : lesson.completed
                        ? 'text-gray-400 dark:text-gray-500 line-through'
                        : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'
                    }`}
                    style={isActive ? { color: '#7a5c10' } : {}}
                  >
                    {idx + 1}. {lesson.title}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {typeLabel[lesson.lesson_type] ?? 'Vídeo'}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </aside>
  )
}
