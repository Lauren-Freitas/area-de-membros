import Link from 'next/link'
import { FacetCount, LibraryFilters, buildBibliotecaHref } from '@/lib/core/library'

/**
 * Categoria é a navegação principal da Biblioteca -- tile, não chip, pra ler
 * como "porta de entrada" e não como valor de um dropdown. "Todos" é sempre
 * a primeira opção, pra sempre existir uma forma clara de ver tudo. Categoria
 * sem nenhum conteúdo ainda não some nem fica cinza/desabilitada -- só não
 * mostra a contagem, pra não estampar um "0" que parece erro.
 */
function Tile({ href, active, label, count }: { href: string; active: boolean; label: string; count?: number }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'true' : undefined}
      className={`rounded-xl border p-3.5 transition focus-visible:outline-none focus-visible:ring-2 ${
        active ? '' : 'bg-card border-gray-100 dark:border-[#1e2030] hover:border-gray-300 dark:hover:border-[#2a2f45] hover:shadow-sm'
      }`}
      style={active ? { borderColor: 'var(--brand)', backgroundColor: 'var(--brand-bg)', '--tw-ring-color': 'var(--brand)' } as React.CSSProperties : { '--tw-ring-color': 'var(--brand)' } as React.CSSProperties}
    >
      <p
        className={`text-sm font-semibold leading-snug ${active ? '' : 'text-gray-900 dark:text-gray-100'}`}
        style={active ? { color: 'var(--brand-text)' } : undefined}
      >
        {label}
      </p>
      {!!count && count > 0 && (
        <p className="text-[11px] text-gray-400 mt-1">{count} {count === 1 ? 'material' : 'materiais'}</p>
      )}
    </Link>
  )
}

export function CategoryPicker({ categories, filters, activeSlug }: {
  categories: FacetCount[]
  filters: LibraryFilters
  activeSlug?: string
}) {
  return (
    <div className="mb-6">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">O que você quer aprender?</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        <Tile href={buildBibliotecaHref(filters, { categoria: undefined })} active={!activeSlug} label="Todos" />
        {categories.map(c => {
          const active = c.slug === activeSlug
          return (
            <Tile
              key={c.id}
              href={buildBibliotecaHref(filters, { categoria: active ? undefined : c.slug })}
              active={active}
              label={c.title}
              count={c.count}
            />
          )
        })}
      </div>
    </div>
  )
}
