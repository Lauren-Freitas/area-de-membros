import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkApiKey } from '@/lib/api-auth'
import { getApiActor } from '@/lib/core/actor'
import { createProduct } from '@/lib/core/products'
import { apiSuccess, Errors } from '@/lib/api-response'
import { withIdempotency } from '@/lib/api-idempotency'

export async function GET(req: NextRequest) {
  const auth = await checkApiKey(req)
  if (!auth.ok) return Errors.unauthorized()

  const admin = createAdminClient()
  const { data, error } = await admin.from('products').select('*').order('sort_order')
  if (error) return Errors.internal(error.message)
  return apiSuccess({ products: data })
}

export async function POST(req: NextRequest) {
  const auth = await checkApiKey(req)
  if (!auth.ok) return Errors.unauthorized()
  const actor = getApiActor(auth.keyName)

  // Produto não tem chave natural de deduplicação (título não é único) —
  // sem um Idempotency-Key, chamadas repetidas criam produtos repetidos de
  // propósito (é uma criação de recurso novo, não uma sincronização de estado).
  return withIdempotency(req, actor.label, async () => {
    const body = await req.json()
    if (!body.title) return Errors.validation('title é obrigatório.')
    if (!body.content_type) return Errors.validation('content_type é obrigatório.')

    const result = await createProduct(
      {
        title: body.title,
        description: body.description ?? '',
        content_type: body.content_type,
        content_url: body.content_url ?? null,
        banner_url: body.banner_url ?? null,
        is_pack: body.is_pack ?? false,
        sort_order: body.sort_order ?? 0,
        is_active: body.is_active ?? true,
      },
      actor,
    )
    if (result.error) return Errors.validation(result.error)
    return apiSuccess({ product: result.data }, 201)
  })
}
