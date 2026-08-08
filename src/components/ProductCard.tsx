import Link from 'next/link'
import { Product } from '@/types'

interface ProductCardProps {
  product: Product
  unlocked: boolean
  expiresAt?: string | null
  progress?: { total: number; completed: number } | null
  certificateId?: string | null
  isCourse?: boolean
  lessonCount?: number
}

export function ProductCard({ product, unlocked, expiresAt, progress, certificateId, isCourse = false, lessonCount = 0 }: ProductCardProps) {
  const pct = progress && progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0
  const completed = pct === 100

  const now = new Date()
  const expiry = expiresAt ? new Date(expiresAt) : null
  const isExpired = expiry ? expiry < now : false
  const hasAccess = unlocked && !isExpired

  const typeLabel = isCourse ? 'Curso' : product.content_type === 'video' ? 'Vídeo' : 'Arquivo'

  const buyTarget = product.buy_url
    ?? `https://wa.me/5561991900589?text=Ol%C3%A1!%20Tenho%20interesse%20em%3A%20${encodeURIComponent(product.title)}`

  const card = (
    <div className="group relative rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.02] shadow-sm hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/30">
      {/* Banner */}
      <div
        className="relative aspect-video overflow-hidden rounded-2xl"
        style={{ background: 'linear-gradient(135deg, var(--brand-bg) 0%, var(--brand-border) 100%)' }}
      >
        {product.banner_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.banner_url}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-14 h-14 opacity-40" style={{ color: 'var(--brand)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              {product.content_type === 'video' ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-2.72a.75.75 0 011.28.53v7.38a.75.75 0 01-1.28.53l-4.72-2.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-7.5A2.25 2.25 0 0013.5 6.75h-9A2.25 2.25 0 002.25 9v7.5a2.25 2.25 0 002.25 2.25z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              )}
            </svg>
          </div>
        )}

        {/* Overlay premium — conteúdo bloqueado ou expirado */}
        {!hasAccess && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1.5 text-center px-3">
            <svg className="w-6 h-6 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <p className="text-white text-xs font-semibold">{isExpired ? 'Acesso expirado' : 'Conteúdo exclusivo'}</p>
            <span
              className="inline-flex items-center text-[11px] font-semibold px-3 py-1 rounded-full transition group-hover:opacity-90"
              style={{ backgroundColor: 'var(--brand)', color: '#fff' }}
            >
              {isExpired ? 'Renovar acesso' : 'Conhecer'}
            </span>
          </div>
        )}

        {/* Barra de progresso na base do banner */}
        {hasAccess && progress && progress.total > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: completed ? '#22c55e' : 'var(--brand)' }}
            />
          </div>
        )}

        {/* Badge certificado */}
        {certificateId && hasAccess && (
          <div className="absolute top-2 right-2 text-lg" title="Certificado disponível">🎓</div>
        )}
      </div>

      {/* Título + descrição + info */}
      <div className="px-3 py-3">
        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--brand)' }}>
          <span>{typeLabel}</span>
          {isCourse && lessonCount > 0 && (
            <>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span className="text-gray-400 dark:text-gray-500 normal-case tracking-normal">{lessonCount} {lessonCount === 1 ? 'aula' : 'aulas'}</span>
            </>
          )}
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug">{product.title}</h3>
        {product.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed line-clamp-2">{product.description}</p>
        )}
        {hasAccess && progress && progress.total > 0 && (
          <p className="text-xs text-gray-400 mt-1.5">{progress.completed}/{progress.total} aulas · {pct}%</p>
        )}
        {hasAccess && expiry && !isExpired && (
          <p className="text-xs text-gray-400 mt-1">Válido até {expiry.toLocaleDateString('pt-BR')}</p>
        )}
      </div>
    </div>
  )

  if (hasAccess) {
    return <Link href={`/produto/${product.id}`} className="block">{card}</Link>
  }

  // Expirado: já teve acesso e sabe o que é — vai direto pra renovação externa.
  // Nunca teve acesso: mostra a prévia dentro do app antes de sair pro externo
  // (a página de produto detecta a ausência de acesso e renderiza só a prévia).
  if (isExpired) {
    return (
      <a href={buyTarget} target="_blank" rel="noopener noreferrer" className="block">
        {card}
      </a>
    )
  }

  return <Link href={`/produto/${product.id}`} className="block">{card}</Link>
}
