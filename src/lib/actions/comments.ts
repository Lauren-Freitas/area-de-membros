'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { awardXp, checkBadgesAfterComment } from '@/lib/xp'

export async function postComment(lessonId: string, productId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !content.trim()) return

  await supabase.from('lesson_comments').insert({
    lesson_id: lessonId,
    user_id: user.id,
    content: content.trim().slice(0, 1000),
  })

  await Promise.all([
    awardXp(user.id, 'lesson_comment', { lesson_id: lessonId, product_id: productId }),
    checkBadgesAfterComment(user.id),
  ])

  revalidatePath(`/produto/${productId}/aula/${lessonId}`)
}

export async function deleteComment(commentId: string, lessonId: string, productId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('lesson_comments').delete().eq('id', commentId)

  revalidatePath(`/produto/${productId}/aula/${lessonId}`)
}
