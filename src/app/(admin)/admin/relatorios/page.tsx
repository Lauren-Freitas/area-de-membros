import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function RelatoriosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'equipe') redirect('/dashboard')

  const admin = createAdminClient()

  const [
    { data: membroProfiles },
    { data: nullRoleProfiles },
    { data: products },
    { data: allAccesses },
    { data: allProgress },
    { data: allComments },
    { data: topLessons },
  ] = await Promise.all([
    supabase.from('profiles').select('id, name, email, created_at').eq('role', 'membro').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, name, email, created_at').is('role', null).order('created_at', { ascending: false }),
    admin.from('products').select('id, title').eq('is_active', true).order('sort_order'),
    admin.from('user_products').select('user_id, product_id, granted_at'),
    admin.from('lesson_progress').select('user_id, lesson_id, completed_at'),
    admin.from('lesson_comments').select('user_id, created_at'),
    admin
      .from('lesson_progress')
      .select('lesson_id, lessons(title, modules(product_id, products(title)))')
      .limit(200),
  ])

  const members = [
    ...(membroProfiles ?? []),
    ...(nullRoleProfiles ?? []),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const totalMembers = members.length
  const totalProducts = products?.length ?? 0
  const totalCompletions = allProgress?.length ?? 0
  const totalComments = allComments?.length ?? 0

  const accessByUser = new Map<string, string[]>()
  for (const a of allAccesses ?? []) {
    if (!accessByUser.has(a.user_id)) accessByUser.set(a.user_id, [])
    accessByUser.get(a.user_id)!.push(a.product_id)
  }

  const progressByUser = new Map<string, number>()
  for (const p of allProgress ?? []) {
    progressByUser.set(p.user_id, (progressByUser.get(p.user_id) ?? 0) + 1)
  }

  const lessonCounts = new Map<string, { title: string; product: string; count: number }>()
  for (const row of topLessons ?? []) {
    const lesson = Array.isArray(row.lessons) ? row.lessons[0] : row.lessons as { title: string; modules: { products: { title: string } } | { products: { title: string } }[] } | null
    if (!lesson) continue
    const mod = Array.isArray(lesson.modules) ? lesson.modules[0] : lesson.modules as { products: { title: string } | { title: string }[] } | null
    const prod = mod ? (Array.isArray(mod.products) ? mod.products[0] : mod.products) as { title: string } | null : null
    const existing = lessonCounts.get(row.lesson_id)
    if (existing) {
      existing.count++
    } else {
      lessonCounts.set(row.lesson_id, { title: lesson.title, product: prod?.title ?? '', count: 1 })
    }
  }
  const topContent = [...lessonCounts.values()].sort((a, b) => b.count - a.count).slice(0, 8)

  const productMap = Object.fromEntries((products ?? []).map(p => [p.id, p.title]))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-sm text-gray-500 mt-0.5">Visão geral da plataforma.</p>
      </div>

      {/* Cards de totais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Membros', value: totalMembers, icon: '👥' },
          { label: 'Produtos ativos', value: totalProducts, icon: '📦' },
          { label: 'Aulas concluídas', value: totalCompletions, icon: '✅' },
          { label: 'Comentários', value: totalComments, icon: '💬' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-2xl mb-1">{icon}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Top conteúdo */}
      {topContent.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-900 mb-4">Aulas mais concluídas</h2>
          <div className="space-y-3">
            {topContent.map((item, idx) => {
              const maxCount = topContent[0].count
              const pct = Math.round((item.count / maxCount) * 100)
              return (
                <div key={idx}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-gray-900 truncate block">{item.title}</span>
                      {item.product && <span className="text-xs text-gray-400">{item.product}</span>}
                    </div>
                    <span className="text-xs font-bold text-gray-500 ml-3 shrink-0">{item.count} {item.count === 1 ? 'vez' : 'vezes'}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#b48840' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Lista de membros */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-bold text-gray-900 pb-4 border-b border-gray-100">Membros</h2>
        {members.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Nenhum membro ainda.</p>
        ) : (
          <>
            {/* Column headers */}
            <div className="flex items-center py-2 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              <span className="flex-1">Membro</span>
              <span className="flex-1 hidden md:block">Produtos</span>
              <span className="w-36 shrink-0 hidden lg:block">Aulas concluídas</span>
              <span className="w-24 shrink-0 text-right">Cadastro</span>
            </div>
            <div className="divide-y divide-gray-100">
              {members.map(m => {
                const userProducts = (accessByUser.get(m.id) ?? []).map(id => productMap[id]).filter(Boolean)
                const completed = progressByUser.get(m.id) ?? 0
                return (
                  <div key={m.id} className="flex items-center py-3 hover:bg-gray-50 transition">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{m.name}</p>
                      <p className="text-xs text-gray-400">{m.email}</p>
                    </div>
                    <div className="flex-1 min-w-0 pr-4 hidden md:block">
                      {userProducts.length === 0 ? (
                        <span className="text-xs text-gray-300">Nenhum</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {userProducts.map(t => (
                            <span key={t} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#f5efe3', color: '#7a5c10' }}>{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="w-36 shrink-0 hidden lg:block">
                      <span className={`text-sm font-semibold ${completed > 0 ? 'text-green-600' : 'text-gray-300'}`}>
                        {completed}
                      </span>
                    </div>
                    <div className="w-24 shrink-0 text-xs text-gray-400 text-right">
                      {new Date(m.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
