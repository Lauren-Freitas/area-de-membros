'use server'

import { createClient } from '@/lib/supabase/server'

export async function rateLesson(lessonId: string, productId: string, rating: number) {
  if (rating < 1 || rating > 5) return { error: 'Avaliação inválida' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('lesson_ratings')
    .upsert(
      { user_id: user.id, lesson_id: lessonId, product_id: productId, rating, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,lesson_id' }
    )

  if (error) return { error: error.message }
  return { success: true }
}
