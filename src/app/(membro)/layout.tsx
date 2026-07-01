import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { ThemeToggle } from '@/components/ThemeToggle'
import { NotificationBell } from '@/components/NotificationBell'
import { NavLink } from '@/components/NavLink'
import { ProfileMenu } from '@/components/ProfileMenu'
import { MobileSidebar } from '@/components/MobileSidebar'
import { ProteinoFAB } from '@/components/ProteinoFAB'

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()

  const [{ data: profile }, { data: notifData }, { data: userProducts }, { data: allProducts }] = await Promise.all([
    supabase.from('profiles').select('name, role, avatar_url').eq('id', user.id).single(),
    supabase
      .from('notifications')
      .select('id, title, body, link, read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('user_products').select('product_id').eq('user_id', user.id),
    adminClient.from('products').select('id, title').eq('is_active', true).order('sort_order'),
  ])

  const notifications = notifData ?? []
  const unreadCount = notifications.filter(n => !n.read).length
  const unlockedIds = new Set((userProducts ?? []).map(p => p.product_id))
  const myProducts = (allProducts ?? []).filter(p => unlockedIds.has(p.id))
  const hasLocked = (allProducts ?? []).some(p => !unlockedIds.has(p.id))

  const userName = profile?.name ?? 'Usuário'
  const avatarUrl = (profile as { avatar_url?: string | null } | null)?.avatar_url ?? null

  return (
    <div className="min-h-screen bg-[#e4e4e4] dark:bg-[#00060f] transition-colors duration-200">
      <header className="bg-white dark:bg-[#0d1020] border-b border-gray-100 dark:border-[#1e2030] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MobileSidebar />
            <Image src="/iav_1024.png" alt="Thiago Cantalovo" width={32} height={32} className="rounded-full dark:hidden shrink-0" />
            <Image src="/iav_grafite_1024.png" alt="Thiago Cantalovo" width={32} height={32} className="rounded-full hidden dark:block shrink-0" />
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none">Thiago Cantalovo</p>
              <p className="text-xs text-gray-400 mt-0.5">Nutricionista</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {profile?.role === 'admin' && (
              <a
                href="/admin"
                className="hidden sm:inline-flex text-xs font-medium px-3 py-1.5 rounded-full transition"
                style={{ color: '#7a5c10', backgroundColor: '#f5efe3' }}
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

      <nav className="bg-white dark:bg-[#0d1020] border-b border-gray-100 dark:border-[#1e2030]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-1 h-10 overflow-x-auto scrollbar-none">
          <NavLink href="/dashboard" label="Início" />
          {myProducts.map(p => (
            <NavLink key={p.id} href={`/produto/${p.id}`} label={p.title} />
          ))}
          {hasLocked && <NavLink href="/dashboard" label="Disponíveis" />}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>

      {user && <ProteinoFAB userId={user.id} />}
    </div>
  )
}
