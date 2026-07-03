import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function AssinaturaPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const [
    { data: membroProfiles },
    { data: nullRoleProfiles },
    { count: totalAcessos },
  ] = await Promise.all([
    supabase.from('profiles').select('id, name, email, created_at').eq('role', 'membro').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, name, email, created_at').is('role', null).order('created_at', { ascending: false }),
    adminClient.from('user_products').select('id', { count: 'exact', head: true }),
  ])

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

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Membros ativos</p>
          <p className="text-3xl font-bold" style={{ color: '#b48840' }}>{totalMembers}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Acessos liberados</p>
          <p className="text-3xl font-bold" style={{ color: '#b48840' }}>{totalAcessos ?? 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 pb-4 border-b border-gray-100">Membros recentes</h2>
        {!recentMembers.length ? (
          <p className="text-sm text-gray-400 pt-4">Nenhum membro ainda.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentMembers.map(m => (
              <div key={m.id} className="flex items-center gap-3 py-3 last:pb-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gray-100 text-gray-500 shrink-0">
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
