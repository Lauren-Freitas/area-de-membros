'use client'

import { useState, useTransition } from 'react'
import { LibraryItem } from '@/types'
import { LibraryFilters, LibraryAccessInfo } from '@/lib/core/library'
import { loadMoreLibraryItems } from '@/lib/actions/library'
import { ResponsiveGrid } from '@/components/ResponsiveGrid'
import { LibraryItemCard } from './LibraryItemCard'

interface Props {
  initialItems: LibraryItem[]
  initialHasMore: boolean
  filters: LibraryFilters
  formatTitleById: Record<string, string>
  buyUrlByProduct: Record<string, string | null>
  initialAccessByProduct: Record<string, LibraryAccessInfo>
  initialCompletedLessonIds: string[]
}

export function LibraryResults({
  initialItems, initialHasMore, filters, formatTitleById, buyUrlByProduct,
  initialAccessByProduct, initialCompletedLessonIds,
}: Props) {
  const [items, setItems] = useState(initialItems)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [accessByProduct, setAccessByProduct] = useState(initialAccessByProduct)
  const [completedLessonIds, setCompletedLessonIds] = useState(new Set(initialCompletedLessonIds))
  const [isPending, startTransition] = useTransition()

  function handleLoadMore() {
    startTransition(async () => {
      const result = await loadMoreLibraryItems(filters, items.length)
      setItems(prev => [...prev, ...result.items])
      setHasMore(result.hasMore)
      setAccessByProduct(prev => ({ ...prev, ...result.accessByProduct }))
      setCompletedLessonIds(prev => new Set([...prev, ...result.completedLessonIds]))
    })
  }

  if (items.length === 0) {
    return (
      <div className="py-10 flex flex-col items-center text-center gap-2 bg-card rounded-2xl border border-dashed border-gray-200 dark:border-[#2a2f45]">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ainda não há conteúdo por aqui.</p>
        <p className="text-xs text-gray-400 max-w-xs">A biblioteca está crescendo — novos conteúdos aparecem assim que forem publicados e classificados.</p>
      </div>
    )
  }

  return (
    <div>
      <ResponsiveGrid minItemWidth="240px" gap="gap-4">
        {items.map(item => {
          const access = accessByProduct[item.product_id]
          const isCompleted = item.kind === 'lesson'
            ? completedLessonIds.has(item.content_id)
            : (access?.isCompleted ?? false)
          return (
            <LibraryItemCard
              key={`${item.kind}-${item.content_id}`}
              item={item}
              formatTitle={item.content_format_id ? formatTitleById[item.content_format_id] ?? null : null}
              hasAccess={access?.hasAccess ?? false}
              isExpired={access?.isExpired ?? false}
              isCompleted={isCompleted}
              buyUrl={buyUrlByProduct[item.product_id] ?? null}
            />
          )
        })}
      </ResponsiveGrid>

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isPending}
            className="px-5 py-2.5 text-sm font-semibold rounded-full border border-gray-200 dark:border-[#2a2f45] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1f35] transition disabled:opacity-50"
          >
            {isPending ? 'Carregando...' : 'Carregar mais'}
          </button>
        </div>
      )}
    </div>
  )
}
