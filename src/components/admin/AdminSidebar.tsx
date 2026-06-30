'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { logout } from '@/lib/actions/auth'

const nav = [
  {
    section: 'Conteúdo',
    items: [
      { label: 'Criar produto', href: '/admin/produtos/novo', exact: true },
      { label: 'Gerenciar produtos', href: '/admin/produtos' },
      { label: 'Turmas', href: '/admin/turmas' },
      { label: 'Certificados', href: '/admin/certificados' },
    ],
  },
  {
    section: 'Membros',
    items: [
      { label: 'Criar usuário', href: '/admin/usuarios/novo', exact: true },
      { label: 'Gerenciar usuários', href: '/admin/usuarios' },
      { label: 'Convites', href: '/admin/convites' },
    ],
  },
  {
    section: 'Cobrança',
    items: [
      { label: 'Assinatura', href: '/admin/cobranca/assinatura' },
      { label: 'Vendas', href: '/admin/cobranca/vendas' },
      { label: 'Faturas pagas', href: '/admin/cobranca/faturas' },
    ],
  },
  {
    section: 'Comunicação',
    items: [
      { label: 'Banners', href: '/admin/banners' },
      { label: 'Ofertas', href: '/admin/ofertas' },
    ],
  },
  {
    section: 'Análises',
    items: [
      { label: 'Relatórios', href: '/admin/relatorios' },
    ],
  },
  {
    section: 'Configurações',
    items: [
      { label: 'Aparência', href: '/admin/aparencia' },
      { label: 'Integrações', href: '/admin/integracoes' },
      { label: 'Meu perfil', href: '/admin/configuracoes', exact: true },
      { label: 'Suporte & FAQ', href: '/admin/configuracoes#suporte' },
    ],
  },
]

interface Props {
  userName: string
  userEmail: string
}

export function AdminSidebar({ userName, userEmail }: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  function isActive(href: string, exact?: boolean) {
    // Hash links (same-page anchors) are never "active"
    if (href.includes('#')) return false
    // Dashboard exact match
    if (href === '/admin') return pathname === '/admin'
    // Exact-match items (create pages, specific routes)
    if (exact) return pathname === href
    // List/section pages: active if on the page OR a sub-page, but NOT if sub-page is "novo"
    return pathname === href || (
      pathname.startsWith(href + '/') &&
      !pathname.endsWith('/novo') &&
      !pathname.endsWith('/nova')
    )
  }

  const SidebarInner = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <Link href="/admin" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
          <Image src="/iav_1024.png" alt="Logo" width={36} height={36} className="rounded-full shrink-0" />
          <div>
            <p className="text-xs font-bold text-gray-900 leading-none">Painel Admin</p>
            <p className="text-xs text-gray-400 mt-0.5">Thiago Cantalovo</p>
          </div>
        </Link>
      </div>

      {/* Dashboard */}
      <div className="px-3 pt-4">
        <Link
          href="/admin"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition mb-1 ${
            pathname === '/admin' ? 'text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
          style={pathname === '/admin' ? { backgroundColor: '#b48840' } : {}}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Visão geral
        </Link>
      </div>

      {/* Sections */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {nav.map(({ section, items }) => (
          <div key={section} className="mt-5">
            <p className="px-3 mb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
              {section}
            </p>
            {items.map(({ label, href, exact }) => {
              const active = isActive(href, exact)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition mb-0.5 ${
                    active ? 'text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  style={active ? { backgroundColor: '#b48840' } : {}}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 space-y-3">
        <Link
          href="/dashboard"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg transition"
          style={{ color: '#7a5c10', backgroundColor: '#f5efe3' }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Ver área de membros
        </Link>
        <div className="flex items-center justify-between px-1">
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-700 truncate">{userName}</p>
            <p className="text-[10px] text-gray-400 truncate">{userEmail}</p>
          </div>
          <form action={logout}>
            <button type="submit" className="text-xs text-gray-400 hover:text-red-500 transition font-medium ml-3 shrink-0">
              Sair
            </button>
          </form>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-100 z-20 flex items-center justify-between px-4">
        <Link href="/admin" className="flex items-center gap-2.5">
          <Image src="/iav_1024.png" alt="Logo" width={30} height={30} className="rounded-full" />
          <span className="text-sm font-bold text-gray-900">Painel Admin</span>
        </Link>
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {mobileOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <aside className={`fixed top-0 left-0 h-full w-60 bg-white border-r border-gray-100 z-40 transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <SidebarInner />
      </aside>
    </>
  )
}
