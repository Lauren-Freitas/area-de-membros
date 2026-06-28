import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWelcomeEmail } from '@/lib/resend'

function auth(req: NextRequest) {
  return req.headers.get('x-api-key') === process.env.ADMIN_API_KEY
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin.from('profiles').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ users: data })
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const name = body.name?.trim()
  const email = body.email?.trim().toLowerCase()
  const productIds: string[] = body.products ?? []

  if (!name || !email) return NextResponse.json({ error: 'name e email são obrigatórios' }, { status: 400 })

  const admin = createAdminClient()

  const { data: existing } = await admin.from('profiles').select('id').eq('email', email).maybeSingle()

  let userId: string
  let isNewUser = false
  let inviteLink: string | null = null

  if (existing) {
    userId = existing.id
  } else {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: false,
      user_metadata: { name },
    })
    if (createError || !created.user) return NextResponse.json({ error: createError?.message ?? 'Erro ao criar usuário' }, { status: 500 })
    userId = created.user.id
    isNewUser = true

    const { data: linkData } = await admin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/criar-senha`,
        data: { name },
      },
    })
    inviteLink = linkData?.properties?.action_link ?? null
  }

  if (productIds.length > 0) {
    await admin.from('user_products').upsert(
      productIds.map((productId) => ({ user_id: userId, product_id: productId, granted_by: 'manual' })),
      { onConflict: 'user_id,product_id', ignoreDuplicates: true }
    )
  }

  if (isNewUser && inviteLink) {
    const productTitle = productIds.length === 1
      ? (await admin.from('products').select('title').eq('id', productIds[0]).single()).data?.title ?? 'Área de Membros'
      : 'Área de Membros'
    await sendWelcomeEmail({ email, name, productTitle, inviteLink }).catch(() => null)
  }

  return NextResponse.json({ userId, isNewUser }, { status: isNewUser ? 201 : 200 })
}
