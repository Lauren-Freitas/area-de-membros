import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWelcomeEmail, sendAccessGrantedEmail } from '@/lib/resend'

type AdminClient = ReturnType<typeof createAdminClient>
type Json = Record<string, unknown>

// A Kiwify entrega webhook_event_type em inglês (confirmado com payload real: "order_approved"),
// mesmo a documentação/API de criação de webhook usando nomes em português ("compra_aprovada").
// Mantém os dois por segurança; os de estorno/chargeback/assinatura ainda não foram confirmados
// com payload real, então cobre as variantes mais prováveis.
const GRANT_EVENTS = ['order_approved', 'compra_aprovada', 'subscription_renewed']
const OVERDUE_EVENTS = ['subscription_late']
const REVOKE_EVENTS = [
  'order_refunded', 'compra_reembolsada', 'refunded',
  'order_rejected', 'compra_recusada',
  'chargeback', 'chargedback',
  'subscription_canceled', 'subscription_cancelled',
]

/** A Kiwify usa nomes de campo inconsistentes entre versões do payload — tenta várias chaves. */
function pick(obj: Json | undefined, keys: string[]): unknown {
  if (!obj) return undefined
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k]
  }
  return undefined
}

interface ParsedKiwifyEvent {
  email: string | null
  name: string | null
  kiwifyProductId: string | null
  value: number | null
}

function parseKiwifyPayload(body: Json): ParsedKiwifyEvent {
  const customer = pick(body, ['Customer', 'customer']) as Json | undefined
  const product = pick(body, ['Product', 'product']) as Json | undefined
  const commissions = pick(body, ['Commissions', 'commissions']) as Json | undefined

  const email = (pick(customer, ['email', 'Email']) as string | undefined)?.toLowerCase().trim() ?? null
  const name = (pick(customer, ['full_name', 'name', 'Name']) as string | undefined) ?? null
  const kiwifyProductId = (pick(product, ['product_id', 'id']) as string | undefined) ?? null

  // Valores vêm em centavos, aninhados em Commissions (confirmado com payload real).
  const rawValue = (pick(commissions, ['product_base_price', 'charge_amount', 'settlement_amount']) as number | undefined)
    ?? (pick(body, ['net_amount', 'charge_amount', 'amount']) as number | undefined)
  const value = rawValue != null ? rawValue / 100 : null

  return { email, name, kiwifyProductId, value }
}

async function expandProductIds(admin: AdminClient, product: { id: string; is_pack: boolean }) {
  if (!product.is_pack) return [product.id]
  const { data } = await admin.from('products').select('id')
  return (data ?? []).map((p: { id: string }) => p.id)
}

async function findProductByKiwifyId(admin: AdminClient, kiwifyProductId: string) {
  const { data } = await admin
    .from('products')
    .select('id, title, is_pack')
    .eq('kiwify_product_id', kiwifyProductId)
    .maybeSingle()
  return data
}

async function findProfileByEmail(admin: AdminClient, email: string) {
  const { data } = await admin.from('profiles').select('id').eq('email', email).maybeSingle()
  return data
}

async function handleGrant(admin: AdminClient, parsed: ParsedKiwifyEvent) {
  const { email, name, kiwifyProductId, value } = parsed
  if (!email) throw new Error('Email do cliente não encontrado no payload')
  if (!kiwifyProductId) throw new Error('ID do produto Kiwify não encontrado no payload')

  const product = await findProductByKiwifyId(admin, kiwifyProductId)
  if (!product) throw new Error(`Nenhum produto da área de membros vinculado ao ID Kiwify: ${kiwifyProductId}`)

  const existing = await findProfileByEmail(admin, email)
  let userId: string
  let isNewUser = false
  let inviteLink: string | null = null
  const displayName = name ?? email

  if (existing) {
    userId = existing.id
  } else {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: false,
      user_metadata: { name: displayName },
    })
    if (createError || !created.user) throw createError ?? new Error('Falha ao criar usuário')
    userId = created.user.id
    isNewUser = true

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!
    const { data: linkData } = await admin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: {
        redirectTo: `${appUrl}/auth/callback?next=/criar-senha`,
        data: { name: displayName },
      },
    })
    inviteLink = linkData?.properties?.action_link ?? null
  }

  const productIds = await expandProductIds(admin, product)
  for (const pid of productIds) {
    const { error } = await admin.from('user_products').upsert(
      {
        user_id: userId,
        product_id: pid,
        granted_by: product.is_pack ? 'pack' : 'purchase',
        value,
        billing_type: 'kiwify',
        payment_status: 'confirmed',
      },
      { onConflict: 'user_id,product_id' }
    )
    if (error) throw error
  }

  if (isNewUser && inviteLink) {
    await sendWelcomeEmail({ email, name: displayName, productTitle: product.title, inviteLink })
  } else {
    await sendAccessGrantedEmail({ email, name: displayName, productTitle: product.title })
  }
}

async function handleOverdue(admin: AdminClient, parsed: ParsedKiwifyEvent) {
  const { email, kiwifyProductId } = parsed
  if (!email) throw new Error('Email do cliente não encontrado no payload')
  if (!kiwifyProductId) throw new Error('ID do produto Kiwify não encontrado no payload')

  const profile = await findProfileByEmail(admin, email)
  if (!profile) throw new Error(`Cliente não encontrado: ${email}`)

  const product = await findProductByKiwifyId(admin, kiwifyProductId)
  if (!product) throw new Error(`Nenhum produto da área de membros vinculado ao ID Kiwify: ${kiwifyProductId}`)

  const productIds = await expandProductIds(admin, product)
  await admin
    .from('user_products')
    .update({ payment_status: 'overdue' })
    .eq('user_id', profile.id)
    .in('product_id', productIds)
    .in('granted_by', ['purchase', 'pack'])
}

async function handleRevoke(admin: AdminClient, parsed: ParsedKiwifyEvent) {
  const { email, kiwifyProductId } = parsed
  if (!email) throw new Error('Email do cliente não encontrado no payload')
  if (!kiwifyProductId) throw new Error('ID do produto Kiwify não encontrado no payload')

  const profile = await findProfileByEmail(admin, email)
  if (!profile) throw new Error(`Cliente não encontrado: ${email}`)

  const product = await findProductByKiwifyId(admin, kiwifyProductId)
  if (!product) throw new Error(`Nenhum produto da área de membros vinculado ao ID Kiwify: ${kiwifyProductId}`)

  const productIds = await expandProductIds(admin, product)
  await admin
    .from('user_products')
    .delete()
    .eq('user_id', profile.id)
    .in('product_id', productIds)
    .in('granted_by', ['purchase', 'pack'])
}

export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('signature')
  if (!token || token !== process.env.KIWIFY_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = (await req.json()) as Json
  const admin = createAdminClient()
  const event = pick(payload, ['webhook_event_type', 'event', 'type']) as string | undefined

  if (!event) {
    await admin.from('webhook_logs').insert({
      event_type: 'unknown',
      provider: 'kiwify',
      status: 'failed',
      error_message: 'Evento não identificado no payload (campo webhook_event_type/event/type ausente)',
      payload,
    })
    return NextResponse.json({ received: true })
  }

  try {
    const parsed = parseKiwifyPayload(payload)

    if (GRANT_EVENTS.includes(event)) {
      await handleGrant(admin, parsed)
    } else if (OVERDUE_EVENTS.includes(event)) {
      await handleOverdue(admin, parsed)
    } else if (REVOKE_EVENTS.includes(event)) {
      await handleRevoke(admin, parsed)
    } else {
      await admin.from('webhook_logs').insert({ event_type: event, provider: 'kiwify', status: 'ignored', payload })
      return NextResponse.json({ received: true })
    }

    await admin.from('webhook_logs').insert({ event_type: event, provider: 'kiwify', status: 'processed', payload })
    return NextResponse.json({ received: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    await admin.from('webhook_logs').insert({
      event_type: event,
      provider: 'kiwify',
      status: 'failed',
      error_message: message,
      payload,
    })
    console.error('[webhook/kiwify]', message)
    return NextResponse.json({ received: true })
  }
}
