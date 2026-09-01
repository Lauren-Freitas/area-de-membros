'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { awardXp, checkBadgesAfterLesson } from '@/lib/xp'
import { fireOutboundWebhooks } from '@/lib/fire-webhooks'
import { getWebhookActor } from '@/lib/core/actor'

const SYSTEM_ACTOR = getWebhookActor('Sistema')

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

    await Promise.all([
      awardXp(user.id, 'lesson_complete', { lesson_id: lessonId, product_id: productId }),
      checkBadgesAfterLesson(user.id),
      maybeIssueCertificate(supabase, user.id, productId),
      fireOutboundWebhooks('lesson.completed', {
        member: { id: user.id },
        product: { id: productId },
        actor: SYSTEM_ACTOR,
        metadata: { lesson_id: lessonId },
      }, productId),
    ])
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
      const { data: certificate } = await supabase
        .from('certificates')
        .insert({ user_id: userId, product_id: productId })
        .select('id')
        .single()

      // Notificar o membro
      const { data: product } = await supabase
        .from('products')
        .select('title')
        .eq('id', productId)
        .single()

      if (certificate) {
        // Notificação é um evento de sistema sobre o próprio usuário -- o client
        // autenticado do membro não tem permissão de INSERT em notifications (só
        // UPDATE em linha própria, usado em markAllRead/markOneRead). Mesmo padrão
        // já validado em community.ts e api/v1/certificates/route.ts.
        const admin = createAdminClient()
        const { error: notifError } = await admin.from('notifications').insert({
          user_id: userId,
          title: '🎓 Certificado disponível!',
          body: `Você concluiu "${product?.title}". Seu certificado está pronto para download.`,
          link: `/certificado/${certificate.id}`,
        })
        // Notificação é um "nice to have" pós-emissão -- o certificado já foi
        // criado e continua válido mesmo se isto falhar. Só registra pra não
        // repetir o silêncio que esse bug já causou.
        if (notifError) console.error('Falha ao criar notificação de certificado:', notifError)
      }

      await fireOutboundWebhooks('certificate.generated', {
        member: { id: userId },
        product: { id: productId, title: product?.title },
        actor: SYSTEM_ACTOR,
      }, productId)
    }

    revalidatePath('/dashboard')
    revalidatePath(`/produto/${productId}`)
  }
}
