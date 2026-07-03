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
        <h1 className="text-xl font-bold text-gray-900">Faturas</h1>
        <p className="text-sm text-gray-500 mt-0.5">Histórico de acessos concedidos ({vendas?.length ?? 0} no total).</p>
      </div>

      {!vendas?.length ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400 text-sm">
          Nenhuma fatura ainda.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          {/* Header */}
          <div className="flex items-center pb-3 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <span className="flex-1">Membro</span>
            <span className="flex-1">Produto</span>
            <span className="w-36">Data</span>
            <span className="w-24">Status</span>
          </div>
          {/* Rows */}
          <div className="divide-y divide-gray-100">
            {vendas.map((v) => {
              const profile = Array.isArray(v.profiles) ? v.profiles[0] : v.profiles
              const product = Array.isArray(v.products) ? v.products[0] : v.products
              return (
                <div key={v.id} className="flex items-center py-3 hover:bg-gray-50 transition">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{profile?.name ?? '—'}</p>
                    <p className="text-xs text-gray-400">{profile?.email}</p>
                  </div>
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-gray-700 truncate">{product?.title ?? '—'}</p>
                  </div>
                  <div className="w-36 text-sm text-gray-400 shrink-0">
                    {new Date(v.granted_at).toLocaleDateString('pt-BR', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </div>
                  <div className="w-24 shrink-0">
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-green-50 text-green-700">
                      ✓ Pago
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
