import { createAdminClient } from './supabase/admin'
import { createClient } from './supabase/server'

interface LogParams {
  action: string
  entity: string
  entityId?: string | null
  entityName?: string | null
}

export async function logActivity(params: LogParams): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, role')
      .eq('id', user.id)
      .single()

    await createAdminClient().from('activity_logs').insert({
      user_id: user.id,
      user_name: profile?.name ?? user.email ?? 'Desconhecido',
      user_role: profile?.role ?? '',
      action: params.action,
      entity: params.entity,
      entity_id: params.entityId ?? null,
      entity_name: params.entityName ?? null,
    })
  } catch {
    // Silencioso — falha no log nunca deve quebrar a operação principal
  }
}
