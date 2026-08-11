import { createAdminClient } from '@/lib/supabase/admin'
import { ACTION_STYLE, ENTITY_LABEL, ROLE_STYLE, relativeTime } from '@/lib/activity-labels'

export const dynamic = 'force-dynamic'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function Initials({ name, role }: { name: string; role: string }) {
  const initials = name.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase() || '?'
  const color = ROLE_STYLE[role]?.color ?? '#6b7280'
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  )
}

const PERIOD_LABEL: Record<string, string> = {
  hoje: 'Hoje',
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
}

function periodSince(periodo?: string): string | null {
  if (periodo === 'hoje') return new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
  if (periodo === '7d') return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  if (periodo === '30d') return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  return null
}

export default async function AtividadesPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; periodo?: string; ator?: string }>
}) {
  const { tipo, periodo, ator } = await searchParams
  const admin = createAdminClient()

  let query = admin
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300)

  if (tipo) query = query.eq('entity', tipo)
  const since = periodSince(periodo)
  if (since) query = query.gte('created_at', since)
  if (ator) query = query.eq('user_name', ator)

  // Lista de atores pro seletor vem de uma consulta separada, sem o filtro de
  // ator aplicado — senão, ao escolher um ator, o próprio seletor "esquece"
  // todos os outros nomes possíveis (só sobraria o já selecionado).
  const [{ data: logs }, { data: actorRows }] = await Promise.all([
    query,
    admin.from('activity_logs').select('user_name').order('user_name').limit(1000),
  ])

  const entityTypes = Object.keys(ENTITY_LABEL)
  const actors = [...new Set((actorRows ?? []).map(r => r.user_name).filter(Boolean))].sort()

  // Monta o link de cada filtro preservando os outros já ativos — trocar o
  // período não deve resetar o tipo escolhido, e vice-versa.
  function filterHref(overrides: { tipo?: string; periodo?: string; ator?: string }) {
    const params = new URLSearchParams()
    const next = { tipo, periodo, ator, ...overrides }
    if (next.tipo) params.set('tipo', next.tipo)
    if (next.periodo) params.set('periodo', next.periodo)
    if (next.ator) params.set('ator', next.ator)
    const qs = params.toString()
    return `/admin/atividades${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="max-w-5xl">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Atividades</h1>
        <p className="text-sm text-gray-500 mt-0.5">Histórico de ações realizadas no painel administrativo.</p>
      </div>

      {/* Filtro de tipo */}
      <div className="flex flex-wrap gap-2 mb-3">
        <a
          href={filterHref({ tipo: undefined })}
          className="px-3 py-1 rounded-full text-xs font-medium border transition"
          style={!tipo
            ? { backgroundColor: 'var(--brand)', color: '#fff', borderColor: 'var(--brand)' }
            : { backgroundColor: 'transparent', color: '#6b7280', borderColor: '#e5e7eb' }}
        >
          Todas
        </a>
        {entityTypes.map(e => (
          <a
            key={e}
            href={filterHref({ tipo: e })}
            className="px-3 py-1 rounded-full text-xs font-medium border transition"
            style={tipo === e
              ? { backgroundColor: 'var(--brand)', color: '#fff', borderColor: 'var(--brand)' }
              : { backgroundColor: 'transparent', color: '#6b7280', borderColor: '#e5e7eb' }}
          >
            {ENTITY_LABEL[e]}
          </a>
        ))}
      </div>

      {/* Filtros de período e ator */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="flex flex-wrap gap-1.5">
          <a
            href={filterHref({ periodo: undefined })}
            className="px-3 py-1 rounded-full text-xs font-medium border transition"
            style={!periodo
              ? { backgroundColor: '#111827', color: '#fff', borderColor: '#111827' }
              : { backgroundColor: 'transparent', color: '#6b7280', borderColor: '#e5e7eb' }}
          >
            Tudo
          </a>
          {Object.entries(PERIOD_LABEL).map(([key, label]) => (
            <a
              key={key}
              href={filterHref({ periodo: key })}
              className="px-3 py-1 rounded-full text-xs font-medium border transition"
              style={periodo === key
                ? { backgroundColor: '#111827', color: '#fff', borderColor: '#111827' }
                : { backgroundColor: 'transparent', color: '#6b7280', borderColor: '#e5e7eb' }}
            >
              {label}
            </a>
          ))}
        </div>

        {actors.length > 1 && (
          <>
            <span className="w-px h-4 bg-gray-200 mx-1" />
            <div className="flex flex-wrap gap-1.5">
              <a
                href={filterHref({ ator: undefined })}
                className="px-3 py-1 rounded-full text-xs font-medium border transition"
                style={!ator
                  ? { backgroundColor: '#111827', color: '#fff', borderColor: '#111827' }
                  : { backgroundColor: 'transparent', color: '#6b7280', borderColor: '#e5e7eb' }}
              >
                Todos os autores
              </a>
              {actors.map(name => (
                <a
                  key={name}
                  href={filterHref({ ator: name })}
                  className="px-3 py-1 rounded-full text-xs font-medium border transition"
                  style={ator === name
                    ? { backgroundColor: '#111827', color: '#fff', borderColor: '#111827' }
                    : { backgroundColor: 'transparent', color: '#6b7280', borderColor: '#e5e7eb' }}
                >
                  {name}
                </a>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Lista */}
      {!logs || logs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          {tipo || periodo || ator ? (
            <>
              <p className="text-sm">Nenhuma atividade encontrada com esses filtros.</p>
              <a href="/admin/atividades" className="text-xs mt-1 inline-block hover:underline" style={{ color: 'var(--brand)' }}>
                Limpar filtros
              </a>
            </>
          ) : (
            <>
              <p className="text-sm">Nenhuma atividade registrada ainda.</p>
              <p className="text-xs mt-1">As ações feitas no painel aparecerão aqui.</p>
            </>
          )}
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] divide-y divide-gray-100 dark:divide-[#1e2030]">
          {logs.map((log) => {
            const actionStyle = ACTION_STYLE[log.action] ?? { label: log.action, bg: '#f3f4f6', text: '#374151' }
            const entityLabel = ENTITY_LABEL[log.entity] ?? log.entity
            const roleInfo = ROLE_STYLE[log.user_role]

            return (
              <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                {/* Avatar */}
                <Initials name={log.user_name} role={log.user_role} />

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{log.user_name}</span>
                    {roleInfo && (
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ color: roleInfo.color, backgroundColor: roleInfo.color + '18' }}
                      >
                        {roleInfo.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: actionStyle.bg, color: actionStyle.text }}
                    >
                      {actionStyle.label}
                    </span>
                    <span className="text-xs text-gray-500">{entityLabel}</span>
                    {log.entity_name && (
                      <span className="text-xs font-medium text-gray-700 truncate max-w-xs">
                        · {log.entity_name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Timestamp */}
                <div className="shrink-0 text-right" title={formatDate(log.created_at)}>
                  <span className="text-xs text-gray-400">{relativeTime(log.created_at)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
