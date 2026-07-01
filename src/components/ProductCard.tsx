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

  // Estado do card
  // hasAccess → "Incluso no plano"
  // !unlocked && buy_url → "Comprar"
  // !unlocked && !buy_url || expirado → "Bloqueado"
  const state: 'active' | 'buy' | 'locked' | 'expired' =
    hasAccess ? 'active' :
    isExpired ? 'expired' :
    product.buy_url ? 'buy' : 'locked'

  const buyTarget = product.buy_url
    ?? `https://wa.me/5561991900589?text=Ol%C3%A1!%20Tenho%20interesse%20em%3A%20${encodeURIComponent(product.title)}`

  const cardContent = (
    <div className={`bg-white dark:bg-[#0d1020] rounded-2xl border overflow-hidden flex flex-col transition-shadow hover:shadow-md h-full ${
      state === 'active'
        ? 'border-gray-100 dark:border-[#1e2030]'
        : 'border-gray-200 dark:border-[#1e2030]'
    }`}>
      {/* Banner */}
      <div className="relative aspect-video overflow-hidden" style={{ background: 'linear-gradient(135deg, #f5efe3 0%, #ede0c8 100%)' }}>
        {product.banner_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.banner_url}
            alt={product.title}
            className={`w-full h-full object-cover ${state !== 'active' ? 'opacity-60' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl" style={{ color: '#d2b17b' }}>
              {product.content_type === 'video' ? '▶' : '📄'}
            </span>
          </div>
        )}

        {/* Overlay de bloqueio */}
        {state !== 'active' && (
          <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
            <div className="text-center text-white">
              <svg className="w-8 h-8 mx-auto mb-1.5 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <span className="text-xs font-semibold opacity-90">
                {state === 'expired' ? 'Expirado' : state === 'buy' ? 'Disponível para compra' : 'Bloqueado'}
              </span>
            </div>
          </div>
        )}

        {/* Badge de certificado */}
        {certificateId && (
          <div className="absolute top-2 right-2 text-lg" title="Certificado disponível">🎓</div>
        )}

        {/* Badge de estado */}
        <div className="absolute top-3 left-3">
          {state === 'active' ? (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 text-gray-700">
              Incluso no plano
            </span>
          ) : state === 'buy' ? (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: '#b48840' }}>
              Comprar
            </span>
          ) : state === 'expired' ? (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500 text-white">
              Expirado
            </span>
          ) : (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-700/80 text-white">
              🔒 Bloqueado
            </span>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug mb-1">{product.title}</h3>
        {product.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 flex-1">{product.description}</p>
        )}

        {/* Data de expiração */}
        {unlocked && expiry && (
          <p className={`text-xs mt-2 font-medium ${isExpired ? 'text-red-500' : 'text-gray-400'}`}>
            {isExpired
              ? `Expirou em ${expiry.toLocaleDateString('pt-BR')}`
              : `Válido até ${expiry.toLocaleDateString('pt-BR')}`}
          </p>
        )}

        {/* Barra de progresso */}
        {state === 'active' && progress && progress.total > 0 && (
          <div className="mt-3 mb-1">
            <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mb-1">
              <span>{progress.completed}/{progress.total} aulas</span>
              <span style={{ color: completed ? '#22c55e' : '#b48840' }}>{pct}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: completed ? '#22c55e' : '#b48840' }}
              />
            </div>
          </div>
        )}

        {/* Botões de ação */}
        <div className="mt-4 flex flex-col gap-2">
          {state === 'active' && (
            <Link
              href={`/produto/${product.id}`}
              className="block w-full text-center py-2 px-4 text-white text-sm font-semibold rounded-lg transition hover:opacity-90"
              style={{ backgroundColor: '#b48840' }}
            >
              {completed ? 'Rever conteúdo' : progress && progress.completed > 0 ? 'Continuar' : 'Acessar conteúdo'}
            </Link>
          )}

          {(state === 'buy' || state === 'locked' || state === 'expired') && (
            <span
              className="block w-full text-center py-2 px-4 text-sm font-semibold rounded-lg border-2 transition cursor-pointer"
              style={{ borderColor: '#b48840', color: '#b48840' }}
            >
              {state === 'expired' ? 'Renovar acesso' : state === 'buy' ? 'Comprar agora' : 'Saiba mais'}
            </span>
          )}

          {certificateId && state === 'active' && (
            <Link
              href={`/certificado/${certificateId}`}
              className="block w-full text-center py-1.5 px-4 text-xs font-semibold rounded-lg transition hover:opacity-90"
              style={{ backgroundColor: '#f5efe3', color: '#7a5c10' }}
            >
              🎓 Ver certificado
            </Link>
          )}
        </div>
      </div>
    </div>
  )

  // Card clicável para estados que levam à compra
  if (state === 'buy' || state === 'locked' || state === 'expired') {
    return (
      <a href={buyTarget} target="_blank" rel="noopener noreferrer" className="block group">
        {cardContent}
      </a>
    )
  }

  return cardContent
}
