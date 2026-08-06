import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkApiKey } from '@/lib/api-auth'
import { getApiActor } from '@/lib/core/actor'
import { updateProduct, deleteProduct } from '@/lib/core/products'
import { apiSuccess, Errors } from '@/lib/api-response'
import { withIdempotency } from '@/lib/api-idempotency'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkApiKey(req)
  if (!auth.ok) return Errors.unauthorized()

  const { id } = await params
  const admin = createAdminClient()
  const { data, error } = await admin.from('products').select('*').eq('id', id).maybeSingle()
  if (error) return Errors.internal(error.message)
  if (!data) return Errors.productNotFound()
  return apiSuccess({ product: data })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkApiKey(req)
  if (!auth.ok) return Errors.unauthorized()
  const actor = getApiActor(auth.keyName)

  return withIdempotency(req, actor.label, async () => {
    const { id } = await params
    const body = await req.json()

    const result = await updateProduct(id, body, actor)
    if (result.error === 'Produto não encontrado.') return Errors.productNotFound()
    if (result.error) return Errors.validation(result.error)
    return apiSuccess({ product: result.data })
  })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkApiKey(req)
  if (!auth.ok) return Errors.unauthorized()
  const actor = getApiActor(auth.keyName)

  return withIdempotency(req, actor.label, async () => {
    const { id } = await params
    const result = await deleteProduct(id, actor)
    if (result.error) return Errors.internal(result.error)
    return apiSuccess({ deleted: true })
  })
}
