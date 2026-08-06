import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkApiKey } from '@/lib/api-auth'
import { getApiActor } from '@/lib/core/actor'
import { updateMember, deleteMember } from '@/lib/core/members'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkApiKey(req)
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const admin = createAdminClient()
  const { data, error } = await admin.from('profiles').select('*').eq('id', id).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  return NextResponse.json({ user: data })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkApiKey(req)
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  if (body.role !== undefined && !['admin', 'equipe', 'membro'].includes(body.role)) {
    return NextResponse.json({ error: "role deve ser 'admin', 'equipe' ou 'membro'" }, { status: 400 })
  }

  const result = await updateMember(
    id,
    {
      name: typeof body.name === 'string' ? body.name : undefined,
      role: body.role,
      is_active: typeof body.is_active === 'boolean' ? body.is_active : undefined,
      phone: typeof body.phone === 'string' ? body.phone : undefined,
    },
    getApiActor(auth.keyName),
  )
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.error === 'Usuário não encontrado.' ? 404 : 400 })
  return NextResponse.json({ user: result.data })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkApiKey(req)
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const result = await deleteMember(id, getApiActor(auth.keyName))
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json({ deleted: true })
}
