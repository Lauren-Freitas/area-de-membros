'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function saveCohort(formData: FormData) {
  const adminClient = createAdminClient()
  const id = formData.get('id') as string | null
  const name = (formData.get('name') as string).trim()
  const description = (formData.get('description') as string).trim() || null
  const product_id = (formData.get('product_id') as string) || null
  const starts_at = (formData.get('starts_at') as string) || null
  const ends_at = (formData.get('ends_at') as string) || null

  if (id) {
    await adminClient.from('cohorts').update({ name, description, product_id, starts_at, ends_at }).eq('id', id)
  } else {
    await adminClient.from('cohorts').insert({ name, description, product_id, starts_at, ends_at })
  }

  revalidatePath('/admin/turmas')
  redirect('/admin/turmas')
}

export async function deleteCohort(id: string) {
  const adminClient = createAdminClient()
  await adminClient.from('cohorts').delete().eq('id', id)
  revalidatePath('/admin/turmas')
}

export async function addCohortMember(cohortId: string, userId: string) {
  const adminClient = createAdminClient()
  await adminClient.from('cohort_members').upsert(
    { cohort_id: cohortId, user_id: userId },
    { onConflict: 'cohort_id,user_id' }
  )
  revalidatePath(`/admin/turmas/${cohortId}`)
}

export async function removeCohortMember(cohortId: string, userId: string) {
  const adminClient = createAdminClient()
  await adminClient.from('cohort_members').delete()
    .eq('cohort_id', cohortId).eq('user_id', userId)
  revalidatePath(`/admin/turmas/${cohortId}`)
}
