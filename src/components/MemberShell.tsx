'use client'

import { useSyncExternalStore } from 'react'
import { MemberSidebar } from '@/components/MemberSidebar'

interface Props {
  platformName: string
  userName: string
  avatarUrl: string | null
  unreadCount: number
  isViewingAs: boolean
  bannerOffset: string
  children: React.ReactNode
}

const STORAGE_KEY = 'memberSidebarOpen'
const CHANGE_EVENT = 'member-sidebar-change'

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}

function getSnapshot() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === null ? true : stored === '1'
  } catch {
    return true
  }
}

function getServerSnapshot() {
  return true
}

function setOpenPreference(value: boolean) {
  try { localStorage.setItem(STORAGE_KEY, value ? '1' : '0') } catch {}
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

/**
 * Dono do estado de abrir/fechar a sidebar desktop + sua persistência
 * (mesma ideia de src/components/admin/AdminShell.tsx, mas lendo o
 * localStorage via useSyncExternalStore em vez de effect+setState -- assim
 * o valor real já chega no primeiro paint do cliente, sem flash, e sem
 * disparar o lint react-hooks/set-state-in-effect). Fica fora de
 * layout.tsx porque esse é um Server Component -- o toggle precisa de
 * estado de cliente, mas o conteúdo (header utilitário + main) continua
 * renderizado no server e só passa por aqui como children.
 */
export function MemberShell({ platformName, userName, avatarUrl, unreadCount, isViewingAs, bannerOffset, children }: Props) {
  const open = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  function toggle() {
    setOpenPreference(!open)
  }

  return (
    <>
      <MemberSidebar
        platformName={platformName}
        userName={userName}
        avatarUrl={avatarUrl}
        unreadCount={unreadCount}
        isViewingAs={isViewingAs}
        open={open}
        onToggle={toggle}
      />

      {/* Controle flutuante pra reabrir -- só existe quando a sidebar está fechada, não reserva coluna */}
      {!open && (
        <button
          type="button"
          onClick={toggle}
          aria-label="Abrir menu"
          title="Abrir menu"
          className={`hidden lg:flex fixed left-4 z-40 items-center justify-center w-9 h-9 rounded-lg bg-card border border-gray-100 dark:border-[#1e2030] text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1f35] hover:text-gray-700 dark:hover:text-gray-200 shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
            isViewingAs ? 'top-14' : 'top-4'
          }`}
          style={{ '--tw-ring-color': 'var(--brand)' } as React.CSSProperties}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      <div className={`transition-[margin] duration-300 ease-in-out ${open ? 'lg:ml-60' : 'lg:ml-0'} ${bannerOffset}`}>
        {children}
      </div>
    </>
  )
}
