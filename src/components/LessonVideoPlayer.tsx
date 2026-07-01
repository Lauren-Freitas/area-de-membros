'use client'

import { useState, useEffect, useRef } from 'react'
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
  completionEventKey?: string
}

export function LessonVideoPlayer({ url, progressPct: initialPct, prevHref, nextHref, completionEventKey }: Props) {
  const [progressPct, setProgressPct] = useState(initialPct)
  const [showExpandMenu, setShowExpandMenu] = useState(false)
  const [theatreMode, setTheatreMode] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  function expandFull() {
    const el = iframeRef.current
    if (!el) return
    if (el.requestFullscreen) el.requestFullscreen()
    setShowExpandMenu(false)
  }

  function expandPartial() {
    setTheatreMode(true)
    setShowExpandMenu(false)
  }

  // Fechar menu ao clicar fora
  useEffect(() => {
    if (!showExpandMenu) return
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowExpandMenu(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [showExpandMenu])

  // Fechar teatro com Escape
  useEffect(() => {
    if (!theatreMode) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setTheatreMode(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [theatreMode])

  useEffect(() => {
    if (!completionEventKey) return
    function onComplete(e: Event) {
      const detail = (e as CustomEvent<{ completed: boolean }>).detail
      setProgressPct(detail.completed ? 100 : 0)
    }
    window.addEventListener(completionEventKey, onComplete)
    return () => window.removeEventListener(completionEventKey, onComplete)
  }, [completionEventKey])

  return (
    <>
      {/* Modo cinema */}
      {theatreMode && url && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 sm:p-10"
          onClick={() => setTheatreMode(false)}
        >
          <div
            className="w-full max-w-5xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
              <iframe
                src={getEmbedUrl(url)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
              />
            </div>
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setTheatreMode(false)}
                className="flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Fechar (Esc)
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-[#0d1020] rounded-2xl border border-gray-100 dark:border-[#1e2030] overflow-hidden">
        {/* Vídeo */}
        <div className="relative">
          <div className="aspect-video bg-black">
            {url ? (
              <iframe
                ref={iframeRef}
                src={getEmbedUrl(url)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
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
          <span className="text-xs text-gray-400 font-medium">{progressPct}% concluído</span>

          <div className="flex items-center gap-1">
            {/* Expandir — dropdown com duas opções */}
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setShowExpandMenu(v => !v)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                title="Opções de expansão"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
              </button>

              {showExpandMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-44 bg-white dark:bg-[#1a1f35] rounded-xl shadow-2xl border border-gray-100 dark:border-[#2a2f45] overflow-hidden z-10">
                  <button
                    onClick={expandPartial}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252a40] transition text-left"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v3m0-3h3m-3 0L7.5 7.5M3.75 20.25v-3m0 3h3m-3 0L7.5 16.5M20.25 3.75h-3m3 0v3m0-3L16.5 7.5M20.25 20.25h-3m3 0v-3m0 3L16.5 16.5" />
                    </svg>
                    Ampliar parcial
                  </button>
                  <div className="h-px bg-gray-100 dark:bg-[#2a2f45]" />
                  <button
                    onClick={expandFull}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252a40] transition text-left"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                    </svg>
                    Ampliar total
                  </button>
                </div>
              )}
            </div>

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
