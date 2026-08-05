import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAsaasCustomer } from '@/lib/asaas'
import { sendWelcomeEmail, sendAccessGrantedEmail } from '@/lib/resend'
import { fireOutboundWebhooks } from '@/lib/fire-webhooks'

type AdminClient = ReturnType<typeof createAdminClient>

const GRANT_EVENTS = ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED']
const OVERDUE_EVENTS = ['PAYMENT_OVERDUE']
const REVOKE_EVENTS = ['PAYMENT_REFUNDED', 'PAYMENT_DELETED', 'PAYMENT_CHARGEBACK_REQUESTED']

async function expandProductIds(admin: AdminClient, product: { id: string; is_pack: boolean }) {
  if (!product.is_pack) return [product.id]
  const { data } = await admin.from('products').select('id')
  return (data ?? []).map((p: { id: string }) => p.id)
}

/** Resolve o profile de um cliente Asaas: primeiro pelo asaas_customer_id salvo, com fallback por e-mail. */
async function resolveProfileId(admin: AdminClient, customerId: string): Promise<string | null> {
  const { data: byCustomerId } = await admin
    .from('profiles')
    .select('id')
    .eq('asaas_customer_id', customerId)
    .maybeSingle()
  if (byCustomerId) return byCustomerId.id

  const customer = await getAsaasCustomer(customerId)
  const { data: byEmail } = await admin
    .from('profiles')
    .select('id')
    .eq('email', customer.email)
    .maybeSingle()
  return byEmail?.id ?? null
}

async function handleGrant(admin: AdminClient, payment: Record<string, unknown>) {
  const customer = await getAsaasCustomer(payment.customer as string)
  const { email, name } = customer

  const productId = (payment.externalReference as string | null) ?? null
  if (!productId) throw new Error('externalReference não definido no pagamento')

  const { data: product, error: productError } = await admin
    .from('products')
    .select('id, title, is_pack')
    .eq('id', productId)
    .single()
  if (productError || !product) throw new Error(`Produto não encontrado: ${productId}`)

  const { data: existing } = await admin
    .from('profiles')
    .select('id, asaas_customer_id')
    .eq('email', email)
    .maybeSingle()

  let userId: string
  let isNewUser = false
  let inviteLink: string | null = null

  if (existing) {
    userId = existing.id
    if (!existing.asaas_customer_id) {
      await admin.from('profiles').update({ asaas_customer_id: customer.id }).eq('id', userId)
    }
  } else {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { name },
    })
    if (createError || !created.user) throw createError ?? new Error('Falha ao criar usuário')
    userId = created.user.id
    isNewUser = true

    await admin.from('profiles').update({ asaas_customer_id: customer.id }).eq('id', userId)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!
    const { data: linkData } = await admin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: {
        redirectTo: `${appUrl}/auth/callback?next=/criar-senha`,
        data: { name },
      },
    })
    inviteLink = linkData?.properties?.action_link ?? null
  }

  const productIds = await expandProductIds(admin, product)

  const billingSnapshot = {
    asaas_payment_id: payment.id as string,
    value: (payment.value as number) ?? null,
    billing_type: (payment.billingType as string) ?? null,
    payment_status: 'confirmed' as const,
    invoice_url: (payment.invoiceUrl as string) ?? null,
  }

  for (const pid of productIds) {
    const { error: upsertError } = await admin.from('user_products').upsert(
      {
        user_id: userId,
        product_id: pid,
        granted_by: product.is_pack ? 'pack' : 'purchase',
        ...billingSnapshot,
      },
      { onConflict: 'user_id,product_id' }
    )
    if (upsertError) throw upsertError
  }

  if (isNewUser && inviteLink) {
    await sendWelcomeEmail({ email, name, productTitle: product.title, inviteLink })
  } else {
    await sendAccessGrantedEmail({ email, name, productTitle: product.title })
  }

  await Promise.all(productIds.map((pid) => Promise.all([
    fireOutboundWebhooks('purchase.approved', { user_id: userId, product_id: pid, email, name, value: billingSnapshot.value, provider: 'asaas' }, pid),
    fireOutboundWebhooks('payment.approved', { user_id: userId, product_id: pid, email, value: billingSnapshot.value, provider: 'asaas' }, pid),
  ])))
}

async function handleOverdue(admin: AdminClient, payment: Record<string, unknown>) {
  const productId = (payment.externalReference as string | null) ?? null
  if (!productId) throw new Error('externalReference não definido no pagamento')

  const userId = await resolveProfileId(admin, payment.customer as string)
  if (!userId) throw new Error(`Cliente não encontrado para o pagamento ${payment.id}`)

  const { data: product, error: productError } = await admin
    .from('products')
    .select('id, is_pack')
    .eq('id', productId)
    .single()
  if (productError || !product) throw new Error(`Produto não encontrado: ${productId}`)

  const productIds = await expandProductIds(admin, product)
  await admin
    .from('user_products')
    .update({ payment_status: 'overdue' })
    .eq('user_id', userId)
    .in('product_id', productIds)
    .in('granted_by', ['purchase', 'pack'])

  await Promise.all(productIds.map((pid) =>
    fireOutboundWebhooks('payment.overdue', { user_id: userId, product_id: pid, provider: 'asaas' }, pid)
  ))
}

async function handleRevoke(admin: AdminClient, payment: Record<string, unknown>) {
  const productId = (payment.externalReference as string | null) ?? null
  if (!productId) throw new Error('externalReference não definido no pagamento')

  const userId = await resolveProfileId(admin, payment.customer as string)
  if (!userId) throw new Error(`Cliente não encontrado para o pagamento ${payment.id}`)

  const { data: product, error: productError } = await admin
    .from('products')
    .select('id, is_pack')
    .eq('id', productId)
    .single()
  if (productError || !product) throw new Error(`Produto não encontrado: ${productId}`)

  const productIds = await expandProductIds(admin, product)

  await admin
    .from('user_products')
    .delete()
    .eq('user_id', userId)
    .in('product_id', productIds)
    .in('granted_by', ['purchase', 'pack'])

  await Promise.all(productIds.map((pid) => Promise.all([
    fireOutboundWebhooks('purchase.refunded', { user_id: userId, product_id: pid, provider: 'asaas' }, pid),
    fireOutboundWebhooks('payment.refunded', { user_id: userId, product_id: pid, provider: 'asaas' }, pid),
  ])))
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('asaas-access-token')
  if (!token || token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await req.json()
  const { event, payment } = payload
  const admin = createAdminClient()

  try {
    if (GRANT_EVENTS.includes(event)) {
      await handleGrant(admin, payment)
    } else if (OVERDUE_EVENTS.includes(event)) {
      await handleOverdue(admin, payment)
    } else if (REVOKE_EVENTS.includes(event)) {
      await handleRevoke(admin, payment)
    } else {
      await admin.from('webhook_logs').insert({
        event_type: event,
        provider: 'asaas',
        asaas_payment_id: payment?.id ?? null,
        status: 'ignored',
        payload,
      })
      return NextResponse.json({ received: true })
    }

    await admin.from('webhook_logs').insert({
      event_type: event,
      provider: 'asaas',
      asaas_payment_id: payment.id,
      status: 'processed',
      payload,
    })

    return NextResponse.json({ received: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    await admin.from('webhook_logs').insert({
      event_type: event,
      provider: 'asaas',
      asaas_payment_id: payment?.id ?? null,
      status: 'failed',
      error_message: message,
      payload,
    })
    console.error('[webhook/asaas]', message)
    return NextResponse.json({ received: true })
  }
}
