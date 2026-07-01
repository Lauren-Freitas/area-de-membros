import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getLevelInfo, LEVELS, BADGES } from '@/lib/xp'

export default async function PerfilPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, xpResult, { data: badgesData }, { count: lessonsCompleted }] = await Promise.all([
    supabase.from('profiles').select('name, avatar_url, bio').eq('id', user.id).single(),
    adminClient.from('user_xp_totals').select('total_xp').eq('user_id', user.id).maybeSingle(),
    adminClient.from('user_badges').select('badge_key, awarded_at').eq('user_id', user.id),
    supabase.from('lesson_progress').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  const totalXp = (xpResult.data as { total_xp?: number } | null)?.total_xp ?? 0
  const { cur, next, xpInLevel, xpNeeded, pct } = getLevelInfo(totalXp)
  const earnedKeys = new Set((badgesData ?? []).map(b => b.badge_key))
  const badgeMap = Object.fromEntries((badgesData ?? []).map(b => [b.badge_key, b.awarded_at]))

  const name = profile?.name ?? 'Usuário'
  const avatarUrl = (profile as { avatar_url?: string | null } | null)?.avatar_url ?? null
  const bio = (profile as { bio?: string | null } | null)?.bio ?? null
  const initials = name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Cabeçalho do perfil */}
      <div className="bg-white dark:bg-[#0d1020] rounded-2xl border border-gray-100 dark:border-[#1e2030] overflow-hidden">
        {/* Banner gradiente */}
        <div className="h-24" style={{ background: 'linear-gradient(135deg, #f5efe3 0%, #b48840 100%)' }} />

        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={name}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-[#0d1020]"
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white border-4 border-white dark:border-[#0d1020]"
                  style={{ backgroundColor: '#b48840' }}
                >
                  {initials}
                </div>
              )}
              {/* Badge de nível */}
              <div
                className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: '#b48840' }}
              >
                Nv.{cur.level}
              </div>
            </div>

            <Link
              href="/conta"
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
              </svg>
              Editar perfil
            </Link>
          </div>

          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{name}</h1>
          {bio && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{bio}</p>}

          {/* Stats rápidos */}
          <div className="flex items-center gap-6 mt-4 text-center">
            <div>
              <p className="text-xl font-bold" style={{ color: '#b48840' }}>{totalXp}</p>
              <p className="text-xs text-gray-400">XP total</p>
            </div>
            <div className="w-px h-8 bg-gray-100 dark:bg-gray-700" />
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{lessonsCompleted}</p>
              <p className="text-xs text-gray-400">Aulas concluídas</p>
            </div>
            <div className="w-px h-8 bg-gray-100 dark:bg-gray-700" />
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{earnedKeys.size}</p>
              <p className="text-xs text-gray-400">Conquistas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de XP / Nível */}
      <div className="bg-white dark:bg-[#0d1020] rounded-2xl border border-gray-100 dark:border-[#1e2030] p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nível atual</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
              {cur.level} — <span style={{ color: '#b48840' }}>{cur.label}</span>
            </p>
          </div>
          {next && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Próximo nível</p>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{next.label}</p>
            </div>
          )}
        </div>

        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #b48840, #f5c842)' }}
          />
        </div>

        {next ? (
          <p className="text-xs text-gray-400">
            <span className="font-semibold" style={{ color: '#b48840' }}>{xpInLevel} XP</span>
            {' '}de{' '}
            <span className="font-semibold">{xpNeeded} XP</span>
            {' '}para o nível {next.level} · {pct}%
          </p>
        ) : (
          <p className="text-xs font-semibold" style={{ color: '#b48840' }}>Nível máximo atingido! 🏆</p>
        )}

        {/* Escada de níveis */}
        <div className="mt-4 grid grid-cols-5 gap-1">
          {LEVELS.map(lvl => (
            <div
              key={lvl.level}
              className="flex flex-col items-center gap-0.5"
              title={`Nível ${lvl.level}: ${lvl.label} (${lvl.minXp} XP)`}
            >
              <div
                className="w-full h-1.5 rounded-full"
                style={{ backgroundColor: totalXp >= lvl.minXp ? '#b48840' : '#e5e7eb' }}
              />
              <span className="text-[9px] text-gray-400">{lvl.level}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Conquistas / Badges */}
      <div className="bg-white dark:bg-[#0d1020] rounded-2xl border border-gray-100 dark:border-[#1e2030] p-5">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Conquistas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {BADGES.map(badge => {
            const earned = earnedKeys.has(badge.key)
            const awardedAt = badgeMap[badge.key]
            return (
              <div
                key={badge.key}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition ${
                  earned
                    ? 'border-yellow-200 dark:border-yellow-700'
                    : 'border-gray-100 dark:border-[#1e2030] opacity-40 grayscale'
                }`}
                style={earned ? { backgroundColor: '#fefce8' } : {}}
              >
                <span className="text-3xl">{badge.icon}</span>
                <div>
                  <p className={`text-xs font-bold ${earned ? 'text-yellow-800' : 'text-gray-500 dark:text-gray-400'}`}>
                    {badge.label}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{badge.description}</p>
                  {earned && awardedAt && (
                    <p className="text-[10px] mt-1" style={{ color: '#b48840' }}>
                      {new Date(awardedAt).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Link para o ranking */}
      <Link
        href="/ranking"
        className="flex items-center justify-between px-5 py-4 bg-white dark:bg-[#0d1020] rounded-2xl border border-gray-100 dark:border-[#1e2030] hover:shadow-md transition group"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Ver ranking geral</p>
            <p className="text-xs text-gray-400">Compare sua pontuação com outros membros</p>
          </div>
        </div>
        <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  )
}
