import { createAdminClient } from '@/lib/supabase/admin'

export default async function FaturasPage() {
  const adminClient = createAdminClient()
  const { data: vendas } = await adminClient
    .from('user_products')
    .select('id, granted_at, profiles(name, email), products(title)')
    .order('granted_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Faturas pagas</h1>
        <p className="text-sm text-gray-500 mt-0.5">Histórico de acessos concedidos ({vendas?.length ?? 0} no total).</p>
      </div>

      {!vendas?.length ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400 text-sm">
          Nenhuma fatura ainda.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-medium">Membro</th>
                <th className="text-left px-5 py-3 font-medium">Produto</th>
                <th className="text-left px-5 py-3 font-medium">Data</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
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
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-green-50 text-green-700">
                        ✓ Pago
                      </span>
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
