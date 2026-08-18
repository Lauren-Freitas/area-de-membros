import { createAdminClient } from '@/lib/supabase/admin'
import { sendWelcomeEmail, sendAccessGrantedEmail, sendCollaboratorInviteEmail } from '@/lib/resend'
import { grantAccess } from './access'
import { emitEvent } from './events'
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
 * e-mail — idempotente por natureza: chamar de novo com o mesmo e-mail nunca
 * cria um segundo cadastro. Único ponto de criação usado pela UI, pela API
 * pública e (via webhook de convite aceito) pelo fluxo de auto-cadastro —
 * concessão de produtos passa por `grantAccess` em vez de duplicar o upsert
 * aqui (que por sua vez também é idempotente).
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

    // type 'invite' só é válido pra provisionar um usuário que ainda não existe
    // (cria + convida num passo só). Como o usuário já foi criado por createUser
    // acima, o tipo certo pra gerar o link de "criar senha" é 'recovery' — com
    // 'invite' aqui, o Supabase sempre rejeita com 422 email_exists.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `${appUrl}/auth/callback?next=/criar-senha` },
    })
    if (linkError) console.error('[createMember] falha ao gerar link de convite:', linkError.message)
    inviteLink = linkData?.properties?.action_link ?? null
  }

  const profileUpdate: Record<string, unknown> = {}
  if (isNewUser) {
    // O profile é criado por trigger a partir do auth.users, com role no valor
    // padrão da coluna — sempre sobrescreve pro valor esperado pelo resto do app.
    profileUpdate.role = role
    if (input.isActive === false) profileUpdate.is_active = false
  } else {
    // Reaproveitar um profile existente pelo e-mail (idempotência) nunca pode
    // desativar essa conta de lado — quem quer desativar alguém usa a ação
    // dedicada (setMemberActive/updateMember), que passa pela confirmação e
    // pelo guard-rail de "nunca ficar sem admin ativo". "Criar membro" com um
    // e-mail que já existe só deve reconciliar produto/telefone, nunca status.
    if (role !== 'membro') profileUpdate.role = role
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
      await sendCollaboratorInviteEmail({ email, name, inviteLink })
        .catch(err => console.error('[createMember] falha ao enviar email de convite (equipe):', err))
    } else {
      await sendWelcomeEmail({ email, name, productTitle, inviteLink })
        .catch(err => console.error('[createMember] falha ao enviar email de boas-vindas:', err))
    }
  } else if (isNewUser && !inviteLink) {
    console.error('[createMember] membro criado sem link de convite — email de boas-vindas não enviado.')
  } else if (!isNewUser && productIds.length > 0) {
    await sendAccessGrantedEmail({ email, name, productTitle })
      .catch(err => console.error('[createMember] falha ao enviar email de acesso liberado:', err))
  }

  if (isNewUser) {
    await emitEvent({
      event: 'member.created',
      actor, member: { id: userId, name, email }, metadata: { role },
      activity: { action: 'criar', entity: 'membro', entityName: `${name} (${email})` },
    })
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

/**
 * A plataforma nunca pode ficar sem nenhum admin ativo pra acessar o painel.
 * Bloqueia desativar/excluir um admin quando ele é o único admin ativo
 * restante — não é sobre uma pessoa específica, é sobre nunca haver um
 * lockout total do painel administrativo.
 */
async function isLastActiveAdmin(admin: ReturnType<typeof createAdminClient>, userId: string): Promise<boolean> {
  const { data: target } = await admin.from('profiles').select('role, is_active').eq('id', userId).maybeSingle()
  if (!target || target.role !== 'admin' || target.is_active === false) return false

  const { count } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'admin')
    .eq('is_active', true)
    .neq('id', userId)
  return (count ?? 0) === 0
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

  if (patch.is_active === false && await isLastActiveAdmin(admin, userId)) {
    return { error: 'Esse é o único admin ativo. Não é possível desativá-lo. Ative outro admin antes.' }
  }

  const update: Record<string, unknown> = {}
  if (typeof patch.name === 'string') update.name = patch.name.trim()
  if (patch.role) update.role = patch.role
  if (typeof patch.is_active === 'boolean') update.is_active = patch.is_active
  if (typeof patch.phone === 'string' || patch.phone === null) update.phone = patch.phone?.trim() || null

  if (Object.keys(update).length === 0) return { error: 'Nenhum campo para atualizar.' }

  const { data, error } = await admin.from('profiles').update(update).eq('id', userId).select().single()
  if (error) return { error: error.message }

  const wasActive = before.is_active !== false
  const member = { id: userId, name: data.name, email: data.email }
  if ('is_active' in update && update.is_active !== wasActive) {
    await emitEvent({
      event: update.is_active ? 'member.activated' : 'member.deactivated',
      actor, member,
      activity: { action: 'editar', entity: 'membro', entityId: userId, entityName: data.name },
    })
  } else {
    await emitEvent({
      event: 'member.updated',
      actor, member, metadata: { role: data.role },
      activity: { action: 'editar', entity: 'membro', entityId: userId, entityName: data.name },
    })
  }

  return { data }
}

/** Toggle rápido (menu de ações / drawer) — distinto de updateMember pra manter o rótulo semântico "ativar/desativar" no histórico. Idempotente: chamar de novo com o mesmo estado é um no-op. */
export async function setMemberActive(userId: string, active: boolean, actor: Actor): Promise<{ success?: boolean; error?: string }> {
  const admin = createAdminClient()
  if (!active && await isLastActiveAdmin(admin, userId)) {
    return { error: 'Esse é o único admin ativo. Não é possível desativá-lo. Ative outro admin antes.' }
  }
  const { data: profile } = await admin.from('profiles').select('name, email').eq('id', userId).maybeSingle()
  const { error } = await admin.from('profiles').update({ is_active: active }).eq('id', userId)
  if (error) return { error: error.message }

  await emitEvent({
    event: active ? 'member.activated' : 'member.deactivated',
    actor, member: { id: userId, name: profile?.name, email: profile?.email },
    activity: { action: active ? 'ativar' : 'desativar', entity: 'membro', entityId: userId, entityName: profile?.name ?? null },
  })
  return { success: true }
}

/** Idempotente: excluir um membro já excluído retorna sucesso (o estado final desejado — "não existe mais" — já é verdade). */
export async function deleteMember(userId: string, actor: Actor): Promise<{ success?: boolean; error?: string }> {
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('name, email').eq('id', userId).maybeSingle()
  if (!profile) return { success: true }

  if (await isLastActiveAdmin(admin, userId)) {
    return { error: 'Esse é o único admin ativo. Não é possível excluí-lo. Ative outro admin antes.' }
  }

  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }

  await emitEvent({
    event: 'member.deleted',
    actor, member: { id: userId, name: profile.name, email: profile.email },
    activity: { action: 'excluir', entity: 'membro', entityId: userId, entityName: profile.name ?? profile.email ?? null },
  })
  return { success: true }
}

/**
 * "Enviar acesso" — decide sozinho entre convite (nunca ativou a conta,
 * `last_login_at` nulo) e redefinição de senha (já ativou), pra nunca expor
 * as duas ações como escolhas separadas pro admin.
 */
export async function resendAccess(userId: string, actor: Actor): Promise<{ success?: boolean; error?: string }> {
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('name, email, role, last_login_at').eq('id', userId).maybeSingle()
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

    // O template de e-mail tem que refletir o role real — reenviar acesso pra
    // um membro nunca pode usar a cópia de "você entrou pra equipe/painel
    // admin", mesmo que a função sirva os dois casos.
    const isStaff = profile.role === 'admin' || profile.role === 'equipe'
    try {
      if (isStaff) {
        await sendCollaboratorInviteEmail({ email: profile.email, name: profile.name, inviteLink })
      } else {
        await sendWelcomeEmail({ email: profile.email, name: profile.name, productTitle: 'Área de Membros', inviteLink })
      }
    } catch (err) {
      return { error: `Email não enviado: ${err instanceof Error ? err.message : String(err)}` }
    }
    await emitEvent({
      event: 'invite.sent',
      actor, member: { id: userId, name: profile.name, email: profile.email },
      activity: { action: 'enviar_convite', entity: 'membro', entityId: userId, entityName: profile.name },
    })
    return { success: true }
  }

  const { error } = await admin.auth.resetPasswordForEmail(profile.email, {
    redirectTo: `${appUrl}/auth/callback?next=/nova-senha`,
  })
  if (error) return { error: error.message }

  await emitEvent({
    event: 'password.reset',
    actor, member: { id: userId, name: profile.name, email: profile.email },
    activity: { action: 'enviar_login', entity: 'membro', entityId: userId, entityName: profile.name },
  })
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
