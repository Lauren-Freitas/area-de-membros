'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

declare global {
  interface Window {
    YT: {
      Player: new (el: HTMLElement, opts: {
        videoId?: string
        playerVars?: Record<string, unknown>
      }) => YTPlayer
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

interface YTPlayer {
  setPlaybackRate(rate: number): void
  getIframe(): HTMLIFrameElement
  destroy(): void
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

function isYouTubeUrl(url: string) {
  return url.includes('youtube.com') || url.includes('youtu.be')
}

function extractYouTubeId(url: string) {
  return (
    url.match(/[?&]v=([a-zA-Z0-9_-]{11})/)?.[1] ??
    url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)?.[1] ??
    url.match(/\/embed\/([a-zA-Z0-9_-]{11})/)?.[1] ??
    ''
  )
}

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
  const [theatreMode, setTheatreMode] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const ytContainerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const ytPlayerRef = useRef<YTPlayer | null>(null)
  const speedMenuRef = useRef<HTMLDivElement>(null)

  const isYT = url ? isYouTubeUrl(url) : false

  // Inicializar YouTube IFrame API
  useEffect(() => {
    if (!url || !isYT) return
    const videoId = extractYouTubeId(url)
    if (!videoId) return

    let mounted = true

    function createPlayer() {
      if (!mounted || !ytContainerRef.current) return
      ytPlayerRef.current?.destroy()
      ytPlayerRef.current = new window.YT.Player(ytContainerRef.current, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1 },
      })
    }

    if (window.YT?.Player) {
      createPlayer()
    } else {
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        prev?.()
        createPlayer()
      }
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const script = document.createElement('script')
        script.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(script)
      }
    }

    return () => {
      mounted = false
      ytPlayerRef.current?.destroy()
      ytPlayerRef.current = null
    }
  }, [url, isYT])

  // Fechar menu de velocidade ao clicar fora
  useEffect(() => {
    if (!showSpeedMenu) return
    function onClickOutside(e: MouseEvent) {
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target as Node)) {
        setShowSpeedMenu(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [showSpeedMenu])

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

  function changeSpeed(rate: number) {
    setSpeed(rate)
    setShowSpeedMenu(false)
    ytPlayerRef.current?.setPlaybackRate(rate)
  }

  function expandFull() {
    if (isYT && ytPlayerRef.current) {
      ytPlayerRef.current.getIframe().requestFullscreen?.()
    } else {
      iframeRef.current?.requestFullscreen?.()
    }
  }

  return (
    <>
      {/* Modo cinema */}
      {theatreMode && url && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 sm:p-10"
          onClick={() => setTheatreMode(false)}
        >
          <div className="w-full max-w-5xl" onClick={e => e.stopPropagation()}>
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
        <div className="aspect-video bg-black">
          {url ? (
            isYT ? (
              /* YouTube: div substituído pela API */
              <div key={url} ref={ytContainerRef} className="w-full h-full" />
            ) : (
              <iframe
                ref={iframeRef}
                src={getEmbedUrl(url)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
              Vídeo não configurado.
            </div>
          )}
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
            {/* Velocidade — só para YouTube */}
            {isYT && (
              <div ref={speedMenuRef} className="relative">
                <button
                  onClick={() => setShowSpeedMenu(v => !v)}
                  className="h-8 px-2 flex items-center rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  title="Velocidade"
                >
                  {speed}x
                </button>
                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-1 bg-white dark:bg-[#1a1f35] rounded-xl shadow-xl border border-gray-100 dark:border-[#2a2f45] overflow-hidden z-10 py-1 min-w-[100px]">
                    {SPEEDS.map(s => (
                      <button
                        key={s}
                        onClick={() => changeSpeed(s)}
                        className={`w-full px-4 py-1.5 text-xs text-left transition ${
                          speed === s
                            ? 'font-semibold text-[#b48840]'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252a40]'
                        }`}
                      >
                        {s === 1 ? '1x (normal)' : `${s}x`}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Modo teatro */}
            <button
              onClick={() => setTheatreMode(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              title="Modo teatro"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v3m0-3h3m-3 0L7.5 7.5M3.75 20.25v-3m0 3h3m-3 0L7.5 16.5M20.25 3.75h-3m3 0v3m0-3L16.5 7.5M20.25 20.25h-3m3 0v-3m0 3L16.5 16.5" />
              </svg>
            </button>

            {/* Tela cheia */}
            <button
              onClick={expandFull}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              title="Tela cheia"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
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
