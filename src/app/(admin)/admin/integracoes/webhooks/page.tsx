import { createAdminClient } from '@/lib/supabase/admin'
import { WebhooksClient } from './WebhooksClient'

export default async function WebhooksPage() {
  const adminClient = createAdminClient()

  const [{ data: webhooks }, { data: products }] = await Promise.all([
    adminClient
      .from('outbound_webhooks')
      .select('id, name, url, product_id, is_active, created_at, last_fired_at, last_status, products(title)')
      .order('created_at', { ascending: false }),
    adminClient
      .from('products')
      .select('id, title')
      .eq('is_active', true)
      .order('sort_order'),
  ])

  const normalized = (webhooks ?? []).map(w => ({
    ...w,
    products: Array.isArray(w.products) ? w.products[0] : w.products,
  }))

  return <WebhooksClient webhooks={normalized} products={products ?? []} />
}
