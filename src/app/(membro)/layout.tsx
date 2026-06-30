import { createClient } from '@/lib/supabase/server'
import { logout } from '@/lib/actions/auth'
import Image from 'next/image'
import { ThemeToggle } from '@/components/ThemeToggle'
import { SearchBar } from '@/components/SearchBar'
import { NotificationBell } from '@/components/NotificationBell'
import { NavLink } from '@/components/NavLink'
import { ProteinoFAB } from '@/components/ProteinoFAB'

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
    <div className="min-h-screen bg-[#e4e4e4] dark:bg-[#00060f] transition-colors duration-200">
      <header className="bg-white dark:bg-[#0d1020] border-b border-gray-100 dark:border-[#1e2030] sticky top-0 z-10">
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
                style={{ color: '#7a5c10', backgroundColor: '#f5efe3' }}
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

      <nav className="bg-white dark:bg-[#0d1020] border-b border-gray-100 dark:border-[#1e2030]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-1 h-10 overflow-x-auto">
          <NavLink href="/dashboard" label="Início" />
          <NavLink
            href="/comunidade"
            label="Comunidade"
            icon={
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
            }
          />
          <NavLink
            href="/ranking"
            label="Ranking"
            icon={
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
              </svg>
            }
          />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>

      {user && <ProteinoFAB userId={user.id} />}
    </div>
  )
}
