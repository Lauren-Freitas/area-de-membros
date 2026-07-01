'use server'

import { createClient } from '@/lib/supabase/server'
import { awardXp, checkBadgesAfterRating } from '@/lib/xp'

export async function rateLesson(lessonId: string, productId: string, rating: number) {
  if (rating < 1 || rating > 5) return { error: 'Avaliação inválida' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: existing } = await supabase
    .from('lesson_ratings')
    .select('id')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .maybeSingle()

  const { error } = await supabase
    .from('lesson_ratings')
    .upsert(
      { user_id: user.id, lesson_id: lessonId, product_id: productId, rating, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,lesson_id' }
    )

  if (error) return { error: error.message }

  if (!existing) {
    await Promise.all([
      awardXp(user.id, 'lesson_rating', { lesson_id: lessonId, product_id: productId }),
      checkBadgesAfterRating(user.id),
    ])
  }

  return { success: true }
}
