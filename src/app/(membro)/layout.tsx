import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { cookies } from 'next/headers'
import { BrandLogo } from '@/components/BrandLogo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { NotificationBell } from '@/components/NotificationBell'
import { NavLink } from '@/components/NavLink'
import { MEMBER_NAV_ITEMS } from '@/lib/member-nav'
import { ProfileMenu } from '@/components/ProfileMenu'
import { MobileSidebar } from '@/components/MobileSidebar'
import { ProteinoFAB } from '@/components/ProteinoFAB'
import { ViewAsBanner } from '@/components/ViewAsBanner'
import { fireOutboundWebhooks } from '@/lib/fire-webhooks'
import { getWebhookActor } from '@/lib/core/actor'

async function touchLastLogin(adminClient: ReturnType<typeof createAdminClient>, userId: string, lastLoginAt: string | null | undefined) {
  const isStale = !lastLoginAt || Date.now() - new Date(lastLoginAt).getTime() > 5 * 60 * 1000
  if (isStale) {
    await adminClient.from('profiles').update({ last_login_at: new Date().toISOString() }).eq('id', userId)
    await fireOutboundWebhooks('login.created', { member: { id: userId }, actor: getWebhookActor('Sistema') })
  }
}

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()

  // Verifica modo "ver como membro"
  const cookieStore = await cookies()
  const viewAsMemberId = cookieStore.get('view_as')?.value
  const viewAsName = cookieStore.get('view_as_name')?.value ?? 'Membro'

  // Em modo view-as, valida que quem está logado é admin/equipe
  let isViewingAs = false
  if (viewAsMemberId) {
    const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    isViewingAs = me?.role === 'admin' || me?.role === 'equipe'
  }

  // ID efetivo: o membro alvo (view-as) ou o próprio usuário
  const targetId = isViewingAs ? viewAsMemberId! : user.id

  const [{ data: profile }, { data: notifData }, { data: userProducts }, { data: allProducts }] = await Promise.all([
    adminClient.from('profiles').select('name, role, avatar_url, is_active, last_login_at').eq('id', targetId).single(),
    adminClient.from('notifications')
      .select('id, title, body, link, read, created_at')
      .eq('user_id', targetId)
      .order('created_at', { ascending: false })
      .limit(20),
    adminClient.from('user_products').select('product_id').eq('user_id', targetId),
    adminClient.from('products').select('id, title').eq('is_active', true).order('sort_order'),
  ])

  // Membro desativado não tem acesso (só aplica quando não estamos em modo view-as)
  if (!isViewingAs && profile && (profile as { is_active?: boolean }).is_active === false) {
    redirect('/login?erro=conta-desativada')
  }

  const notifications = notifData ?? []
  const unreadCount = notifications.filter(n => !n.read).length
  const unlockedIds = new Set((userProducts ?? []).map(p => p.product_id))
  const myProducts = (allProducts ?? []).filter(p => unlockedIds.has(p.id))

  const userName = profile?.name ?? 'Usuário'
  const firstName = userName.trim().split(' ')[0]
  const avatarUrl = (profile as { avatar_url?: string | null } | null)?.avatar_url ?? null

  // Último acesso — atualiza no máximo a cada 5 minutos pra não gravar a cada navegação,
  // e nunca em modo "ver como membro" (não é um acesso de verdade do membro).
  // A escrita roda depois da resposta (after()) pra não sobrescrever o valor antes da
  // página atual (ex: a home, que mostra "último acesso") ler o valor anterior.
  if (!isViewingAs) {
    const lastLoginAt = (profile as { last_login_at?: string | null } | null)?.last_login_at
    after(() => touchLastLogin(adminClient, user.id, lastLoginAt))
  }

  return (
    <div className={`min-h-screen bg-[var(--background)] transition-colors duration-200 ${isViewingAs ? 'pt-10' : ''}`}>

      {/* Banner de "ver como membro" */}
      {isViewingAs && <ViewAsBanner memberName={viewAsName} />}

      <header className="bg-card border-b border-gray-100 dark:border-[#1e2030] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MobileSidebar userName={userName} />
            <BrandLogo size={32} className="shrink-0" />
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none">Thiago Cantalovo</p>
              <p className="text-xs text-gray-400 mt-0.5">Nutricionista</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Botão Admin — oculto em modo view-as para não confundir */}
            {!isViewingAs && (profile?.role === 'admin' || profile?.role === 'equipe') && (
              <a
                href="/admin"
                className="hidden sm:inline-flex text-xs font-medium px-3 py-1.5 rounded-full transition"
                style={{ color: 'var(--brand-text)', backgroundColor: 'var(--brand-bg)' }}
              >
                Admin
              </a>
            )}
            <span className="hidden md:inline text-sm text-gray-600 dark:text-gray-300 mr-1">
              Olá, {firstName} 👋
            </span>
            <NotificationBell notifications={notifications} unreadCount={unreadCount} />
            <ThemeToggle />
            <ProfileMenu name={userName} avatarUrl={avatarUrl} unreadCount={unreadCount} />
          </div>
        </div>
      </header>

      <nav className="bg-card border-b border-gray-100 dark:border-[#1e2030]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-1 h-10 overflow-x-auto scrollbar-none">
          {MEMBER_NAV_ITEMS.map(item => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
          {myProducts.length > 0 && (
            <>
              <span className="w-px h-4 bg-gray-200 dark:bg-[#2a2f45] mx-1 shrink-0" />
              {myProducts.map(p => (
                <NavLink key={p.id} href={`/produto/${p.id}`} label={p.title} />
              ))}
            </>
          )}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>

      {/* FAB do Proteíno — oculto em modo view-as */}
      {!isViewingAs && user && <ProteinoFAB />}
    </div>
  )
}
