'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

function getEmbedUrl(url: string) {
  return url
    .replace('watch?v=', 'embed/')
    .replace('youtu.be/', 'www.youtube.com/embed/')
    .replace('vimeo.com/', 'player.vimeo.com/video/')
}

interface Props {
  url: string | null
  progressPct: number
  prevHref: string | null
  nextHref: string | null
}

export function LessonVideoPlayer({ url, progressPct, prevHref, nextHref }: Props) {
  const [focusMode, setFocusMode] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setFocusMode(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      {/* Overlay foco */}
      {focusMode && (
        <div
          className="fixed inset-0 bg-black/85 z-[100]"
          onClick={() => setFocusMode(false)}
        />
      )}

      <div className="bg-white dark:bg-[#0d1020] rounded-2xl border border-gray-100 dark:border-[#1e2030] overflow-hidden">
        {/* Vídeo */}
        <div className={focusMode
          ? 'fixed inset-x-4 top-1/2 -translate-y-1/2 z-[101] max-w-5xl mx-auto'
          : 'relative'
        }>
          <div className="aspect-video bg-black">
            {url ? (
              <iframe
                src={getEmbedUrl(url)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                Vídeo não configurado.
              </div>
            )}
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="h-1 bg-gray-100 dark:bg-gray-700">
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${progressPct}%`, backgroundColor: '#b48840' }}
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-[#0a0d1a]">
          {/* Progresso texto */}
          <span className="text-xs text-gray-400 font-medium">{progressPct}% concluído</span>

          {/* Botões */}
          <div className="flex items-center gap-1">
            {/* Grid — scroll para sidebar de aulas no mobile */}
            <a
              href="#lesson-sidebar"
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              title="Ver lista de aulas"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </a>
            <span
              className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg text-gray-500 dark:text-gray-400"
              title="Playlist visível na lateral"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </span>

            {/* Apagar / Acender luzes */}
            <button
              onClick={() => setFocusMode(v => !v)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              title={focusMode ? 'Acender luzes' : 'Apagar luzes'}
            >
              {focusMode ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
            </button>

            {/* Anterior */}
            {prevHref ? (
              <Link
                href={prevHref}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                title="Aula anterior"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            ) : (
              <span className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-100 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </span>
            )}

            {/* Próxima */}
            {nextHref ? (
              <Link
                href={nextHref}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                title="Próxima aula"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ) : (
              <span className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-100 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
