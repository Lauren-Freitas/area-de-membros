'use client'

import Link from 'next/link'
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

function useDisclosure() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return { open, setOpen, ref }
}

export const MenuContext = createContext<{ close: () => void } | null>(null)

/** Pra painéis com conteúdo totalmente customizado (ex: lista de notificações) que precisam fechar o menu por conta própria. */
export function useMenuClose() {
  const ctx = useContext(MenuContext)
  return ctx?.close ?? (() => {})
}

interface MenuProps {
  /** Renderiza o elemento que abre/fecha o menu (botão, avatar, ⋯ etc). */
  trigger: (state: { open: boolean; toggle: () => void }) => ReactNode
  children: ReactNode
  align?: 'left' | 'right'
  /** Classe de largura/etc do painel — sobrescreve o padrão w-52. */
  panelClassName?: string
  className?: string
}

/**
 * Dropdown genérico: cuida de abrir/fechar + clique-fora (antes duplicado em
 * NotificationBell e ProfileMenu). O conteúdo do painel é livre — use
 * MenuItem/MenuDivider para uma lista de ações, ou qualquer JSX pra conteúdo
 * customizado (ex: lista de notificações, popover de "+N produtos").
 */
export function Menu({ trigger, children, align = 'right', panelClassName = 'w-52', className = '' }: MenuProps) {
  const { open, setOpen, ref } = useDisclosure()
  const close = () => setOpen(false)
  const toggle = () => setOpen(v => !v)

  return (
    <div className={`relative ${className}`} ref={ref}>
      {trigger({ open, toggle })}
      {open && (
        <div
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-2 ${panelClassName} bg-card border border-gray-100 dark:border-[#1e2030] rounded-xl shadow-lg z-50 overflow-hidden py-1`}
        >
          <MenuContext.Provider value={{ close }}>{children}</MenuContext.Provider>
        </div>
      )}
    </div>
  )
}

interface MenuItemProps {
  onSelect?: () => void
  href?: string
  icon?: ReactNode
  danger?: boolean
  disabled?: boolean
  /** Não fecha o menu ao selecionar — pra ações assíncronas que mostram feedback inline (ex: "Enviando..."). */
  keepOpen?: boolean
  children: ReactNode
}

export function MenuItem({ onSelect, href, icon, danger, disabled, keepOpen, children }: MenuItemProps) {
  const ctx = useContext(MenuContext)
  const classes = `w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-left transition disabled:opacity-60 ${
    danger
      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1f35]'
  }`

  if (href) {
    return (
      <Link href={href} onClick={() => ctx?.close()} className={classes}>
        {icon}
        {children}
      </Link>
    )
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        onSelect?.()
        if (!keepOpen) ctx?.close()
      }}
      className={classes}
    >
      {icon}
      {children}
    </button>
  )
}

export function MenuDivider() {
  return <div className="border-t border-gray-100 dark:border-[#1e2030] my-1" />
}
