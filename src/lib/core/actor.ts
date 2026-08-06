import { createClient } from '@/lib/supabase/server'

/**
 * Quem/o que executou uma ação — admin logado, chamada de API (identificada
 * pelo nome da chave), ou webhook de entrada (Kiwify/Asaas). Sempre explícito
 * na chamada, nunca redescoberto a partir de sessão dentro da função de
 * negócio — é isso que torna API/webhook igualmente auditáveis quanto admin.
 */
export interface Actor {
  type: 'admin' | 'api' | 'webhook'
  label: string
  userId?: string | null
  userRole?: string | null
}

/** Deriva o actor a partir da sessão do admin logado (uso em Server Actions da UI). */
export async function getAdminActor(): Promise<Actor> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { type: 'admin', label: 'Desconhecido' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .single()

  return {
    type: 'admin',
    label: profile?.name ?? user.email ?? 'Desconhecido',
    userId: user.id,
    userRole: profile?.role ?? '',
  }
}

/** Actor de uma chamada REST autenticada por API key (rotas /api/admin/**). */
export function getApiActor(keyName?: string): Actor {
  return { type: 'api', label: keyName ?? 'Chave mestra' }
}

/** Actor de um webhook de entrada (Kiwify, Asaas). */
export function getWebhookActor(provider: string): Actor {
  return { type: 'webhook', label: provider }
}
