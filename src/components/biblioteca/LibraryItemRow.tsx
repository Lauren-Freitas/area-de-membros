import Link from 'next/link'
import { LibraryItem } from '@/types'

interface Props {
  item: LibraryItem
  categoryTitles: string[]
  hasAccess: boolean
  isExpired: boolean
  isCompleted: boolean
  buyUrl: string | null
}

/**
 * Lista compacta, não parede de cards -- nome, descrição, categoria como tag
 * discreta, CTA claro. Mesma linguagem de acesso do antigo card (bloqueado
 * sempre leva pra /produto/[id], a prévia que já existe com o CTA real).
 * Tipo/formato não é exibido aqui -- taxonomia diferente, não definida pros
 * materiais reais ainda.
 */
export function LibraryItemRow({ item, categoryTitles, hasAccess, isExpired, isCompleted, buyUrl }: Props) {
  const effectiveAccess = hasAccess && !isExpired
  const href = item.kind === 'lesson'
    ? (effectiveAccess ? `/produto/${item.product_id}/aula/${item.content_id}` : `/produto/${item.product_id}`)
    : `/produto/${item.product_id}`

  const row = (
    <div className="bg-card rounded-xl border border-gray-100 dark:border-[#1e2030] px-4 py-3.5 sm:px-5 sm:py-4 flex items-center gap-4 transition hover:border-gray-300 dark:hover:border-[#2a2f45] hover:shadow-sm">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{item.title}</h3>
          {effectiveAccess && isCompleted && (
            <span className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#22c55e' }} title="Concluído">
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
          )}
        </div>
        {item.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>}
        {categoryTitles.length > 0 && (
          <p className="text-[11px] text-gray-400 mt-1">{categoryTitles.join(' · ')}</p>
        )}
      </div>
      <div className="shrink-0">
        {effectiveAccess ? (
          <span className="text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--brand)' }}>Abrir material →</span>
        ) : (
          <span className="text-xs font-semibold whitespace-nowrap text-red-400 dark:text-red-400/80">
            {isExpired ? 'Renovar acesso →' : 'Conhecer →'}
          </span>
        )}
      </div>
    </div>
  )

  if (hasAccess && isExpired) {
    const target = buyUrl ?? `https://wa.me/5561991900589?text=${encodeURIComponent(`Olá! Tenho interesse em: ${item.product_title}`)}`
    return (
      <a href={target} target="_blank" rel="noopener noreferrer" className="block">
        {row}
      </a>
    )
  }

  return <Link href={href} className="block">{row}</Link>
}
