import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { getLevelInfo } from '@/lib/xp'

interface RankingRow {
  user_id: string
  name: string
  lessons_completed: number
  total_points: number
}

const medals = ['🥇', '🥈', '🥉']
const podiumColors = [
  { bg: 'var(--brand-bg)', border: 'var(--brand)', text: 'var(--brand-text)', height: 'h-28' },
  { bg: '#f8f8f8', border: '#9ca3af', text: '#6b7280', height: 'h-20' },
  { bg: '#fdf3e6', border: '#d97706', text: '#92400e', height: 'h-16' },
]

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function formatPoints(pts: number) {
  return pts >= 1000 ? `${(pts / 1000).toFixed(1)}k` : String(pts)
}

export async function RankingTab({ userId }: { userId: string }) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const [{ data: rankingData }, xpResult] = await Promise.all([
    adminClient.rpc('get_member_ranking'),
    adminClient.from('user_xp_totals').select('total_xp').eq('user_id', userId).maybeSingle(),
  ])
  const ranking: RankingRow[] = rankingData ?? []
  const totalXp = (xpResult.data as { total_xp?: number } | null)?.total_xp ?? 0
  const { cur } = getLevelInfo(totalXp)

  const top3 = ranking.slice(0, 3)
  const myPosition = ranking.findIndex(r => r.user_id === userId)
  const myRow = myPosition >= 0 ? ranking[myPosition] : null

  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean)
  const podiumPositions = [1, 0, 2]

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Os membros mais engajados. Pontos: conclusão de aula (+50), avaliação (+25), comentário (+25).
        {' '}Isso é diferente do seu <Link href="/progresso" className="underline hover:no-underline">XP e nível</Link>: o XP mede seu progresso pessoal, o ranking compara você com outros membros.
      </p>

      {myRow && (
        <div
          className="flex items-center gap-4 px-5 py-4 rounded-2xl border"
          style={{ backgroundColor: 'var(--brand-bg)', borderColor: 'var(--brand-border)' }}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ backgroundColor: '#ede0c8', border: '2px solid var(--brand)', color: 'var(--brand-text)' }}>
            {initials(myRow.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--brand-text)' }}>Sua posição: {myPosition + 1}º</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {myRow.lessons_completed} aula{myRow.lessons_completed !== 1 ? 's' : ''} concluída{myRow.lessons_completed !== 1 ? 's' : ''}
              {' · '}Nível {cur.level}: {cur.label}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-bold" style={{ color: 'var(--brand)' }}>{formatPoints(myRow.total_points)}</p>
            <p className="text-xs text-gray-400">pontos</p>
          </div>
        </div>
      )}

      {ranking.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🏆</p>
          <p className="font-medium">Ninguém no ranking ainda.</p>
          <p className="text-sm mt-1">Comece a concluir aulas para aparecer aqui!</p>
        </div>
      ) : (
        <>
          {top3.length >= 2 && (
            <div className="flex items-end justify-center gap-4 pt-4">
              {podiumOrder.map((member, i) => {
                const rankIdx = podiumPositions[i]
                const colors = podiumColors[rankIdx]
                const isMe = member.user_id === userId
                return (
                  <div key={member.user_id} className="flex flex-col items-center gap-2">
                    <div
                      className={`relative w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold ${isMe ? 'ring-4 ring-yellow-400' : ''}`}
                      style={{ backgroundColor: colors.bg, border: `2px solid ${colors.border}`, color: colors.text }}
                    >
                      {initials(member.name)}
                      <span className="absolute -top-3 text-xl">{medals[rankIdx]}</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 max-w-[80px] text-center leading-tight truncate">
                      {member.name.split(' ')[0]}
                    </p>
                    <p className="text-xs font-bold" style={{ color: 'var(--brand)' }}>{formatPoints(member.total_points)} pts</p>
                    <div
                      className={`w-24 ${colors.height} rounded-t-lg flex items-center justify-center text-sm font-bold`}
                      style={{ backgroundColor: colors.bg, borderTop: `3px solid ${colors.border}`, color: colors.text }}
                    >
                      {rankIdx + 1}º
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] overflow-hidden">
            <div className="divide-y divide-gray-50 dark:divide-gray-700">
              {ranking.slice(0, 50).map((member, idx) => {
                const isMe = member.user_id === userId
                const medal = medals[idx]
                return (
                  <div
                    key={member.user_id}
                    className={`flex items-center gap-4 px-5 py-3.5 transition ${!isMe ? 'hover:bg-gray-50 dark:hover:bg-gray-700' : ''}`}
                    style={isMe ? { backgroundColor: 'var(--brand-bg)' } : {}}
                  >
                    <span
                      className="text-sm font-bold w-8 text-center shrink-0"
                      style={isMe ? { color: 'var(--brand)' } : { color: '#9ca3af' }}
                    >
                      {medal ?? `${idx + 1}º`}
                    </span>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{
                        backgroundColor: isMe ? 'var(--brand-bg)' : '#f3f4f6',
                        border: `2px solid ${isMe ? 'var(--brand)' : '#e5e7eb'}`,
                        color: isMe ? 'var(--brand-text)' : '#6b7280',
                      }}
                    >
                      {initials(member.name)}
                    </div>
                    <span
                      className="text-sm font-medium flex-1 truncate"
                      style={isMe ? { color: 'var(--brand-text)', fontWeight: 600 } : { color: undefined }}
                    >
                      <span className="text-gray-800 dark:text-gray-200" style={isMe ? { color: 'var(--brand-text)' } : {}}>
                        {member.name}{isMe ? ' (você)' : ''}
                      </span>
                    </span>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold" style={{ color: 'var(--brand)' }}>{formatPoints(member.total_points)}</p>
                      <p className="text-[10px] text-gray-400">{member.lessons_completed} aulas</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-gray-400 flex-wrap">
            <span>✅ Aula concluída = <strong>50 pts</strong></span>
            <span>⭐ Avaliação = <strong>25 pts</strong></span>
            <span>💬 Comentário = <strong>25 pts</strong></span>
          </div>
        </>
      )}
    </div>
  )
}
