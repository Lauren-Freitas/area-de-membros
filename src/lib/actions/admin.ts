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

  if (profile?.role !== 'admin') redirect('/dashboard')

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
  const content_type = formData.get('content_type') as string
  const content_url = (formData.get('content_url') as string)?.trim() || null
  const banner_url = (formData.get('banner_url') as string)?.trim() || null
  const is_pack = formData.get('is_pack') === 'on'
  const sort_order = parseInt(formData.get('sort_order') as string) || 0
  const is_active = formData.get('is_active') === 'on'

  if (!title) return { error: 'O título é obrigatório.' }
  if (!content_type) return { error: 'O tipo de conteúdo é obrigatório.' }

  const buy_url = (formData.get('buy_url') as string)?.trim() || null
  const payload = { title, description: description || '', content_type, content_url, banner_url, buy_url, is_pack, sort_order, is_active }

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

  if (isNewUser && inviteLink) {
    await sendWelcomeEmail({ email, name, productTitle, inviteLink }).catch(() => null)
  } else if (productIds.length > 0) {
    await sendAccessGrantedEmail({ email, name, productTitle }).catch(() => null)
  }

  revalidatePath('/admin/usuarios')
  redirect('/admin/usuarios')
}

export async function deleteUser(userId: string) {
  await requireAdmin()
  const admin = createAdminClient()
  await admin.auth.admin.deleteUser(userId)
  revalidatePath('/admin/usuarios')
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

  if (!title) return { error: 'O título é obrigatório.' }

  const isNew = !id
  const { error } = isNew
    ? await supabase.from('modules').insert({ product_id, title, description, sort_order })
    : await supabase.from('modules').update({ title, description, sort_order }).eq('id', id)

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

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ name, email })
    .eq('id', user.id)

  if (profileError) return { error: profileError.message }

  revalidatePath('/admin/configuracoes')
  return { success: true }
}

// ─── Acesso ──────────────────────────────────────────────────────────────────

export async function grantAccess(userId: string, productId: string) {
  const supabase = await requireAdmin()
  await supabase.from('user_products').insert({ user_id: userId, product_id: productId, granted_by: 'manual' })
  revalidatePath('/admin/usuarios')
}

export async function revokeAccess(userId: string, productId: string) {
  const supabase = await requireAdmin()
  await supabase.from('user_products').delete().eq('user_id', userId).eq('product_id', productId)
  revalidatePath('/admin/usuarios')
}
