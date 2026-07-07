import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const ACTION_STYLE: Record<string, { label: string; bg: string; text: string }> = {
  criar:             { label: 'Criou',            bg: '#dcfce7', text: '#15803d' },
  editar:            { label: 'Editou',            bg: '#dbeafe', text: '#1d4ed8' },
  excluir:           { label: 'Excluiu',           bg: '#fee2e2', text: '#b91c1c' },
  ativar:            { label: 'Ativou',            bg: '#d1fae5', text: '#065f46' },
  desativar:         { label: 'Desativou',         bg: '#f3f4f6', text: '#4b5563' },
  conceder_acesso:   { label: 'Concedeu acesso',   bg: '#d1fae5', text: '#065f46' },
  revogar_acesso:    { label: 'Revogou acesso',    bg: '#ffedd5', text: '#c2410c' },
  adicionar_turma:   { label: 'Adicionou à turma', bg: '#ede9fe', text: '#6d28d9' },
  remover_turma:     { label: 'Removeu da turma',  bg: '#fce7f3', text: '#9d174d' },
  salvar_aparencia:  { label: 'Salvou aparência',  bg: '#ede9fe', text: '#7c3aed' },
  restaurar_aparencia: { label: 'Restaurou aparência', bg: '#fef3c7', text: '#92400e' },
  ver_como:          { label: 'Visualizou como',   bg: '#e0f2fe', text: '#0369a1' },
}

const ENTITY_LABEL: Record<string, string> = {
  produto: 'Produto', modulo: 'Módulo', aula: 'Aula',
  membro: 'Membro', acesso: 'Acesso', banner: 'Banner',
  oferta: 'Oferta', turma: 'Turma', convite: 'Convite',
  api_key: 'API Key', webhook: 'Webhook', aparencia: 'Aparência',
}

const ROLE_STYLE: Record<string, { label: string; color: string }> = {
  admin:  { label: 'Admin',  color: '#b48840' },
  equipe: { label: 'Equipe', color: '#6d28d9' },
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60)  return 'agora mesmo'
  const m = Math.floor(s / 60)
  if (m < 60)  return `${m} min atrás`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h atrás`
  const d = Math.floor(h / 24)
  if (d < 30)  return `${d}d atrás`
  const mo = Math.floor(d / 30)
  return `${mo} mes${mo > 1 ? 'es' : ''} atrás`
}

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

export default async function AtividadesPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>
}) {
  const { tipo } = await searchParams
  const admin = createAdminClient()

  let query = admin
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300)

  if (tipo) query = query.eq('entity', tipo)

  const { data: logs } = await query

  const entityTypes = Object.keys(ENTITY_LABEL)

  return (
    <div className="max-w-5xl">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Atividades</h1>
        <p className="text-sm text-gray-500 mt-0.5">Histórico de ações realizadas no painel administrativo.</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        <a
          href="/admin/atividades"
          className="px-3 py-1 rounded-full text-xs font-medium border transition"
          style={!tipo
            ? { backgroundColor: '#b48840', color: '#fff', borderColor: '#b48840' }
            : { backgroundColor: 'transparent', color: '#6b7280', borderColor: '#e5e7eb' }}
        >
          Todas
        </a>
        {entityTypes.map(e => (
          <a
            key={e}
            href={`/admin/atividades?tipo=${e}`}
            className="px-3 py-1 rounded-full text-xs font-medium border transition"
            style={tipo === e
              ? { backgroundColor: '#b48840', color: '#fff', borderColor: '#b48840' }
              : { backgroundColor: 'transparent', color: '#6b7280', borderColor: '#e5e7eb' }}
          >
            {ENTITY_LABEL[e]}
          </a>
        ))}
      </div>

      {/* Lista */}
      {!logs || logs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm">Nenhuma atividade registrada ainda.</p>
          <p className="text-xs mt-1">As ações feitas no painel aparecerão aqui.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0d1020] rounded-2xl border border-gray-100 dark:border-[#1e2030] divide-y divide-gray-100 dark:divide-[#1e2030]">
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
