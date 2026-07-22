import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const CYCLE_LABELS: Record<string, string> = {
  WEEKLY: 'Semanal', BIWEEKLY: 'Quinzenal', MONTHLY: 'Mensal', BIMONTHLY: 'Bimestral',
  QUARTERLY: 'Trimestral', SEMIANNUALLY: 'Semestral', YEARLY: 'Anual',
}

export default async function AssinaturaPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const [
    { data: membroProfiles },
    { data: nullRoleProfiles },
    { count: totalAcessos },
    { data: assinantes },
  ] = await Promise.all([
    supabase.from('profiles').select('id, name, email, created_at').eq('role', 'membro').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, name, email, created_at').is('role', null).order('created_at', { ascending: false }),
    adminClient.from('user_products').select('id', { count: 'exact', head: true }),
    adminClient
      .from('user_products')
      .select('id, value, payment_status, profiles(name, email), products!inner(title, billing_cycle)')
      .eq('payment_status', 'confirmed')
      .not('products.billing_cycle', 'is', null),
  ])

  const activeSubscribers = (assinantes ?? []).map(a => ({
    id: a.id,
    value: a.value,
    profile: Array.isArray(a.profiles) ? a.profiles[0] : a.profiles,
    product: Array.isArray(a.products) ? a.products[0] : a.products,
  }))
  const recurringRevenueMonthly = activeSubscribers
    .filter(a => a.product?.billing_cycle === 'MONTHLY')
    .reduce((sum, a) => sum + (a.value ?? 0), 0)

  const allMembers = [
    ...(membroProfiles ?? []),
    ...(nullRoleProfiles ?? []),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const totalMembers = allMembers.length
  const recentMembers = allMembers.slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Assinatura</h1>
        <p className="text-sm text-gray-500 mt-0.5">Visão geral dos membros e acessos ativos.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Membros ativos</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--brand)' }}>{totalMembers}</p>
        </div>
        <div className="bg-card rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Acessos liberados</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--brand)' }}>{totalAcessos ?? 0}</p>
        </div>
        <div className="bg-card rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Assinantes ativos</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--brand)' }}>{activeSubscribers.length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Receita recorrente/mês</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--brand)' }}>
            {recurringRevenueMonthly.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <p className="text-xs text-gray-400 mt-1">Só ciclo mensal</p>
        </div>
      </div>

      {activeSubscribers.length > 0 && (
        <div className="bg-card rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 pb-4 border-b border-gray-100">Assinantes recorrentes</h2>
          <div className="divide-y divide-gray-100">
            {activeSubscribers.map(a => (
              <div key={a.id} className="flex items-center gap-3 py-3 last:pb-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{a.profile?.name ?? '—'}</p>
                  <p className="text-xs text-gray-400 truncate">{a.profile?.email}</p>
                </div>
                <div className="text-sm text-gray-600 shrink-0">{a.product?.title}</div>
                <div className="text-xs text-gray-400 shrink-0 w-20 text-right">
                  {a.product?.billing_cycle ? CYCLE_LABELS[a.product.billing_cycle] : '—'}
                </div>
                <div className="text-sm font-medium text-gray-900 shrink-0 w-24 text-right">
                  {a.value != null ? a.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 pb-4 border-b border-gray-100">Membros recentes</h2>
        {!recentMembers.length ? (
          <p className="text-sm text-gray-400 pt-4">Nenhum membro ainda.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentMembers.map(m => (
              <div key={m.id} className="flex items-center gap-3 py-3 last:pb-0 hover:bg-gray-50 transition rounded-lg">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gray-100 dark:bg-gray-500/10 text-gray-500 dark:text-gray-400 shrink-0">
                  {m.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                  <p className="text-xs text-gray-400 truncate">{m.email}</p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">
                  {new Date(m.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
