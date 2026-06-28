import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function auth(req: NextRequest) {
  return req.headers.get('x-api-key') === process.env.ADMIN_API_KEY
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { user_id, product_id } = await req.json()
  if (!user_id || !product_id) return NextResponse.json({ error: 'user_id e product_id são obrigatórios' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('user_products').upsert(
    { user_id, product_id, granted_by: 'manual' },
    { onConflict: 'user_id,product_id', ignoreDuplicates: true }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ granted: true })
}

export async function DELETE(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { user_id, product_id } = await req.json()
  if (!user_id || !product_id) return NextResponse.json({ error: 'user_id e product_id são obrigatórios' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('user_products').delete().eq('user_id', user_id).eq('product_id', product_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ revoked: true })
}
