'use server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function registerWithInvite(
  code: string,
  name: string,
  email: string,
  password: string
): Promise<{ error?: string; success?: boolean }> {
  const admin = createAdminClient()

  const { data: invite } = await admin
    .from('invites')
    .select('*')
    .eq('code', code.toUpperCase())
    .single()

  if (!invite) return { error: 'Convite inválido ou não encontrado.' }
  if (invite.expires_at && new Date(invite.expires_at) < new Date())
    return { error: 'Este convite expirou.' }
  if (invite.max_uses !== null && invite.used_count >= invite.max_uses)
    return { error: 'Este convite já atingiu o limite de usos.' }

  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle()

  if (existing) return { error: 'Este email já está cadastrado. Faça login normalmente.' }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: email.toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { name },
  })

  if (createError || !created.user) return { error: createError?.message ?? 'Erro ao criar conta.' }

  const productIds: string[] = invite.product_ids ?? []
  if (productIds.length > 0) {
    await admin.from('user_products').insert(
      productIds.map((pid: string) => ({
        user_id: created.user!.id,
        product_id: pid,
        granted_by: 'manual',
      }))
    )
  }

  await admin
    .from('invites')
    .update({ used_count: invite.used_count + 1 })
    .eq('id', invite.id)

  return { success: true }
}
