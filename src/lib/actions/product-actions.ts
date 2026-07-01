'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markProductComplete(productId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  await supabase
    .from('user_products')
    .update({ is_completed: true, completed_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('product_id', productId)

  revalidatePath(`/produto/${productId}`)
}

export async function unmarkProductComplete(productId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  await supabase
    .from('user_products')
    .update({ is_completed: false, completed_at: null })
    .eq('user_id', user.id)
    .eq('product_id', productId)

  revalidatePath(`/produto/${productId}`)
}

export async function rateProduct(productId: string, rating: number) {
  if (rating < 1 || rating > 5) return { error: 'Avaliação inválida' }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  await supabase
    .from('product_ratings')
    .upsert(
      { user_id: user.id, product_id: productId, rating, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,product_id' }
    )
}

export async function addProductComment(productId: string, content: string) {
  if (!content.trim()) return { error: 'Comentário vazio' }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('product_comments')
    .insert({ user_id: user.id, product_id: productId, content: content.trim() })

  if (error) return { error: error.message }
  revalidatePath(`/produto/${productId}`)
  return { success: true }
}

export async function deleteProductComment(commentId: string, productId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  await supabase
    .from('product_comments')
    .delete()
    .eq('id', commentId)
    .or(isAdmin ? 'id.neq.null' : `user_id.eq.${user.id}`)

  revalidatePath(`/produto/${productId}`)
}
