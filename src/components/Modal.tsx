'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  /** Largura máxima do painel — mesma escala de `max-w-*` do Tailwind. */
  maxWidth?: string
}

/** Casca genérica de modal — portal, overlay, escape-to-close, click-outside-close. Extraído de ConfirmModal pra dar suporte a outros modais de ação única sem duplicar essa mecânica de novo. */
export function Modal({ isOpen, onClose, children, maxWidth = 'max-w-sm' }: Props) {
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-[#1a1f35] rounded-2xl shadow-2xl w-full ${maxWidth} flex flex-col gap-4 p-6`}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
