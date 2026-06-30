import Link from 'next/link'
import { Product } from '@/types'

interface ProductCardProps {
  product: Product
  unlocked: boolean
  progress?: { total: number; completed: number } | null
  certificateId?: string | null
}

export function ProductCard({ product, unlocked, progress, certificateId }: ProductCardProps) {
  const pct = progress && progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0
  const completed = pct === 100

  return (
    <div className={`bg-white dark:bg-[#0d1020] rounded-2xl border overflow-hidden flex flex-col transition-shadow hover:shadow-md ${
      unlocked ? 'border-gray-100 dark:border-[#1e2030]' : 'border-gray-100 dark:border-[#1e2030] opacity-90'
    }`}>
      <div className="relative aspect-video overflow-hidden" style={{ background: 'linear-gradient(135deg, #f5efe3 0%, #ede0c8 100%)' }}>
        {product.banner_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.banner_url} alt={product.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl" style={{ color: '#d2b17b' }}>
              {product.content_type === 'video' ? '▶' : '📄'}
            </span>
          </div>
        )}

        {!unlocked && (
          <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
            <div className="text-center text-white">
              <svg className="w-8 h-8 mx-auto mb-1 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-xs font-medium opacity-80">Bloqueado</span>
            </div>
          </div>
        )}

        {/* Badge de certificado */}
        {certificateId && (
          <div className="absolute top-2 right-2 text-lg" title="Certificado disponível">🎓</div>
        )}

        <div className="absolute top-3 left-3">
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/90 text-gray-700">
            {product.content_type === 'video' ? 'Vídeo' : 'Download'}
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug mb-1">{product.title}</h3>
        {product.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 flex-1">{product.description}</p>
        )}

        {unlocked && progress && progress.total > 0 && (
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

        <div className="mt-4 flex flex-col gap-2">
          {unlocked ? (
            <Link
              href={`/produto/${product.id}`}
              className="block w-full text-center py-2 px-4 text-white text-sm font-semibold rounded-lg transition hover:opacity-90"
              style={{ backgroundColor: '#b48840' }}
            >
              {completed ? 'Rever conteúdo' : progress && progress.completed > 0 ? 'Continuar' : 'Acessar conteúdo'}
            </Link>
          ) : (
            <a
              href={product.buy_url ?? `https://wa.me/5561991900589?text=Olá! Tenho interesse em: ${encodeURIComponent(product.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-2 px-4 text-sm font-semibold rounded-lg border-2 transition dark:hover:bg-gray-700"
              style={{ borderColor: '#b48840', color: '#b48840' }}
            >
              Quero adquirir
            </a>
          )}
          {certificateId && (
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
}
