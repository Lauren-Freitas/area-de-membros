import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { toggleOffer, deleteOffer } from '@/lib/actions/offers'

export default async function OfertasAdminPage() {
  const adminClient = createAdminClient()
  const { data: offers } = await adminClient
    .from('offers')
    .select('*, products(title)')
    .order('sort_order')
    .order('created_at', { ascending: false })

  function formatDate(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  function formatPrice(v: number | null) {
    if (v == null) return '—'
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Ofertas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Promoções com countdown para membros</p>
        </div>
        <Link
          href="/admin/ofertas/nova"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-white text-sm font-semibold rounded-lg transition hover:opacity-90"
          style={{ backgroundColor: '#b48840' }}
        >
          + Nova oferta
        </Link>
      </div>

      {!offers?.length ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400">
          <p className="font-medium">Nenhuma oferta criada ainda.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Oferta</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Preço</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Encerra</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {offers.map((offer) => {
                const product = Array.isArray(offer.products) ? offer.products[0] : offer.products
                const expired = offer.ends_at && new Date(offer.ends_at) < new Date()
                return (
                  <tr key={offer.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900">{offer.title}</p>
                      {product && <p className="text-xs text-gray-400 mt-0.5">{product.title}</p>}
                      {offer.coupon_code && (
                        <span className="inline-block mt-1 text-xs font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-600">{offer.coupon_code}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      {offer.original_price && <span className="text-xs text-gray-400 line-through mr-1">{formatPrice(offer.original_price)}</span>}
                      {offer.promo_price && <span className="font-semibold text-green-600">{formatPrice(offer.promo_price)}</span>}
                      {!offer.original_price && !offer.promo_price && <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className={expired ? 'text-red-500' : 'text-gray-500'}>{formatDate(offer.ends_at)}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <form action={async () => { 'use server'; await toggleOffer(offer.id, !offer.is_active) }}>
                        <button type="submit" className={`text-xs px-2.5 py-1 rounded-full font-medium transition hover:opacity-80 ${offer.is_active && !expired ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {offer.is_active && !expired ? 'Ativa' : 'Inativa'}
                        </button>
                      </form>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/ofertas/${offer.id}`}
                          className="text-xs px-3 py-1.5 rounded-lg border transition hover:bg-gray-50"
                          style={{ borderColor: '#b48840', color: '#7a5c10' }}
                        >
                          Editar
                        </Link>
                        <form action={async () => { 'use server'; await deleteOffer(offer.id) }}>
                          <button type="submit" className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition">
                            Excluir
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
