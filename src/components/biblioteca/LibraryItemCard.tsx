import Link from 'next/link'
import { LibraryItem } from '@/types'

interface Props {
  item: LibraryItem
  formatTitle: string | null
  hasAccess: boolean
  isExpired: boolean
  isCompleted: boolean
  buyUrl: string | null
}

/**
 * Mesma linguagem visual do ProductCard pra disponível/bloqueado/expirado —
 * não é uma segunda lógica de acesso, só um card que serve tanto aula
 * quanto produto avulso. Bloqueado sempre leva pra /produto/[id] (a prévia
 * que já existe, com o CTA de aquisição real); nunca inventa um fluxo novo.
 */
export function LibraryItemCard({ item, formatTitle, hasAccess, isExpired, isCompleted, buyUrl }: Props) {
  const effectiveAccess = hasAccess && !isExpired

  const href = item.kind === 'lesson'
    ? (effectiveAccess ? `/produto/${item.product_id}/aula/${item.content_id}` : `/produto/${item.product_id}`)
    : `/produto/${item.product_id}`

  const card = (
    <div className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] p-4 h-full flex flex-col transition-all duration-200 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-2 mb-2">
        {formatTitle ? (
          <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--brand)' }}>{formatTitle}</p>
        ) : <span />}
        {effectiveAccess && isCompleted && (
          <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#22c55e' }} title="Concluída">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
        )}
      </div>

      <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug">{item.title}</h3>
      <p className="text-xs text-gray-400 mt-1">de {item.product_title}</p>

      {!effectiveAccess && (
        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-red-400 dark:text-red-400/80">
            {isExpired ? 'Acesso expirado' : 'Conteúdo exclusivo'}
          </span>
          <span className="text-xs font-semibold" style={{ color: 'var(--brand)' }}>
            {isExpired ? 'Renovar acesso →' : 'Conhecer →'}
          </span>
        </div>
      )}
    </div>
  )

  // Expirado: já teve acesso, sabe o que é -- direto pra renovação externa.
  // Sem acesso ainda: mostra a prévia dentro do app primeiro (mesmo padrão do ProductCard).
  if (hasAccess && isExpired) {
    const target = buyUrl ?? `https://wa.me/5561991900589?text=${encodeURIComponent(`Olá! Tenho interesse em: ${item.product_title}`)}`
    return (
      <a href={target} target="_blank" rel="noopener noreferrer" className="block h-full">
        {card}
      </a>
    )
  }

  return <Link href={href} className="block h-full">{card}</Link>
}
