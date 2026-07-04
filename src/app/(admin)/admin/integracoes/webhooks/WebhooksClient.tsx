'use client'

import { useActionState, useState } from 'react'
import { createOutboundWebhook, deleteOutboundWebhook, toggleOutboundWebhook } from '@/lib/actions/integracoes'

interface Webhook {
  id: string
  name: string
  url: string
  product_id: string | null
  is_active: boolean
  created_at: string
  last_fired_at: string | null
  last_status: number | null
  products: { title: string } | null
}

interface Product { id: string; title: string }

function fmt(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

function StatusBadge({ status }: { status: number | null }) {
  if (!status) return <span className="text-gray-300 text-xs">—</span>
  const ok = status >= 200 && status < 300
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
      {status}
    </span>
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
      <div className="bg-white dark:bg-[#0d1020] rounded-2xl border border-gray-100 dark:border-[#1e2030] p-4 flex flex-wrap items-center gap-3">
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
          style={{ backgroundColor: '#b48840' }}
        >
          + Criar webhook
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form action={action} className="bg-white dark:bg-[#0d1020] rounded-2xl border border-gray-100 dark:border-[#1e2030] p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Novo webhook de saída</h2>
          <p className="text-xs text-gray-400">A plataforma enviará um POST para a URL configurada sempre que uma venda for concluída.</p>
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
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
            <p className="font-semibold mb-1">Payload enviado (exemplo):</p>
            <pre className="font-mono text-[11px] leading-relaxed">{JSON.stringify({ event: 'sale.created', timestamp: new Date().toISOString(), user_id: 'uuid', product_id: 'uuid', user_name: 'João Silva', user_email: 'joao@email.com' }, null, 2)}</pre>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#b48840' }}
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
      <div className="bg-white dark:bg-[#0d1020] rounded-2xl border border-gray-100 dark:border-[#1e2030] p-5">
        {/* Header row */}
        <div className="flex items-center pb-3 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <span className="w-32 shrink-0">Produto</span>
          <span className="flex-1">Nome</span>
          <span className="flex-1">URL</span>
          <span className="w-28 shrink-0">Último disparo</span>
          <span className="w-20 shrink-0">Status</span>
          <span className="w-24 shrink-0" />
        </div>
        {/* Rows */}
        <div className="divide-y divide-gray-100">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              Nenhum webhook configurado ainda.
            </div>
          ) : filtered.map(w => (
            <div key={w.id} className={`flex items-center py-3.5 hover:bg-gray-50 transition ${!w.is_active ? 'opacity-50' : ''}`}>
              <span className="w-32 shrink-0 text-xs text-gray-500">
                {w.products?.title ?? <span className="italic text-gray-300">Todos</span>}
              </span>
              <span className="flex-1 font-medium text-gray-900 text-sm">{w.name}</span>
              <div className="flex-1">
                <code className="text-xs text-gray-500 truncate block max-w-[200px]">{w.url}</code>
              </div>
              <span className="w-28 shrink-0 text-xs text-gray-400">{fmt(w.last_fired_at)}</span>
              <span className="w-20 shrink-0"><StatusBadge status={w.last_status} /></span>
              <div className="w-24 shrink-0 flex items-center gap-3 justify-end">
                <form action={toggleOutboundWebhook.bind(null, w.id, w.is_active)}>
                  <button type="submit" className="text-xs text-gray-400 hover:text-gray-700 transition">
                    {w.is_active ? 'Pausar' : 'Ativar'}
                  </button>
                </form>
                <form action={deleteOutboundWebhook.bind(null, w.id)}>
                  <button type="submit" className="text-xs text-red-400 hover:text-red-600 transition font-medium">
                    Excluir
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
        {/* Footer */}
        <div className="pt-3 mt-1 border-t border-gray-100 flex items-center justify-center gap-2 text-sm text-gray-400">
          <svg className="w-4 h-4 text-blue-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
          </svg>
          Aprenda mais sobre os <a href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700 transition" style={{ color: '#b48840' }}>webhooks no n8n</a>
        </div>
      </div>
    </div>
  )
}
