'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sendWelcomeEmail, sendAccessGrantedEmail } from '@/lib/resend'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'equipe') redirect('/dashboard')

  return supabase
}

export type AdminActionState = { error?: string; success?: boolean } | undefined

// ─── Produtos ───────────────────────────────────────────────────────────────

export async function saveProduct(
  prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const supabase = await requireAdmin()

  const id = formData.get('id') as string | null
  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim()
  const banner_url = (formData.get('banner_url') as string)?.trim() || null
  const is_pack = formData.get('is_pack') === 'on'
  const sort_order = parseInt(formData.get('sort_order') as string) || 0
  const is_active = formData.get('is_active') === 'on'

  if (!title) return { error: 'O título é obrigatório.' }

  const buy_url = (formData.get('buy_url') as string)?.trim() || null
  const payload = { title, description: description || '', banner_url, buy_url, is_pack, sort_order, is_active }

  const isNew = !id || id === 'novo'
  const { error } = isNew
    ? await supabase.from('products').insert(payload)
    : await supabase.from('products').update(payload).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/produtos')
  revalidatePath('/dashboard')
  redirect('/admin/produtos')
}

export async function toggleProductActive(id: string, isActive: boolean) {
  const supabase = await requireAdmin()
  await supabase.from('products').update({ is_active: isActive }).eq('id', id)
  revalidatePath('/admin/produtos')
  revalidatePath('/dashboard')
}

export async function deleteProduct(id: string) {
  const supabase = await requireAdmin()
  await supabase.from('products').delete().eq('id', id)
  revalidatePath('/admin/produtos')
  revalidatePath('/dashboard')
}

// ─── Usuários ────────────────────────────────────────────────────────────────

export async function createUser(
  prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin()
  const admin = createAdminClient()

  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const role = ((formData.get('role') as string) || 'membro') as 'admin' | 'equipe' | 'membro'
  const productIds = formData.getAll('products') as string[]

  if (!name) return { error: 'O nome é obrigatório.' }
  if (!email) return { error: 'O email é obrigatório.' }

  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  let userId: string
  let isNewUser = false
  let inviteLink: string | null = null

  if (existing) {
    userId = existing.id
  } else {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: false,
      user_metadata: { name },
    })
    if (createError || !created.user) return { error: createError?.message ?? 'Erro ao criar usuário.' }
    userId = created.user.id
    isNewUser = true

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!
    const { data: linkData } = await admin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: {
        redirectTo: `${appUrl}/auth/callback?next=/criar-senha`,
        data: { name },
      },
    })
    inviteLink = linkData?.properties?.action_link ?? null
  }

  if (productIds.length > 0) {
    const rows = productIds.map((productId) => ({
      user_id: userId,
      product_id: productId,
      granted_by: 'manual' as const,
    }))
    await admin.from('user_products').upsert(rows, { onConflict: 'user_id,product_id', ignoreDuplicates: true })
  }

  const productTitle = productIds.length === 1
    ? (await admin.from('products').select('title').eq('id', productIds[0]).single()).data?.title ?? 'Área de Membros'
    : productIds.length > 1 ? 'seus produtos' : 'Área de Membros'

  const is_active = formData.get('is_active') === 'on'

  if (role !== 'membro' || !is_active) {
    const profileUpdate: Record<string, unknown> = {}
    if (role !== 'membro') profileUpdate.role = role
    if (!is_active) profileUpdate.is_active = false

    const { error: roleError } = await admin.from('profiles').update(profileUpdate).eq('id', userId)
    if (roleError) return { error: `Erro ao configurar o perfil: ${roleError.message}` }
  }

  if (isNewUser && inviteLink) {
    await sendWelcomeEmail({ email, name, productTitle, inviteLink }).catch(() => null)
  } else if (productIds.length > 0) {
    await sendAccessGrantedEmail({ email, name, productTitle }).catch(() => null)
  }

  revalidatePath('/admin/usuarios')
  revalidatePath('/admin/configuracoes')
  if (role === 'admin' || role === 'equipe') redirect('/admin/configuracoes')
  redirect('/admin/usuarios')
}

export async function deleteUser(userId: string): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }
  revalidatePath('/admin/usuarios')
  revalidatePath('/admin/configuracoes')
  return { success: true }
}

export async function resendAdminInvite(userId: string, email: string, name: string): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()
  const admin = createAdminClient()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const { data: linkData, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo: `${appUrl}/auth/callback?next=/criar-senha`,
    },
  })

  if (error) return { error: error.message }
  const inviteLink = linkData?.properties?.action_link
  if (!inviteLink) return { error: 'Não foi possível gerar o link de convite.' }

  await sendWelcomeEmail({ email, name, productTitle: 'Painel Admin', inviteLink }).catch(() => null)
  return { success: true }
}

export async function updateUser(
  userId: string,
  prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin()
  const admin = createAdminClient()

  const name = (formData.get('name') as string)?.trim()
  const role = (formData.get('role') as string) as 'admin' | 'equipe' | 'membro'
  const is_active = formData.get('is_active') === 'on'

  if (!name) return { error: 'O nome é obrigatório.' }

  const { error } = await admin
    .from('profiles')
    .update({ name, role, is_active })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/admin/usuarios')
  revalidatePath(`/admin/usuarios/${userId}`)
  return { success: true }
}

// ─── Módulos ─────────────────────────────────────────────────────────────────

export async function saveModule(
  prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const supabase = await requireAdmin()
  const id = formData.get('id') as string | null
  const product_id = formData.get('product_id') as string
  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const sort_order = parseInt(formData.get('sort_order') as string) || 0
  const release_type = (formData.get('release_type') as string) || 'immediate'
  const release_after_days = release_type === 'days_after'
    ? parseInt(formData.get('release_after_days') as string) || 7
    : null
  const release_at = release_type === 'date'
    ? (formData.get('release_at') as string) || null
    : null

  if (!title) return { error: 'O título é obrigatório.' }

  const payload = { title, description, sort_order, release_type, release_after_days, release_at }

  const isNew = !id
  const { error } = isNew
    ? await supabase.from('modules').insert({ product_id, ...payload })
    : await supabase.from('modules').update(payload).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath(`/admin/produtos/${product_id}`)
  redirect(`/admin/produtos/${product_id}`)
}

export async function deleteModule(moduleId: string, productId: string) {
  const supabase = await requireAdmin()
  await supabase.from('modules').delete().eq('id', moduleId)
  revalidatePath(`/admin/produtos/${productId}`)
}

// ─── Aulas ───────────────────────────────────────────────────────────────────

export async function saveLesson(
  prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const supabase = await requireAdmin()
  const id = formData.get('id') as string | null
  const module_id = formData.get('module_id') as string
  const product_id = formData.get('product_id') as string
  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const lesson_type = formData.get('lesson_type') as string
  const content_url = (formData.get('content_url') as string)?.trim() || null
  const content_text = (formData.get('content_text') as string)?.trim() || null
  const sort_order = parseInt(formData.get('sort_order') as string) || 0
  const is_published = formData.get('is_published') === 'on'

  if (!title) return { error: 'O título é obrigatório.' }
  if (!lesson_type) return { error: 'O tipo é obrigatório.' }

  const payload = { module_id, title, description, lesson_type, content_url, content_text, sort_order, is_published }
  const isNew = !id
  const { error } = isNew
    ? await supabase.from('lessons').insert(payload)
    : await supabase.from('lessons').update(payload).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath(`/admin/produtos/${product_id}/modulos/${module_id}`)
  redirect(`/admin/produtos/${product_id}/modulos/${module_id}`)
}

export async function deleteLesson(lessonId: string, moduleId: string, productId: string) {
  const supabase = await requireAdmin()
  await supabase.from('lessons').delete().eq('id', lessonId)
  revalidatePath(`/admin/produtos/${productId}/modulos/${moduleId}`)
}

// ─── Perfil ──────────────────────────────────────────────────────────────────

export async function updateProfile(
  prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const supabase = await requireAdmin()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()

  if (!name) return { error: 'O nome é obrigatório.' }
  if (!email) return { error: 'O email é obrigatório.' }

  const admin = createAdminClient()

  if (email !== user.email) {
    const { error: authError } = await admin.auth.admin.updateUserById(user.id, { email })
    if (authError) return { error: authError.message }
  }

  let avatar_url: string | null | undefined
  const removeAvatar = formData.get('remove_avatar') === 'true'
  const avatarFile = formData.get('avatar') as File | null
  if (removeAvatar) {
    avatar_url = null
  } else if (avatarFile && avatarFile.size > 0) {
    const ext = avatarFile.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${user.id}/avatar.${ext}`
    const bytes = await avatarFile.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, bytes, { contentType: avatarFile.type, upsert: true })
    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      avatar_url = `${publicUrl}?v=${Date.now()}`
    }
  }

  const update: Record<string, unknown> = { name, email }
  if (avatar_url !== undefined) update.avatar_url = avatar_url

  const { error: profileError } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', user.id)

  if (profileError) return { error: profileError.message }

  revalidatePath('/admin/configuracoes')
  return { success: true }
}

export async function updateAdminPassword(
  prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const supabase = await requireAdmin()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const currentPassword = formData.get('current_password') as string
  const newPassword = formData.get('new_password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (!currentPassword || !newPassword || !confirmPassword) return { error: 'Preencha todos os campos.' }
  if (newPassword !== confirmPassword) return { error: 'As novas senhas não coincidem.' }
  if (newPassword.length < 8) return { error: 'A nova senha deve ter pelo menos 8 caracteres.' }

  const { error: authError } = await supabase.auth.signInWithPassword({ email: user.email!, password: currentPassword })
  if (authError) return { error: 'Senha atual incorreta.' }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
  if (updateError) return { error: updateError.message }

  return { success: true }
}

// ─── Banners ─────────────────────────────────────────────────────────────────

export async function saveBanner(
  prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin()
  const admin = createAdminClient()

  const id = formData.get('id') as string | null
  const title = (formData.get('title') as string)?.trim()
  const body = (formData.get('body') as string)?.trim() || null
  const link = (formData.get('link') as string)?.trim() || null
  const link_label = (formData.get('link_label') as string)?.trim() || null
  const type = (formData.get('type') as string) || 'info'
  const is_active = formData.get('is_active') === 'on'
  const expires_at = (formData.get('expires_at') as string)?.trim() || null
  const sort_order = parseInt(formData.get('sort_order') as string) || 0

  if (!title) return { error: 'O título é obrigatório.' }

  const payload = { title, body, link, link_label, type, is_active, expires_at, sort_order }
  const isNew = !id || id === 'novo'
  const { error } = isNew
    ? await admin.from('banners').insert(payload)
    : await admin.from('banners').update(payload).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/banners')
  revalidatePath('/dashboard')
  redirect('/admin/banners')
}

export async function deleteBanner(id: string) {
  await requireAdmin()
  const admin = createAdminClient()
  await admin.from('banners').delete().eq('id', id)
  revalidatePath('/admin/banners')
  revalidatePath('/dashboard')
}

// ─── Convites ────────────────────────────────────────────────────────────────

export async function createInvite(
  prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin()
  const admin = createAdminClient()

  const note = (formData.get('note') as string)?.trim() || null
  const product_ids = formData.getAll('products') as string[]
  const max_uses = parseInt(formData.get('max_uses') as string) || null
  const expires_at = (formData.get('expires_at') as string)?.trim() || null

  const code = Math.random().toString(36).slice(2, 10).toUpperCase()

  const { error } = await admin.from('invites').insert({
    code,
    note,
    product_ids,
    max_uses,
    expires_at: expires_at || null,
  })

  if (error) return { error: error.message }
  revalidatePath('/admin/convites')
  redirect('/admin/convites')
}

export async function deleteInvite(id: string) {
  await requireAdmin()
  const admin = createAdminClient()
  await admin.from('invites').delete().eq('id', id)
  revalidatePath('/admin/convites')
}

export async function updateInvite(
  id: string,
  prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin()
  const admin = createAdminClient()

  const note = (formData.get('note') as string)?.trim() || null
  const product_ids = formData.getAll('products') as string[]
  const max_uses = parseInt(formData.get('max_uses') as string) || null
  const expires_at = (formData.get('expires_at') as string)?.trim() || null

  const { error } = await admin.from('invites').update({
    note,
    product_ids,
    max_uses,
    expires_at: expires_at || null,
  }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/convites')
  redirect('/admin/convites')
}

// ─── Certificados ─────────────────────────────────────────────────────────────

export async function deleteCertificate(id: string) {
  const supabase = await requireAdmin()
  await supabase.from('certificates').delete().eq('id', id)
  revalidatePath('/admin/certificados')
}

// ─── Acesso ──────────────────────────────────────────────────────────────────

export async function grantAccess(userId: string, productId: string) {
  const supabase = await requireAdmin()
  await supabase.from('user_products').insert({ user_id: userId, product_id: productId, granted_by: 'manual' })
  revalidatePath('/admin/usuarios')
  revalidatePath(`/admin/usuarios/${userId}`)
}

export async function revokeAccess(userId: string, productId: string) {
  const supabase = await requireAdmin()
  await supabase.from('user_products').delete().eq('user_id', userId).eq('product_id', productId)
  revalidatePath('/admin/usuarios')
  revalidatePath(`/admin/usuarios/${userId}`)
}
