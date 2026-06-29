'use client'
import { useState, useEffect } from 'react'
import { Banner } from '@/types'

const STORAGE_KEY = 'dismissed_banners'

const colors: Record<string, { bg: string; border: string; text: string; btn: string }> = {
  info:    { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', btn: '#3b82f6' },
  success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', btn: '#22c55e' },
  warning: { bg: '#fffbeb', border: '#fde68a', text: '#b45309', btn: '#f59e0b' },
  promo:   { bg: '#fdf8e6', border: '#f0d98c', text: '#92710a', btn: '#c9a84c' },
}

export function BannerList({ banners }: { banners: Banner[] }) {
  const [dismissed, setDismissed] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
      setDismissed(stored)
    } catch { /* ignore */ }
    setMounted(true)
  }, [])

  function dismiss(id: string) {
    const next = [...dismissed, id]
    setDismissed(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }

  if (!mounted) return null

  const visible = banners.filter(b => !dismissed.includes(b.id))
  if (visible.length === 0) return null

  return (
    <div className="space-y-3 mb-6">
      {visible.map(b => {
        const c = colors[b.type] ?? colors.info
        return (
          <div
            key={b.id}
            className="flex items-start gap-3 px-4 py-3.5 rounded-xl border"
            style={{ backgroundColor: c.bg, borderColor: c.border }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: c.text }}>{b.title}</p>
              {b.body && <p className="text-xs mt-0.5 opacity-80" style={{ color: c.text }}>{b.body}</p>}
              {b.link && (
                <a
                  href={b.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-xs font-semibold text-white px-3 py-1 rounded-lg transition hover:opacity-90"
                  style={{ backgroundColor: c.btn }}
                >
                  {b.link_label ?? 'Ver mais'}
                </a>
              )}
            </div>
            <button
              onClick={() => dismiss(b.id)}
              className="shrink-0 p-1 rounded opacity-50 hover:opacity-100 transition"
              style={{ color: c.text }}
              aria-label="Fechar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )
      })}
    </div>
  )
}
