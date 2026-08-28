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

const STORAGE_KEY = 'memberSidebarCollapsed'
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
    return localStorage.getItem(STORAGE_KEY) === 'collapsed'
  } catch {
    return false
  }
}

function getServerSnapshot() {
  return false
}

function setCollapsedPreference(value: boolean) {
  try { localStorage.setItem(STORAGE_KEY, value ? 'collapsed' : 'expanded') } catch {}
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

/**
 * Dono do estado de recolher/expandir a sidebar desktop + sua persistência
 * (mesma ideia de src/components/admin/AdminShell.tsx, inclusive a mesma
 * convenção de valores 'collapsed'/'expanded', mas lendo o localStorage via
 * useSyncExternalStore em vez de effect+setState -- assim o valor real já
 * chega no primeiro paint do cliente, sem flash, e sem disparar o lint
 * react-hooks/set-state-in-effect). Fica fora de layout.tsx porque esse é
 * um Server Component -- o toggle precisa de estado de cliente, mas o
 * conteúdo (header utilitário + main) continua renderizado no server e só
 * passa por aqui como children.
 */
export function MemberShell({ platformName, userName, avatarUrl, unreadCount, isViewingAs, bannerOffset, children }: Props) {
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  function toggle() {
    setCollapsedPreference(!collapsed)
  }

  return (
    <>
      <MemberSidebar
        platformName={platformName}
        userName={userName}
        avatarUrl={avatarUrl}
        unreadCount={unreadCount}
        isViewingAs={isViewingAs}
        collapsed={collapsed}
        onToggle={toggle}
      />
      <div className={`transition-[margin] duration-200 ${collapsed ? 'lg:ml-16' : 'lg:ml-60'} ${bannerOffset}`}>
        {children}
      </div>
    </>
  )
}
