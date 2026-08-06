import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkApiKey } from '@/lib/api-auth'
import { getApiActor } from '@/lib/core/actor'
import { updateProduct, deleteProduct } from '@/lib/core/products'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkApiKey(req)
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const admin = createAdminClient()
  const { data, error } = await admin.from('products').select('*').eq('id', id).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
  return NextResponse.json({ product: data })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkApiKey(req)
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const result = await updateProduct(
    id,
    {
      title: body.title,
      description: body.description,
      content_type: body.content_type,
      content_url: body.content_url,
      banner_url: body.banner_url,
      is_pack: body.is_pack,
      is_active: body.is_active,
      sort_order: body.sort_order,
    },
    getApiActor(auth.keyName),
  )
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.error === 'Produto não encontrado.' ? 404 : 400 })
  return NextResponse.json({ product: result.data })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkApiKey(req)
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const result = await deleteProduct(id, getApiActor(auth.keyName))
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json({ deleted: true })
}
