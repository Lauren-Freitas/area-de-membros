import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkApiKey } from '@/lib/api-auth'
import { getApiActor } from '@/lib/core/actor'
import { grantAccess, revokeAccess, updateAccessExpiry } from '@/lib/core/access'
import { apiSuccess, Errors } from '@/lib/api-response'
import { withIdempotency } from '@/lib/api-idempotency'

export async function POST(req: NextRequest) {
  const auth = await checkApiKey(req)
  if (!auth.ok) return Errors.unauthorized()
  const actor = getApiActor(auth.keyName)

  return withIdempotency(req, actor.label, async () => {
    const { user_id, product_id, expires_at } = await req.json()
    if (!user_id || !product_id) return Errors.validation('user_id e product_id são obrigatórios.')

    // Upsert real (ver core/access.ts) — chamar de novo com o mesmo par é
    // sempre seguro: mesma validade = mesmo estado final, validade diferente
    // = atualiza em vez de ser ignorado silenciosamente.
    const result = await grantAccess(user_id, product_id, actor, { expiresAt: expires_at ?? null })
    if (result.error) return Errors.internal(result.error)
    return apiSuccess({ granted: true })
  })
}

export async function GET(req: NextRequest) {
  const auth = await checkApiKey(req)
  if (!auth.ok) return Errors.unauthorized()

  const { searchParams } = req.nextUrl
  const user_id = searchParams.get('user_id')
  const product_id = searchParams.get('product_id')

  const admin = createAdminClient()
  let query = admin
    .from('user_products')
    .select('id, user_id, product_id, granted_at, granted_by, expires_at, payment_status, value, billing_type')
    .order('granted_at', { ascending: false })

  if (user_id) query = query.eq('user_id', user_id)
  if (product_id) query = query.eq('product_id', product_id)

  const { data, error } = await query
  if (error) return Errors.internal(error.message)
  return apiSuccess({ access_grants: data })
}

export async function PATCH(req: NextRequest) {
  const auth = await checkApiKey(req)
  if (!auth.ok) return Errors.unauthorized()
  const actor = getApiActor(auth.keyName)

  return withIdempotency(req, actor.label, async () => {
    const { user_id, product_id, expires_at } = await req.json()
    if (!user_id || !product_id) return Errors.validation('user_id e product_id são obrigatórios.')
    if (expires_at !== null && typeof expires_at !== 'string') {
      return Errors.validation('expires_at deve ser uma data ISO ou null (acesso permanente).')
    }

    const result = await updateAccessExpiry(user_id, product_id, expires_at ?? null, actor)
    if (result.error) return Errors.internal(result.error)
    return apiSuccess({ updated: true })
  })
}

export async function DELETE(req: NextRequest) {
  const auth = await checkApiKey(req)
  if (!auth.ok) return Errors.unauthorized()
  const actor = getApiActor(auth.keyName)

  return withIdempotency(req, actor.label, async () => {
    const { user_id, product_id } = await req.json()
    if (!user_id || !product_id) return Errors.validation('user_id e product_id são obrigatórios.')

    // Idempotente: revogar um acesso que já não existe também retorna sucesso.
    const result = await revokeAccess(user_id, product_id, actor)
    if (result.error) return Errors.internal(result.error)
    return apiSuccess({ revoked: true })
  })
}
