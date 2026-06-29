'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleLessonComplete(lessonId: string, productId: string, completed: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  if (completed) {
    await supabase.from('lesson_progress').delete()
      .eq('user_id', user.id).eq('lesson_id', lessonId)
  } else {
    await supabase.from('lesson_progress').upsert(
      { user_id: user.id, lesson_id: lessonId, completed: true },
      { onConflict: 'user_id,lesson_id' }
    )
  }

  revalidatePath(`/produto/${productId}/aula/${lessonId}`)
  revalidatePath(`/produto/${productId}`)
  revalidatePath('/dashboard')
}
