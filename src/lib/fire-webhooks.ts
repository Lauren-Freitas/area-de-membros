import { createAdminClient } from './supabase/admin'
import type { Actor } from './core/actor'

export const ALL_WEBHOOK_EVENTS = [
  'member.created', 'member.updated', 'member.deleted', 'member.activated', 'member.deactivated',
  'access.granted', 'access.revoked',
  'product.created', 'product.updated', 'product.deleted',
  'purchase.approved', 'purchase.refunded',
  'payment.approved', 'payment.failed', 'payment.overdue', 'payment.refunded',
  'certificate.generated',
  'lesson.completed',
  'invite.sent', 'invite.accepted',
  'login.created', 'password.reset',
] as const

export type WebhookEvent = typeof ALL_WEBHOOK_EVENTS[number]

export interface WebhookMember {
  id: string
  name?: string | null
  email?: string | null
}

export interface WebhookProduct {
  id: string
  title?: string | null
}

export interface WebhookPayloadInput {
  member?: WebhookMember | null
  product?: WebhookProduct | null
  actor: Actor
  metadata?: Record<string, unknown>
}

/**
 * Dispara um evento pra todos os webhooks de saída inscritos nele. Payload
 * sempre no mesmo formato, não importa quem chamou — isso é o que faz o
 * mesmo evento significar a mesma coisa pra quem consome (n8n/Make/Zapier),
 * em vez de variar campo a campo dependendo se veio da UI, da API ou de um
 * webhook de entrada.
 */
export async function fireOutboundWebhooks(
  event: WebhookEvent,
  input: WebhookPayloadInput,
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
      member: input.member ? { id: input.member.id, name: input.member.name ?? null, email: input.member.email ?? null } : null,
      product: input.product ? { id: input.product.id, title: input.product.title ?? null } : null,
      actor: { type: input.actor.type, label: input.actor.label },
      metadata: input.metadata ?? {},
    }
    const body = JSON.stringify(fullPayload)
    const resolvedProductId = productId ?? input.product?.id ?? null

    await Promise.allSettled(
      hooks
        .filter(h => !h.product_id || h.product_id === resolvedProductId)
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
