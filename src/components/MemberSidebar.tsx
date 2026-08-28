'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { MEMBER_NAV_ITEMS } from '@/lib/member-nav'
import { ProfileMenu } from '@/components/ProfileMenu'

interface Props {
  platformName: string
  userName: string
  avatarUrl: string | null
  unreadCount: number
  isViewingAs: boolean
  open: boolean
  onToggle: () => void
}

/**
 * Sidebar fixa do desktop -- substitui a antiga barra horizontal com uma
 * aba por produto (Etapa 5). Retrátil (Etapa 5.1): ao fechar, desliza
 * inteira pra fora da tela via transform (não vira uma coluna de ícones,
 * não reserva espaço). Estado e toggle vêm de fora (MemberShell),
 * persistidos em localStorage. Conta fica no rodapé, não no topo.
 */
export function MemberSidebar({ platformName, userName, avatarUrl, unreadCount, isViewingAs, open, onToggle }: Props) {
  const pathname = usePathname()

  return (
    <aside
      inert={!open}
      className={`hidden lg:flex flex-col fixed left-0 w-60 bg-card border-r border-gray-100 dark:border-[#1e2030] z-40 transition-transform duration-300 ease-in-out ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
      style={{ top: isViewingAs ? 40 : 0, height: isViewingAs ? 'calc(100% - 40px)' : '100%' }}
    >
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-100 dark:border-[#1e2030]">
        <BrandLogo size={30} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight truncate">{platformName}</p>
          <p className="text-xs text-gray-400 leading-tight">Nutricionista</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Fechar menu"
          className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1f35] hover:text-gray-700 dark:hover:text-gray-200 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          style={{ '--tw-ring-color': 'var(--brand)' } as React.CSSProperties}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {MEMBER_NAV_ITEMS.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
                active ? '' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1f35]'
              }`}
              style={{
                ...(active ? { backgroundColor: 'var(--brand-bg)', color: 'var(--brand-text)' } : undefined),
                '--tw-ring-color': 'var(--brand)',
              } as React.CSSProperties}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-3 border-t border-gray-100 dark:border-[#1e2030]">
        <ProfileMenu name={userName} avatarUrl={avatarUrl} unreadCount={unreadCount} variant="row" />
      </div>
    </aside>
  )
}
