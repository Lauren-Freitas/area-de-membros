import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkApiKey } from '@/lib/api-auth'
import { fireOutboundWebhooks } from '@/lib/fire-webhooks'
import { logActivity } from '@/lib/log-activity'
import { getApiActor } from '@/lib/core/actor'

export async function GET(req: NextRequest) {
  const auth = await checkApiKey(req)
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('certificates')
    .select('id, user_id, product_id, issued_at')
    .order('issued_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ certificates: data })
}

export async function POST(req: NextRequest) {
  const auth = await checkApiKey(req)
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { user_id, product_id } = await req.json()
  if (!user_id || !product_id) return NextResponse.json({ error: 'user_id e product_id são obrigatórios' }, { status: 400 })

  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('certificates')
    .select('id, user_id, product_id, issued_at')
    .eq('user_id', user_id)
    .eq('product_id', product_id)
    .maybeSingle()
  if (existing) return NextResponse.json({ certificate: existing })

  const { data: certificate, error } = await admin
    .from('certificates')
    .insert({ user_id, product_id })
    .select('id, user_id, product_id, issued_at')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const [{ data: product }, { data: member }] = await Promise.all([
    admin.from('products').select('title').eq('id', product_id).maybeSingle(),
    admin.from('profiles').select('name, email').eq('id', user_id).maybeSingle(),
  ])

  await admin.from('notifications').insert({
    user_id,
    title: '🎓 Certificado disponível!',
    body: `Você concluiu "${product?.title ?? 'um curso'}". Seu certificado está pronto para download.`,
    link: '/dashboard',
  })

  const actor = getApiActor(auth.keyName)
  await logActivity({ action: 'criar', entity: 'certificado', entityId: certificate.id, entityName: `${member?.name ?? user_id} → ${product?.title ?? product_id}`, actor })
  await fireOutboundWebhooks('certificate.generated', {
    member: { id: user_id, name: member?.name, email: member?.email },
    product: { id: product_id, title: product?.title },
    actor,
  }, product_id)

  return NextResponse.json({ certificate }, { status: 201 })
}
