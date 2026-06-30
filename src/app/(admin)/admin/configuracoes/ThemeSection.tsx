'use client'

import { useEffect, useState } from 'react'

export function ThemeSection() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  function setTheme(isDark: boolean) {
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
    try { localStorage.setItem('theme', isDark ? 'dark' : 'light') } catch {}
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={() => setTheme(false)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition ${
          !dark
            ? 'border-gray-900 bg-white text-gray-900'
            : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'
        }`}
      >
        ☀️ Claro
      </button>
      <button
        onClick={() => setTheme(true)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition ${
          dark
            ? 'border-yellow-400 bg-gray-900 text-white'
            : 'border-gray-200 bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-white'
        }`}
      >
        🌙 Escuro
      </button>
    </div>
  )
}
