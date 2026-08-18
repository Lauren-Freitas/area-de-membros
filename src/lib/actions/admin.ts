'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logActivity } from '@/lib/log-activity'
import { fireOutboundWebhooks } from '@/lib/fire-webhooks'
import sanitizeHtml from 'sanitize-html'
import { getAdminActor } from '@/lib/core/actor'
import * as coreMembers from '@/lib/core/members'
import * as coreAccess from '@/lib/core/access'
import * as coreProducts from '@/lib/core/products'

function sanitizeLessonHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'blockquote', 'code', 'pre', 'img', 'span', 'div'],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
      '*': ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
  })
}

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

/**
 * Erros da API de Auth do Supabase (ex: AuthRetryableFetchError em falha de rede)
 * às vezes têm `.message` vazio ou "{}" — nesse caso usa nome/status pra dar
 * uma pista legível em vez de mostrar "{}" cru na tela.
 */
function authErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const anyErr = err as Record<string, unknown>
    const message = typeof anyErr.message === 'string' ? anyErr.message : ''
    if (message && message !== '{}') return message
    const name = typeof anyErr.name === 'string' ? anyErr.name : ''
    if (name) return `${name}${typeof anyErr.status === 'number' ? ` (status ${anyErr.status})` : ''}. Tente novamente em instantes`
  }
  return fallback
}

// ─── Produtos ───────────────────────────────────────────────────────────────

export async function saveProduct(
  prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin()
  const actor = await getAdminActor()

  const id = formData.get('id') as string | null
  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim()
  const banner_url = (formData.get('banner_url') as string)?.trim() || null
  const is_pack = formData.get('is_pack') === 'on'
  const sort_order = parseInt(formData.get('sort_order') as string) || 0
  const is_active = formData.get('is_active') === 'on'
  const is_featured = formData.get('is_featured') === 'on'
  const buy_url = (formData.get('buy_url') as string)?.trim() || null
  const priceRaw = (formData.get('price') as string)?.trim()
  const price = priceRaw ? parseFloat(priceRaw) : null
  const billing_cycle = (formData.get('billing_cycle') as string)?.trim() || null
  const content_type = (formData.get('content_type') as string) || 'file'
  const content_url = (formData.get('content_url') as string)?.trim() || null
  const kiwify_product_id = (formData.get('kiwify_product_id') as string)?.trim() || null
  const payload = { title, description: description || '', banner_url, buy_url, price, billing_cycle, content_type, content_url, kiwify_product_id, is_pack, sort_order, is_active, is_featured }

  const isNew = !id || id === 'novo'
  const result = isNew
    ? await coreProducts.createProduct(payload, actor)
    : await coreProducts.updateProduct(id, payload, actor)
  if (result.error) return { error: result.error }

  revalidatePath('/admin/produtos')
  revalidatePath('/dashboard')
  redirect('/admin/produtos')
}

export async function deleteProduct(id: string) {
  await requireAdmin()
  await coreProducts.deleteProduct(id, await getAdminActor())
  revalidatePath('/admin/produtos')
  revalidatePath('/dashboard')
}

export async function toggleProductActive(id: string, currentlyActive: boolean): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()
  const result = await coreProducts.toggleProductActive(id, currentlyActive, await getAdminActor())
  revalidatePath('/admin/produtos')
  revalidatePath('/dashboard')
  return result
}

export async function reorderProducts(orderedIds: string[]): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()
  const result = await coreProducts.reorderProducts(orderedIds, await getAdminActor())
  revalidatePath('/admin/produtos')
  revalidatePath('/dashboard')
  return result
}

export async function duplicateProduct(id: string, mode: coreProducts.DuplicateMode = 'full'): Promise<{ error?: string; newId?: string }> {
  await requireAdmin()
  const result = await coreProducts.duplicateProduct(id, mode, await getAdminActor())
  revalidatePath('/admin/produtos')
  return result
}

// ─── Usuários ────────────────────────────────────────────────────────────────

export async function createUser(
  prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin()
  const actor = await getAdminActor()

  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const phone = (formData.get('phone') as string)?.trim() || null
  const role = ((formData.get('role') as string) || 'membro') as 'admin' | 'equipe' | 'membro'
  const productIds = formData.getAll('products') as string[]
  // O toggle "ativo" só existe no formulário de colaborador (equipe/admin) — o
  // de membro nem pergunta, então a ausência do campo tem que significar
  // "ativo" (o default da coluna), não "inativo". Só 'off' explícito desativa.
  const is_active = formData.get('is_active') !== 'off'

  const accessType = (formData.get('access_type') as string) || 'permanent'
  let accessExpiresAt: string | null = null
  if (accessType === 'date') {
    const dateVal = formData.get('access_expires_at') as string
    if (dateVal) accessExpiresAt = new Date(dateVal).toISOString()
  } else if (accessType === 'days') {
    const days = parseInt(formData.get('access_days') as string) || 0
    if (days > 0) {
      const d = new Date()
      d.setDate(d.getDate() + days)
      accessExpiresAt = d.toISOString()
    }
  }

  const result = await coreMembers.createMember(
    { name, email, phone, role, isActive: is_active, productIds, accessExpiresAt },
    actor,
  )
  if (result.error) return { error: result.error }

  revalidatePath('/admin/usuarios')
  revalidatePath('/admin/configuracoes')
  if (role === 'admin' || role === 'equipe') redirect('/admin/configuracoes')
  redirect('/admin/usuarios')
}

export async function deleteUser(userId: string): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()
  const result = await coreMembers.deleteMember(userId, await getAdminActor())
  revalidatePath('/admin/usuarios')
  revalidatePath('/admin/configuracoes')
  return result
}

export async function resendAdminInvite(userId: string): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()
  return coreMembers.resendAccess(userId, await getAdminActor())
}

export async function toggleUserActive(userId: string, currentlyActive: boolean): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()
  const result = await coreMembers.setMemberActive(userId, !currentlyActive, await getAdminActor())
  revalidatePath('/admin/usuarios')
  revalidatePath(`/admin/usuarios/${userId}`)
  return result
}

export async function updateUser(
  userId: string,
  prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin()
  const actor = await getAdminActor()

  const name = (formData.get('name') as string)?.trim()
  const role = (formData.get('role') as string) as 'admin' | 'equipe' | 'membro'
  const is_active = formData.get('is_active') === 'on'
  const phone = (formData.get('phone') as string)?.trim() || null

  if (!name) return { error: 'O nome é obrigatório.' }

  const result = await coreMembers.updateMember(userId, { name, role, is_active, phone }, actor)
  if (result.error) return { error: result.error }

  revalidatePath('/admin/usuarios')
  revalidatePath(`/admin/usuarios/${userId}`)
  return { success: true }
}

// ─── Módulos ─────────────────────────────────────────────────────────────────

export async function saveModule(
  prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin()
  const admin = createAdminClient()
  const id = formData.get('id') as string | null
  const product_id = formData.get('product_id') as string
  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const release_type = (formData.get('release_type') as string) || 'immediate'
  const release_after_days = release_type === 'days_after'
    ? parseInt(formData.get('release_after_days') as string) || 7
    : null
  const release_at = release_type === 'date'
    ? (formData.get('release_at') as string) || null
    : null

  if (!title) return { error: 'O título é obrigatório.' }

  // sort_order não é mais editado aqui — é definido na tela "Organizar módulos e aulas".
  const payload = { title, description, release_type, release_after_days, release_at }

  const isNew = !id
  const { error } = isNew
    ? await admin.from('modules').insert({ product_id, ...payload })
    : await admin.from('modules').update(payload).eq('id', id)

  if (error) return { error: error.message }
  await logActivity({ action: isNew ? 'criar' : 'editar', entity: 'modulo', entityName: title })
  revalidatePath(`/admin/produtos/${product_id}`)
  redirect(`/admin/produtos/${product_id}`)
}

export async function deleteModule(moduleId: string, productId: string) {
  await requireAdmin()
  const admin = createAdminClient()
  await admin.from('modules').delete().eq('id', moduleId)
  await logActivity({ action: 'excluir', entity: 'modulo', entityId: moduleId })
  revalidatePath(`/admin/produtos/${productId}`)
}

// ─── Aulas ───────────────────────────────────────────────────────────────────

export async function saveLesson(
  prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin()
  const admin = createAdminClient()
  const id = formData.get('id') as string | null
  const module_id = formData.get('module_id') as string
  const product_id = formData.get('product_id') as string
  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const content_url = (formData.get('content_url') as string)?.trim() || null
  const content_html_raw = (formData.get('content_html') as string)?.trim() || null
  const is_published = formData.get('is_published') === 'on'

  const release_type = (formData.get('release_type') as string) || 'immediate'
  const release_after_days = release_type === 'days_after'
    ? parseInt(formData.get('release_after_days') as string) || 7
    : null
  const release_at = release_type === 'date'
    ? (formData.get('release_at') as string) || null
    : null
  const access_duration_raw = (formData.get('access_duration_days') as string)?.trim()
  const access_duration_days = access_duration_raw ? parseInt(access_duration_raw) || null : null

  if (!title) return { error: 'O título é obrigatório.' }

  const content_html = content_html_raw ? sanitizeLessonHtml(content_html_raw) : null
  // lesson_type não é mais escolhido no formulário — mantido só pra compatibilidade
  // com ícones/listagens existentes (aulas antigas do tipo file/link continuam como estão).
  const lesson_type = content_url ? 'video' : 'text'

  // sort_order não é mais editado aqui — é definido na tela "Organizar módulos e aulas".
  const payload = { module_id, title, description, lesson_type, content_url, content_html, is_published, release_type, release_after_days, release_at, access_duration_days }
  const isNew = !id
  const { error } = isNew
    ? await admin.from('lessons').insert(payload)
    : await admin.from('lessons').update(payload).eq('id', id)

  if (error) return { error: error.message }
  await logActivity({ action: isNew ? 'criar' : 'editar', entity: 'aula', entityName: title })
  revalidatePath(`/admin/produtos/${product_id}/modulos/${module_id}`)
  redirect(`/admin/produtos/${product_id}/modulos/${module_id}`)
}

export async function deleteLesson(lessonId: string, moduleId: string, productId: string) {
  await requireAdmin()
  const admin = createAdminClient()
  await admin.from('lessons').delete().eq('id', lessonId)
  await logActivity({ action: 'excluir', entity: 'aula', entityId: lessonId })
  revalidatePath(`/admin/produtos/${productId}/modulos/${moduleId}`)
}

export async function reorderModulesAndLessons(
  productId: string,
  modules: { id: string; sort_order: number }[],
  lessons: { id: string; module_id: string; sort_order: number }[]
): Promise<{ error?: string }> {
  await requireAdmin()
  const admin = createAdminClient()

  const results = await Promise.all([
    ...modules.map(m => admin.from('modules').update({ sort_order: m.sort_order }).eq('id', m.id)),
    ...lessons.map(l => admin.from('lessons').update({ module_id: l.module_id, sort_order: l.sort_order }).eq('id', l.id)),
  ])
  const failed = results.find(r => r.error)
  if (failed?.error) return { error: failed.error.message }

  await logActivity({ action: 'editar', entity: 'organizacao', entityId: productId })
  revalidatePath(`/admin/produtos/${productId}`)
  return {}
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
    if (authError) return { error: authErrorMessage(authError, 'Erro ao atualizar email.') }
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

  await logActivity({ action: isNew ? 'criar' : 'editar', entity: 'banner', entityName: title })
  revalidatePath('/admin/banners')
  revalidatePath('/dashboard')
  redirect('/admin/banners')
}

export async function deleteBanner(id: string) {
  await requireAdmin()
  const admin = createAdminClient()
  await admin.from('banners').delete().eq('id', id)
  await logActivity({ action: 'excluir', entity: 'banner', entityId: id })
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

  if (expires_at && new Date(expires_at) <= new Date()) {
    return { error: 'A data de expiração precisa ser no futuro.' }
  }

  const code = Math.random().toString(36).slice(2, 10).toUpperCase()

  const { error } = await admin.from('invites').insert({
    code,
    note,
    product_ids,
    max_uses,
    expires_at: expires_at || null,
  })

  if (error) return { error: error.message }
  const actor = await getAdminActor()
  await logActivity({ action: 'criar', entity: 'convite', entityName: note ?? code, actor })
  await fireOutboundWebhooks('invite.sent', { actor, metadata: { code, note, product_ids } })
  revalidatePath('/admin/convites')
  redirect('/admin/convites')
}

export async function deleteInvite(id: string) {
  await requireAdmin()
  const admin = createAdminClient()
  await admin.from('invites').delete().eq('id', id)
  await logActivity({ action: 'excluir', entity: 'convite', entityId: id })
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

  if (expires_at && new Date(expires_at) <= new Date()) {
    return { error: 'A data de expiração precisa ser no futuro.' }
  }

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
  await requireAdmin()
  const admin = createAdminClient()
  await admin.from('certificates').delete().eq('id', id)
  revalidatePath('/admin/certificados')
}

// ─── Acesso ──────────────────────────────────────────────────────────────────

export async function grantAccess(userId: string, productId: string) {
  await requireAdmin()
  const result = await coreAccess.grantAccess(userId, productId, await getAdminActor())
  revalidatePath('/admin/usuarios')
  revalidatePath(`/admin/usuarios/${userId}`)
  revalidatePath(`/admin/produtos/${productId}`)
  return result
}

export async function revokeAccess(userId: string, productId: string) {
  await requireAdmin()
  await coreAccess.revokeAccess(userId, productId, await getAdminActor())
  revalidatePath('/admin/usuarios')
  revalidatePath(`/admin/usuarios/${userId}`)
  revalidatePath(`/admin/produtos/${productId}`)
}

export async function updateAccessExpiry(userId: string, productId: string, expiresAt: string | null) {
  await requireAdmin()
  const result = await coreAccess.updateAccessExpiry(userId, productId, expiresAt, await getAdminActor())
  revalidatePath('/admin/usuarios')
  revalidatePath(`/admin/usuarios/${userId}`)
  return result
}

// ── Chamados (suporte) ──────────────────────────────────────────────────────

export async function respondTicket(
  ticketId: string,
  response: string,
  newStatus: 'open' | 'resolved' | 'closed',
): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()
  const trimmed = response.trim()
  if (!trimmed) return { error: 'A resposta não pode ficar vazia.' }

  const admin = createAdminClient()
  const { data: ticket } = await admin.from('support_tickets').select('subject, user_id').eq('id', ticketId).maybeSingle()
  if (!ticket) return { error: 'Chamado não encontrado.' }

  const { error } = await admin
    .from('support_tickets')
    .update({ admin_response: trimmed, responded_at: new Date().toISOString(), status: newStatus })
    .eq('id', ticketId)
  if (error) return { error: error.message }

  await logActivity({ action: 'responder', entity: 'chamado', entityId: ticketId, entityName: ticket.subject ?? null })
  revalidatePath('/admin/chamados')
  return { success: true }
}

export async function updateTicketStatus(
  ticketId: string,
  newStatus: 'open' | 'resolved' | 'closed',
): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from('support_tickets').update({ status: newStatus }).eq('id', ticketId)
  if (error) return { error: error.message }

  revalidatePath('/admin/chamados')
  return { success: true }
}
