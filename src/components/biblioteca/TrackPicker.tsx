import Link from 'next/link'
import { FacetCount, LibraryFilters, buildBibliotecaHref } from '@/lib/core/library'

/** Trilha tem peso intermediário -- chip, não tile, mas ainda maior destaque que o tipo. */
export function TrackPicker({ tracks, filters, activeSlug }: {
  tracks: FacetCount[]
  filters: LibraryFilters
  activeSlug?: string
}) {
  return (
    <div className="mb-6">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Qual habilidade você quer desenvolver?</p>
      <div className="flex flex-wrap gap-2">
        {tracks.map(t => {
          const active = t.slug === activeSlug
          const href = buildBibliotecaHref(filters, { trilha: active ? undefined : t.slug })
          return (
            <Link
              key={t.id}
              href={href}
              className={`px-3.5 py-2 rounded-full border text-sm font-medium transition ${
                active
                  ? ''
                  : 'border-gray-200 dark:border-[#2a2f45] text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-[#374151]'
              }`}
              style={active ? { borderColor: 'var(--brand)', backgroundColor: 'var(--brand-bg)', color: 'var(--brand-text)' } : undefined}
            >
              {t.title}
              {t.count > 0 && <span className="ml-1.5 text-xs opacity-60">{t.count}</span>}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
