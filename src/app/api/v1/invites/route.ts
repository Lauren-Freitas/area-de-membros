import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkApiKey } from '@/lib/api-auth'
import { getApiActor } from '@/lib/core/actor'
import { emitEvent } from '@/lib/core/events'
import { apiSuccess, Errors } from '@/lib/api-response'
import { withIdempotency } from '@/lib/api-idempotency'
import { hasScope } from '@/lib/api-scopes'

export async function GET(req: NextRequest) {
  const auth = await checkApiKey(req)
  if (!auth.ok) return Errors.unauthorized()
  if (!hasScope(auth, 'invites:read')) return Errors.forbidden('invites:read')

  const admin = createAdminClient()
  const { data, error } = await admin.from('invites').select('*').order('created_at', { ascending: false })
  if (error) return Errors.internal(error.message)
  return apiSuccess({ invites: data })
}

/** Sem chave natural de deduplicação (cada chamada gera um código novo de propósito) — use Idempotency-Key pra reintentos seguros. */
export async function POST(req: NextRequest) {
  const auth = await checkApiKey(req)
  if (!auth.ok) return Errors.unauthorized()
  if (!hasScope(auth, 'invites:write')) return Errors.forbidden('invites:write')
  const actor = getApiActor(auth.keyName)

  return withIdempotency(req, actor.label, async () => {
    const body = await req.json()
    if (body.max_uses !== undefined && body.max_uses !== null && typeof body.max_uses !== 'number') {
      return Errors.validation('max_uses deve ser um número ou null (sem limite).')
    }
    if (body.expires_at !== undefined && body.expires_at !== null && typeof body.expires_at !== 'string') {
      return Errors.validation('expires_at deve ser uma data ISO ou null (sem expiração).')
    }

    const note = typeof body.note === 'string' ? body.note.trim() || null : null
    const product_ids: string[] = Array.isArray(body.product_ids) ? body.product_ids : []
    const max_uses = typeof body.max_uses === 'number' ? body.max_uses : null
    const expires_at = typeof body.expires_at === 'string' ? body.expires_at : null
    const code = Math.random().toString(36).slice(2, 10).toUpperCase()

    const admin = createAdminClient()
    const { data, error } = await admin.from('invites').insert({ code, note, product_ids, max_uses, expires_at }).select().single()
    if (error) return Errors.internal(error.message)

    await emitEvent({
      event: 'invite.sent',
      actor,
      metadata: { code, note, product_ids },
      activity: { action: 'criar', entity: 'convite', entityName: note ?? code },
    })

    return apiSuccess({ invite: data }, 201)
  })
}
