import Link from 'next/link'
import { Product } from '@/types'

interface ProductCardProps {
  product: Product
  unlocked: boolean
}

export function ProductCard({ product, unlocked }: ProductCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border overflow-hidden flex flex-col transition-shadow hover:shadow-md ${
        unlocked ? 'border-gray-100' : 'border-gray-100 opacity-80'
      }`}
    >
      {/* Banner */}
      <div className="relative aspect-video bg-gradient-to-br from-emerald-50 to-teal-100 overflow-hidden">
        {product.banner_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.banner_url}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl text-emerald-200">
              {product.content_type === 'video' ? '▶' : '📄'}
            </span>
          </div>
        )}

        {/* Overlay de bloqueado */}
        {!unlocked && (
          <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
            <div className="text-center text-white">
              <svg
                className="w-8 h-8 mx-auto mb-1 opacity-90"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span className="text-xs font-medium opacity-80">Bloqueado</span>
            </div>
          </div>
        )}

        {/* Badge de tipo */}
        <div className="absolute top-3 left-3">
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/90 text-gray-700">
            {product.content_type === 'video' ? 'Vídeo' : 'Download'}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1">
          {product.title}
        </h3>
        {product.description && (
          <p className="text-xs text-gray-500 line-clamp-2 flex-1">{product.description}</p>
        )}

        <div className="mt-4">
          {unlocked ? (
            <Link
              href={`/produto/${product.id}`}
              className="block w-full text-center py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition"
            >
              Acessar conteúdo
            </Link>
          ) : (
            <div className="block w-full text-center py-2 px-4 bg-gray-100 text-gray-400 text-sm font-semibold rounded-lg cursor-default select-none">
              Disponível para compra
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
