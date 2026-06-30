import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export default async function AdminPage() {
  const adminClient = createAdminClient()

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalMembers },
    { count: newMembersWeek },
    { count: totalAccesses },
    { count: newAccessesMonth },
    { count: activeProducts },
    { count: totalCertificates },
    { data: recentMembers },
    { data: recentActivity },
  ] = await Promise.all([
    adminClient.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'member'),
    adminClient.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'member').gte('created_at', sevenDaysAgo),
    adminClient.from('user_products').select('*', { count: 'exact', head: true }),
    adminClient.from('user_products').select('*', { count: 'exact', head: true }).gte('granted_at', thirtyDaysAgo),
    adminClient.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
    adminClient.from('certificates').select('*', { count: 'exact', head: true }),
    adminClient
      .from('profiles')
      .select('id, name, email, created_at')
      .eq('role', 'member')
      .order('created_at', { ascending: false })
      .limit(5),
    adminClient
      .from('user_products')
      .select('granted_at, profiles(name, email), products(title)')
      .order('granted_at', { ascending: false })
      .limit(5),
  ])

  function fmt(d: string) {
    return new Date(d).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
  }

  const metrics = [
    {
      label: 'Membros',
      value: totalMembers ?? 0,
      sub: `+${newMembersWeek ?? 0} esta semana`,
      up: (newMembersWeek ?? 0) > 0,
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
  ]

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(({ label, value, sub, up, href, icon }) => (
          <Link
            key={label}
            href={href}
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#f5efe3', color: '#b48840' }}>
                {icon}
              </div>
              {up !== null && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${up ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
                  {up ? '↑' : '—'}
                </span>
              )}
            </div>
            <p className="text-3xl font-bold text-gray-900 group-hover:text-[#b48840] transition">{value}</p>
            <p className="text-sm font-medium text-gray-600 mt-0.5">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent members */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Membros recentes</h2>
            <Link href="/admin/usuarios" className="text-xs font-medium hover:underline" style={{ color: '#b48840' }}>
              Ver todos
            </Link>
          </div>
          {!recentMembers?.length ? (
            <p className="text-sm text-gray-400 py-4 text-center">Nenhum membro ainda.</p>
          ) : (
            <div className="space-y-3">
              {recentMembers.map(m => (
                <div key={m.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gray-100 text-gray-500 shrink-0">
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
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Últimas vendas</h2>
            <Link href="/admin/cobranca/vendas" className="text-xs font-medium hover:underline" style={{ color: '#b48840' }}>
              Ver todas
            </Link>
          </div>
          {!recentActivity?.length ? (
            <p className="text-sm text-gray-400 py-4 text-center">Nenhuma venda ainda.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((v, i) => {
                const profile = Array.isArray(v.profiles) ? v.profiles[0] : v.profiles
                const product = Array.isArray(v.products) ? v.products[0] : v.products
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm" style={{ backgroundColor: '#f5efe3' }}>
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
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Ações rápidas</h2>
        <div className="flex flex-wrap gap-3">
          {quickActions.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition hover:opacity-90"
              style={{ backgroundColor: '#b48840' }}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
