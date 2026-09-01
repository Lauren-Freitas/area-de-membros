'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  queryLibraryItems,
  getAccessMap,
  getCompletedLessonIds,
  getCategoryTitlesForItems,
  type LibraryFilters,
} from '@/lib/core/library'
import { LibraryItem } from '@/types'

export interface LoadMoreResult {
  items: LibraryItem[]
  hasMore: boolean
  accessByProduct: Record<string, { hasAccess: boolean; isExpired: boolean; isCompleted: boolean }>
  completedLessonIds: string[]
  categoryTitlesByContentId: Record<string, string[]>
}

/** Próxima página de itens da Biblioteca, já com acesso/conclusão/categoria calculados pro membro atual. */
export async function loadMoreLibraryItems(filters: LibraryFilters, offset: number): Promise<LoadMoreResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { items, hasMore } = await queryLibraryItems(supabase, filters, offset)
  const productIds = items.map(i => i.product_id)
  const lessonIds = items.filter(i => i.kind === 'lesson').map(i => i.content_id)

  const [accessByProduct, completedLessonSet, categoryTitlesByContentId] = await Promise.all([
    getAccessMap(supabase, user.id, productIds),
    getCompletedLessonIds(supabase, user.id, lessonIds),
    getCategoryTitlesForItems(supabase, items),
  ])

  return {
    items,
    hasMore,
    accessByProduct,
    completedLessonIds: [...completedLessonSet],
    categoryTitlesByContentId,
  }
}
