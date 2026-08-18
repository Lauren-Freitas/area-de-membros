import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWelcomeEmail, sendAccessGrantedEmail } from '@/lib/resend'
import { getWebhookActor } from '@/lib/core/actor'
import { recordPurchaseApproved, recordPaymentOverdue, recordPurchaseRefunded } from '@/lib/core/access'

const ACTOR = getWebhookActor('Kiwify')

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

/**
 * Erros do Supabase (Postgrest/Auth) nem sempre são instância de Error, e Error
 * "de verdade" também não serializa em JSON.stringify normal (message/stack não
 * são enumeráveis) — por isso lista as próprias propriedades explicitamente.
 */
function errorMessage(err: unknown): string {
  if (!err || typeof err !== 'object') return String(err)
  try {
    const props = Object.getOwnPropertyNames(err)
    const dump = JSON.stringify(err, props)
    if (dump && dump !== '{}') return dump
  } catch {
    /* ignore */
  }
  return String(err)
}

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
      email_confirm: true,
      user_metadata: { name: displayName },
    })
    if (createError || !created.user) throw createError ?? new Error('Falha ao criar usuário')
    userId = created.user.id
    isNewUser = true

    // type 'invite' só é válido pra provisionar um usuário que ainda não existe
    // (cria + convida num passo só). Como o usuário já foi criado por createUser
    // acima, o tipo certo pra gerar o link de "criar senha" é 'recovery' — com
    // 'invite' aqui, o Supabase sempre rejeita com 422 email_exists.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${appUrl}/auth/callback?next=/criar-senha`,
      },
    })
    if (linkError) console.error('[webhook/kiwify] falha ao gerar link de convite:', linkError.message)
    inviteLink = linkData?.properties?.action_link ?? null
  }

  const productIds = await expandProductIds(admin, product)

  if (isNewUser && inviteLink) {
    await sendWelcomeEmail({ email, name: displayName, productTitle: product.title, inviteLink })
  } else {
    await sendAccessGrantedEmail({ email, name: displayName, productTitle: product.title })
  }

  await Promise.all(productIds.map((pid) => recordPurchaseApproved(userId, pid, ACTOR, {
    provider: 'kiwify',
    grantedBy: product.is_pack ? 'pack' : 'purchase',
    value,
    billingType: 'kiwify',
  })))
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
  await Promise.all(productIds.map((pid) => recordPaymentOverdue(profile.id, pid, ACTOR, 'kiwify')))
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
  await Promise.all(productIds.map((pid) => recordPurchaseRefunded(profile.id, pid, ACTOR, 'kiwify')))
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
    const message = errorMessage(err)
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
