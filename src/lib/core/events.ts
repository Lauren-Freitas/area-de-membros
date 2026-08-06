import { logActivity } from '@/lib/log-activity'
import { fireOutboundWebhooks, type WebhookEvent, type WebhookMember, type WebhookProduct } from '@/lib/fire-webhooks'
import type { Actor } from './actor'

interface EmitEventInput {
  event: WebhookEvent
  actor: Actor
  member?: WebhookMember | null
  product?: WebhookProduct | null
  metadata?: Record<string, unknown>
  /** Trilha em português pro histórico interno — a nomenclatura de activity_logs é
   * independente da nomenclatura pública do evento (ex: um `invite.sent` pode
   * significar "convite criado" ou "acesso reenviado", contextos diferentes). */
  activity: { action: string; entity: string; entityId?: string | null; entityName?: string | null }
  /** Produto usado pro filtro de webhook, se diferente de `product.id` (ex: evento sem produto específico). */
  filterProductId?: string | null
}

/**
 * Todo efeito colateral de uma ação de negócio nasce aqui — a ação muda o
 * banco, depois emite UM evento que vira, ao mesmo tempo, uma linha de
 * activity_logs (auditoria interna) e um disparo de webhook (quem está do
 * lado de fora). Antes desta função, cada lugar que fazia isso chamava
 * `logActivity` e `fireOutboundWebhooks` separadamente, com parâmetros e
 * vocabulário ligeiramente diferentes — dois pontos de verdade pra uma coisa
 * só. Preparado pro dia em que outros consumidores internos (Córtex: agenda,
 * financeiro, BI) também precisarem reagir ao mesmo evento.
 */
export async function emitEvent(input: EmitEventInput): Promise<void> {
  await logActivity({
    action: input.activity.action,
    entity: input.activity.entity,
    entityId: input.activity.entityId,
    entityName: input.activity.entityName,
    actor: input.actor,
  })
  await fireOutboundWebhooks(
    input.event,
    { member: input.member, product: input.product, actor: input.actor, metadata: input.metadata },
    input.filterProductId ?? input.product?.id ?? null,
  )
}
