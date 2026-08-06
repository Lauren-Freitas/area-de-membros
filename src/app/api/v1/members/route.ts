import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkApiKey } from '@/lib/api-auth'
import { getApiActor } from '@/lib/core/actor'
import { createMember } from '@/lib/core/members'
import { apiSuccess, Errors } from '@/lib/api-response'
import { withIdempotency } from '@/lib/api-idempotency'

export async function GET(req: NextRequest) {
  const auth = await checkApiKey(req)
  if (!auth.ok) return Errors.unauthorized()

  const admin = createAdminClient()
  const { data, error } = await admin.from('profiles').select('*').order('created_at', { ascending: false })
  if (error) return Errors.internal(error.message)
  return apiSuccess({ members: data })
}

export async function POST(req: NextRequest) {
  const auth = await checkApiKey(req)
  if (!auth.ok) return Errors.unauthorized()
  const actor = getApiActor(auth.keyName)

  return withIdempotency(req, actor.label, async () => {
    const body = await req.json()
    const name = body.name?.trim()
    const email = body.email?.trim().toLowerCase()
    if (!name || !email) return Errors.validation('name e email são obrigatórios.')

    const result = await createMember(
      {
        name,
        email,
        phone: body.phone ?? null,
        productIds: body.products ?? [],
        accessExpiresAt: body.access_expires_at ?? null,
      },
      actor,
    )
    // userId ausente = falhou antes de criar nada. userId presente + error =
    // membro criado mas a liberação de produto(s) falhou — devolve o id pra
    // quem chamou saber o que corrigir, em vez de esconder atrás de um 400.
    if (result.error && !result.userId) return Errors.validation(result.error)
    if (result.error) return apiSuccess({ member_id: result.userId, is_new: result.isNewUser, warning: result.error }, 207)
    return apiSuccess({ member_id: result.userId, is_new: result.isNewUser }, result.isNewUser ? 201 : 200)
  })
}
