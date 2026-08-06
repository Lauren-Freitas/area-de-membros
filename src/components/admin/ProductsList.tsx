'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { ProductRow } from '@/components/admin/ProductRow'
import { ProductDragPreview } from '@/components/admin/ProductDragPreview'
import { Toast } from '@/components/Toast'
import { reorderProducts } from '@/lib/actions/admin'

export interface ProductLite {
  id: string
  title: string
  description: string | null
  is_active: boolean
  sort_order: number
}

interface Props {
  initialProducts: ProductLite[]
}

export function ProductsList({ initialProducts }: Props) {
  const [products, setProducts] = useState(initialProducts)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  )

  const activeProduct = products.find(p => p.id === activeId) ?? null

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = products.findIndex(p => p.id === active.id)
    const newIndex = products.findIndex(p => p.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(products, oldIndex, newIndex)
    setProducts(reordered)

    reorderProducts(reordered.map(p => p.id)).then(result => {
      if (!result.error) setToast({ message: 'Ordem salva', id: Date.now() })
    })
  }

  function updateProduct(id: string, patch: Partial<ProductLite>) {
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)))
  }

  function removeProduct(id: string) {
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-gray-200 text-gray-400">
        <p className="font-medium">Nenhum produto cadastrado.</p>
        <p className="text-sm mt-1">Crie o primeiro produto para começar.</p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center pb-3 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide gap-3">
        <span className="w-5 shrink-0" />
        <span className="flex-1">Produto</span>
        <span className="w-20 text-center">Status</span>
        <span className="w-10 shrink-0" />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <SortableContext items={products.map(p => p.id)} strategy={verticalListSortingStrategy}>
          <div className="divide-y divide-gray-100">
            {products.map(product => (
              <ProductRow
                key={product.id}
                product={product}
                isAnyDragging={activeId !== null}
                onToggled={nowActive => updateProduct(product.id, { is_active: nowActive })}
                onDeleted={() => removeProduct(product.id)}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeProduct && <ProductDragPreview product={activeProduct} />}
        </DragOverlay>
      </DndContext>

      <Toast key={toast?.id} message={toast?.message ?? null} />
    </div>
  )
}
