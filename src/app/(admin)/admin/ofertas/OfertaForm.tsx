'use client'
import { saveOffer } from '@/lib/actions/offers'

interface Product { id: string; title: string }
interface Offer {
  id: string; product_id: string | null; title: string; description: string | null
  original_price: number | null; promo_price: number | null; coupon_code: string | null
  ends_at: string | null; sort_order: number
}

export function OfertaForm({ offer, products }: { offer?: Offer; products: Product[] }) {
  return (
    <form action={saveOffer} className="space-y-5 bg-white rounded-2xl border border-gray-100 p-6 max-w-lg">
      {offer && <input type="hidden" name="id" value={offer.id} />}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Título da oferta *</label>
        <input
          name="title"
          required
          defaultValue={offer?.title}
          placeholder="Ex: Oferta relâmpago — 50% off!"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição</label>
        <textarea
          name="description"
          rows={2}
          defaultValue={offer?.description ?? ''}
          placeholder="Detalhe a oferta para o membro..."
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Produto relacionado</label>
        <select
          name="product_id"
          defaultValue={offer?.product_id ?? ''}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 bg-white"
        >
          <option value="">Nenhum (oferta geral)</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Preço original (R$)</label>
          <input
            type="number"
            name="original_price"
            step="0.01"
            defaultValue={offer?.original_price ?? ''}
            placeholder="197,00"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Preço promocional (R$)</label>
          <input
            type="number"
            name="promo_price"
            step="0.01"
            defaultValue={offer?.promo_price ?? ''}
            placeholder="97,00"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Cupom de desconto</label>
        <input
          name="coupon_code"
          defaultValue={offer?.coupon_code ?? ''}
          placeholder="EX: PROMO50"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-yellow-300"
        />
        <p className="text-xs text-gray-400 mt-1">Opcional — o membro pode copiar e usar no checkout.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Encerra em</label>
          <input
            type="datetime-local"
            name="ends_at"
            defaultValue={offer?.ends_at ? offer.ends_at.slice(0, 16) : ''}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Ordem</label>
          <input
            type="number"
            name="sort_order"
            defaultValue={offer?.sort_order ?? 0}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className="px-5 py-2 text-white text-sm font-semibold rounded-lg transition hover:opacity-90"
          style={{ backgroundColor: '#b48840' }}
        >
          {offer ? 'Salvar alterações' : 'Criar oferta'}
        </button>
        <a href="/admin/ofertas" className="text-sm text-gray-500 hover:text-gray-700 transition">Cancelar</a>
      </div>
    </form>
  )
}
