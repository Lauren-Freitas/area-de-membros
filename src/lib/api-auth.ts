import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ApiScope } from './api-scopes'

export interface ApiKeyCheck {
  ok: boolean
  /** Nome da chave nomeada cadastrada (Integrações → API), quando aplicável — vira o `actor.label` no histórico/webhooks. */
  keyName?: string
  /** null = sem restrição (chave mestra, ou chave nomeada marcada como acesso total / criada antes de escopos existirem). */
  scopes?: ApiScope[] | null
}

/**
 * Autenticação das rotas de API pública — qualquer cliente HTTP autenticado
 * por chave, não uma integração específica. Aceita a chave mestra (env var,
 * sempre irrestrita) ou qualquer chave nomeada cadastrada em Integrações →
 * API (escopo conforme cadastrado). Um erro na consulta ao banco nunca deve
 * liberar acesso — só retorna ok:true numa correspondência explícita.
 */
export async function checkApiKey(req: NextRequest): Promise<ApiKeyCheck> {
  const key = req.headers.get('x-api-key')
  if (!key) return { ok: false }
  if (key === process.env.ADMIN_API_KEY) return { ok: true, keyName: 'Chave mestra', scopes: null }

  const admin = createAdminClient()
  const { data } = await admin.from('api_keys').select('id, name, scopes').eq('key', key).maybeSingle()
  if (data) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
    // Precisa de await: sem isso é fire-and-forget e o runtime pode encerrar o
    // contexto da requisição antes do update chegar no Supabase — na prática
    // last_used_at nunca era gravado (confirmado em teste ponta a ponta).
    await admin.from('api_keys').update({ last_used_at: new Date().toISOString(), last_ip: ip }).eq('id', data.id)
    return { ok: true, keyName: data.name ?? undefined, scopes: (data.scopes as ApiScope[] | null) ?? null }
  }
  return { ok: false }
}
