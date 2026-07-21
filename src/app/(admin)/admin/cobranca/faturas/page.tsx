import { createAdminClient } from '@/lib/supabase/admin'
import { PaymentStatusBadge } from '@/components/admin/PaymentStatusBadge'
import { PaymentStatus } from '@/types'

export default async function FaturasPage() {
  const adminClient = createAdminClient()
  const { data: vendas } = await adminClient
    .from('user_products')
    .select('id, granted_at, value, payment_status, invoice_url, profiles(name, email), products(title)')
    .order('granted_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Faturas</h1>
        <p className="text-sm text-gray-500 mt-0.5">Histórico de acessos concedidos ({vendas?.length ?? 0} no total).</p>
      </div>

      {!vendas?.length ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-gray-200 text-gray-400 text-sm">
          Nenhuma fatura ainda.
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-gray-100 p-5">
          {/* Header */}
          <div className="flex items-center pb-3 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <span className="flex-1">Membro</span>
            <span className="flex-1">Produto</span>
            <span className="w-28 text-right">Valor</span>
            <span className="w-36">Data</span>
            <span className="w-28">Status</span>
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
                  <div className="w-28 text-right text-sm text-gray-700 shrink-0">
                    {v.value != null ? v.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}
                  </div>
                  <div className="w-36 text-sm text-gray-400 shrink-0">
                    {new Date(v.granted_at).toLocaleDateString('pt-BR', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </div>
                  <div className="w-28 shrink-0 flex items-center gap-2">
                    <PaymentStatusBadge status={v.payment_status as PaymentStatus | null} />
                    {v.invoice_url && (
                      <a href={v.invoice_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600" title="Ver fatura no Asaas">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
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
