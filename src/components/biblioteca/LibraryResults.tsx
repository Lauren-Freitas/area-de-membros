'use client'

import { useState, useTransition } from 'react'
import { LibraryItem } from '@/types'
import { LibraryFilters, LibraryAccessInfo, FacetCount } from '@/lib/core/library'
import { loadMoreLibraryItems } from '@/lib/actions/library'
import { LibraryItemRow } from './LibraryItemRow'

interface Props {
  initialItems: LibraryItem[]
  initialHasMore: boolean
  filters: LibraryFilters
  categories: FacetCount[]
  categoryTitlesByContentId: Record<string, string[]>
  buyUrlByProduct: Record<string, string | null>
  initialAccessByProduct: Record<string, LibraryAccessInfo>
  initialCompletedLessonIds: string[]
}

const SEM_CATEGORIA = 'Sem categoria'

export function LibraryResults({
  initialItems, initialHasMore, filters, categories, categoryTitlesByContentId, buyUrlByProduct,
  initialAccessByProduct, initialCompletedLessonIds,
}: Props) {
  const [items, setItems] = useState(initialItems)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [categoryTitles, setCategoryTitles] = useState(categoryTitlesByContentId)
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
      setCategoryTitles(prev => ({ ...prev, ...result.categoryTitlesByContentId }))
    })
  }

  if (items.length === 0) {
    return (
      <div className="py-10 flex flex-col items-center text-center gap-2 bg-card rounded-2xl border border-dashed border-gray-200 dark:border-[#2a2f45]">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ainda não há materiais por aqui.</p>
        <p className="text-xs text-gray-400 max-w-xs">A biblioteca está crescendo — novos materiais aparecem assim que forem publicados.</p>
      </div>
    )
  }

  function renderItem(item: LibraryItem) {
    const access = accessByProduct[item.product_id]
    const isCompleted = item.kind === 'lesson'
      ? completedLessonIds.has(item.content_id)
      : (access?.isCompleted ?? false)
    return (
      <LibraryItemRow
        key={`${item.kind}-${item.content_id}`}
        item={item}
        categoryTitles={categoryTitles[item.content_id] ?? []}
        hasAccess={access?.hasAccess ?? false}
        isExpired={access?.isExpired ?? false}
        isCompleted={isCompleted}
        buyUrl={buyUrlByProduct[item.product_id] ?? null}
      />
    )
  }

  // "Todos" (sem filtro de categoria): agrupa por categoria pra facilitar a
  // leitura do acervo inteiro. Um material com 2 categorias aparece nas duas
  // seções -- reflete a mesma associação N:N que filtrar por categoria usa.
  // Com um filtro de categoria ativo, a lista já vem pré-filtrada -- não
  // precisa de seções.
  const showGrouped = !filters.categoria

  if (!showGrouped) {
    return (
      <div>
        <div className="space-y-2.5">
          {items.map(renderItem)}
        </div>
        <LoadMoreButton hasMore={hasMore} isPending={isPending} onClick={handleLoadMore} />
      </div>
    )
  }

  const groups = new Map<string, LibraryItem[]>(categories.map(c => [c.title, []]))
  const uncategorized: LibraryItem[] = []
  for (const item of items) {
    const titles = categoryTitles[item.content_id] ?? []
    if (titles.length === 0) {
      uncategorized.push(item)
      continue
    }
    for (const title of titles) {
      groups.get(title)?.push(item)
    }
  }

  return (
    <div>
      {categories.map(c => {
        const groupItems = groups.get(c.title) ?? []
        if (groupItems.length === 0) return null
        return (
          <div key={c.id} className="mb-6 last:mb-0">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5">{c.title}</p>
            <div className="space-y-2.5">{groupItems.map(renderItem)}</div>
          </div>
        )
      })}
      {uncategorized.length > 0 && (
        <div className="mb-6 last:mb-0">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5">{SEM_CATEGORIA}</p>
          <div className="space-y-2.5">{uncategorized.map(renderItem)}</div>
        </div>
      )}
      <LoadMoreButton hasMore={hasMore} isPending={isPending} onClick={handleLoadMore} />
    </div>
  )
}

function LoadMoreButton({ hasMore, isPending, onClick }: { hasMore: boolean; isPending: boolean; onClick: () => void }) {
  if (!hasMore) return null
  return (
    <div className="mt-6 flex justify-center">
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        className="px-5 py-2.5 text-sm font-semibold rounded-full border border-gray-200 dark:border-[#2a2f45] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1f35] transition disabled:opacity-50"
      >
        {isPending ? 'Carregando...' : 'Carregar mais'}
      </button>
    </div>
  )
}
