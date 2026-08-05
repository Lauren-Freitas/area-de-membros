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
