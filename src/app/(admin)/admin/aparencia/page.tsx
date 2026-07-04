import { createAdminClient } from '@/lib/supabase/admin'
import { APPEARANCE_DEFAULTS } from '@/lib/appearance-defaults'
import { AparenciaForm } from './AparenciaForm'

export const dynamic = 'force-dynamic'

export default async function AparenciaPage() {
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
