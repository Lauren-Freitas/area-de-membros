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
    <div className="group relative rounded-2xl overflow-hidden border border-gray-100 dark:border-[#1e2030] bg-white dark:bg-[#0d1020] transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
      {/* Banner */}
      <div
        className="relative aspect-video overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #f5efe3 0%, #ede0c8 100%)' }}
      >
        {product.banner_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.banner_url}
            alt={product.title}
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${!hasAccess ? 'opacity-60' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl opacity-40" style={{ color: '#b48840' }}>
              {product.content_type === 'video' ? '▶' : '📄'}
            </span>
          </div>
        )}

        {/* Overlay bloqueado */}
        {!hasAccess && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1">
            <svg className="w-9 h-9 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            {isExpired && <span className="text-xs text-white/70 font-medium">Acesso expirado</span>}
          </div>
        )}

        {/* Barra de progresso na base do banner */}
        {hasAccess && progress && progress.total > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: completed ? '#22c55e' : '#b48840' }}
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
