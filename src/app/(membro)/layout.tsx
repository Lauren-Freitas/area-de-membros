import { createClient } from '@/lib/supabase/server'
import { logout } from '@/lib/actions/auth'

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user?.id ?? '')
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
              TC
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-900 leading-none">Thiago Cantalovo</p>
              <p className="text-xs text-gray-400 mt-0.5">Nutricionista</p>
            </div>
          </div>

          {/* Usuário + Logout */}
          <div className="flex items-center gap-3">
            {profile?.role === 'admin' && (
              <a
                href="/admin"
                className="hidden sm:inline-flex text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition"
              >
                Admin
              </a>
            )}
            <span className="text-sm text-gray-600 hidden sm:block">{profile?.name}</span>
            <form action={logout}>
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-gray-800 transition font-medium"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  )
}
