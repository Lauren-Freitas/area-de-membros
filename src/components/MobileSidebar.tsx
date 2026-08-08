'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { MEMBER_NAV_ITEMS } from '@/lib/member-nav'

export function MobileSidebar({ userName }: { userName?: string }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const pathname = usePathname()
  const router = useRouter()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (search.trim().length < 2) return
    router.push(`/busca?q=${encodeURIComponent(search.trim())}`)
    setSearch('')
    setOpen(false)
  }

  const firstName = userName?.trim().split(' ')[0]

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition rounded-lg"
        aria-label="Abrir menu"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 w-72 bg-card z-50 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#1e2030]">
              <p className="font-semibold text-gray-900 dark:text-white">Menu</p>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {firstName && (
              <div className="px-5 py-4 border-b border-gray-100 dark:border-[#1e2030]">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Olá, {firstName} 👋</p>
              </div>
            )}

            <div className="px-4 py-3 border-b border-gray-100 dark:border-[#1e2030]">
              <form onSubmit={handleSearch} className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  type="search"
                  placeholder="Pesquisar conteúdo..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-[#1a1f35] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
                  style={{ '--tw-ring-color': 'var(--brand)' } as React.CSSProperties}
                />
              </form>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {MEMBER_NAV_ITEMS.map(item => {
                const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3.5 rounded-xl text-sm font-medium transition ${
                      active ? '' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1f35]'
                    }`}
                    style={active ? { backgroundColor: 'var(--brand-bg)', color: 'var(--brand-text)' } : undefined}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </>
      )}
    </>
  )
}
