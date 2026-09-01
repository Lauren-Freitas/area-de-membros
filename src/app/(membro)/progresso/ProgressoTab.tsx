import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Image from 'next/image'
import Link from 'next/link'
import { getLevelInfo, BADGES } from '@/lib/xp'

export async function ProgressoTab({ userId }: { userId: string }) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const [{ data: profile }, xpResult, { data: badgesData }, { count: lessonsCompleted }, { data: certsData }] = await Promise.all([
    supabase.from('profiles').select('name, avatar_url, bio').eq('id', userId).single(),
    adminClient.from('user_xp_totals').select('total_xp').eq('user_id', userId).maybeSingle(),
    adminClient.from('user_badges').select('badge_key, awarded_at').eq('user_id', userId),
    supabase.from('lesson_progress').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    // Client autenticado do próprio membro -- mesma leitura já usada em
    // /certificado/[id], só a lista em vez de um registro único. Sem adminClient
    // aqui: não é necessário, o próprio membro já pode ler seus certificados.
    supabase.from('certificates').select('id, issued_at, products(title)').eq('user_id', userId).order('issued_at', { ascending: false }),
  ])

  const certificates = (certsData ?? []).map(c => ({
    id: c.id as string,
    issuedAt: c.issued_at as string,
    productTitle: ((Array.isArray(c.products) ? c.products[0] : c.products) as { title: string } | null)?.title ?? 'Curso',
  }))

  const totalXp = (xpResult.data as { total_xp?: number } | null)?.total_xp ?? 0
  const { cur, next, xpInLevel, xpNeeded, pct } = getLevelInfo(totalXp)
  const earnedKeys = new Set((badgesData ?? []).map(b => b.badge_key))
  const badgeMap = Object.fromEntries((badgesData ?? []).map(b => [b.badge_key, b.awarded_at]))

  const name = profile?.name ?? 'Usuário'
  const avatarUrl = (profile as { avatar_url?: string | null } | null)?.avatar_url ?? null
  const bio = (profile as { bio?: string | null } | null)?.bio ?? null
  const initials = name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()

  return (
    <div className="space-y-6">
      {/* Cabeçalho do perfil */}
      <div className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] overflow-hidden">
        <div className="h-24" style={{ background: 'linear-gradient(135deg, var(--brand-bg) 0%, var(--brand) 100%)' }} />

        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={name}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-[var(--card)]"
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white border-4 border-white dark:border-[var(--card)]"
                  style={{ backgroundColor: 'var(--brand)' }}
                >
                  {initials}
                </div>
              )}
              <div
                className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: 'var(--brand)' }}
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

          <div className="flex items-center gap-6 mt-4 text-center">
            <div>
              <p className="text-xl font-bold" style={{ color: 'var(--brand)' }}>{totalXp}</p>
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
      <div className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nível atual</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
              {cur.level}: <span style={{ color: 'var(--brand)' }}>{cur.label}</span>
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
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--brand), #f5c842)' }}
          />
        </div>

        {next ? (
          <p className="text-xs text-gray-400">
            <span className="font-semibold" style={{ color: 'var(--brand)' }}>{xpInLevel} XP</span>
            {' '}de{' '}
            <span className="font-semibold">{xpNeeded} XP</span>
            {' '}para o nível {next.level} · {pct}%
          </p>
        ) : (
          <p className="text-xs font-semibold" style={{ color: 'var(--brand)' }}>Nível máximo atingido! 🏆</p>
        )}
      </div>

      {/* Conquistas / Badges */}
      <div className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] p-5">
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
                    <p className="text-[10px] mt-1" style={{ color: 'var(--brand)' }}>
                      {new Date(awardedAt).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Certificados -- histórico permanente; a celebração do momento vive na
          página do produto e na notificação do sino, isto aqui é só o arquivo. */}
      <div className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] p-5">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Certificados</h2>
        {certificates.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">Você ainda não possui certificados.</p>
        ) : (
          <div className="space-y-3">
            {certificates.map(cert => (
              <div
                key={cert.id}
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-gray-100 dark:border-[#1e2030]"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{cert.productTitle}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Emitido em {new Date(cert.issuedAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <Link href={`/certificado/${cert.id}`} className="shrink-0 text-xs font-semibold" style={{ color: 'var(--brand)' }}>
                  Ver certificado →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
