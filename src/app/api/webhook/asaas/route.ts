import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAsaasCustomer } from '@/lib/asaas'
import { sendWelcomeEmail, sendAccessGrantedEmail } from '@/lib/resend'

export async function POST(req: NextRequest) {
  const token = req.headers.get('asaas-access-token')
  if (!token || token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await req.json()
  const { event, payment } = payload
  const admin = createAdminClient()

  if (event !== 'PAYMENT_CONFIRMED') {
    await admin.from('webhook_logs').insert({
      event_type: event,
      asaas_payment_id: payment?.id ?? null,
      status: 'ignored',
      payload,
    })
    return NextResponse.json({ received: true })
  }

  try {
    const customer = await getAsaasCustomer(payment.customer)
    const { email, name } = customer

    const productId: string | null = payment.externalReference ?? null
    if (!productId) throw new Error('externalReference não definido no pagamento')

    const { data: product, error: productError } = await admin
      .from('products')
      .select('id, title, is_pack')
      .eq('id', productId)
      .single()
    if (productError || !product) throw new Error(`Produto não encontrado: ${productId}`)

    const { data: existing } = await admin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

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
      if (createError || !created.user) throw createError ?? new Error('Falha ao criar usuário')
      userId = created.user.id
      isNewUser = true

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

    const productIds: string[] = product.is_pack
      ? await admin
          .from('products')
          .select('id')
          .then(({ data }) => (data ?? []).map((p: { id: string }) => p.id))
      : [product.id]

    for (const pid of productIds) {
      const { error: insertError } = await admin.from('user_products').insert({
        user_id: userId,
        product_id: pid,
        granted_by: product.is_pack ? 'pack' : 'purchase',
        asaas_payment_id: payment.id,
      })
      if (insertError && insertError.code !== '23505') throw insertError
    }

    if (isNewUser && inviteLink) {
      await sendWelcomeEmail({ email, name, productTitle: product.title, inviteLink })
    } else {
      await sendAccessGrantedEmail({ email, name, productTitle: product.title })
    }

    await admin.from('webhook_logs').insert({
      event_type: event,
      asaas_payment_id: payment.id,
      status: 'processed',
      payload,
    })

    return NextResponse.json({ received: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    await admin.from('webhook_logs').insert({
      event_type: event,
      asaas_payment_id: payment?.id ?? null,
      status: 'failed',
      error_message: message,
      payload,
    })
    console.error('[webhook/asaas]', message)
    return NextResponse.json({ received: true })
  }
}
