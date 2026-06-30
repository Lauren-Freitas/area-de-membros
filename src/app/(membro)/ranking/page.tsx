import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

interface RankingRow {
  user_id: string
  name: string
  lessons_completed: number
}

const medals = ['🥇', '🥈', '🥉']
const podiumColors = [
  { bg: '#fdf8e6', border: '#c9a84c', text: '#92710a', height: 'h-28' },  // 1st
  { bg: '#f8f8f8', border: '#9ca3af', text: '#6b7280', height: 'h-20' },  // 2nd
  { bg: '#fdf3e6', border: '#d97706', text: '#92400e', height: 'h-16' },  // 3rd
]

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export default async function RankingPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rankingData } = await adminClient.rpc('get_member_ranking')
  const ranking: RankingRow[] = rankingData ?? []

  const top3 = ranking.slice(0, 3)
  const rest = ranking.slice(3)
  const myPosition = ranking.findIndex(r => r.user_id === user.id)

  // Ordenar pódio: 2º | 1º | 3º
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean)
  const podiumPositions = [1, 0, 2] // índices correspondentes no ranking (0-based)

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ranking</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Os membros mais engajados da comunidade.</p>
      </div>

      {ranking.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🏆</p>
          <p className="font-medium">Ninguém no ranking ainda.</p>
          <p className="text-sm mt-1">Comece a concluir aulas para aparecer aqui!</p>
        </div>
      ) : (
        <>
          {/* Pódio */}
          {top3.length >= 2 && (
            <div className="flex items-end justify-center gap-4 pt-6">
              {podiumOrder.map((member, i) => {
                const rankIdx = podiumPositions[i]
                const colors = podiumColors[rankIdx]
                const isMe = member.user_id === user.id
                return (
                  <div key={member.user_id} className="flex flex-col items-center gap-2">
                    {/* Avatar */}
                    <div className={`relative w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold ${isMe ? 'ring-4 ring-yellow-400' : ''}`}
                      style={{
                        backgroundColor: colors.bg,
                        border: `2px solid ${colors.border}`,
                        color: colors.text,
                      }}
                    >
                      {initials(member.name)}
                      <span className="absolute -top-3 text-xl">{medals[rankIdx]}</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 max-w-[80px] text-center leading-tight truncate">
                      {member.name.split(' ')[0]}
                    </p>
                    <p className="text-xs text-gray-400">{member.lessons_completed} aulas</p>
                    {/* Base do pódio */}
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

          {/* Minha posição (se fora do top 10 visível) */}
          {myPosition >= 10 && (
            <div
              className="flex items-center gap-4 px-5 py-3 rounded-xl border"
              style={{ backgroundColor: '#fdf8e6', borderColor: '#f0d98c' }}
            >
              <span className="text-sm font-bold w-8 text-center" style={{ color: '#c9a84c' }}>
                {myPosition + 1}º
              </span>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#fdf8e6', border: '2px solid #c9a84c', color: '#92710a' }}>
                {initials(ranking[myPosition].name)}
              </div>
              <span className="text-sm font-semibold text-gray-800 flex-1">Você</span>
              <span className="text-sm text-gray-500">{ranking[myPosition].lessons_completed} aulas</span>
            </div>
          )}

          {/* Lista completa */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="divide-y divide-gray-50 dark:divide-gray-700">
              {ranking.slice(0, 50).map((member, idx) => {
                const isMe = member.user_id === user.id
                const medal = medals[idx]
                return (
                  <div
                    key={member.user_id}
                    className={`flex items-center gap-4 px-5 py-3.5 ${isMe ? '' : 'hover:bg-gray-50 dark:hover:bg-gray-700'} transition`}
                    style={isMe ? { backgroundColor: '#fdf8e6' } : {}}
                  >
                    <span className={`text-sm font-bold w-8 text-center shrink-0 ${isMe ? '' : 'text-gray-400'}`}
                      style={isMe ? { color: '#c9a84c' } : {}}>
                      {medal ?? `${idx + 1}º`}
                    </span>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{
                        backgroundColor: isMe ? '#fdf8e6' : '#f3f4f6',
                        border: isMe ? '2px solid #c9a84c' : '2px solid #e5e7eb',
                        color: isMe ? '#92710a' : '#6b7280',
                      }}
                    >
                      {initials(member.name)}
                    </div>
                    <span className={`text-sm font-medium flex-1 ${isMe ? '' : 'text-gray-800 dark:text-gray-200'}`}
                      style={isMe ? { color: '#92710a', fontWeight: 600 } : {}}>
                      {member.name}{isMe ? ' (você)' : ''}
                    </span>
                    <span className="text-sm text-gray-400 shrink-0">
                      {member.lessons_completed} aula{member.lessons_completed !== 1 ? 's' : ''}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
