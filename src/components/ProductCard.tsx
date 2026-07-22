import Link from 'next/link'
import { Product } from '@/types'

interface ProductCardProps {
  product: Product
  unlocked: boolean
  expiresAt?: string | null
  progress?: { total: number; completed: number } | null
  certificateId?: string | null
}

export function ProductCard({ product, unlocked, expiresAt, progress, certificateId }: ProductCardProps) {
  const pct = progress && progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0
  const completed = pct === 100

  const now = new Date()
  const expiry = expiresAt ? new Date(expiresAt) : null
  const isExpired = expiry ? expiry < now : false
  const hasAccess = unlocked && !isExpired

  const buyTarget = product.buy_url
    ?? `https://wa.me/5561991900589?text=Ol%C3%A1!%20Tenho%20interesse%20em%3A%20${encodeURIComponent(product.title)}`

  const card = (
    <div className="group relative rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.02]">
      {/* Banner */}
      <div
        className="relative aspect-video overflow-hidden rounded-2xl"
        style={{ background: 'linear-gradient(135deg, var(--brand-bg) 0%, #ede0c8 100%)' }}
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

        {/* Badge cadeado — canto superior direito */}
        {!hasAccess && (
          <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
        )}

        {/* Badge expirado */}
        {isExpired && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[10px] font-semibold text-white/80">
            Expirado
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
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug">{product.title}</h3>
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

  return (
    <a href={buyTarget} target="_blank" rel="noopener noreferrer" className="block">
      {card}
    </a>
  )
}
