'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
  const phoneDdi = (formData.get('phone_ddi') as string)?.trim() || ''
  const phoneNumber = (formData.get('phone_number') as string)?.trim() || ''
  const phone = phoneDdi && phoneNumber ? `${phoneDdi}${phoneNumber}` : (phoneNumber || null)
  const bio = (formData.get('bio') as string)?.trim() || null
  const timezone = (formData.get('timezone') as string)?.trim() || 'America/Sao_Paulo'
  const ai_tone = (formData.get('ai_tone') as string)?.trim() || 'empatico'

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

  const update: Record<string, unknown> = { name, phone, bio, timezone, ai_tone }
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

  // Upload de anexos opcionais (múltiplos)
  const attachmentUrls: string[] = []
  const attachmentFiles = formData.getAll('attachment') as File[]
  const filesToUpload = attachmentFiles.filter(f => f && f.size > 0)

  if (filesToUpload.length > 0) {
    try {
      const admin = createAdminClient()
      await admin.storage.createBucket('ticket-files', { public: true }).catch(() => {})
      const timestamp = Date.now()
      await Promise.all(filesToUpload.map(async (file, idx) => {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
        const path = `${user.id}/${timestamp}-${idx}.${ext}`
        const bytes = await file.arrayBuffer()
        const { error } = await admin.storage
          .from('ticket-files')
          .upload(path, bytes, { contentType: file.type })
        if (!error) {
          const { data: { publicUrl } } = admin.storage.from('ticket-files').getPublicUrl(path)
          attachmentUrls.push(publicUrl)
        }
      }))
    } catch {
      // Segue sem os anexos se upload falhar
    }
  }

  const attachmentLines = attachmentUrls.map((url, i) => `📎 Anexo ${i + 1}: ${url}`).join('\n')
  const fullMessage = attachmentLines
    ? `${message}\n\n${attachmentLines}`
    : message

  const { error } = await supabase.from('support_tickets').insert({
    user_id: user.id,
    subject,
    product_id: product_id || null,
    message: fullMessage,
  })

  if (error) return { error: error.message }

  revalidatePath('/atendimento')
  return { success: true }
}
