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
  if (!hasScope(auth, 'certificates:read')) return Errors.forbidden('certificates:read')

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('certificates')
    .select('id, user_id, product_id, issued_at')
    .order('issued_at', { ascending: false })
  if (error) return Errors.internal(error.message)
  return apiSuccess({ certificates: data })
}

/** Idempotente de propósito: chamar de novo com o mesmo par user_id/product_id retorna o certificado já existente, nunca duplica. */
export async function POST(req: NextRequest) {
  const auth = await checkApiKey(req)
  if (!auth.ok) return Errors.unauthorized()
  if (!hasScope(auth, 'certificates:write')) return Errors.forbidden('certificates:write')
  const actor = getApiActor(auth.keyName)

  return withIdempotency(req, actor.label, async () => {
    const { user_id, product_id } = await req.json()
    if (!user_id || !product_id) return Errors.validation('user_id e product_id são obrigatórios.')

    const admin = createAdminClient()
    const { data: existing } = await admin
      .from('certificates')
      .select('id, user_id, product_id, issued_at')
      .eq('user_id', user_id)
      .eq('product_id', product_id)
      .maybeSingle()
    if (existing) return apiSuccess({ certificate: existing })

    const { data: certificate, error } = await admin
      .from('certificates')
      .insert({ user_id, product_id })
      .select('id, user_id, product_id, issued_at')
      .single()
    if (error) return Errors.internal(error.message)

    const [{ data: product }, { data: member }] = await Promise.all([
      admin.from('products').select('title').eq('id', product_id).maybeSingle(),
      admin.from('profiles').select('name, email').eq('id', user_id).maybeSingle(),
    ])

    await admin.from('notifications').insert({
      user_id,
      title: '🎓 Certificado disponível!',
      body: `Você concluiu "${product?.title ?? 'um curso'}". Seu certificado está pronto para download.`,
      link: '/dashboard',
    })

    await emitEvent({
      event: 'certificate.generated',
      actor,
      member: { id: user_id, name: member?.name, email: member?.email },
      product: { id: product_id, title: product?.title },
      activity: { action: 'criar', entity: 'certificado', entityId: certificate.id, entityName: `${member?.name ?? user_id} → ${product?.title ?? product_id}` },
    })

    return apiSuccess({ certificate }, 201)
  })
}
