'use client'

import { useState, useEffect } from 'react'

function getEmbedUrl(url: string) {
  return url
    .replace('watch?v=', 'embed/')
    .replace('youtu.be/', 'www.youtube.com/embed/')
    .replace('vimeo.com/', 'player.vimeo.com/video/')
}

export function VideoFocusLesson({ url }: { url: string | null }) {
  const [focusMode, setFocusMode] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setFocusMode(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!url) return (
    <div className="aspect-video flex items-center justify-center bg-[#e4e4e4] dark:bg-[#00060f] text-gray-400 text-sm">
      Vídeo não configurado.
    </div>
  )

  return (
    <>
      {/* Overlay escuro */}
      {focusMode && (
        <div
          className="fixed inset-0 bg-black/85 z-[100]"
          onClick={() => setFocusMode(false)}
        />
      )}

      {/* Container do vídeo */}
      <div className={focusMode ? 'fixed inset-x-4 top-1/2 -translate-y-1/2 z-[101] max-w-5xl mx-auto' : 'relative'}>
        <div className="aspect-video">
          <iframe
            src={getEmbedUrl(url)}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Barra com botão apagar luzes */}
        <div className="flex items-center justify-end px-3 py-2 bg-gray-50 dark:bg-[#0a0d1a]">
          <button
            onClick={() => setFocusMode(v => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition"
          >
            {focusMode ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
                Acender luzes
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
                Apagar luzes
              </>
            )}
          </button>
        </div>
      </div>
    </>
  )
}
