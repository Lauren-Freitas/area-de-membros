import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkApiKey } from '@/lib/api-auth'
import { fireOutboundWebhooks } from '@/lib/fire-webhooks'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await checkApiKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const admin = createAdminClient()
  const { data, error } = await admin.from('profiles').select('*').eq('id', id).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  return NextResponse.json({ user: data })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await checkApiKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const admin = createAdminClient()

  const { data: before, error: beforeError } = await admin.from('profiles').select('is_active, email').eq('id', id).maybeSingle()
  if (beforeError) return NextResponse.json({ error: beforeError.message }, { status: 500 })
  if (!before) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const update: Record<string, unknown> = {}
  if (typeof body.name === 'string') update.name = body.name.trim()
  if (typeof body.role === 'string') update.role = body.role
  if (typeof body.is_active === 'boolean') update.is_active = body.is_active
  if (typeof body.phone === 'string') update.phone = body.phone.trim() || null

  if (Object.keys(update).length === 0) return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })

  const { data, error } = await admin.from('profiles').update(update).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if ('is_active' in update && update.is_active !== (before.is_active !== false)) {
    await fireOutboundWebhooks(update.is_active ? 'member.enabled' : 'member.disabled', { user_id: id, name: data.name, email: before.email })
  } else {
    await fireOutboundWebhooks('member.updated', { user_id: id, name: data.name, email: before.email })
  }

  return NextResponse.json({ user: data })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await checkApiKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('name, email').eq('id', id).maybeSingle()
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await fireOutboundWebhooks('member.deleted', { user_id: id, name: profile?.name, email: profile?.email })
  return NextResponse.json({ deleted: true })
}
