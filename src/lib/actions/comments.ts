'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

export async function deleteComment(lessonId: string, productId: string, commentId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin' || profile?.role === 'equipe'

  // Admin modera qualquer comentário (client de service_role, ignora RLS de
  // propósito). Membro só apaga o próprio — imposto pela RLS, não só pela UI:
  // o botão de excluir já é escondido pra quem não é dono, mas isso não
  // impede uma chamada direta da action com um commentId alheio.
  const client = isAdmin ? createAdminClient() : supabase
  const { data, error } = await client.from('lesson_comments').delete().eq('id', commentId).select('id')
  if (error) return { error: error.message }
  if (!data?.length) return { error: 'Comentário não encontrado ou sem permissão para excluir.' }

  revalidatePath(`/produto/${productId}/aula/${lessonId}`)
  return {}
}
