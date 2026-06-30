import { createClient } from '@/lib/supabase/server'
import { logout } from '@/lib/actions/auth'
import Image from 'next/image'
import { ThemeToggle } from '@/components/ThemeToggle'
import { SearchBar } from '@/components/SearchBar'
import { NotificationBell } from '@/components/NotificationBell'
import { NavLink } from '@/components/NavLink'

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [{ data: profile }, { data: notifData }] = await Promise.all([
    supabase.from('profiles').select('name, role').eq('id', user?.id ?? '').single(),
    supabase
      .from('notifications')
      .select('id, title, body, link, read, created_at')
      .eq('user_id', user?.id ?? '')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const notifications = notifData ?? []
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/iav_1024.png" alt="Thiago Cantalovo" width={36} height={36} className="rounded-full dark:hidden shrink-0" />
            <Image src="/iav_grafite_1024.png" alt="Thiago Cantalovo" width={36} height={36} className="rounded-full hidden dark:block shrink-0" />
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none">Thiago Cantalovo</p>
              <p className="text-xs text-gray-400 mt-0.5">Nutricionista</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SearchBar />
            <NotificationBell notifications={notifications} unreadCount={unreadCount} />
            {profile?.role === 'admin' && (
              <a
                href="/admin"
                className="hidden sm:inline-flex text-xs font-medium px-3 py-1.5 rounded-full transition"
                style={{ color: '#9c7a2c', backgroundColor: '#fdf8e6' }}
              >
                Admin
              </a>
            )}
            <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:block">{profile?.name}</span>
            <ThemeToggle />
            <form action={logout}>
              <button type="submit" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition font-medium">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <nav className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-1 h-10 overflow-x-auto">
          <NavLink href="/dashboard" label="Início" />
          <NavLink href="/ranking" label="🏆 Ranking" />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  )
}
