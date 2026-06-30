'use client'
import { useState, useEffect } from 'react'

interface Offer {
  id: string
  title: string
  description: string | null
  original_price: number | null
  promo_price: number | null
  coupon_code: string | null
  ends_at: string | null
  products: { title: string; buy_url: string | null } | null
}

function useCountdown(endsAt: string | null) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    if (!endsAt) return
    function update() {
      const diff = new Date(endsAt!).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('Encerrada'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      if (h >= 24) {
        const d = Math.floor(h / 24)
        setTimeLeft(`${d}d ${h % 24}h ${m}m`)
      } else {
        setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
      }
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [endsAt])

  return timeLeft
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg border transition"
      style={{ borderColor: '#b48840', color: copied ? '#22c55e' : '#7a5c10', backgroundColor: '#f5efe3' }}
    >
      {copied ? '✓ Copiado!' : `🏷️ ${code}`}
    </button>
  )
}

export function OfertaCard({ offer }: { offer: Offer }) {
  const timeLeft = useCountdown(offer.ends_at)
  const expired = offer.ends_at && new Date(offer.ends_at) < new Date()
  if (expired) return null

  const product = offer.products
  const buyUrl = product?.buy_url
    ?? `https://wa.me/5561991900589?text=Olá! Quero aproveitar a oferta: ${encodeURIComponent(offer.title)}`

  const discount = offer.original_price && offer.promo_price
    ? Math.round((1 - offer.promo_price / offer.original_price) * 100)
    : null

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 p-5" style={{ borderColor: '#b48840', background: 'linear-gradient(135deg, #f5efe3 0%, #fff9ea 100%)' }}>
      {/* Faixa de desconto */}
      {discount && (
        <div className="absolute top-3 right-3 w-12 h-12 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#e53e3e' }}>
          -{discount}%
        </div>
      )}

      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl">⚡</span>
        <div className="flex-1 min-w-0 pr-10">
          <h3 className="font-bold text-gray-900">{offer.title}</h3>
          {product && <p className="text-xs font-medium mt-0.5" style={{ color: '#7a5c10' }}>{product.title}</p>}
          {offer.description && <p className="text-sm text-gray-600 mt-1">{offer.description}</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        {/* Preços */}
        {(offer.original_price || offer.promo_price) && (
          <div className="flex items-center gap-2">
            {offer.original_price && (
              <span className="text-sm text-gray-400 line-through">
                {offer.original_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            )}
            {offer.promo_price && (
              <span className="text-xl font-bold text-gray-900">
                {offer.promo_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            )}
          </div>
        )}

        {/* Countdown */}
        {offer.ends_at && timeLeft && (
          <div className="flex items-center gap-1.5 text-sm font-mono font-semibold" style={{ color: '#e53e3e' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {timeLeft}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <a
          href={buyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-5 py-2 text-white text-sm font-semibold rounded-lg transition hover:opacity-90"
          style={{ backgroundColor: '#b48840' }}
        >
          Aproveitar oferta →
        </a>
        {offer.coupon_code && <CopyButton code={offer.coupon_code} />}
      </div>
    </div>
  )
}
