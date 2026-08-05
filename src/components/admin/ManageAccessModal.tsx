'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AccessCard } from '@/components/admin/AccessCard'

interface ProductItem {
  id: string
  title: string
  hasAccess: boolean
  expiresAt: string | null
}

interface Props {
  isOpen: boolean
  onClose: () => void
  memberName: string
  userId: string
  products: ProductItem[]
}

export function ManageAccessModal({ isOpen, onClose, memberName, userId, products }: Props) {
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
        className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-1">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white text-base">Gerenciar acessos</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{memberName}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition p-1"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {products.length === 0 ? (
          <p className="text-sm text-gray-400 mt-4">Nenhum produto ativo cadastrado.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
            {products.map(p => (
              <AccessCard
                key={p.id}
                title={p.title}
                hasAccess={p.hasAccess}
                expiresAt={p.expiresAt}
                userId={userId}
                productId={p.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
