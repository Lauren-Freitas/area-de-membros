import { createAdminClient } from '@/lib/supabase/admin'
import { Badge, type BadgeTone } from '@/components/Badge'
import { EmptyState } from '@/components/EmptyState'
import { relativeTime } from '@/lib/activity-labels'

export const dynamic = 'force-dynamic'

const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  processed: { label: 'Processado', tone: 'success' },
  failed: { label: 'Falhou', tone: 'danger' },
  ignored: { label: 'Ignorado', tone: 'neutral' },
}

const PROVIDERS = ['asaas', 'kiwify']

function fmtFull(d: string) {
  return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default async function WebhooksEntradaPage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string; status?: string }>
}) {
  const { provider, status } = await searchParams
  const admin = createAdminClient()

  let query = admin
    .from('webhook_logs')
    .select('id, event_type, provider, status, payload, error_message, asaas_payment_id, created_at')
    .order('created_at', { ascending: false })
    .limit(150)

  if (provider) query = query.eq('provider', provider)
  if (status) query = query.eq('status', status)

  const { data: logs } = await query

  function filterHref(overrides: { provider?: string; status?: string }) {
    const params = new URLSearchParams()
    const next = { provider, status, ...overrides }
    if (next.provider) params.set('provider', next.provider)
    if (next.status) params.set('status', next.status)
    const qs = params.toString()
    return `/admin/cobranca/webhooks-entrada${qs ? `?${qs}` : ''}`
  }

  function pillStyle(active: boolean) {
    return active
      ? { backgroundColor: '#111827', color: '#fff', borderColor: '#111827' }
      : { backgroundColor: 'transparent', color: '#6b7280', borderColor: '#e5e7eb' }
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Webhooks de entrada</h1>
        <p className="text-sm text-gray-500 mt-0.5 max-w-2xl">
          Eventos de pagamento recebidos do Asaas e da Kiwify. Cada compra, atraso ou estorno gera um evento aqui, mesmo quando falha ao processar. Não afeta a API pública nem os webhooks de saída configurados em Integrações.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          <a href={filterHref({ provider: undefined })} className="px-3 py-1 rounded-full text-xs font-medium border transition" style={pillStyle(!provider)}>
            Todos os provedores
          </a>
          {PROVIDERS.map(p => (
            <a key={p} href={filterHref({ provider: p })} className="px-3 py-1 rounded-full text-xs font-medium border transition capitalize" style={pillStyle(provider === p)}>
              {p}
            </a>
          ))}
        </div>
        <span className="w-px h-4 bg-gray-200 mx-1" />
        <div className="flex flex-wrap gap-1.5">
          <a href={filterHref({ status: undefined })} className="px-3 py-1 rounded-full text-xs font-medium border transition" style={pillStyle(!status)}>
            Todos os status
          </a>
          {Object.entries(STATUS).map(([key, { label }]) => (
            <a key={key} href={filterHref({ status: key })} className="px-3 py-1 rounded-full text-xs font-medium border transition" style={pillStyle(status === key)}>
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* Lista */}
      {!logs || logs.length === 0 ? (
        <div className="bg-card rounded-2xl border border-dashed border-gray-200">
          <EmptyState
            title={provider || status ? 'Nenhum evento encontrado com esses filtros.' : 'Nenhum evento recebido ainda.'}
            description={!provider && !status ? 'Eventos de pagamento do Asaas e da Kiwify aparecem aqui automaticamente.' : undefined}
          />
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-gray-100 divide-y divide-gray-100">
          {logs.map(log => {
            const statusInfo = STATUS[log.status] ?? { label: log.status, tone: 'neutral' as BadgeTone }
            return (
              <details key={log.id} className="group px-4 py-3">
                <summary className="flex items-center gap-3 cursor-pointer select-none list-none">
                  <svg className="w-3.5 h-3.5 text-gray-300 shrink-0 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide shrink-0 w-16 capitalize">{log.provider}</span>
                  <span className="text-sm font-medium text-gray-800 flex-1 min-w-0 truncate">{log.event_type}</span>
                  {log.error_message && (
                    <span className="text-xs text-red-500 truncate max-w-xs hidden sm:block">{log.error_message}</span>
                  )}
                  <Badge tone={statusInfo.tone}>{statusInfo.label}</Badge>
                  <span className="text-xs text-gray-400 shrink-0 w-16 text-right" title={fmtFull(log.created_at)}>{relativeTime(log.created_at)}</span>
                </summary>
                <div className="mt-3 ml-6 space-y-2">
                  {log.error_message && (
                    <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{log.error_message}</p>
                  )}
                  <pre className="bg-gray-900 text-gray-100 rounded-xl p-3.5 text-[11px] overflow-x-auto leading-relaxed max-h-64">
                    {JSON.stringify(log.payload, null, 2)}
                  </pre>
                </div>
              </details>
            )
          })}
        </div>
      )}
    </div>
  )
}
