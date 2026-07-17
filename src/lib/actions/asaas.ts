'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAsaasPaymentLink } from '@/lib/asaas'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logActivity } from '@/lib/log-activity'
import { BillingCycle } from '@/types'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'equipe') redirect('/dashboard')
}

export async function generatePaymentLink(productId: string): Promise<{ url?: string; error?: string }> {
  await requireAdmin()
  const admin = createAdminClient()

  const { data: product, error } = await admin
    .from('products')
    .select('id, title, price, billing_cycle')
    .eq('id', productId)
    .single()
  if (error || !product) return { error: 'Produto não encontrado.' }
  if (!product.price) return { error: 'Defina um preço para o produto antes de gerar o link.' }

  const billingCycle = product.billing_cycle as BillingCycle | null

  try {
    const link = await createAsaasPaymentLink({
      name: product.title,
      value: product.price,
      externalReference: product.id,
      chargeType: billingCycle ? 'RECURRENT' : 'DETACHED',
      subscriptionCycle: billingCycle ?? undefined,
    })

    await admin.from('products').update({ buy_url: link.url, asaas_product_id: link.id }).eq('id', productId)
    await logActivity({ action: 'gerar_link_pagamento', entity: 'produto', entityId: productId, entityName: product.title })
    revalidatePath('/admin/produtos')
    revalidatePath(`/admin/produtos/${productId}`)
    return { url: link.url }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erro ao gerar link no Asaas.' }
  }
}
