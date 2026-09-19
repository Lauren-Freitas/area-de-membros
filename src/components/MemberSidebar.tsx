'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { MEMBER_NAV_ITEMS } from '@/lib/member-nav'
import { ProfileMenu } from '@/components/ProfileMenu'

interface Props {
  platformName: string
  platformTagline: string
  userName: string
  avatarUrl: string | null
  unreadCount: number
  isViewingAs: boolean
  collapsed: boolean
  onToggle: () => void
}

/** Tooltip discreto pro item de nav quando a sidebar está recolhida -- só ícones, sem texto visível. */
function CollapsedTooltip({ label }: { label: string }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-gray-900 dark:bg-black px-2.5 py-1.5 text-xs font-medium text-white opacity-0 scale-95 transition duration-150 group-hover:opacity-100 group-hover:scale-100 group-focus-visible:opacity-100 group-focus-visible:scale-100 z-50"
    >
      {label}
    </span>
  )
}

/**
 * Sidebar fixa do desktop -- substitui a antiga barra horizontal com uma
 * aba por produto (Etapa 5). Recolhível pra só ícones + tooltip (Etapa
 * 5.2), no mesmo padrão visual de AdminSidebar.tsx: coluna de ícones
 * permanece (não some da tela), toggle com o mesmo ícone de 3 linhas.
 * Estado e toggle vêm de fora (MemberShell), persistidos em localStorage.
 * Conta fica no rodapé.
 */
export function MemberSidebar({ platformName, platformTagline, userName, avatarUrl, unreadCount, isViewingAs, collapsed, onToggle }: Props) {
  const pathname = usePathname()

  return (
    <aside
      className={`hidden lg:flex flex-col fixed left-0 bg-card border-r border-gray-100 dark:border-[#1e2030] z-40 transition-[width] duration-200 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
      style={{ top: isViewingAs ? 40 : 0, height: isViewingAs ? 'calc(100% - 40px)' : '100%' }}
    >
      <div className={`flex items-center h-16 border-b border-gray-100 dark:border-[#1e2030] transition-all duration-200 ${collapsed ? 'justify-center px-0' : 'gap-2.5 px-5'}`}>
        {!collapsed && (
          <>
            <BrandLogo size={30} className="shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight truncate">{platformName}</p>
              {platformTagline && <p className="text-xs text-gray-400 leading-tight">{platformTagline}</p>}
            </div>
          </>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          aria-expanded={!collapsed}
          className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1f35] hover:text-gray-700 dark:hover:text-gray-200 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          style={{ '--tw-ring-color': 'var(--brand)' } as React.CSSProperties}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
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
              className={`group relative flex items-center rounded-xl text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
                collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'
              } ${active ? '' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1f35]'}`}
              style={{
                ...(active ? { backgroundColor: 'var(--brand-bg)', color: 'var(--brand-text)' } : undefined),
                '--tw-ring-color': 'var(--brand)',
              } as React.CSSProperties}
            >
              {item.icon}
              {!collapsed && item.label}
              {collapsed && <CollapsedTooltip label={item.label} />}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-3 border-t border-gray-100 dark:border-[#1e2030]">
        <ProfileMenu name={userName} avatarUrl={avatarUrl} unreadCount={unreadCount} variant="row" collapsed={collapsed} />
      </div>
    </aside>
  )
}
