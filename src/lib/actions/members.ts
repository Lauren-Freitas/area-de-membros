'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { getAdminActor } from '@/lib/core/actor'
import * as coreMembers from '@/lib/core/members'

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
  }
  productAccess: MemberProductAccess[]
}

/**
 * Busca sob demanda — só quando o drawer abre, nunca faz parte da listagem.
 */
export async function getMemberDetail(userId: string): Promise<MemberDetail | null> {
  await requireAdmin()
  const admin = createAdminClient()

  const [{ data: profile }, { data: products }, { data: accesses }] = await Promise.all([
    admin.from('profiles').select('id, name, email, phone, avatar_url, role, is_active, last_login_at, created_at').eq('id', userId).maybeSingle(),
    admin.from('products').select('id, title').eq('is_active', true).order('sort_order'),
    admin.from('user_products').select('product_id, expires_at').eq('user_id', userId),
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
  }
}

export interface ActivityEntry {
  id: string
  action: string
  entity: string
  entityId: string | null
  entityName: string | null
  actor: string
  actorType: string
  createdAt: string
}

/** Últimas ações registradas para este membro — inclui o que veio de admin, API ou webhook. */
export async function getMemberActivity(userId: string, limit = 10): Promise<ActivityEntry[]> {
  await requireAdmin()
  const admin = createAdminClient()
  const { data } = await admin
    .from('activity_logs')
    .select('id, action, entity, entity_id, entity_name, user_name, actor_type, actor_label, created_at')
    .eq('entity_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []).map(row => ({
    id: row.id,
    action: row.action,
    entity: row.entity,
    entityId: row.entity_id,
    entityName: row.entity_name,
    actor: row.actor_label ?? row.user_name ?? 'Desconhecido',
    actorType: row.actor_type ?? 'admin',
    createdAt: row.created_at,
  }))
}

/** Gera o link de acesso sem enviar e-mail — poder do "Copiar link de acesso". */
export async function getMemberAccessLink(userId: string): Promise<{ link?: string; error?: string }> {
  await requireAdmin()
  return coreMembers.getMemberAccessLink(userId)
}

/**
 * "Enviar acesso" — decide sozinho entre convite e redefinição de senha
 * conforme o membro já ativou a conta ou não.
 */
export async function resetMemberPassword(userId: string): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()
  return coreMembers.resendAccess(userId, await getAdminActor())
}
