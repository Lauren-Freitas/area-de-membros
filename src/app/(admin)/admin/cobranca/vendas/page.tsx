import { createAdminClient } from '@/lib/supabase/admin'

export default async function VendasPage({
  searchParams,
}: {
  searchParams: Promise<{ produto?: string }>
}) {
  const { produto } = await searchParams
  const adminClient = createAdminClient()

  const [{ data: products }, vendasQuery] = await Promise.all([
    adminClient.from('products').select('id, title').eq('is_active', true).order('sort_order'),
    adminClient
      .from('user_products')
      .select('id, granted_at, user_id, product_id, profiles(name, email), products(title)')
      .order('granted_at', { ascending: false }),
  ])

  let vendas = vendasQuery.data ?? []
  if (produto) {
    vendas = vendas.filter(v => v.product_id === produto)
  }

  const totalByProduct: Record<string, number> = {}
  for (const v of (vendasQuery.data ?? [])) {
    const pid = v.product_id
    if (pid) totalByProduct[pid] = (totalByProduct[pid] ?? 0) + 1
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Vendas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{vendas.length} acesso{vendas.length !== 1 ? 's' : ''} liberado{vendas.length !== 1 ? 's' : ''}.</p>
        </div>
        {/* Filtro por produto */}
        <form method="get" className="flex items-center gap-2">
          <select
            name="produto"
            defaultValue={produto ?? ''}
            onChange={(e) => (e.target.form as HTMLFormElement).submit()}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-300"
          >
            <option value="">Todos os produtos</option>
            {(products ?? []).map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          <button type="submit" className="px-3 py-2 text-white text-sm font-semibold rounded-lg transition hover:opacity-90" style={{ backgroundColor: '#b48840' }}>
            Filtrar
          </button>
          {produto && (
            <a href="/admin/cobranca/vendas" className="text-sm text-gray-400 hover:text-gray-700 transition px-2">
              Limpar
            </a>
          )}
        </form>
      </div>

      {/* Cards resumo */}
      {!produto && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {(products ?? []).filter(p => totalByProduct[p.id]).map(p => (
            <a key={p.id} href={`/admin/cobranca/vendas?produto=${p.id}`}
              className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition">
              <p className="text-2xl font-bold" style={{ color: '#b48840' }}>{totalByProduct[p.id]}</p>
              <p className="text-xs text-gray-500 mt-1 leading-snug">{p.title}</p>
            </a>
          ))}
        </div>
      )}

      {!vendas.length ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400 text-sm">
          Nenhuma venda encontrada.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-medium">Membro</th>
                <th className="text-left px-5 py-3 font-medium">Produto</th>
                <th className="text-left px-5 py-3 font-medium">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {vendas.map((v) => {
                const profile = Array.isArray(v.profiles) ? v.profiles[0] : v.profiles
                const product = Array.isArray(v.products) ? v.products[0] : v.products
                return (
                  <tr key={v.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{profile?.name ?? '—'}</p>
                      <p className="text-xs text-gray-400">{profile?.email}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-700">{product?.title ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-400">
                      {new Date(v.granted_at).toLocaleDateString('pt-BR', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
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
