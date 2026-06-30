'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPost(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const title = (formData.get('title') as string).trim()
  const body = (formData.get('body') as string).trim()
  if (!title || !body) return

  const { data } = await supabase.from('community_posts').insert({ user_id: user.id, title, body }).select('id').single()
  revalidatePath('/comunidade')
  if (data?.id) redirect(`/comunidade/${data.id}`)
}

export async function deletePost(postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const adminClient = createAdminClient()

  if (profile?.role === 'admin') {
    await adminClient.from('community_posts').delete().eq('id', postId)
  } else {
    await supabase.from('community_posts').delete().eq('id', postId).eq('user_id', user.id)
  }

  revalidatePath('/comunidade')
  redirect('/comunidade')
}

export async function pinPost(postId: string, pinned: boolean) {
  const adminClient = createAdminClient()
  await adminClient.from('community_posts').update({ pinned }).eq('id', postId)
  revalidatePath('/comunidade')
  revalidatePath(`/comunidade/${postId}`)
}

export async function createReply(postId: string, body: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !body.trim()) return

  await supabase.from('community_replies').insert({ post_id: postId, user_id: user.id, body: body.trim() })
  revalidatePath(`/comunidade/${postId}`)
}

export async function deleteReply(replyId: string, postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const adminClient = createAdminClient()

  if (profile?.role === 'admin') {
    await adminClient.from('community_replies').delete().eq('id', replyId)
  } else {
    await supabase.from('community_replies').delete().eq('id', replyId).eq('user_id', user.id)
  }

  revalidatePath(`/comunidade/${postId}`)
}
