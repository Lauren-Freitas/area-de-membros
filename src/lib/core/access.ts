import { createAdminClient } from '@/lib/supabase/admin'
import { logActivity } from '@/lib/log-activity'
import { fireOutboundWebhooks } from '@/lib/fire-webhooks'
import type { Actor } from './actor'

type AdminClient = ReturnType<typeof createAdminClient>

async function loadMemberAndProduct(admin: AdminClient, userId: string, productId: string) {
  const [{ data: member }, { data: product }] = await Promise.all([
    admin.from('profiles').select('id, name, email').eq('id', userId).maybeSingle(),
    admin.from('products').select('id, title').eq('id', productId).maybeSingle(),
  ])
  return { member, product }
}

/** Concessão manual (admin) ou via API — não usado para compras (ver recordPurchaseApproved). */
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
    { onConflict: 'user_id,product_id', ignoreDuplicates: true },
  )
  if (error) return { error: error.message }

  const { member, product } = await loadMemberAndProduct(admin, userId, productId)
  await logActivity({
    action: 'conceder_acesso',
    entity: 'acesso',
    entityId: userId,
    entityName: `${member?.name ?? userId} → ${product?.title ?? productId}`,
    actor,
  })
  await fireOutboundWebhooks('access.granted', { member, product, actor }, productId)
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

  await logActivity({
    action: 'revogar_acesso',
    entity: 'acesso',
    entityId: userId,
    entityName: `${member?.name ?? userId} → ${product?.title ?? productId}`,
    actor,
  })
  await fireOutboundWebhooks('access.revoked', { member, product, actor }, productId)
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
  await logActivity({
    action: 'editar',
    entity: 'validade_acesso',
    entityId: userId,
    entityName: `${member?.name ?? userId} → ${product?.title ?? productId}`,
    actor,
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
  await logActivity({
    action: 'conceder_acesso',
    entity: 'acesso',
    entityId: userId,
    entityName: `${member?.name ?? userId} → ${product?.title ?? productId}`,
    actor,
  })
  const metadata = { value: billing.value, billing_type: billing.billingType, provider: billing.provider }
  await Promise.all([
    fireOutboundWebhooks('purchase.approved', { member, product, actor, metadata }, productId),
    fireOutboundWebhooks('payment.approved', { member, product, actor, metadata }, productId),
  ])
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

  await logActivity({
    action: 'revogar_acesso',
    entity: 'acesso',
    entityId: userId,
    entityName: `${member?.name ?? userId} → ${product?.title ?? productId}`,
    actor,
  })
  const metadata = { provider }
  await Promise.all([
    fireOutboundWebhooks('purchase.refunded', { member, product, actor, metadata }, productId),
    fireOutboundWebhooks('payment.refunded', { member, product, actor, metadata }, productId),
  ])
}
