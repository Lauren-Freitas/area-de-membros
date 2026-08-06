import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkApiKey } from '@/lib/api-auth'
import { getApiActor } from '@/lib/core/actor'
import { createMember } from '@/lib/core/members'

export async function GET(req: NextRequest) {
  const auth = await checkApiKey(req)
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin.from('profiles').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ users: data })
}

export async function POST(req: NextRequest) {
  const auth = await checkApiKey(req)
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const name = body.name?.trim()
  const email = body.email?.trim().toLowerCase()
  if (!name || !email) return NextResponse.json({ error: 'name e email são obrigatórios' }, { status: 400 })

  const result = await createMember(
    {
      name,
      email,
      phone: body.phone ?? null,
      productIds: body.products ?? [],
      accessExpiresAt: body.access_expires_at ?? null,
    },
    getApiActor(auth.keyName),
  )
  // userId ausente = falhou antes de criar nada (ex: e-mail inválido). userId presente
  // + error = membro foi criado mas a liberação de produto(s) falhou — o caller precisa
  // do id pra saber o que corrigir, por isso não descarta a resposta num 400 puro.
  if (result.error && !result.userId) return NextResponse.json({ error: result.error }, { status: 400 })
  if (result.error) return NextResponse.json({ userId: result.userId, isNewUser: result.isNewUser, error: result.error }, { status: 207 })
  return NextResponse.json({ userId: result.userId, isNewUser: result.isNewUser }, { status: result.isNewUser ? 201 : 200 })
}
