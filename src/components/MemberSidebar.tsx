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
}

/**
 * Sidebar fixa do desktop -- substitui a antiga barra horizontal com uma
 * aba por produto (Etapa 5). Só 5 destinos, sem colapsar: a lista é curta
 * o bastante pra não precisar disso. Conta fica no rodapé, não no topo.
 */
export function MemberSidebar({ platformName, userName, avatarUrl, unreadCount, isViewingAs }: Props) {
  const pathname = usePathname()

  return (
    <aside
      className="hidden lg:flex flex-col fixed left-0 w-60 bg-card border-r border-gray-100 dark:border-[#1e2030] z-40"
      style={{ top: isViewingAs ? 40 : 0, height: isViewingAs ? 'calc(100% - 40px)' : '100%' }}
    >
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-100 dark:border-[#1e2030]">
        <BrandLogo size={30} className="shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight truncate">{platformName}</p>
          <p className="text-xs text-gray-400 leading-tight">Nutricionista</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {MEMBER_NAV_ITEMS.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                active ? '' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1f35]'
              }`}
              style={active ? { backgroundColor: 'var(--brand-bg)', color: 'var(--brand-text)' } : undefined}
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
