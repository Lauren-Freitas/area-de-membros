import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function auth(req: NextRequest) {
  return req.headers.get('x-api-key') === process.env.ADMIN_API_KEY
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin.from('products').select('*').order('sort_order')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ products: data })
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, description, content_type, content_url, banner_url, is_pack, sort_order, is_active } = body

  if (!title) return NextResponse.json({ error: 'title é obrigatório' }, { status: 400 })
  if (!content_type) return NextResponse.json({ error: 'content_type é obrigatório' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin.from('products').insert({
    title,
    description: description ?? '',
    content_type,
    content_url: content_url ?? null,
    banner_url: banner_url ?? null,
    is_pack: is_pack ?? false,
    sort_order: sort_order ?? 0,
    is_active: is_active ?? true,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ product: data }, { status: 201 })
}
