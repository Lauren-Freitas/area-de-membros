'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export function SearchBar() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleOpen() {
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (q.trim().length < 2) return
    router.push(`/busca?q=${encodeURIComponent(q.trim())}`)
    setOpen(false)
    setQ('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false)
      setQ('')
    }
  }

  return (
    <div className="relative">
      {open ? (
        <form onSubmit={handleSubmit} className="flex items-center">
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => { if (!q) setOpen(false) }}
            placeholder="Pesquisar conteúdo..."
            className="w-48 sm:w-64 text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': '#b48840' } as React.CSSProperties}
          />
          <button type="submit" className="ml-2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </form>
      ) : (
        <button
          onClick={handleOpen}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
          title="Pesquisar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      )}
    </div>
  )
}
