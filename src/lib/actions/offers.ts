'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logActivity } from '@/lib/log-activity'

export async function saveOffer(formData: FormData) {
  const adminClient = createAdminClient()
  const id = formData.get('id') as string | null
  const product_id = (formData.get('product_id') as string) || null
  const title = (formData.get('title') as string).trim()
  const description = (formData.get('description') as string).trim() || null
  const original_price = parseFloat(formData.get('original_price') as string) || null
  const promo_price = parseFloat(formData.get('promo_price') as string) || null
  const coupon_code = (formData.get('coupon_code') as string).trim() || null
  const ends_at = (formData.get('ends_at') as string) || null
  const sort_order = parseInt(formData.get('sort_order') as string) || 0
  const is_active = formData.get('is_active') === 'on'

  const payload = { product_id, title, description, original_price, promo_price, coupon_code, ends_at, sort_order, is_active }

  if (id) {
    await adminClient.from('offers').update(payload).eq('id', id)
  } else {
    await adminClient.from('offers').insert(payload)
  }

  await logActivity({ action: id ? 'editar' : 'criar', entity: 'oferta', entityName: title })
  revalidatePath('/admin/ofertas')
  revalidatePath('/dashboard')
  redirect('/admin/ofertas')
}

export async function deleteOffer(id: string) {
  const adminClient = createAdminClient()
  await adminClient.from('offers').delete().eq('id', id)
  await logActivity({ action: 'excluir', entity: 'oferta', entityId: id })
  revalidatePath('/admin/ofertas')
  revalidatePath('/dashboard')
}
