'use client'

import { useState } from 'react'
import { ProductActionsMenu } from '@/components/admin/ProductActionsMenu'

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

  if (deleted) return null

  return (
    <div className="flex items-center py-3.5 gap-4 hover:bg-gray-50 transition">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900">{product.title}</p>
        {product.description && (
          <p className="text-xs text-gray-400 truncate max-w-sm mt-0.5">{product.description}</p>
        )}
        <p className="text-xs text-gray-300 mt-0.5">Ordem {product.sort_order}</p>
      </div>

      <div className="w-20 text-center shrink-0">
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            product.is_active
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
              : 'bg-gray-100 dark:bg-gray-500/10 text-gray-500 dark:text-gray-400'
          }`}
        >
          {product.is_active ? 'Ativo' : 'Inativo'}
        </span>
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
