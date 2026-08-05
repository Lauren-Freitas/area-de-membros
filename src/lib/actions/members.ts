'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { fireOutboundWebhooks } from '@/lib/fire-webhooks'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'equipe') redirect('/dashboard')
}

export interface MemberSummary {
  id: string
  name: string
  email: string
  phone: string | null
  avatar_url: string | null
  role: string
  is_active: boolean | null
  last_login_at: string | null
  created_at: string
  notes: string | null
  products_count: number
  product_titles: string[]
  next_expiry: string | null
  has_permanent_access: boolean | null
  is_subscriber: boolean | null
}

export type MemberFilter = 'all' | 'active' | 'inactive' | 'expiring' | 'no-access' | 'subscribers'
export type MemberSort = 'name' | 'created' | 'last_login' | 'expiry'

interface ListMembersParams {
  search?: string
  filter?: MemberFilter
  sort?: MemberSort
  page: number
  pageSize: number
}

/** Fonte: view `member_summary` (agregada no banco) — uma query paginada só, sem N+1. */
export async function listMembers({ search, filter = 'all', sort = 'created', page, pageSize }: ListMembersParams): Promise<{ members: MemberSummary[]; total: number }> {
  await requireAdmin()
  const admin = createAdminClient()

  let query = admin.from('member_summary').select('*', { count: 'exact' })

  const term = search?.trim().replace(/[%_,]/g, '')
  if (term) query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%`)

  const now = new Date().toISOString()
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  if (filter === 'active') query = query.or('is_active.is.null,is_active.eq.true')
  else if (filter === 'inactive') query = query.eq('is_active', false)
  else if (filter === 'expiring') query = query.gte('next_expiry', now).lte('next_expiry', in7Days)
  else if (filter === 'no-access') query = query.eq('products_count', 0)
  else if (filter === 'subscribers') query = query.eq('is_subscriber', true)

  const sortMap: Record<MemberSort, { column: string; ascending: boolean }> = {
    name: { column: 'name', ascending: true },
    created: { column: 'created_at', ascending: false },
    last_login: { column: 'last_login_at', ascending: false },
    expiry: { column: 'next_expiry', ascending: true },
  }
  const { column, ascending } = sortMap[sort]
  query = query.order(column, { ascending, nullsFirst: false })

  const from = (page - 1) * pageSize
  query = query.range(from, from + pageSize - 1)

  const { data, error, count } = await query
  if (error) return { members: [], total: 0 }
  return { members: (data ?? []) as MemberSummary[], total: count ?? 0 }
}

export interface MemberProductAccess {
  id: string
  title: string
  hasAccess: boolean
  expiresAt: string | null
}

export interface MemberActivityEntry {
  id: string
  action: string
  entity: string
  entity_name: string | null
  user_name: string
  created_at: string
}

export interface MemberWebhookEntry {
  id: string
  event: string
  success: boolean
  attempted_at: string
}

export interface MemberDetail {
  profile: {
    id: string
    name: string
    email: string
    phone: string | null
    avatar_url: string | null
    role: string
    is_active: boolean
    last_login_at: string | null
    created_at: string
    notes: string | null
  }
  productAccess: MemberProductAccess[]
  recentActivity: MemberActivityEntry[]
  recentWebhookDeliveries: MemberWebhookEntry[]
}

/** Busca sob demanda — só quando o drawer abre, nunca faz parte da listagem. */
export async function getMemberDetail(userId: string): Promise<MemberDetail | null> {
  await requireAdmin()
  const admin = createAdminClient()

  const [{ data: profile }, { data: products }, { data: accesses }, { data: activity }, { data: deliveries }] = await Promise.all([
    admin.from('profiles').select('id, name, email, phone, avatar_url, role, is_active, last_login_at, created_at, notes').eq('id', userId).maybeSingle(),
    admin.from('products').select('id, title').eq('is_active', true).order('sort_order'),
    admin.from('user_products').select('product_id, expires_at').eq('user_id', userId),
    admin.from('activity_logs').select('id, action, entity, entity_name, user_name, created_at').eq('entity_id', userId).order('created_at', { ascending: false }).limit(8),
    admin.from('outbound_webhook_deliveries').select('id, event, success, attempted_at').filter('payload->>user_id', 'eq', userId).order('attempted_at', { ascending: false }).limit(5),
  ])

  if (!profile) return null

  const accessMap = new Map((accesses ?? []).map(a => [a.product_id as string, a.expires_at as string | null]))
  const productAccess: MemberProductAccess[] = (products ?? []).map(p => ({
    id: p.id,
    title: p.title,
    hasAccess: accessMap.has(p.id),
    expiresAt: accessMap.get(p.id) ?? null,
  }))

  return {
    profile: { ...profile, is_active: profile.is_active !== false },
    productAccess,
    recentActivity: activity ?? [],
    recentWebhookDeliveries: deliveries ?? [],
  }
}

/** Gera o link de acesso sem enviar e-mail — poder do "Copiar link de acesso". */
export async function getMemberAccessLink(userId: string): Promise<{ link?: string; error?: string }> {
  await requireAdmin()
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

/**
 * "Enviar login" — redefinição de senha para quem já ativou a conta.
 * Diferente de resendAdminInvite (admin.ts): usa o e-mail padrão do Supabase,
 * mesmo mecanismo do fluxo de autoatendimento em /esqueceu-senha.
 */
export async function resetMemberPassword(userId: string): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('email').eq('id', userId).maybeSingle()
  if (!profile) return { error: 'Usuário não encontrado' }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const { error } = await admin.auth.resetPasswordForEmail(profile.email, {
    redirectTo: `${appUrl}/auth/callback?next=/nova-senha`,
  })
  if (error) return { error: error.message }

  await fireOutboundWebhooks('password.reset', { user_id: userId, email: profile.email })
  return { success: true }
}

export async function updateMemberNotes(userId: string, notes: string): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from('profiles').update({ notes: notes.trim() || null }).eq('id', userId)
  if (error) return { error: error.message }
  revalidatePath('/admin/usuarios')
  return { success: true }
}
