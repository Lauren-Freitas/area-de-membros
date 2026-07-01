'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type MemberActionState = { error?: string; success?: boolean } | undefined

export async function updateMemberProfile(
  prevState: MemberActionState,
  formData: FormData
): Promise<MemberActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const name = (formData.get('name') as string)?.trim()
  const phone = (formData.get('phone') as string)?.trim() || null
  const bio = (formData.get('bio') as string)?.trim() || null
  const timezone = (formData.get('timezone') as string)?.trim() || 'America/Sao_Paulo'

  if (!name) return { error: 'O nome é obrigatório.' }

  let avatar_url: string | undefined

  const avatarFile = formData.get('avatar') as File | null
  if (avatarFile && avatarFile.size > 0) {
    const ext = avatarFile.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${user.id}/avatar.${ext}`
    const bytes = await avatarFile.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, bytes, { contentType: avatarFile.type, upsert: true })

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      avatar_url = publicUrl
    }
  }

  const update: Record<string, unknown> = { name, phone, bio, timezone }
  if (avatar_url !== undefined) update.avatar_url = avatar_url

  const { error } = await supabase.from('profiles').update(update).eq('id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/conta')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateMemberPassword(
  prevState: MemberActionState,
  formData: FormData
): Promise<MemberActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const currentPassword = formData.get('current_password') as string
  const newPassword = formData.get('new_password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: 'Preencha todos os campos.' }
  }
  if (newPassword !== confirmPassword) {
    return { error: 'As novas senhas não coincidem.' }
  }
  if (newPassword.length < 8) {
    return { error: 'A nova senha deve ter pelo menos 8 caracteres.' }
  }

  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  })
  if (authError) return { error: 'Senha atual incorreta.' }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
  if (updateError) return { error: updateError.message }

  return { success: true }
}

export async function submitTicket(
  prevState: MemberActionState,
  formData: FormData
): Promise<MemberActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const subject = (formData.get('subject') as string)?.trim() || null
  const product_id = (formData.get('product_id') as string)?.trim() || null
  const message = (formData.get('message') as string)?.trim()

  if (!message) return { error: 'A mensagem é obrigatória.' }

  const { error } = await supabase.from('support_tickets').insert({
    user_id: user.id,
    subject,
    product_id: product_id || null,
    message,
  })

  if (error) return { error: error.message }

  revalidatePath('/atendimento')
  return { success: true }
}
