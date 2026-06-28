'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  return supabase
}

export type AdminActionState = { error?: string } | undefined

export async function saveProduct(
  prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const supabase = await requireAdmin()

  const id = formData.get('id') as string | null
  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim()
  const content_type = formData.get('content_type') as string
  const content_url = (formData.get('content_url') as string)?.trim() || null
  const banner_url = (formData.get('banner_url') as string)?.trim() || null
  const is_pack = formData.get('is_pack') === 'on'
  const sort_order = parseInt(formData.get('sort_order') as string) || 0
  const is_active = formData.get('is_active') === 'on'

  if (!title) return { error: 'O título é obrigatório.' }
  if (!content_type) return { error: 'O tipo de conteúdo é obrigatório.' }

  const payload = { title, description: description || '', content_type, content_url, banner_url, is_pack, sort_order, is_active }

  const isNew = !id || id === 'novo'
  const { error } = isNew
    ? await supabase.from('products').insert(payload)
    : await supabase.from('products').update(payload).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/produtos')
  revalidatePath('/dashboard')
  redirect('/admin/produtos')
}

export async function toggleProductActive(id: string, isActive: boolean) {
  const supabase = await requireAdmin()
  await supabase.from('products').update({ is_active: isActive }).eq('id', id)
  revalidatePath('/admin/produtos')
  revalidatePath('/dashboard')
}

export async function deleteProduct(id: string) {
  const supabase = await requireAdmin()
  await supabase.from('products').delete().eq('id', id)
  revalidatePath('/admin/produtos')
  revalidatePath('/dashboard')
}

export async function grantAccess(userId: string, productId: string) {
  const supabase = await requireAdmin()
  await supabase.from('user_products').insert({ user_id: userId, product_id: productId, granted_by: 'manual' })
  revalidatePath('/admin/usuarios')
}

export async function revokeAccess(userId: string, productId: string) {
  const supabase = await requireAdmin()
  await supabase.from('user_products').delete().eq('user_id', userId).eq('product_id', productId)
  revalidatePath('/admin/usuarios')
}
