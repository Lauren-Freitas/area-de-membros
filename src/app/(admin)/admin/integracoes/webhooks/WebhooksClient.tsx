'use client'

import { useActionState, useState, useTransition } from 'react'
import {
  createOutboundWebhook, deleteOutboundWebhook, toggleOutboundWebhook, updateOutboundWebhook,
  getWebhookDeliveries, resendWebhookDelivery, testOutboundWebhook, type WebhookDelivery,
} from '@/lib/actions/integracoes'
import { DeleteConfirmButton } from '@/components/DeleteConfirmButton'
import { ALL_WEBHOOK_EVENTS, type WebhookEvent } from '@/lib/fire-webhooks'

interface Webhook {
  id: string
  name: string
  url: string
  product_id: string | null
  is_active: boolean
  events: string[] | null
  created_at: string
  last_fired_at: string | null
  last_status: number | null
  products: { title: string } | null
}

interface Product { id: string; title: string }

const EVENT_LABELS: Record<WebhookEvent, string> = {
  'member.created': 'Membro criado',
  'member.updated': 'Membro atualizado',
  'member.deleted': 'Membro excluído',
  'member.enabled': 'Membro ativado',
  'member.disabled': 'Membro desativado',
  'access.granted': 'Acesso concedido',
  'access.revoked': 'Acesso revogado',
  'sale.approved': 'Venda aprovada',
  'sale.refused': 'Venda recusada',
  'sale.refunded': 'Venda reembolsada',
  'payment.approved': 'Pagamento aprovado',
  'payment.failed': 'Pagamento falhou',
  'payment.overdue': 'Pagamento em atraso',
  'payment.refunded': 'Pagamento reembolsado',
  'certificate.issued': 'Certificado emitido',
  'invite.sent': 'Convite enviado',
  'invite.accepted': 'Convite aceito',
  'login.created': 'Login realizado',
}

function fmt(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

function fmtFull(d: string) {
  return new Date(d).toLocaleString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function StatusBadge({ status }: { status: number | null }) {
  if (!status) return <span className="text-gray-300 text-xs">—</span>
  const ok = status >= 200 && status < 300
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${ok ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
      {status}
    </span>
  )
}

function EventCheckboxes({ defaultSelected }: { defaultSelected: string[] }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        Eventos <span className="text-gray-400">(opcional — vazio recebe todos)</span>
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto border border-gray-200 dark:border-[#374151] rounded-lg p-2.5">
        {ALL_WEBHOOK_EVENTS.map(ev => (
          <label key={ev} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
            <input type="checkbox" name="events" value={ev} defaultChecked={defaultSelected.includes(ev)} className="rounded border-gray-300" />
            {EVENT_LABELS[ev]}
          </label>
        ))}
      </div>
    </div>
  )
}

function WebhookRow({ webhook, products }: { webhook: Webhook; products: Product[] }) {
  const [expanded, setExpanded] = useState(false)
  const [editState, editAction, editPending] = useActionState(updateOutboundWebhook.bind(null, webhook.id), null)
  const [deliveries, setDeliveries] = useState<WebhookDelivery[] | null>(null)
  const [loadingDeliveries, setLoadingDeliveries] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; status: number } | { error: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  async function loadDeliveries() {
    setLoadingDeliveries(true)
    const data = await getWebhookDeliveries(webhook.id)
    setDeliveries(data)
    setLoadingDeliveries(false)
  }

  function toggleExpanded() {
    const next = !expanded
    setExpanded(next)
    if (next && deliveries === null) loadDeliveries()
  }

  function handleTest() {
    setTestResult(null)
    startTransition(async () => {
      const res = await testOutboundWebhook(webhook.id)
      setTestResult(res)
      if (expanded) loadDeliveries()
    })
  }

  function handleResend(deliveryId: string) {
    startTransition(async () => {
      await resendWebhookDelivery(deliveryId)
      loadDeliveries()
    })
  }

  return (
    <div className={`border-b border-gray-100 last:border-b-0 ${!webhook.is_active ? 'opacity-50' : ''}`}>
      <div className="flex items-center py-3.5 hover:bg-gray-50 transition">
        <span className="w-32 shrink-0 text-xs text-gray-500">
          {webhook.products?.title ?? <span className="italic text-gray-300">Todos</span>}
        </span>
        <span className="flex-1 font-medium text-gray-900 text-sm">{webhook.name}</span>
        <div className="flex-1">
          <code className="text-xs text-gray-500 truncate block max-w-[200px]">{webhook.url}</code>
        </div>
        <span className="w-28 shrink-0 text-xs text-gray-400">{fmt(webhook.last_fired_at)}</span>
        <span className="w-20 shrink-0"><StatusBadge status={webhook.last_status} /></span>
        <div className="w-40 shrink-0 flex items-center gap-3 justify-end">
          <button onClick={toggleExpanded} className="text-xs text-gray-400 hover:text-gray-700 transition">
            {expanded ? 'Fechar' : 'Detalhes'}
          </button>
          <form action={toggleOutboundWebhook.bind(null, webhook.id, webhook.is_active)}>
            <button type="submit" className="text-xs text-gray-400 hover:text-gray-700 transition">
              {webhook.is_active ? 'Pausar' : 'Ativar'}
            </button>
          </form>
          <DeleteConfirmButton
            onDelete={() => deleteOutboundWebhook(webhook.id)}
            title="Excluir webhook"
            message="Esse endpoint deixará de receber notificações da plataforma."
            className="text-xs text-red-400 hover:text-red-600 transition font-medium"
          />
        </div>
      </div>

      {expanded && (
        <div className="pb-5 space-y-4">
          <form action={editAction} className="bg-gray-50 dark:bg-[#0d1117] rounded-lg p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Editar</p>
            {editState?.error && <p className="text-sm text-red-600">{editState.error}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nome</label>
                <input name="name" defaultValue={webhook.name} required className="w-full px-3 py-1.5 border border-gray-200 dark:border-[#374151] rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#111827]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">URL</label>
                <input name="url" type="url" defaultValue={webhook.url} required className="w-full px-3 py-1.5 border border-gray-200 dark:border-[#374151] rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#111827]" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Produto</label>
              <select name="product_id" defaultValue={webhook.product_id ?? ''} className="w-full px-3 py-1.5 border border-gray-200 dark:border-[#374151] rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#111827]">
                <option value="">Todos os produtos</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <EventCheckboxes defaultSelected={webhook.events ?? []} />
            <div className="flex items-center gap-2 flex-wrap">
              <button type="submit" disabled={editPending} className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: 'var(--brand)' }}>
                {editPending ? 'Salvando...' : 'Salvar alterações'}
              </button>
              <button type="button" onClick={handleTest} disabled={isPending} className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-60">
                Testar
              </button>
              {testResult && (
                'error' in testResult
                  ? <span className="text-xs text-red-600">{testResult.error}</span>
                  : <span className={`text-xs ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                      {testResult.success ? `Sucesso (${testResult.status})` : `Falhou (${testResult.status || 'sem resposta'})`}
                    </span>
              )}
            </div>
          </form>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Histórico de entregas</p>
            {loadingDeliveries ? (
              <p className="text-xs text-gray-400 py-3">Carregando...</p>
            ) : !deliveries?.length ? (
              <p className="text-xs text-gray-400 py-3">Nenhuma entrega registrada ainda.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {deliveries.map(d => (
                  <div key={d.id} className="flex items-center py-2 gap-3">
                    <span className="flex-1 text-xs font-mono text-gray-600">{d.event}</span>
                    <span className="w-32 shrink-0 text-xs text-gray-400">{fmtFull(d.attempted_at)}</span>
                    <span className="w-16 shrink-0"><StatusBadge status={d.response_status} /></span>
                    <button onClick={() => handleResend(d.id)} disabled={isPending} className="shrink-0 text-xs hover:underline disabled:opacity-60" style={{ color: 'var(--brand)' }}>
                      Reenviar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function WebhooksClient({ webhooks, products }: { webhooks: Webhook[]; products: Product[] }) {
  const [state, action, isPending] = useActionState(createOutboundWebhook, null)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [productFilter, setProductFilter] = useState('')

  const filtered = webhooks.filter(w => {
    const matchSearch = !search || w.name.toLowerCase().includes(search.toLowerCase()) || w.url.toLowerCase().includes(search.toLowerCase())
    const matchProduct = !productFilter || w.product_id === productFilter
    return matchSearch && matchProduct
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <a href="/admin/integracoes" className="text-gray-400 hover:text-gray-700 transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </a>
        <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Webhooks</h1>
      </div>

      {/* Toolbar */}
      <div className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 border border-gray-200 dark:border-[#374151] rounded-lg px-3 py-2 min-w-[180px]">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 bg-transparent outline-none"
          />
        </div>
        <select
          value={productFilter}
          onChange={e => setProductFilter(e.target.value)}
          className="border border-gray-200 dark:border-[#374151] rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-[#111827] focus:outline-none"
        >
          <option value="">Todos os produtos</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <div className="flex-1" />
        <button
          onClick={() => setShowForm(v => !v)}
          className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition hover:opacity-90 shrink-0"
          style={{ backgroundColor: 'var(--brand)' }}
        >
          + Criar webhook
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form action={action} className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Novo webhook de saída</h2>
          <p className="text-xs text-gray-400">A plataforma enviará um POST para a URL configurada sempre que um dos eventos selecionados acontecer.</p>
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                name="name"
                placeholder="Ex: n8n — Nova venda"
                className="w-full px-3 py-2 border border-gray-200 dark:border-[#374151] rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#111827] focus:outline-none focus:ring-2 focus:ring-yellow-300"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
              <input
                name="url"
                type="url"
                placeholder="https://n8n.seudominio.com/webhook/..."
                className="w-full px-3 py-2 border border-gray-200 dark:border-[#374151] rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#111827] focus:outline-none focus:ring-2 focus:ring-yellow-300"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por produto <span className="text-gray-400">(opcional)</span></label>
            <select
              name="product_id"
              className="w-full px-3 py-2 border border-gray-200 dark:border-[#374151] rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#111827] focus:outline-none focus:ring-2 focus:ring-yellow-300"
            >
              <option value="">Todos os produtos</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <EventCheckboxes defaultSelected={[]} />
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
            <p className="font-semibold mb-1">Payload enviado (exemplo):</p>
            <pre className="font-mono text-[11px] leading-relaxed">{JSON.stringify({ event: 'sale.approved', timestamp: new Date().toISOString(), user_id: 'uuid', product_id: 'uuid', user_name: 'João Silva', user_email: 'joao@email.com' }, null, 2)}</pre>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              {isPending ? 'Criando...' : 'Criar webhook'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] p-5">
        {/* Header row */}
        <div className="flex items-center pb-3 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <span className="w-32 shrink-0">Produto</span>
          <span className="flex-1">Nome</span>
          <span className="flex-1">URL</span>
          <span className="w-28 shrink-0">Último disparo</span>
          <span className="w-20 shrink-0">Status</span>
          <span className="w-40 shrink-0" />
        </div>
        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            Nenhum webhook configurado ainda.
          </div>
        ) : filtered.map(w => (
          <WebhookRow key={w.id} webhook={w} products={products} />
        ))}
        {/* Footer */}
        <div className="pt-3 mt-1 border-t border-gray-100 flex items-center justify-center gap-2 text-sm text-gray-400">
          <svg className="w-4 h-4 text-blue-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
          </svg>
          Aprenda mais sobre os <a href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700 transition" style={{ color: 'var(--brand)' }}>webhooks no n8n</a>
        </div>
      </div>
    </div>
  )
}
