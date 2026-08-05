import { createAdminClient } from './supabase/admin'

export type WebhookEvent =
  | 'member.created' | 'member.updated' | 'member.deleted' | 'member.enabled' | 'member.disabled'
  | 'access.granted' | 'access.revoked'
  | 'sale.approved' | 'sale.refused' | 'sale.refunded'
  | 'payment.approved' | 'payment.failed' | 'payment.overdue' | 'payment.refunded'
  | 'certificate.issued'
  | 'invite.sent' | 'invite.accepted'
  | 'login.created'

export async function fireOutboundWebhooks(
  event: WebhookEvent,
  payload: Record<string, unknown>,
  productId?: string | null,
) {
  try {
    const admin = createAdminClient()
    const { data: hooks } = await admin
      .from('outbound_webhooks')
      .select('id, url, product_id')
      .eq('is_active', true)

    if (!hooks?.length) return

    const body = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      ...payload,
    })

    await Promise.allSettled(
      hooks
        .filter(h => !h.product_id || h.product_id === productId)
        .map(async (h) => {
          try {
            const res = await fetch(h.url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body,
              signal: AbortSignal.timeout(8000),
            })
            await admin.from('outbound_webhooks').update({
              last_fired_at: new Date().toISOString(),
              last_status: res.status,
            }).eq('id', h.id)
          } catch {
            await admin.from('outbound_webhooks').update({
              last_fired_at: new Date().toISOString(),
              last_status: 0,
            }).eq('id', h.id)
          }
        }),
    )
  } catch {
    // never throw — webhook failures should not break the main flow
  }
}
