import { createAdminClient } from './supabase/admin'

export const LEVELS = [
  { level: 1, minXp: 0,     label: 'Iniciante' },
  { level: 2, minXp: 500,   label: 'Aprendiz' },
  { level: 3, minXp: 1200,  label: 'Estudante' },
  { level: 4, minXp: 2500,  label: 'Dedicado' },
  { level: 5, minXp: 4500,  label: 'Avançado' },
  { level: 6, minXp: 7000,  label: 'Especialista' },
  { level: 7, minXp: 10000, label: 'Mestre' },
  { level: 8, minXp: 14000, label: 'Expert' },
  { level: 9, minXp: 19000, label: 'Elite' },
  { level: 10, minXp: 25000, label: 'Lendário' },
]

export function getLevelInfo(totalXp: number) {
  let cur = LEVELS[0]
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVELS[i].minXp) { cur = LEVELS[i]; break }
  }
  const next = LEVELS[cur.level] ?? null
  const xpInLevel = totalXp - cur.minXp
  const xpNeeded  = next ? next.minXp - cur.minXp : 0
  const pct = next ? Math.min(100, Math.round((xpInLevel / xpNeeded) * 100)) : 100
  return { cur, next, totalXp, xpInLevel, xpNeeded, pct }
}

export const BADGES = [
  { key: 'first_comment', label: 'Primeiro Comentário', icon: '💬', description: 'Fez seu primeiro comentário' },
  { key: 'first_rating',  label: 'Primeira Avaliação',  icon: '⭐', description: 'Avaliou um conteúdo' },
  { key: 'first_lesson',  label: 'Primeira Aula',        icon: '🎯', description: 'Concluiu sua primeira aula' },
  { key: 'lessons_10',    label: '10 Aulas',             icon: '⚡', description: 'Concluiu 10 aulas' },
  { key: 'lessons_100',   label: '100 Aulas',            icon: '🔥', description: 'Concluiu 100 aulas' },
  { key: 'first_product', label: 'Primeiro Curso',       icon: '🏆', description: 'Concluiu um produto completo' },
] as const

export type BadgeKey = typeof BADGES[number]['key']

export async function awardXp(
  userId: string,
  eventType: string,
  metadata?: Record<string, unknown>
): Promise<number> {
  try {
    const admin = createAdminClient()
    const { data: setting } = await admin
      .from('xp_settings')
      .select('xp_amount, is_enabled')
      .eq('event_type', eventType)
      .single()
    if (!setting?.is_enabled || !setting.xp_amount) return 0
    await admin.from('xp_transactions').insert({
      user_id: userId,
      event_type: eventType,
      xp_amount: setting.xp_amount,
      metadata: metadata ?? null,
    })
    return setting.xp_amount
  } catch { return 0 }
}

async function grantBadge(userId: string, key: BadgeKey) {
  try {
    await createAdminClient().from('user_badges').insert({ user_id: userId, badge_key: key })
  } catch { /* ignore duplicate */ }
}

export async function checkBadgesAfterComment(userId: string) {
  const admin = createAdminClient()
  const { count } = await admin
    .from('xp_transactions').select('id', { count: 'exact', head: true })
    .eq('user_id', userId).in('event_type', ['lesson_comment', 'product_comment'])
  if (count === 1) await grantBadge(userId, 'first_comment')
}

export async function checkBadgesAfterRating(userId: string) {
  const admin = createAdminClient()
  const { count } = await admin
    .from('xp_transactions').select('id', { count: 'exact', head: true })
    .eq('user_id', userId).in('event_type', ['lesson_rating', 'product_rating'])
  if (count === 1) await grantBadge(userId, 'first_rating')
}

export async function checkBadgesAfterLesson(userId: string) {
  const admin = createAdminClient()
  const { count } = await admin
    .from('lesson_progress').select('lesson_id', { count: 'exact', head: true })
    .eq('user_id', userId)
  const n = count ?? 0
  if (n === 1)   await grantBadge(userId, 'first_lesson')
  if (n === 10)  await grantBadge(userId, 'lessons_10')
  if (n === 100) await grantBadge(userId, 'lessons_100')
}

export async function checkBadgesAfterProduct(userId: string) {
  const admin = createAdminClient()
  const { count } = await admin
    .from('xp_transactions').select('id', { count: 'exact', head: true })
    .eq('user_id', userId).eq('event_type', 'product_complete')
  if (count === 1) await grantBadge(userId, 'first_product')
}
