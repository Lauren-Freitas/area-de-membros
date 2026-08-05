import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fireOutboundWebhooks } from '@/lib/fire-webhooks'
import { checkApiKey } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  if (!await checkApiKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { user_id, product_id } = await req.json()
  if (!user_id || !product_id) return NextResponse.json({ error: 'user_id e product_id são obrigatórios' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('user_products').upsert(
    { user_id, product_id, granted_by: 'api' },
    { onConflict: 'user_id,product_id', ignoreDuplicates: true }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch user info for webhook payload
  const { data: profile } = await admin.from('profiles').select('name, email').eq('id', user_id).maybeSingle()

  await fireOutboundWebhooks('access.granted', {
    user_id,
    product_id,
    user_name: profile?.name,
    user_email: profile?.email,
  }, product_id)

  return NextResponse.json({ granted: true })
}

export async function GET(req: NextRequest) {
  if (!await checkApiKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const user_id = searchParams.get('user_id')
  const product_id = searchParams.get('product_id')

  const admin = createAdminClient()
  let query = admin
    .from('user_products')
    .select('id, user_id, product_id, granted_at, granted_by, expires_at, payment_status, value, billing_type')
    .order('granted_at', { ascending: false })

  if (user_id) query = query.eq('user_id', user_id)
  if (product_id) query = query.eq('product_id', product_id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ access: data })
}

export async function PATCH(req: NextRequest) {
  if (!await checkApiKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { user_id, product_id, expires_at } = await req.json()
  if (!user_id || !product_id) return NextResponse.json({ error: 'user_id e product_id são obrigatórios' }, { status: 400 })
  if (expires_at !== null && typeof expires_at !== 'string') {
    return NextResponse.json({ error: 'expires_at deve ser uma data ISO ou null (acesso permanente)' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('user_products')
    .update({ expires_at: expires_at ?? null })
    .eq('user_id', user_id)
    .eq('product_id', product_id)
    .select()
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Acesso não encontrado' }, { status: 404 })
  return NextResponse.json({ access: data })
}

export async function DELETE(req: NextRequest) {
  if (!await checkApiKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { user_id, product_id } = await req.json()
  if (!user_id || !product_id) return NextResponse.json({ error: 'user_id e product_id são obrigatórios' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('user_products').delete().eq('user_id', user_id).eq('product_id', product_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: profile } = await admin.from('profiles').select('name, email').eq('id', user_id).maybeSingle()
  await fireOutboundWebhooks('access.revoked', {
    user_id,
    product_id,
    user_name: profile?.name,
    user_email: profile?.email,
  }, product_id)

  return NextResponse.json({ revoked: true })
}
