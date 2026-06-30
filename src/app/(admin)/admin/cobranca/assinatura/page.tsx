import { createAdminClient } from '@/lib/supabase/admin'

export default async function AssinaturaPage() {
  const adminClient = createAdminClient()
  const { count: totalMembers } = await adminClient
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'member')

  const { count: totalAcessos } = await adminClient
    .from('user_products')
    .select('id', { count: 'exact', head: true })

  const { data: recentMembers } = await adminClient
    .from('profiles')
    .select('id, name, email, created_at')
    .eq('role', 'member')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Assinatura</h1>
        <p className="text-sm text-gray-500 mt-0.5">Visão geral dos membros e acessos ativos.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Membros ativos</p>
          <p className="text-3xl font-bold" style={{ color: '#b48840' }}>{totalMembers ?? 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Acessos liberados</p>
          <p className="text-3xl font-bold" style={{ color: '#b48840' }}>{totalAcessos ?? 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Membros recentes</h2>
        {!recentMembers?.length ? (
          <p className="text-sm text-gray-400">Nenhum membro ainda.</p>
        ) : (
          <div className="space-y-3">
            {recentMembers.map(m => (
              <div key={m.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gray-100 text-gray-500 shrink-0">
                  {m.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
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
