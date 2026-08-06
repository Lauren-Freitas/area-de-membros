'use client'

import { useState, useTransition } from 'react'
import { ProductActionsMenu } from '@/components/admin/ProductActionsMenu'
import { toggleProductActive } from '@/lib/actions/admin'

interface Props {
  product: {
    id: string
    title: string
    description: string | null
    is_active: boolean
    sort_order: number
  }
}

export function ProductRow({ product: initial }: Props) {
  const [product, setProduct] = useState(initial)
  const [deleted, setDeleted] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (deleted) return null

  function handleToggleStatus() {
    startTransition(async () => {
      await toggleProductActive(product.id, product.is_active)
      setProduct(p => ({ ...p, is_active: !p.is_active }))
    })
  }

  return (
    <div className="flex items-center py-3.5 gap-4 hover:bg-gray-50 transition">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900">{product.title}</p>
        {product.description && (
          <p className="text-xs text-gray-400 truncate max-w-sm mt-0.5">{product.description}</p>
        )}
        <p className="text-xs text-gray-300 mt-0.5">Posição {product.sort_order + 1}</p>
      </div>

      <div className="w-20 text-center shrink-0">
        <button
          type="button"
          onClick={handleToggleStatus}
          disabled={isPending}
          title={product.is_active ? 'Clique para desativar' : 'Clique para ativar'}
          className={`text-xs font-medium px-2.5 py-1 rounded-full transition disabled:opacity-60 ${
            product.is_active
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'
              : 'bg-gray-100 dark:bg-gray-500/10 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-500/20'
          }`}
        >
          {product.is_active ? 'Ativo' : 'Inativo'}
        </button>
      </div>

      <div className="w-10 shrink-0 flex justify-end">
        <ProductActionsMenu
          product={product}
          trigger={({ toggle }) => (
            <button
              type="button"
              onClick={toggle}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-[#1a2035] dark:hover:text-gray-200 transition"
              aria-label="Ações"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 100-4 2 2 0 000 4zM10 12a2 2 0 100-4 2 2 0 000 4zM10 18a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </button>
          )}
          onToggled={nowActive => setProduct(p => ({ ...p, is_active: nowActive }))}
          onReordered={newOrder => setProduct(p => ({ ...p, sort_order: newOrder }))}
          onDeleted={() => setDeleted(true)}
        />
      </div>
    </div>
  )
}
