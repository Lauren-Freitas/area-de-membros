'use client'

import { useTransition } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ProductActionsMenu } from '@/components/admin/ProductActionsMenu'
import { toggleProductActive } from '@/lib/actions/admin'
import type { ProductLite } from '@/components/admin/ProductsList'

interface Props {
  product: ProductLite
  isAnyDragging: boolean
  onToggled: (nowActive: boolean) => void
  onDeleted: () => void
}

export function ProductRow({ product, isAnyDragging, onToggled, onDeleted }: Props) {
  const [isPending, startTransition] = useTransition()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: product.id,
  })

  function handleToggleStatus() {
    startTransition(async () => {
      await toggleProductActive(product.id, product.is_active)
      onToggled(!product.is_active)
    })
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const opacityClass = isDragging ? 'opacity-30' : isAnyDragging ? 'opacity-50' : ''

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center py-3.5 gap-3 group transition-opacity duration-150 ${opacityClass} ${
        !isAnyDragging ? 'hover:bg-gray-50' : ''
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="shrink-0 w-5 h-5 flex items-center justify-center text-gray-300 opacity-0 group-hover:opacity-100 transition cursor-grab active:cursor-grabbing touch-none"
        aria-label="Arraste para reordenar"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <circle cx="7" cy="5" r="1.3" /><circle cx="13" cy="5" r="1.3" />
          <circle cx="7" cy="10" r="1.3" /><circle cx="13" cy="10" r="1.3" />
          <circle cx="7" cy="15" r="1.3" /><circle cx="13" cy="15" r="1.3" />
        </svg>
      </button>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900">{product.title}</p>
        {product.description && (
          <p className="text-xs text-gray-400 truncate max-w-sm mt-0.5">{product.description}</p>
        )}
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
          onToggled={onToggled}
          onDeleted={onDeleted}
        />
      </div>
    </div>
  )
}
