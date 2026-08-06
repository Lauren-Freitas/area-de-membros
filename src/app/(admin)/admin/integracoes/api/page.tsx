import { createAdminClient } from '@/lib/supabase/admin'
import { ApiKeysClient } from './ApiKeysClient'

export default async function ApiPage() {
  const adminClient = createAdminClient()
  const { data: keys } = await adminClient
    .from('api_keys')
    .select('id, name, key, created_at, last_used_at, last_ip, scopes, expires_at, creator:profiles!created_by(name)')
    .order('created_at', { ascending: false })

  const normalized = (keys ?? []).map(k => ({
    ...k,
    creator: Array.isArray(k.creator) ? k.creator[0] ?? null : k.creator,
  }))

  return <ApiKeysClient keys={normalized} />
}
