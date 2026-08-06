import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkApiKey } from '@/lib/api-auth'
import { getApiActor } from '@/lib/core/actor'
import { grantAccess, revokeAccess, updateAccessExpiry } from '@/lib/core/access'

export async function POST(req: NextRequest) {
  const auth = await checkApiKey(req)
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { user_id, product_id, expires_at } = await req.json()
  if (!user_id || !product_id) return NextResponse.json({ error: 'user_id e product_id são obrigatórios' }, { status: 400 })

  const result = await grantAccess(user_id, product_id, getApiActor(auth.keyName), { expiresAt: expires_at ?? null })
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json({ granted: true })
}

export async function GET(req: NextRequest) {
  const auth = await checkApiKey(req)
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
  const auth = await checkApiKey(req)
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { user_id, product_id, expires_at } = await req.json()
  if (!user_id || !product_id) return NextResponse.json({ error: 'user_id e product_id são obrigatórios' }, { status: 400 })
  if (expires_at !== null && typeof expires_at !== 'string') {
    return NextResponse.json({ error: 'expires_at deve ser uma data ISO ou null (acesso permanente)' }, { status: 400 })
  }

  const result = await updateAccessExpiry(user_id, product_id, expires_at ?? null, getApiActor(auth.keyName))
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const auth = await checkApiKey(req)
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { user_id, product_id } = await req.json()
  if (!user_id || !product_id) return NextResponse.json({ error: 'user_id e product_id são obrigatórios' }, { status: 400 })

  const result = await revokeAccess(user_id, product_id, getApiActor(auth.keyName))
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json({ revoked: true })
}
