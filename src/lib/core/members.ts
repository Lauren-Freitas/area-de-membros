import { createAdminClient } from '@/lib/supabase/admin'
import { logActivity } from '@/lib/log-activity'
import { fireOutboundWebhooks } from '@/lib/fire-webhooks'
import { sendWelcomeEmail, sendAccessGrantedEmail, sendCollaboratorInviteEmail } from '@/lib/resend'
import { grantAccess } from './access'
import type { Actor } from './actor'

type Role = 'admin' | 'equipe' | 'membro'

interface CreateMemberInput {
  name: string
  email: string
  phone?: string | null
  role?: Role
  isActive?: boolean
  productIds?: string[]
  accessExpiresAt?: string | null
}

interface CreateMemberResult {
  userId?: string
  isNewUser?: boolean
  error?: string
}

/**
 * Cria um membro/colaborador ou reaproveita um perfil já existente pelo
 * e-mail. Único ponto de criação usado pela UI, pela API pública e (via
 * webhook de convite aceito) pelo fluxo de auto-cadastro — concessão de
 * produtos passa por `grantAccess` em vez de duplicar o upsert aqui.
 */
export async function createMember(input: CreateMemberInput, actor: Actor): Promise<CreateMemberResult> {
  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  const phone = input.phone?.trim() || null
  const role: Role = input.role ?? 'membro'
  const productIds = input.productIds ?? []

  if (!name) return { error: 'O nome é obrigatório.' }
  if (!email) return { error: 'O email é obrigatório.' }

  const admin = createAdminClient()
  const { data: existing } = await admin.from('profiles').select('id').eq('email', email).maybeSingle()

  let userId: string
  let isNewUser = false
  let inviteLink: string | null = null

  if (existing) {
    userId = existing.id
  } else {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { name },
    })
    if (createError || !created.user) return { error: createError?.message ?? 'Erro ao criar usuário.' }
    userId = created.user.id
    isNewUser = true

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!
    const { data: linkData } = await admin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: { redirectTo: `${appUrl}/auth/callback?next=/criar-senha`, data: { name } },
    })
    inviteLink = linkData?.properties?.action_link ?? null
  }

  const profileUpdate: Record<string, unknown> = {}
  if (isNewUser) {
    // O profile é criado por trigger a partir do auth.users, com role no valor
    // padrão da coluna — sempre sobrescreve pro valor esperado pelo resto do app.
    profileUpdate.role = role
    if (input.isActive === false) profileUpdate.is_active = false
  } else {
    if (role !== 'membro') profileUpdate.role = role
    if (input.isActive === false) profileUpdate.is_active = false
  }
  if (phone) profileUpdate.phone = phone

  if (Object.keys(profileUpdate).length > 0) {
    const { error: roleError } = await admin.from('profiles').update(profileUpdate).eq('id', userId)
    if (roleError) return { error: `Erro ao configurar o perfil: ${roleError.message}` }
  }

  const productTitle = productIds.length === 1
    ? (await admin.from('products').select('title').eq('id', productIds[0]).single()).data?.title ?? 'Área de Membros'
    : productIds.length > 1 ? 'seus produtos' : 'Área de Membros'

  if (isNewUser && inviteLink) {
    if (role === 'admin' || role === 'equipe') {
      await sendCollaboratorInviteEmail({ email, name, inviteLink }).catch(() => null)
    } else {
      await sendWelcomeEmail({ email, name, productTitle, inviteLink }).catch(() => null)
    }
  } else if (!isNewUser && productIds.length > 0) {
    await sendAccessGrantedEmail({ email, name, productTitle }).catch(() => null)
  }

  await logActivity({ action: 'criar', entity: 'membro', entityName: `${name} (${email})`, actor })
  if (isNewUser) {
    await fireOutboundWebhooks('member.created', { member: { id: userId, name, email }, actor, metadata: { role } })
  }

  const grantResults = await Promise.all(
    productIds.map((pid) => grantAccess(userId, pid, actor, { expiresAt: input.accessExpiresAt ?? null })),
  )
  const grantError = grantResults.find(r => r.error)
  // O membro já foi criado nesse ponto — um erro aqui não desfaz isso, só
  // avisa quem chamou que a liberação de produto(s) não completou.
  if (grantError) return { userId, isNewUser, error: `Membro criado, mas falha ao liberar produto(s): ${grantError.error}` }

  return { userId, isNewUser }
}

interface UpdateMemberInput {
  name?: string
  role?: Role
  is_active?: boolean
  phone?: string | null
}

export async function updateMember(userId: string, patch: UpdateMemberInput, actor: Actor): Promise<{ data?: Record<string, unknown>; error?: string }> {
  const admin = createAdminClient()
  const { data: before } = await admin.from('profiles').select('is_active, email').eq('id', userId).maybeSingle()
  if (!before) return { error: 'Usuário não encontrado.' }

  const update: Record<string, unknown> = {}
  if (typeof patch.name === 'string') update.name = patch.name.trim()
  if (patch.role) update.role = patch.role
  if (typeof patch.is_active === 'boolean') update.is_active = patch.is_active
  if (typeof patch.phone === 'string' || patch.phone === null) update.phone = patch.phone?.trim() || null

  if (Object.keys(update).length === 0) return { error: 'Nenhum campo para atualizar.' }

  const { data, error } = await admin.from('profiles').update(update).eq('id', userId).select().single()
  if (error) return { error: error.message }

  await logActivity({ action: 'editar', entity: 'membro', entityId: userId, entityName: data.name, actor })

  const wasActive = before.is_active !== false
  const member = { id: userId, name: data.name, email: data.email }
  if ('is_active' in update && update.is_active !== wasActive) {
    await fireOutboundWebhooks(update.is_active ? 'member.activated' : 'member.deactivated', { member, actor })
  } else {
    await fireOutboundWebhooks('member.updated', { member, actor, metadata: { role: data.role } })
  }

  return { data }
}

/** Toggle rápido (menu de ações / drawer) — distinto de updateMember pra manter o rótulo semântico "ativar/desativar" no histórico. */
export async function setMemberActive(userId: string, active: boolean, actor: Actor): Promise<{ success?: boolean; error?: string }> {
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('name, email').eq('id', userId).maybeSingle()
  const { error } = await admin.from('profiles').update({ is_active: active }).eq('id', userId)
  if (error) return { error: error.message }

  await logActivity({ action: active ? 'ativar' : 'desativar', entity: 'membro', entityId: userId, entityName: profile?.name ?? null, actor })
  await fireOutboundWebhooks(active ? 'member.activated' : 'member.deactivated', {
    member: { id: userId, name: profile?.name, email: profile?.email },
    actor,
  })
  return { success: true }
}

export async function deleteMember(userId: string, actor: Actor): Promise<{ success?: boolean; error?: string }> {
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('name, email').eq('id', userId).maybeSingle()
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }

  await logActivity({ action: 'excluir', entity: 'membro', entityId: userId, entityName: profile?.name ?? profile?.email ?? null, actor })
  await fireOutboundWebhooks('member.deleted', { member: { id: userId, name: profile?.name, email: profile?.email }, actor })
  return { success: true }
}

/**
 * "Enviar acesso" — decide sozinho entre convite (nunca ativou a conta,
 * `last_login_at` nulo) e redefinição de senha (já ativou), pra nunca expor
 * as duas ações como escolhas separadas pro admin.
 */
export async function resendAccess(userId: string, actor: Actor): Promise<{ success?: boolean; error?: string }> {
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('name, email, last_login_at').eq('id', userId).maybeSingle()
  if (!profile) return { error: 'Usuário não encontrado.' }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const neverActivated = !profile.last_login_at

  if (neverActivated) {
    const { data: linkData, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: profile.email,
      options: { redirectTo: `${appUrl}/auth/callback?next=/criar-senha` },
    })
    if (error) return { error: error.message }
    const inviteLink = linkData?.properties?.action_link
    if (!inviteLink) return { error: 'Não foi possível gerar o link de convite.' }

    try {
      await sendCollaboratorInviteEmail({ email: profile.email, name: profile.name, inviteLink })
    } catch (err) {
      return { error: `Email não enviado: ${err instanceof Error ? err.message : String(err)}` }
    }
    await logActivity({ action: 'enviar_convite', entity: 'membro', entityId: userId, entityName: profile.name, actor })
    await fireOutboundWebhooks('invite.sent', { member: { id: userId, name: profile.name, email: profile.email }, actor })
    return { success: true }
  }

  const { error } = await admin.auth.resetPasswordForEmail(profile.email, {
    redirectTo: `${appUrl}/auth/callback?next=/nova-senha`,
  })
  if (error) return { error: error.message }

  await logActivity({ action: 'enviar_login', entity: 'membro', entityId: userId, entityName: profile.name, actor })
  await fireOutboundWebhooks('password.reset', { member: { id: userId, name: profile.name, email: profile.email }, actor })
  return { success: true }
}

/** Gera o link de acesso sem enviar e-mail — poder do "Copiar link de acesso". Não loga/dispara webhook: é só leitura de um link, não uma mutação. */
export async function getMemberAccessLink(userId: string): Promise<{ link?: string; error?: string }> {
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('email').eq('id', userId).maybeSingle()
  if (!profile) return { error: 'Usuário não encontrado' }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const { data: linkData, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: profile.email,
    options: { redirectTo: `${appUrl}/auth/callback?next=/criar-senha` },
  })
  if (error) return { error: error.message }

  const link = linkData?.properties?.action_link
  if (!link) return { error: 'Não foi possível gerar o link.' }
  return { link }
}
