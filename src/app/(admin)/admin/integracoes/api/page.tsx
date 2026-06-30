import { createAdminClient } from '@/lib/supabase/admin'
import { ApiKeysClient } from './ApiKeysClient'

export default async function ApiPage() {
  const adminClient = createAdminClient()
  const { data: keys } = await adminClient
    .from('api_keys')
    .select('id, name, key, created_at, last_used_at')
    .order('created_at', { ascending: false })

  return <ApiKeysClient keys={keys ?? []} />
}
