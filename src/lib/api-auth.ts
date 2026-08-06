import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface ApiKeyCheck {
  ok: boolean
  /** Nome da chave nomeada cadastrada (Integrações → API), quando aplicável — vira o `actor.label` no histórico/webhooks. */
  keyName?: string
}

/**
 * Autenticação das rotas de API pública — qualquer cliente HTTP autenticado
 * por chave, não uma integração específica. Aceita a chave mestra (env var)
 * ou qualquer chave nomeada cadastrada em Integrações → API. Um erro na
 * consulta ao banco nunca deve liberar acesso — só retorna ok:true numa
 * correspondência explícita. Propaga o nome da chave pra quem chamou poder
 * identificar o actor no histórico de auditoria.
 */
export async function checkApiKey(req: NextRequest): Promise<ApiKeyCheck> {
  const key = req.headers.get('x-api-key')
  if (!key) return { ok: false }
  if (key === process.env.ADMIN_API_KEY) return { ok: true, keyName: 'Chave mestra' }

  const admin = createAdminClient()
  const { data } = await admin.from('api_keys').select('id, name').eq('key', key).maybeSingle()
  if (data) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
    // Precisa de await: sem isso é fire-and-forget e o runtime pode encerrar o
    // contexto da requisição antes do update chegar no Supabase — na prática
    // last_used_at nunca era gravado (confirmado em teste ponta a ponta).
    await admin.from('api_keys').update({ last_used_at: new Date().toISOString(), last_ip: ip }).eq('id', data.id)
    return { ok: true, keyName: data.name ?? undefined }
  }
  return { ok: false }
}
