import { createAdminClient } from './supabase/admin'

export const ALL_WEBHOOK_EVENTS = [
  'member.created', 'member.updated', 'member.deleted', 'member.enabled', 'member.disabled',
  'access.granted', 'access.revoked',
  'sale.approved', 'sale.refused', 'sale.refunded',
  'payment.approved', 'payment.failed', 'payment.overdue', 'payment.refunded',
  'certificate.issued',
  'invite.sent', 'invite.accepted',
  'login.created',
] as const

export type WebhookEvent = typeof ALL_WEBHOOK_EVENTS[number]

export async function fireOutboundWebhooks(
  event: WebhookEvent,
  payload: Record<string, unknown>,
  productId?: string | null,
) {
  try {
    const admin = createAdminClient()
    const { data: hooks } = await admin
      .from('outbound_webhooks')
      .select('id, url, product_id, events')
      .eq('is_active', true)

    if (!hooks?.length) return

    const fullPayload = {
      event,
      timestamp: new Date().toISOString(),
      ...payload,
    }
    const body = JSON.stringify(fullPayload)

    await Promise.allSettled(
      hooks
        .filter(h => !h.product_id || h.product_id === productId)
        .filter(h => !h.events?.length || h.events.includes(event))
        .map(async (h) => {
          let status = 0
          let responseBody: string | null = null
          try {
            const res = await fetch(h.url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body,
              signal: AbortSignal.timeout(8000),
            })
            status = res.status
            responseBody = (await res.text()).slice(0, 2000)
          } catch (err) {
            responseBody = err instanceof Error ? err.message : String(err)
          }
          const success = status >= 200 && status < 300
          await Promise.allSettled([
            admin.from('outbound_webhooks').update({
              last_fired_at: new Date().toISOString(),
              last_status: status,
            }).eq('id', h.id),
            admin.from('outbound_webhook_deliveries').insert({
              webhook_id: h.id,
              event,
              payload: fullPayload,
              response_status: status || null,
              response_body: responseBody,
              success,
            }),
          ])
        }),
    )
  } catch {
    // never throw — webhook failures should not break the main flow
  }
}
