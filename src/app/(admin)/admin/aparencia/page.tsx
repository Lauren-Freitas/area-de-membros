import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { APPEARANCE_DEFAULTS } from '@/lib/appearance-defaults'
import { AparenciaForm } from './AparenciaForm'

export const dynamic = 'force-dynamic'

export default async function AparenciaPage() {
  // Já era escondida do menu do "equipe" (adminOnly na nav), mas a página em
  // si não checava role — um equipe que soubesse a URL entrava normalmente.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') redirect('/admin')

  const adminClient = createAdminClient()
  const { data: rows } = await adminClient.from('site_config').select('key, value')
  const config = Object.fromEntries(
    (rows ?? []).map(r => [r.key, r.value])
  )

  // preenche com defaults para keys ausentes
  for (const [key, value] of Object.entries(APPEARANCE_DEFAULTS)) {
    if (!(key in config)) config[key] = value
  }

  return <AparenciaForm config={config} />
}
