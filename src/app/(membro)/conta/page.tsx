import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ContaForm } from './ContaForm'

export default async function ContaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, phone, bio, avatar_url, timezone')
    .eq('id', user.id)
    .single()

  return (
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
  )
}
