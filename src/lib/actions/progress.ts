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

    // Verificar se atingiu 100% e emitir certificado
    await maybeIssueCertificate(supabase, user.id, productId)
  }

  revalidatePath(`/produto/${productId}/aula/${lessonId}`)
  revalidatePath(`/produto/${productId}`)
  revalidatePath('/dashboard')
}

async function maybeIssueCertificate(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  userId: string,
  productId: string
) {
  const { data: modules } = await supabase
    .from('modules')
    .select('id')
    .eq('product_id', productId)

  const moduleIds = modules?.map(m => m.id) ?? []
  if (moduleIds.length === 0) return

  const { data: allLessons } = await supabase
    .from('lessons')
    .select('id')
    .in('module_id', moduleIds)
    .eq('is_published', true)

  const total = allLessons?.length ?? 0
  if (total === 0) return

  const lessonIds = allLessons!.map(l => l.id)
  const { data: done } = await supabase
    .from('lesson_progress')
    .select('lesson_id')
    .eq('user_id', userId)
    .in('lesson_id', lessonIds)

  if ((done?.length ?? 0) >= total) {
    // Emitir certificado apenas se ainda não existe
    const { data: existing } = await supabase
      .from('certificates')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle()

    if (!existing) {
      await supabase.from('certificates').insert({ user_id: userId, product_id: productId })

      // Notificar o membro
      const { data: product } = await supabase
        .from('products')
        .select('title')
        .eq('id', productId)
        .single()

      await supabase.from('notifications').insert({
        user_id: userId,
        title: '🎓 Certificado disponível!',
        body: `Você concluiu "${product?.title}". Seu certificado está pronto para download.`,
        link: '/dashboard',
      })
    }

    revalidatePath('/dashboard')
    revalidatePath(`/produto/${productId}`)
  }
}
