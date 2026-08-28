import { LibraryFilters } from '@/lib/core/library'

/**
 * Form GET nativo, não router.push -- client-side navigation pra uma URL
 * que só muda o querystring às vezes reaproveita o cache de rota do Next
 * e não busca os dados novos no servidor. Um form de verdade sempre navega.
 * Os outros filtros ativos viajam como input hidden pra não se perderem.
 */
export function SearchBox({ filters }: { filters: LibraryFilters }) {
  return (
    <form method="get" action="/biblioteca" className="relative mb-7">
      {filters.territorio && <input type="hidden" name="territorio" value={filters.territorio} />}
      {filters.trilha && <input type="hidden" name="trilha" value={filters.trilha} />}
      {filters.tipo && <input type="hidden" name="tipo" value={filters.tipo} />}
      <svg
        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        name="q"
        defaultValue={filters.q ?? ''}
        type="search"
        placeholder="Do que você precisa agora?"
        className="w-full pl-12 pr-4 py-3.5 text-[15px] border border-gray-200 dark:border-[#2a2f45] rounded-2xl bg-card text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
        style={{ '--tw-ring-color': 'var(--brand)' } as React.CSSProperties}
      />
    </form>
  )
}
