import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fireOutboundWebhooks } from '@/lib/fire-webhooks'

async function auth(req: NextRequest): Promise<boolean> {
  const key = req.headers.get('x-api-key')
  if (!key) return false
  if (key === process.env.ADMIN_API_KEY) return true

  // Check named API keys in DB
  const admin = createAdminClient()
  const { data } = await admin.from('api_keys').select('id').eq('key', key).maybeSingle()
  if (data) {
    admin.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', data.id)
    return true
  }
  return false
}

export async function POST(req: NextRequest) {
  if (!await auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  fireOutboundWebhooks('sale.created', {
    user_id,
    product_id,
    user_name: profile?.name,
    user_email: profile?.email,
  }, product_id)

  return NextResponse.json({ granted: true })
}

export async function DELETE(req: NextRequest) {
  if (!await auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { user_id, product_id } = await req.json()
  if (!user_id || !product_id) return NextResponse.json({ error: 'user_id e product_id são obrigatórios' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('user_products').delete().eq('user_id', user_id).eq('product_id', product_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ revoked: true })
}
