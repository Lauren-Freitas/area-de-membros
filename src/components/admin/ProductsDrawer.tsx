'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ProductAccessRow } from '@/components/admin/ProductAccessRow'
import type { MemberProductAccess } from '@/lib/actions/members'

interface Props {
  userId: string
  memberName: string
  products: MemberProductAccess[]
  onClose: () => void
}

/**
 * Drawer lateral pra gerenciar produtos de um membro — substitui o modal
 * antigo. Empilha por cima do MemberDrawer (z maior) quando aberto a partir
 * dele, sem perder o contexto da tabela por trás.
 */
export function ProductsDrawer({ userId, memberName, products, onClose }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-[45]">
      <div
        className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`absolute right-0 top-0 bottom-0 w-full sm:w-[400px] bg-card shadow-2xl overflow-y-auto transition-transform duration-300 ${visible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-6 border-b border-gray-100 dark:border-[#1e2030] flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-bold text-gray-900 dark:text-white">Produtos</h2>
            <p className="text-sm text-gray-400 mt-0.5 truncate">{memberName}</p>
          </div>
          <button onClick={onClose} className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition p-1" aria-label="Fechar">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 divide-y divide-gray-100 dark:divide-[#1e2030]">
          {products.length === 0 ? (
            <p className="text-sm text-gray-400 py-6">Nenhum produto ativo cadastrado.</p>
          ) : (
            products.map(p => (
              <ProductAccessRow
                key={p.id}
                userId={userId}
                productId={p.id}
                title={p.title}
                hasAccess={p.hasAccess}
                expiresAt={p.expiresAt}
              />
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
