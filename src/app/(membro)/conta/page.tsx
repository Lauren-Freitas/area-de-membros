import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MemberTabs } from '@/components/MemberTabs'
import { ContaForm } from './ContaForm'
import { SenhaForm } from './SenhaForm'
import { AssinaturaTab } from './AssinaturaTab'

const TABS = [
  { key: 'perfil', label: 'Perfil' },
  { key: 'senha', label: 'Senha' },
  { key: 'assinatura', label: 'Assinatura' },
]

export default async function ContaPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const active = tab === 'senha' || tab === 'assinatura' ? tab : 'perfil'

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, phone, bio, avatar_url, timezone')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Conta</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Dados pessoais, senha e seus produtos, tudo em um só lugar.
        </p>
      </div>

      <MemberTabs tabs={TABS} active={active} basePath="/conta" />

      {active === 'perfil' && (
        <ContaForm
          initialData={{
            name: profile?.name ?? '',
            phone: (profile as { phone?: string | null } | null)?.phone ?? '',
            bio: (profile as { bio?: string | null } | null)?.bio ?? '',
            avatar_url: (profile as { avatar_url?: string | null } | null)?.avatar_url ?? null,
            timezone: (profile as { timezone?: string | null } | null)?.timezone ?? 'America/Sao_Paulo',
            email: user.email ?? '',
          }}
        />
      )}
      {active === 'senha' && <SenhaForm />}
      {active === 'assinatura' && <AssinaturaTab userId={user.id} />}
    </div>
  )
}
