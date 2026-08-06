import { createAdminClient } from './supabase/admin'
import { createClient } from './supabase/server'
import type { Actor } from './core/actor'

interface LogParams {
  action: string
  entity: string
  entityId?: string | null
  entityName?: string | null
  /** Se omitido, deriva da sessão do admin logado (comportamento histórico). */
  actor?: Actor
}

export async function logActivity(params: LogParams): Promise<void> {
  try {
    let userId: string | null = null
    let userName = 'Desconhecido'
    let userRole = ''
    let actorType: Actor['type'] = 'admin'
    let actorLabel: string | null = null

    if (params.actor) {
      actorType = params.actor.type
      actorLabel = params.actor.label
      userId = params.actor.userId ?? null
      userName = params.actor.label
      userRole = params.actor.userRole ?? ''
    } else {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('id', user.id)
        .single()

      userId = user.id
      userName = profile?.name ?? user.email ?? 'Desconhecido'
      userRole = profile?.role ?? ''
      actorLabel = userName
    }

    await createAdminClient().from('activity_logs').insert({
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      action: params.action,
      entity: params.entity,
      entity_id: params.entityId ?? null,
      entity_name: params.entityName ?? null,
      actor_type: actorType,
      actor_label: actorLabel,
    })
  } catch {
    // Silencioso — falha no log nunca deve quebrar a operação principal
  }
}
