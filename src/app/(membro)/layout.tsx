import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { cookies } from 'next/headers'
import { BrandLogo } from '@/components/BrandLogo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { NotificationBell } from '@/components/NotificationBell'
import { MemberShell } from '@/components/MemberShell'
import { MobileSidebar } from '@/components/MobileSidebar'
import { ProfileMenu } from '@/components/ProfileMenu'
import { ViewAsBanner } from '@/components/ViewAsBanner'
import { getSiteConfig } from '@/lib/branding'
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

  const [{ data: profile }, { data: notifData }, siteConfig] = await Promise.all([
    adminClient.from('profiles').select('name, role, avatar_url, is_active, last_login_at').eq('id', targetId).single(),
    adminClient.from('notifications')
      .select('id, title, body, link, read, created_at')
      .eq('user_id', targetId)
      .order('created_at', { ascending: false })
      .limit(20),
    getSiteConfig(),
  ])

  // Membro desativado não tem acesso (só aplica quando não estamos em modo view-as)
  if (!isViewingAs && profile && (profile as { is_active?: boolean }).is_active === false) {
    redirect('/login?erro=conta-desativada')
  }

  const notifications = notifData ?? []
  const unreadCount = notifications.filter(n => !n.read).length

  const userName = profile?.name ?? 'Usuário'
  const avatarUrl = (profile as { avatar_url?: string | null } | null)?.avatar_url ?? null
  const isAdminOrEquipe = profile?.role === 'admin' || profile?.role === 'equipe'
  const platformName = siteConfig.platform_name || 'Área de Membros'
  const platformTagline = siteConfig.platform_tagline || ''

  // Último acesso — atualiza no máximo a cada 5 minutos pra não gravar a cada navegação,
  // e nunca em modo "ver como membro" (não é um acesso de verdade do membro).
  // A escrita roda depois da resposta (after()) pra não sobrescrever o valor antes da
  // página atual (ex: a home, que mostra "último acesso") ler o valor anterior.
  if (!isViewingAs) {
    const lastLoginAt = (profile as { last_login_at?: string | null } | null)?.last_login_at
    after(() => touchLastLogin(adminClient, user.id, lastLoginAt))
  }

  const bannerOffset = isViewingAs ? 'pt-10' : ''

  return (
    <div className="min-h-screen bg-[var(--background)] transition-colors duration-200">

      {/* Banner de "ver como membro" */}
      {isViewingAs && <ViewAsBanner memberName={viewAsName} />}

      {/* Header mobile-only: hamburger, logo, notificações, tema, conta. Some no desktop -- a sidebar assume o papel de navegação e conta ali. */}
      <div className={bannerOffset}>
        <header className="lg:hidden bg-card border-b border-gray-100 dark:border-[#1e2030] sticky top-0 z-30">
          <div className="px-4 h-16 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MobileSidebar userName={userName} />
              <BrandLogo size={32} className="shrink-0" />
            </div>
            <div className="flex items-center gap-1.5">
              {!isViewingAs && isAdminOrEquipe && (
                <a
                  href="/admin"
                  className="text-xs font-medium px-3 py-1.5 rounded-full transition"
                  style={{ color: 'var(--brand-text)', backgroundColor: 'var(--brand-bg)' }}
                >
                  Admin
                </a>
              )}
              <NotificationBell notifications={notifications} unreadCount={unreadCount} />
              <ThemeToggle />
              <ProfileMenu name={userName} avatarUrl={avatarUrl} unreadCount={unreadCount} />
            </div>
          </div>
        </header>
      </div>

      {/* Sidebar desktop-only, fixa e recolhível -- estado/persistência em MemberShell (client) */}
      <MemberShell
        platformName={platformName}
        platformTagline={platformTagline}
        userName={userName}
        avatarUrl={avatarUrl}
        unreadCount={unreadCount}
        isViewingAs={isViewingAs}
        bannerOffset={bannerOffset}
      >
        {/* Tira utilitária do desktop: notificações, tema, admin. Conta já está na sidebar. */}
        <header className="hidden lg:flex h-14 items-center justify-end gap-2 px-6 border-b border-gray-100 dark:border-[#1e2030] bg-card sticky top-0 z-20">
          {!isViewingAs && isAdminOrEquipe && (
            <a
              href="/admin"
              className="text-xs font-medium px-3 py-1.5 rounded-full transition mr-1"
              style={{ color: 'var(--brand-text)', backgroundColor: 'var(--brand-bg)' }}
            >
              Admin
            </a>
          )}
          <NotificationBell notifications={notifications} unreadCount={unreadCount} />
          <ThemeToggle />
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>
      </MemberShell>
    </div>
  )
}
