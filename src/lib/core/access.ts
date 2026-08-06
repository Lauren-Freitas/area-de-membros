import { createAdminClient } from '@/lib/supabase/admin'
import { fireOutboundWebhooks } from '@/lib/fire-webhooks'
import { emitEvent } from './events'
import type { Actor } from './actor'

type AdminClient = ReturnType<typeof createAdminClient>

async function loadMemberAndProduct(admin: AdminClient, userId: string, productId: string) {
  const [{ data: member }, { data: product }] = await Promise.all([
    admin.from('profiles').select('id, name, email').eq('id', userId).maybeSingle(),
    admin.from('products').select('id, title').eq('id', productId).maybeSingle(),
  ])
  return { member, product }
}

/**
 * Concessão manual (admin) ou via API — não usado para compras (ver
 * recordPurchaseApproved). Upsert real (não `ignoreDuplicates`): chamar de
 * novo com o mesmo par user_id/product_id atualiza granted_by/expires_at em
 * vez de ser ignorado — uma segunda chamada idêntica é inofensiva (mesmo
 * resultado), e uma chamada com expires_at diferente aplica a mudança em vez
 * de silenciosamente não fazer nada (era esse o bug: repetir a chamada com
 * validade diferente não tinha efeito nenhum).
 */
export async function grantAccess(
  userId: string,
  productId: string,
  actor: Actor,
  opts: { expiresAt?: string | null } = {},
): Promise<{ success?: boolean; error?: string }> {
  const admin = createAdminClient()
  const grantedBy = actor.type === 'api' ? 'api' : 'manual'

  const { error } = await admin.from('user_products').upsert(
    { user_id: userId, product_id: productId, granted_by: grantedBy, expires_at: opts.expiresAt ?? null },
    { onConflict: 'user_id,product_id' },
  )
  if (error) return { error: error.message }

  const { member, product } = await loadMemberAndProduct(admin, userId, productId)
  await emitEvent({
    event: 'access.granted',
    actor, member, product,
    metadata: { expires_at: opts.expiresAt ?? null },
    activity: { action: 'conceder_acesso', entity: 'acesso', entityId: userId, entityName: `${member?.name ?? userId} → ${product?.title ?? productId}` },
  })
  return { success: true }
}

export async function revokeAccess(
  userId: string,
  productId: string,
  actor: Actor,
): Promise<{ success?: boolean; error?: string }> {
  const admin = createAdminClient()
  const { member, product } = await loadMemberAndProduct(admin, userId, productId)

  const { error } = await admin.from('user_products').delete().eq('user_id', userId).eq('product_id', productId)
  if (error) return { error: error.message }

  await emitEvent({
    event: 'access.revoked',
    actor, member, product,
    activity: { action: 'revogar_acesso', entity: 'acesso', entityId: userId, entityName: `${member?.name ?? userId} → ${product?.title ?? productId}` },
  })
  return { success: true }
}

export async function updateAccessExpiry(
  userId: string,
  productId: string,
  expiresAt: string | null,
  actor: Actor,
): Promise<{ success?: boolean; error?: string }> {
  const admin = createAdminClient()
  const { error } = await admin.from('user_products').update({ expires_at: expiresAt }).eq('user_id', userId).eq('product_id', productId)
  if (error) return { error: error.message }

  const { member, product } = await loadMemberAndProduct(admin, userId, productId)
  await emitEvent({
    event: 'access.updated',
    actor, member, product,
    metadata: { expires_at: expiresAt },
    activity: { action: 'editar', entity: 'validade_acesso', entityId: userId, entityName: `${member?.name ?? userId} → ${product?.title ?? productId}` },
  })
  return { success: true }
}

interface BillingSnapshot {
  provider: 'asaas' | 'kiwify'
  grantedBy: 'purchase' | 'pack'
  value: number | null
  billingType: string | null
  invoiceUrl?: string | null
  asaasPaymentId?: string | null
}

/** Upsert de acesso originado por pagamento confirmado (Kiwify/Asaas) — dispara purchase.approved + payment.approved. */
export async function recordPurchaseApproved(
  userId: string,
  productId: string,
  actor: Actor,
  billing: BillingSnapshot,
): Promise<void> {
  const admin = createAdminClient()
  await admin.from('user_products').upsert(
    {
      user_id: userId,
      product_id: productId,
      granted_by: billing.grantedBy,
      value: billing.value,
      billing_type: billing.billingType,
      payment_status: 'confirmed',
      invoice_url: billing.invoiceUrl ?? null,
      asaas_payment_id: billing.asaasPaymentId ?? null,
    },
    { onConflict: 'user_id,product_id' },
  )

  const { member, product } = await loadMemberAndProduct(admin, userId, productId)
  const metadata = { value: billing.value, billing_type: billing.billingType, provider: billing.provider }
  await emitEvent({
    event: 'purchase.approved',
    actor, member, product, metadata,
    activity: { action: 'conceder_acesso', entity: 'acesso', entityId: userId, entityName: `${member?.name ?? userId} → ${product?.title ?? productId}` },
  })
  await fireOutboundWebhooks('payment.approved', { member, product, actor, metadata }, productId)
}

/** Marca acesso comprado como em atraso (Kiwify/Asaas) — não revoga, só sinaliza. */
export async function recordPaymentOverdue(userId: string, productId: string, actor: Actor, provider: 'asaas' | 'kiwify'): Promise<void> {
  const admin = createAdminClient()
  await admin
    .from('user_products')
    .update({ payment_status: 'overdue' })
    .eq('user_id', userId)
    .eq('product_id', productId)
    .in('granted_by', ['purchase', 'pack'])

  const { member, product } = await loadMemberAndProduct(admin, userId, productId)
  await fireOutboundWebhooks('payment.overdue', { member, product, actor, metadata: { provider } }, productId)
}

/** Revoga acesso comprado por reembolso/estorno/chargeback (Kiwify/Asaas) — dispara purchase.refunded + payment.refunded. */
export async function recordPurchaseRefunded(userId: string, productId: string, actor: Actor, provider: 'asaas' | 'kiwify'): Promise<void> {
  const admin = createAdminClient()
  const { member, product } = await loadMemberAndProduct(admin, userId, productId)

  await admin
    .from('user_products')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId)
    .in('granted_by', ['purchase', 'pack'])

  const metadata = { provider }
  await emitEvent({
    event: 'purchase.refunded',
    actor, member, product, metadata,
    activity: { action: 'revogar_acesso', entity: 'acesso', entityId: userId, entityName: `${member?.name ?? userId} → ${product?.title ?? productId}` },
  })
  await fireOutboundWebhooks('payment.refunded', { member, product, actor, metadata }, productId)
}
