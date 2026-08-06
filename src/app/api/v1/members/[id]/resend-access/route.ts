import { NextRequest } from 'next/server'
import { checkApiKey } from '@/lib/api-auth'
import { getApiActor } from '@/lib/core/actor'
import { resendAccess } from '@/lib/core/members'
import { apiSuccess, Errors } from '@/lib/api-response'
import { withIdempotency } from '@/lib/api-idempotency'
import { hasScope } from '@/lib/api-scopes'

/**
 * Envia o acesso ao membro — decide sozinho entre convite de primeiro
 * acesso (nunca ativou a conta) e redefinição de senha (já ativou). Sem
 * variantes separadas: um único endpoint pra "dar acesso a este membro",
 * consistente com o que existia como dois nomes na API antiga.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkApiKey(req)
  if (!auth.ok) return Errors.unauthorized()
  if (!hasScope(auth, 'members:write')) return Errors.forbidden('members:write')
  const actor = getApiActor(auth.keyName)

  return withIdempotency(req, actor.label, async () => {
    const { id } = await params
    const result = await resendAccess(id, actor)
    if (result.error === 'Usuário não encontrado.') return Errors.memberNotFound()
    if (result.error) return Errors.internal(result.error)
    return apiSuccess({ sent: true })
  })
}
