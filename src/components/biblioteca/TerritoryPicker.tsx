import Link from 'next/link'
import { FacetCount, LibraryFilters, buildBibliotecaHref } from '@/lib/core/library'

/**
 * Território é o filtro de maior peso visual -- tile, não chip, com a
 * descrição curta do seed como subtítulo, pra ler como "porta de entrada"
 * e não como valor de um dropdown. Território sem nenhum conteúdo ainda
 * não some nem fica cinza/desabilitado -- só não mostra a contagem, pra
 * não estampar um "0" que parece erro.
 */
export function TerritoryPicker({ territories, filters, activeSlug }: {
  territories: FacetCount[]
  filters: LibraryFilters
  activeSlug?: string
}) {
  return (
    <div className="mb-6">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">O que você está vivendo agora?</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {territories.map(t => {
          const active = t.slug === activeSlug
          const href = buildBibliotecaHref(filters, { territorio: active ? undefined : t.slug })
          return (
            <Link
              key={t.id}
              href={href}
              className={`rounded-xl border p-3.5 transition ${active ? '' : 'border-gray-100 dark:border-[#1e2030] hover:border-gray-200 dark:hover:border-[#2a2f45]'}`}
              style={active ? { borderColor: 'var(--brand)', backgroundColor: 'var(--brand-bg)' } : undefined}
            >
              <p
                className={`text-sm font-semibold leading-snug ${active ? '' : 'text-gray-900 dark:text-gray-100'}`}
                style={active ? { color: 'var(--brand-text)' } : undefined}
              >
                {t.title}
              </p>
              {t.count > 0 && (
                <p className="text-[11px] text-gray-400 mt-1">{t.count} {t.count === 1 ? 'conteúdo' : 'conteúdos'}</p>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
