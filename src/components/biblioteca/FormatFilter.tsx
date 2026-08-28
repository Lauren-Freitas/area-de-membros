import Link from 'next/link'
import { ContentFormat } from '@/types'
import { LibraryFilters, buildBibliotecaHref } from '@/lib/core/library'

const VISIBLE_COUNT = 5

/**
 * Tipo é o refinamento mais compacto -- só 10 opções cabem mal como chips
 * sempre visíveis (era exatamente o "3 dropdowns" que não queríamos). Usa
 * <details> nativo pra expandir o resto sem precisar de client component.
 */
export function FormatFilter({ formats, filters, activeSlug }: {
  formats: ContentFormat[]
  filters: LibraryFilters
  activeSlug?: string
}) {
  const activeFormat = formats.find(f => f.slug === activeSlug)
  const visible = activeFormat && !formats.slice(0, VISIBLE_COUNT).some(f => f.slug === activeSlug)
    ? [activeFormat, ...formats.slice(0, VISIBLE_COUNT - 1)]
    : formats.slice(0, VISIBLE_COUNT)
  const rest = formats.filter(f => !visible.includes(f))

  function Chip({ f }: { f: ContentFormat }) {
    const active = f.slug === activeSlug
    const href = buildBibliotecaHref(filters, { tipo: active ? undefined : f.slug })
    return (
      <Link
        href={href}
        className={`px-3 py-1.5 rounded-full border text-xs font-medium transition ${
          active ? '' : 'border-gray-200 dark:border-[#2a2f45] text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-[#374151]'
        }`}
        style={active ? { borderColor: 'var(--brand)', backgroundColor: 'var(--brand-bg)', color: 'var(--brand-text)' } : undefined}
      >
        {f.title}
      </Link>
    )
  }

  return (
    <div className="mb-6">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Prefere qual formato?</p>
      <div className="flex flex-wrap items-center gap-2">
        {visible.map(f => <Chip key={f.id} f={f} />)}
        {rest.length > 0 && (
          <details className="inline-block">
            <summary className="list-none cursor-pointer px-3 py-1.5 rounded-full border border-dashed border-gray-200 dark:border-[#2a2f45] text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
              +{rest.length} outros
            </summary>
            <div className="flex flex-wrap gap-2 mt-2">
              {rest.map(f => <Chip key={f.id} f={f} />)}
            </div>
          </details>
        )}
      </div>
    </div>
  )
}
