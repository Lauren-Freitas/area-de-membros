import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkApiKey } from '@/lib/api-auth'
import { getApiActor } from '@/lib/core/actor'
import { createProduct } from '@/lib/core/products'

export async function GET(req: NextRequest) {
  const auth = await checkApiKey(req)
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin.from('products').select('*').order('sort_order')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ products: data })
}

export async function POST(req: NextRequest) {
  const auth = await checkApiKey(req)
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.title) return NextResponse.json({ error: 'title é obrigatório' }, { status: 400 })
  if (!body.content_type) return NextResponse.json({ error: 'content_type é obrigatório' }, { status: 400 })

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
    getApiActor(auth.keyName),
  )
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ product: result.data }, { status: 201 })
}
