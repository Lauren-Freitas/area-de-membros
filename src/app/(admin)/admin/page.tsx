import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { ACTION_STYLE, ENTITY_LABEL, relativeTime } from '@/lib/activity-labels'

export const dynamic = 'force-dynamic'

// Página server-rendered a cada request (dynamic='force-dynamic') — "agora" precisa
// vir de fora do corpo do componente pra não disparar a regra de pureza do React
// Compiler, que trata Date.now() direto no render como valor instável.
function dateWindows() {
  const now = Date.now()
  return {
    sevenDaysAgo: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
    thirtyDaysAgo: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(),
    oneDayAgo: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
    firstOfMonth: (() => { const d = new Date(now); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString() })(),
  }
}

export default async function AdminPage() {
  const adminClient = createAdminClient()
  const { sevenDaysAgo, thirtyDaysAgo, oneDayAgo, firstOfMonth } = dateWindows()

  const [
    { data: membroProfiles },
    { data: nullRoleProfiles },
    { count: totalAccesses },
    { count: newAccessesMonth },
    { count: activeProducts },
    { count: totalCertificates },
    { data: recentActivity },
    { data: revenueRows },
    { count: completedCount },
    { data: lessonProgressRows },
    { data: lessonCommentsRows },
    { data: productCommentsRows },
    { count: overduePayments },
    { count: failedWebhookDeliveries },
    { count: failedInboundEvents },
    { data: activityFeed },
  ] = await Promise.all([
    adminClient.from('profiles').select('id, name, email, created_at').eq('role', 'membro').order('created_at', { ascending: false }),
    adminClient.from('profiles').select('id, name, email, created_at').is('role', null).order('created_at', { ascending: false }),
    adminClient.from('user_products').select('*', { count: 'exact', head: true }),
    adminClient.from('user_products').select('*', { count: 'exact', head: true }).gte('granted_at', thirtyDaysAgo),
    adminClient.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
    adminClient.from('certificates').select('*', { count: 'exact', head: true }),
    adminClient
      .from('user_products')
      .select('granted_at, profiles(name, email), products(title)')
      .order('granted_at', { ascending: false })
      .limit(5),
    adminClient.from('user_products').select('value').gte('granted_at', firstOfMonth).not('value', 'is', null),
    adminClient.from('user_products').select('*', { count: 'exact', head: true }).eq('is_completed', true),
    adminClient.from('lesson_progress').select('lessons(modules(products(title)))'),
    adminClient.from('lesson_comments').select('id, content, created_at, profiles(name), lessons(title)').order('created_at', { ascending: false }).limit(5),
    adminClient.from('product_comments').select('id, content, created_at, profiles(name), products(title)').order('created_at', { ascending: false }).limit(5),
    adminClient.from('user_products').select('*', { count: 'exact', head: true }).eq('payment_status', 'overdue'),
    adminClient.from('outbound_webhook_deliveries').select('*', { count: 'exact', head: true }).eq('success', false).gte('attempted_at', oneDayAgo),
    adminClient.from('webhook_logs').select('*', { count: 'exact', head: true }).in('status', ['failed', 'ignored']).gte('created_at', sevenDaysAgo),
    adminClient.from('activity_logs').select('id, user_name, action, entity, entity_name, created_at').order('created_at', { ascending: false }).limit(6),
  ])

  const allMembers = [
    ...(membroProfiles ?? []),
    ...(nullRoleProfiles ?? []),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const totalMembers = allMembers.length
  const newMembersWeek = allMembers.filter(p => p.created_at >= sevenDaysAgo).length
  const recentMembers = allMembers.slice(0, 5)

  function fmt(d: string) {
    return new Date(d).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
  }

  const monthlyRevenue = (revenueRows ?? []).reduce((acc, r) => acc + (r.value ?? 0), 0)
  const completionRate = totalAccesses ? Math.round(((completedCount ?? 0) / totalAccesses) * 100) : 0

  // Conteúdo mais acessado — aproximado pelo nº de aulas concluídas por produto (não há log de visualização)
  const engagementByProduct = new Map<string, number>()
  for (const row of lessonProgressRows ?? []) {
    const lessonRel = Array.isArray(row.lessons) ? row.lessons[0] : row.lessons
    const modRel = lessonRel ? (Array.isArray(lessonRel.modules) ? lessonRel.modules[0] : lessonRel.modules) : null
    const prodRel = modRel ? (Array.isArray(modRel.products) ? modRel.products[0] : modRel.products) : null
    const title = prodRel?.title
    if (title) engagementByProduct.set(title, (engagementByProduct.get(title) ?? 0) + 1)
  }
  const topEngaged = [...engagementByProduct.entries()].sort((a, b) => b[1] - a[1])[0] ?? null

  // Comentários recentes — junta de aula e de produto, ordena por data
  type RecentComment = { id: string; content: string; created_at: string; author: string; context: string }
  const recentComments: RecentComment[] = [
    ...(lessonCommentsRows ?? []).map(c => {
      const author = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles
      const lesson = Array.isArray(c.lessons) ? c.lessons[0] : c.lessons
      return { id: c.id, content: c.content, created_at: c.created_at, author: author?.name ?? '—', context: lesson?.title ?? 'Aula' }
    }),
    ...(productCommentsRows ?? []).map(c => {
      const author = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles
      const product = Array.isArray(c.products) ? c.products[0] : c.products
      return { id: c.id, content: c.content, created_at: c.created_at, author: author?.name ?? '—', context: product?.title ?? 'Produto' }
    }),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)

  const metrics = [
    {
      label: 'Membros',
      value: totalMembers,
      sub: `+${newMembersWeek} esta semana`,
      up: newMembersWeek > 0,
      href: '/admin/usuarios',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: 'Vendas',
      value: totalAccesses ?? 0,
      sub: `+${newAccessesMonth ?? 0} este mês`,
      up: (newAccessesMonth ?? 0) > 0,
      href: '/admin/cobranca/vendas',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      label: 'Produtos ativos',
      value: activeProducts ?? 0,
      sub: 'publicados',
      up: null,
      href: '/admin/produtos',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      label: 'Certificados',
      value: totalCertificates ?? 0,
      sub: 'emitidos',
      up: null,
      href: '/admin/certificados',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
    },
    {
      label: 'Receita do mês',
      value: monthlyRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }),
      sub: 'acessos com valor registrado',
      up: null,
      href: '/admin/cobranca/vendas',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Taxa de conclusão',
      value: `${completionRate}%`,
      sub: 'dos acessos concedidos',
      up: null,
      href: '/admin/relatorios',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ]

  const alerts = [
    (overduePayments ?? 0) > 0 && {
      label: `${overduePayments} pagamento${overduePayments !== 1 ? 's' : ''} em atraso`,
      href: '/admin/cobranca/acessos',
    },
    (failedWebhookDeliveries ?? 0) > 0 && {
      label: `${failedWebhookDeliveries} webhook${failedWebhookDeliveries !== 1 ? 's' : ''} de saída falhou nas últimas 24h`,
      href: '/admin/integracoes/webhooks',
    },
    (failedInboundEvents ?? 0) > 0 && {
      label: `${failedInboundEvents} evento${failedInboundEvents !== 1 ? 's' : ''} de pagamento recebido com falha nos últimos 7 dias`,
      href: null,
    },
  ].filter(Boolean) as { label: string; href: string | null }[]

  const quickActions = [
    { label: 'Criar produto', href: '/admin/produtos/novo' },
    { label: 'Adicionar membro', href: '/admin/usuarios/novo' },
    { label: 'Criar oferta', href: '/admin/ofertas/nova' },
    { label: 'Enviar convite', href: '/admin/convites' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Visão geral</h1>
        <span className="text-sm text-gray-400">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map(({ label, value, sub, up, href, icon }) => (
          <Link
            key={label}
            href={href}
            className="bg-card rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--brand-bg)', color: 'var(--brand)' }}>
                {icon}
              </div>
              {up !== null && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${up ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-gray-50 dark:bg-gray-500/10 text-gray-400'}`}>
                  {up ? '↑' : '—'}
                </span>
              )}
            </div>
            <p className="text-3xl font-bold" style={{ color: 'var(--brand)' }}>{value}</p>
            <p className="text-sm font-medium text-gray-600 mt-0.5">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </Link>
        ))}
      </div>

      {/* Atenção — só aparece quando há algo real pra ver */}
      {alerts.length > 0 && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/10 p-5">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <h2 className="font-semibold text-amber-900 dark:text-amber-300">Atenção</h2>
          </div>
          <ul className="space-y-1.5">
            {alerts.map(a => (
              <li key={a.label}>
                {a.href ? (
                  <Link href={a.href} className="text-sm text-amber-800 dark:text-amber-200 hover:underline">
                    {a.label}
                  </Link>
                ) : (
                  <span className="text-sm text-amber-800 dark:text-amber-200">{a.label}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Conteúdo mais acessado */}
      {topEngaged && (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl border border-gray-100 bg-card text-sm">
          <span className="text-lg">📈</span>
          <span className="text-gray-500">Conteúdo mais acessado:</span>
          <span className="font-semibold text-gray-900">{topEngaged[0]}</span>
          <span className="text-gray-400 text-xs">({topEngaged[1]} {topEngaged[1] === 1 ? 'aula concluída' : 'aulas concluídas'} no total)</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent members */}
        <div className="bg-card rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Membros recentes</h2>
            <Link href="/admin/usuarios" className="text-xs font-medium hover:underline" style={{ color: 'var(--brand)' }}>
              Ver todos
            </Link>
          </div>
          {!recentMembers.length ? (
            <p className="text-sm text-gray-400 py-4 text-center">Nenhum membro ainda.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentMembers.map(m => (
                <div key={m.id} className="flex items-center gap-3 py-3 last:pb-0 hover:bg-gray-50 transition rounded-lg">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: 'var(--brand-bg)', color: 'var(--brand-text)' }}>
                    {m.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                    <p className="text-xs text-gray-400 truncate">{m.email}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{fmt(m.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent sales */}
        <div className="bg-card rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Últimas vendas</h2>
            <Link href="/admin/cobranca/vendas" className="text-xs font-medium hover:underline" style={{ color: 'var(--brand)' }}>
              Ver todas
            </Link>
          </div>
          {!recentActivity?.length ? (
            <p className="text-sm text-gray-400 py-4 text-center">Nenhuma venda ainda.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentActivity.map((v, i) => {
                const profile = Array.isArray(v.profiles) ? v.profiles[0] : v.profiles
                const product = Array.isArray(v.products) ? v.products[0] : v.products
                return (
                  <div key={i} className="flex items-center gap-3 py-3 last:pb-0 hover:bg-gray-50 transition rounded-lg">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm" style={{ backgroundColor: 'var(--brand-bg)' }}>
                      📦
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{profile?.name ?? '—'}</p>
                      <p className="text-xs text-gray-400 truncate">{product?.title ?? '—'}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{fmt(v.granted_at)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent comments */}
        <div className="bg-card rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Comentários recentes</h2>
          </div>
          {!recentComments.length ? (
            <p className="text-sm text-gray-400 py-4 text-center">Nenhum comentário ainda.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentComments.map(c => (
                <div key={c.id} className="py-3 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.author}</p>
                    <span className="text-xs text-gray-400 shrink-0">{fmt(c.created_at)}</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">em {c.context}</p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{c.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Atividade recente — feed unificado a partir de activity_logs */}
      {activityFeed && activityFeed.length > 0 && (
        <div className="bg-card rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Atividade recente</h2>
            <Link href="/admin/atividades" className="text-xs font-medium hover:underline" style={{ color: 'var(--brand)' }}>
              Ver tudo
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {activityFeed.map(log => {
              const actionStyle = ACTION_STYLE[log.action] ?? { label: log.action, bg: '#f3f4f6', text: '#374151' }
              const entityLabel = ENTITY_LABEL[log.entity] ?? log.entity
              return (
                <div key={log.id} className="flex items-center gap-3 py-3 last:pb-0">
                  <span className="text-sm font-medium text-gray-900 shrink-0">{log.user_name}</span>
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                    style={{ backgroundColor: actionStyle.bg, color: actionStyle.text }}
                  >
                    {actionStyle.label}
                  </span>
                  <span className="text-xs text-gray-500 shrink-0">{entityLabel}</span>
                  {log.entity_name && (
                    <span className="text-xs text-gray-700 truncate flex-1">{log.entity_name}</span>
                  )}
                  <span className="text-xs text-gray-400 shrink-0 ml-auto">{relativeTime(log.created_at)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="bg-card rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Ações rápidas</h2>
        <div className="flex flex-wrap gap-3">
          {quickActions.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition hover:opacity-90"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
