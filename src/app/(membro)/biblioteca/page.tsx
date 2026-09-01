import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  queryLibraryItems,
  getCategoryCounts,
  getCategoryTitlesForItems,
  getAccessMap,
  getCompletedLessonIds,
  type LibraryFilters,
} from '@/lib/core/library'
import { SearchBox } from '@/components/biblioteca/SearchBox'
import { CategoryPicker } from '@/components/biblioteca/CategoryPicker'
import { LibraryResults } from '@/components/biblioteca/LibraryResults'

export default async function BibliotecaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const filters: LibraryFilters = {
    q: params.q,
    categoria: params.categoria,
  }

  const [{ categories: allCategories }, { items, hasMore }] = await Promise.all([
    getCategoryCounts(supabase),
    queryLibraryItems(supabase, filters, 0),
  ])

  // Só categorias com material real associado aparecem pro paciente -- uma
  // categoria vazia (criada mas ainda sem nada associado) não é uma opção de
  // navegação válida ainda.
  const categories = allCategories.filter(c => c.count > 0)

  const productIds = items.map(i => i.product_id)
  const lessonIds = items.filter(i => i.kind === 'lesson').map(i => i.content_id)

  const [accessByProduct, completedLessonSet, categoryTitlesByContentId, { data: buyUrlRows }] = await Promise.all([
    getAccessMap(supabase, user.id, productIds),
    getCompletedLessonIds(supabase, user.id, lessonIds),
    getCategoryTitlesForItems(supabase, items),
    productIds.length
      ? supabase.from('products').select('id, buy_url').in('id', [...new Set(productIds)])
      : Promise.resolve({ data: [] as { id: string; buy_url: string | null }[] }),
  ])

  const buyUrlByProduct = Object.fromEntries((buyUrlRows ?? []).map(p => [p.id, p.buy_url]))

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Biblioteca</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Encontre o conteúdo certo pra onde você está agora.</p>
      </div>

      <SearchBox filters={filters} />

      <CategoryPicker categories={categories} filters={filters} activeSlug={params.categoria} />

      <LibraryResults
        key={`${filters.categoria ?? ''}|${filters.q ?? ''}`}
        initialItems={items}
        initialHasMore={hasMore}
        filters={filters}
        categories={categories}
        categoryTitlesByContentId={categoryTitlesByContentId}
        buyUrlByProduct={buyUrlByProduct}
        initialAccessByProduct={accessByProduct}
        initialCompletedLessonIds={[...completedLessonSet]}
      />
    </div>
  )
}
