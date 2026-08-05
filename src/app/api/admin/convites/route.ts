import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkApiKey } from '@/lib/api-auth'
import { fireOutboundWebhooks } from '@/lib/fire-webhooks'

export async function GET(req: NextRequest) {
  if (!await checkApiKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin.from('invites').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invites: data })
}

export async function POST(req: NextRequest) {
  if (!await checkApiKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (body.max_uses !== undefined && body.max_uses !== null && typeof body.max_uses !== 'number') {
    return NextResponse.json({ error: 'max_uses deve ser um número ou null (sem limite)' }, { status: 400 })
  }
  if (body.expires_at !== undefined && body.expires_at !== null && typeof body.expires_at !== 'string') {
    return NextResponse.json({ error: 'expires_at deve ser uma data ISO ou null (sem expiração)' }, { status: 400 })
  }

  const note = typeof body.note === 'string' ? body.note.trim() || null : null
  const product_ids: string[] = Array.isArray(body.product_ids) ? body.product_ids : []
  const max_uses = typeof body.max_uses === 'number' ? body.max_uses : null
  const expires_at = typeof body.expires_at === 'string' ? body.expires_at : null

  const code = Math.random().toString(36).slice(2, 10).toUpperCase()

  const admin = createAdminClient()
  const { data, error } = await admin.from('invites').insert({
    code,
    note,
    product_ids,
    max_uses,
    expires_at,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await fireOutboundWebhooks('invite.sent', { code, note, product_ids })
  return NextResponse.json({ invite: data }, { status: 201 })
}
