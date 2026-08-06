import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkApiKey } from '@/lib/api-auth'
import { getApiActor } from '@/lib/core/actor'
import { updateMember, deleteMember } from '@/lib/core/members'
import { apiSuccess, Errors } from '@/lib/api-response'
import { withIdempotency } from '@/lib/api-idempotency'
import { hasScope } from '@/lib/api-scopes'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkApiKey(req)
  if (!auth.ok) return Errors.unauthorized()
  if (!hasScope(auth, 'members:read')) return Errors.forbidden('members:read')

  const { id } = await params
  const admin = createAdminClient()
  const { data, error } = await admin.from('profiles').select('*').eq('id', id).maybeSingle()
  if (error) return Errors.internal(error.message)
  if (!data) return Errors.memberNotFound()
  return apiSuccess({ member: data })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkApiKey(req)
  if (!auth.ok) return Errors.unauthorized()
  if (!hasScope(auth, 'members:write')) return Errors.forbidden('members:write')
  const actor = getApiActor(auth.keyName)

  return withIdempotency(req, actor.label, async () => {
    const { id } = await params
    const body = await req.json()

    if (body.role !== undefined && !['admin', 'equipe', 'membro'].includes(body.role)) {
      return Errors.validation("role deve ser 'admin', 'equipe' ou 'membro'.")
    }

    const result = await updateMember(
      id,
      {
        name: typeof body.name === 'string' ? body.name : undefined,
        role: body.role,
        is_active: typeof body.is_active === 'boolean' ? body.is_active : undefined,
        phone: typeof body.phone === 'string' ? body.phone : undefined,
      },
      actor,
    )
    if (result.error === 'Usuário não encontrado.') return Errors.memberNotFound()
    if (result.error) return Errors.validation(result.error)
    return apiSuccess({ member: result.data })
  })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkApiKey(req)
  if (!auth.ok) return Errors.unauthorized()
  if (!hasScope(auth, 'members:delete')) return Errors.forbidden('members:delete')
  const actor = getApiActor(auth.keyName)

  return withIdempotency(req, actor.label, async () => {
    const { id } = await params
    const result = await deleteMember(id, actor)
    if (result.error) return Errors.internal(result.error)
    return apiSuccess({ deleted: true })
  })
}
