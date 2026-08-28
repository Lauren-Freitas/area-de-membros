import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  queryLibraryItems,
  getFacetCounts,
  getAccessMap,
  getCompletedLessonIds,
  type LibraryFilters,
} from '@/lib/core/library'
import { SearchBox } from '@/components/biblioteca/SearchBox'
import { TerritoryPicker } from '@/components/biblioteca/TerritoryPicker'
import { TrackPicker } from '@/components/biblioteca/TrackPicker'
import { FormatFilter } from '@/components/biblioteca/FormatFilter'
import { LibraryResults } from '@/components/biblioteca/LibraryResults'

export default async function BibliotecaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; territorio?: string; trilha?: string; tipo?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const filters: LibraryFilters = {
    q: params.q,
    territorio: params.territorio,
    trilha: params.trilha,
    tipo: params.tipo,
  }

  const [{ territories, tracks }, { data: formats }, { items, hasMore }] = await Promise.all([
    getFacetCounts(supabase),
    supabase.from('content_formats').select('*').eq('is_active', true).order('sort_order'),
    queryLibraryItems(supabase, filters, 0),
  ])

  const productIds = items.map(i => i.product_id)
  const lessonIds = items.filter(i => i.kind === 'lesson').map(i => i.content_id)

  const [accessByProduct, completedLessonSet, { data: buyUrlRows }] = await Promise.all([
    getAccessMap(supabase, user.id, productIds),
    getCompletedLessonIds(supabase, user.id, lessonIds),
    productIds.length
      ? supabase.from('products').select('id, buy_url').in('id', [...new Set(productIds)])
      : Promise.resolve({ data: [] as { id: string; buy_url: string | null }[] }),
  ])

  const formatTitleById = Object.fromEntries((formats ?? []).map(f => [f.id, f.title]))
  const buyUrlByProduct = Object.fromEntries((buyUrlRows ?? []).map(p => [p.id, p.buy_url]))

  const activeTerritory = territories.find(t => t.slug === params.territorio)
  const activeTrack = tracks.find(t => t.slug === params.trilha)

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Biblioteca</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Encontre o conteúdo certo pra onde você está agora.</p>
      </div>

      <SearchBox filters={filters} />

      <TerritoryPicker territories={territories} filters={filters} activeSlug={params.territorio} />
      <TrackPicker tracks={tracks} filters={filters} activeSlug={params.trilha} />
      <FormatFilter formats={formats ?? []} filters={filters} activeSlug={params.tipo} />

      {(activeTerritory || activeTrack) && (
        <div className="mb-6 space-y-2">
          {activeTerritory?.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">{activeTerritory.title}: {activeTerritory.description}</p>
          )}
          {activeTrack?.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">{activeTrack.title}: {activeTrack.description}</p>
          )}
        </div>
      )}

      <LibraryResults
        initialItems={items}
        initialHasMore={hasMore}
        filters={filters}
        formatTitleById={formatTitleById}
        buyUrlByProduct={buyUrlByProduct}
        initialAccessByProduct={accessByProduct}
        initialCompletedLessonIds={[...completedLessonSet]}
      />
    </div>
  )
}
