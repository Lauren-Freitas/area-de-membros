import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Autenticação das rotas de API externa (n8n, Make, Zapier etc).
 * Aceita a chave mestra (env var) ou qualquer chave nomeada cadastrada em
 * Integrações → API. Um erro na consulta ao banco nunca deve liberar acesso —
 * só retorna true numa correspondência explícita.
 */
export async function checkApiKey(req: NextRequest): Promise<boolean> {
  const key = req.headers.get('x-api-key')
  if (!key) return false
  if (key === process.env.ADMIN_API_KEY) return true

  const admin = createAdminClient()
  const { data } = await admin.from('api_keys').select('id').eq('key', key).maybeSingle()
  if (data) {
    admin.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', data.id)
    return true
  }
  return false
}
