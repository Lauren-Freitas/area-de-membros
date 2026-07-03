'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { logout } from '@/lib/actions/auth'
import { ThemeToggle } from '@/components/ThemeToggle'

// ── Icons ──────────────────────────────────────────────────────────────────
const I = {
  home: <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
  plus: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />,
  grid: <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />,
  users: <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
  award: <><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></>,
  userPlus: <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />,
  mail: <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
  card: <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
  trending: <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
  doc: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  image: <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  tag: <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />,
  chart: <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
  brush: <path strokeLinecap="round" strokeLinejoin="round" d="M4 16s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1v13zm0 0v3" />,
  puzzle: <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />,
  user: <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
  question: <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  external: <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />,
  logout: <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />,
}

function Icon({ d, className = 'w-5 h-5' }: { d: React.ReactNode; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      {d}
    </svg>
  )
}

// ── Nav definition ──────────────────────────────────────────────────────────
const nav = [
  {
    section: 'Conteúdo',
    items: [
      { label: 'Criar produto', href: '/admin/produtos/novo', exact: true, icon: I.plus },
      { label: 'Gerenciar produtos', href: '/admin/produtos', icon: I.grid },
      { label: 'Turmas', href: '/admin/turmas', icon: I.users },
      { label: 'Certificados', href: '/admin/certificados', icon: I.award },
    ],
  },
  {
    section: 'Membros',
    items: [
      { label: 'Criar membro', href: '/admin/usuarios/novo', exact: true, icon: I.userPlus },
      { label: 'Gerenciar membros', href: '/admin/usuarios', icon: I.users },
      { label: 'Convites', href: '/admin/convites', icon: I.mail },
    ],
  },
  {
    section: 'Cobrança',
    items: [
      { label: 'Assinatura', href: '/admin/cobranca/assinatura', icon: I.card },
      { label: 'Vendas', href: '/admin/cobranca/vendas', icon: I.trending },
      { label: 'Faturas pagas', href: '/admin/cobranca/faturas', icon: I.doc },
    ],
  },
  {
    section: 'Comunicação',
    items: [
      { label: 'Banners', href: '/admin/banners', icon: I.image },
      { label: 'Ofertas', href: '/admin/ofertas', icon: I.tag },
    ],
  },
  {
    section: 'Análises',
    items: [
      { label: 'Relatórios', href: '/admin/relatorios', icon: I.chart },
    ],
  },
  {
    section: 'Configurações',
    items: [
      { label: 'Aparência', href: '/admin/aparencia', icon: I.brush },
      { label: 'Integrações', href: '/admin/integracoes', icon: I.puzzle },
      { label: 'Conta & Equipe', href: '/admin/configuracoes', exact: true, icon: I.user },
      { label: 'Suporte & FAQ', href: '/admin/suporte', icon: I.question },
    ],
  },
]

// ── Component ───────────────────────────────────────────────────────────────
interface Props {
  collapsed: boolean
  onToggle: () => void
  userName: string
  userEmail: string
  userAvatar: string | null
}

export function AdminSidebar({ collapsed, onToggle, userName, userEmail, userAvatar }: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [tooltip, setTooltip] = useState<{ label: string; y: number } | null>(null)
  const [hash, setHash] = useState('')
  const [fromEquipe, setFromEquipe] = useState(false)

  useEffect(() => {
    setHash(window.location.hash)
    setFromEquipe(new URLSearchParams(window.location.search).get('from') === 'equipe')
  }, [pathname])

  useEffect(() => {
    const update = () => setHash(window.location.hash)
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])

  function isActive(href: string, exact?: boolean) {
    // Quando vem de Equipe (?from=equipe), /admin/usuarios/[id] deve ativar Conta & Equipe
    if (fromEquipe && pathname.startsWith('/admin/usuarios/')) {
      if (href === '/admin/configuracoes') return true
      if (href === '/admin/usuarios') return false
    }

    if (href.includes('#')) {
      const [hrefPath, hrefHash] = href.split('#')
      return pathname === hrefPath && hash === `#${hrefHash}`
    }
    // Se o hash atual corresponde a um item de nav, não ativa o item pai do mesmo path
    if (hash && pathname === href) {
      const allItems = nav.flatMap(s => s.items)
      const hashTaken = allItems.some(item => item.href === `${href}${hash}`)
      if (hashTaken) return false
    }
    if (href === '/admin') return pathname === '/admin'
    if (exact) return pathname === href
    return pathname === href || (
      pathname.startsWith(href + '/') &&
      !pathname.endsWith('/novo') &&
      !pathname.endsWith('/nova')
    )
  }

  const sidebarW = collapsed ? 'w-16' : 'w-60'

  const SidebarInner = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className={`flex items-center border-b border-gray-100 shrink-0 transition-all duration-200 ${collapsed && !mobile ? 'h-14 justify-center px-0' : 'h-14 px-4 gap-3'}`}>
        {(!collapsed || mobile) && (
          <Image src="/iav_1024.png" alt="Logo" width={32} height={32} className="rounded-full shrink-0" />
        )}
        {(!collapsed || mobile) && (
          <span className="text-xs font-bold text-gray-900 truncate flex-1">Painel Admin</span>
        )}
        <button
          onClick={mobile ? () => setMobileOpen(false) : onToggle}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition shrink-0"
          aria-label="Toggle sidebar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Dashboard link */}
      <div className={`shrink-0 px-2 pt-3 ${collapsed && !mobile ? 'flex justify-center px-0' : ''}`}>
        <Link
          href="/admin"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center rounded-lg transition group relative ${
            collapsed && !mobile ? 'w-10 h-10 justify-center mx-auto' : 'gap-2.5 px-3 py-2'
          } ${pathname === '/admin' ? 'text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
          style={pathname === '/admin' ? { backgroundColor: '#b48840' } : {}}
          onMouseEnter={(e) => collapsed && !mobile && setTooltip({ label: 'Visão geral', y: e.currentTarget.getBoundingClientRect().top })}
          onMouseLeave={() => collapsed && !mobile && setTooltip(null)}
        >
          <Icon d={I.home} className="w-5 h-5 shrink-0" />
          {(!collapsed || mobile) && <span className="text-sm font-medium">Visão geral</span>}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto pb-4 pt-2 px-2">
        {nav.map(({ section, items }) => (
          <div key={section} className="mt-4">
            {(!collapsed || mobile) && (
              <p className="px-3 mb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                {section}
              </p>
            )}
            {collapsed && !mobile && <div className="mx-auto w-6 h-px bg-gray-100 my-2" />}
            {items.map(({ label, href, exact, icon }) => {
              const active = isActive(href, exact)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => {
                    setMobileOpen(false)
                    if (href.includes('#')) setHash('#' + href.split('#')[1])
                    else setHash('')
                  }}
                  className={`flex items-center rounded-lg transition mb-0.5 relative ${
                    collapsed && !mobile
                      ? 'w-10 h-10 justify-center mx-auto'
                      : 'gap-2.5 px-3 py-2'
                  } ${active ? 'text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                  style={active ? { backgroundColor: '#b48840' } : {}}
                  onMouseEnter={(e) => collapsed && !mobile && setTooltip({ label, y: e.currentTarget.getBoundingClientRect().top })}
                  onMouseLeave={() => collapsed && !mobile && setTooltip(null)}
                >
                  <Icon d={icon} className="w-5 h-5 shrink-0" />
                  {(!collapsed || mobile) && <span className="text-sm font-medium truncate">{label}</span>}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className={`shrink-0 border-t border-gray-100 py-3 px-2 space-y-1`}>
        <Link
          href="/dashboard"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center rounded-lg transition text-xs font-medium ${
            collapsed && !mobile ? 'w-10 h-10 justify-center mx-auto' : 'gap-2 px-3 py-2'
          }`}
          style={{ color: '#7a5c10', backgroundColor: collapsed && !mobile ? 'transparent' : '#f5efe3' }}
          onMouseEnter={(e) => collapsed && !mobile && setTooltip({ label: 'Ver área de membros', y: e.currentTarget.getBoundingClientRect().top })}
          onMouseLeave={() => collapsed && !mobile && setTooltip(null)}
        >
          <Icon d={I.external} className="w-4 h-4 shrink-0" />
          {(!collapsed || mobile) && <span>Ver área de membros</span>}
        </Link>

        {(!collapsed || mobile) && (
          <div className="flex items-center gap-2.5 px-3 py-1">
            <Link href="/admin/configuracoes" onClick={() => setMobileOpen(false)} className="shrink-0 hover:opacity-80 transition">
              {userAvatar ? (
                <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: '#b48840' }}
                >
                  {userName.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase() || '?'}
                </div>
              )}
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700 truncate">{userName}</p>
              <p className="text-[10px] text-gray-400 truncate">{userEmail}</p>
            </div>
            <ThemeToggle className="shrink-0 !p-1" />
            <form action={logout}>
              <button type="submit" className="text-xs text-gray-400 hover:text-red-500 transition font-medium shrink-0">
                Sair
              </button>
            </form>
          </div>
        )}

        {collapsed && !mobile && (
          <>
            <div className="flex justify-center">
              <ThemeToggle className="!p-0 w-10 h-10" />
            </div>
            <form action={logout} className="flex justify-center">
              <button
                type="submit"
                className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-red-500 transition"
                onMouseEnter={(e) => setTooltip({ label: 'Sair', y: e.currentTarget.getBoundingClientRect().top })}
                onMouseLeave={() => setTooltip(null)}
              >
                <Icon d={I.logout} className="w-5 h-5" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Tooltip for collapsed state */}
      {collapsed && tooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ top: tooltip.y + 6, left: 68 }}
        >
          <div className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-white shadow-lg whitespace-nowrap"
            style={{ backgroundColor: '#1a1a1a' }}>
            {tooltip.label}
          </div>
        </div>
      )}

      {/* Mobile top bar */}
      <div data-admin-sidebar className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-100 z-20 flex items-center justify-between px-4">
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link href="/admin" className="flex items-center gap-2">
          <Image src="/iav_1024.png" alt="Logo" width={28} height={28} className="rounded-full" />
          <span className="text-sm font-bold text-gray-900">Admin</span>
        </Link>
        <div className="w-10" />
      </div>

      {mobileOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Desktop sidebar */}
      <aside data-admin-sidebar className={`hidden lg:flex flex-col fixed top-0 left-0 h-full bg-white border-r border-gray-100 z-40 transition-[width] duration-200 overflow-hidden ${sidebarW}`}>
        <SidebarInner />
      </aside>

      {/* Mobile sidebar (always full width) */}
      <aside data-admin-sidebar className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 z-40 transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarInner mobile />
      </aside>
    </>
  )
}
