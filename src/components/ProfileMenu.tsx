'use client'

import { logout } from '@/lib/actions/auth'
import { Menu, MenuItem } from '@/components/Menu'

interface Props {
  name: string
  avatarUrl: string | null
  unreadCount: number
  /** 'icon' = avatar redondo isolado (header mobile/desktop utilitário). 'row' = linha com nome, pro rodapé da sidebar. */
  variant?: 'icon' | 'row'
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase() || '?'
}

function Avatar({ name, avatarUrl, unreadCount, size = 36 }: { name: string; avatarUrl: string | null; unreadCount: number; size?: number }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={name} className="rounded-full object-cover w-full h-full" />
      ) : (
        <div
          className="w-full h-full rounded-full flex items-center justify-center text-sm font-bold text-white"
          style={{ backgroundColor: 'var(--brand)' }}
        >
          {getInitials(name)}
        </div>
      )}
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-[var(--card)]" />
      )}
    </div>
  )
}

/** Conta + Sair — Perfil/XP e Assinatura foram consolidados dentro de /conta (Etapa 5). */
export function ProfileMenu({ name, avatarUrl, unreadCount, variant = 'icon' }: Props) {
  return (
    <Menu
      panelClassName="w-52"
      align={variant === 'row' ? 'left' : 'right'}
      openUpward={variant === 'row'}
      trigger={({ toggle }) =>
        variant === 'row' ? (
          <button
            onClick={toggle}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#1a1f35] transition focus:outline-none focus:ring-2 focus:ring-offset-1"
            style={{ '--tw-ring-color': 'var(--brand)' } as React.CSSProperties}
            aria-label="Menu da conta"
          >
            <Avatar name={name} avatarUrl={avatarUrl} unreadCount={unreadCount} size={32} />
            <span className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{name}</p>
              <p className="text-xs text-gray-400">Ver conta</p>
            </span>
            <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
            </svg>
          </button>
        ) : (
          <button
            onClick={toggle}
            className="relative flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-offset-1"
            style={{ '--tw-ring-color': 'var(--brand)' } as React.CSSProperties}
            aria-label="Menu da conta"
          >
            <Avatar name={name} avatarUrl={avatarUrl} unreadCount={unreadCount} size={36} />
          </button>
        )
      }
    >
      <div className="px-4 py-2.5 border-b border-gray-100 dark:border-[#1e2030]">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{name}</p>
      </div>

      <MenuItem
        href="/conta"
        icon={
          <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        }
      >
        Conta
      </MenuItem>

      <div className="border-t border-gray-100 dark:border-[#1e2030] mt-1 pt-1">
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Sair
          </button>
        </form>
      </div>
    </Menu>
  )
}
