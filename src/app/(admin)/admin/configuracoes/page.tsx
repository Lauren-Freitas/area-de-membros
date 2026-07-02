import { createClient } from '@/lib/supabase/server'
import { ConfiguracoesForm } from './ConfiguracoesForm'
import { ThemeSection } from './ThemeSection'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email, avatar_url')
    .eq('id', user?.id ?? '')
    .single()

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Meu perfil</h1>

      <ConfiguracoesForm
        name={profile?.name ?? ''}
        email={profile?.email ?? ''}
        avatarUrl={profile?.avatar_url ?? null}
      />

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Tema</h2>
        <p className="text-sm text-gray-500 mb-4">Escolha entre modo claro e escuro.</p>
        <ThemeSection />
      </div>
    </div>
  )
}
