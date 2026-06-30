'use client'

import { useActionState, useState } from 'react'
import { createApiKey, deleteApiKey } from '@/lib/actions/integracoes'

interface ApiKey {
  id: string
  name: string
  key: string
  created_at: string
  last_used_at: string | null
}

function maskKey(key: string) {
  return key.slice(0, 10) + '••••••••••••••••••••'
}

function fmt(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function ApiKeysClient({ keys }: { keys: ApiKey[] }) {
  const [state, action, isPending] = useActionState(createApiKey, null)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filtered = keys.filter(k => k.name.toLowerCase().includes(search.toLowerCase()))

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const justCreated = state && 'key' in state && state.key

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
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900">API</h1>
      </div>

      {/* New key created — show once */}
      {justCreated && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-green-800">🎉 Chave criada — salve agora, ela não será exibida novamente</p>
          <div className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 border border-green-200">
            <code className="flex-1 text-sm font-mono text-gray-800 break-all select-all">{state.key}</code>
            <button
              onClick={() => copy(state.key!, 'new')}
              className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg text-white transition hover:opacity-90"
              style={{ backgroundColor: '#b48840' }}
            >
              {copiedId === 'new' ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1 border border-gray-200 rounded-lg px-3 py-2">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm text-gray-700 placeholder-gray-400 bg-transparent outline-none"
          />
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition hover:opacity-90 shrink-0"
          style={{ backgroundColor: '#b48840' }}
        >
          + Criar API Key
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form action={action} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Nova chave de API</h2>
          {state?.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da chave</label>
            <input
              name="name"
              placeholder="Ex: n8n Produção, Make Automação..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-300"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Use um nome descritivo para identificar onde essa chave está sendo usada.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#b48840' }}
            >
              {isPending ? 'Criando...' : 'Criar chave'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Nome</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">API Key</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Criada em</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Último uso</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center text-gray-400 text-sm">
                  Nenhuma chave criada ainda.
                </td>
              </tr>
            ) : filtered.map(k => (
              <tr key={k.id} className="hover:bg-gray-50 transition">
                <td className="px-5 py-3.5 font-medium text-gray-900">{k.name}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-gray-500">{maskKey(k.key)}</code>
                    <button
                      onClick={() => copy(k.key, k.id)}
                      className="text-xs text-gray-400 hover:text-gray-700 transition"
                      title="Copiar chave"
                    >
                      {copiedId === k.id ? (
                        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-gray-500">{fmt(k.created_at)}</td>
                <td className="px-5 py-3.5 text-gray-400">{fmt(k.last_used_at)}</td>
                <td className="px-5 py-3.5 text-right">
                  <form action={deleteApiKey.bind(null, k.id)}>
                    <button type="submit" className="text-xs text-red-400 hover:text-red-600 transition font-medium">
                      Excluir
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-center gap-2 text-sm text-gray-400">
          <svg className="w-4 h-4 text-blue-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
          </svg>
          Use o header <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs mx-1">x-api-key: sua-chave</code> em todas as chamadas à API
        </div>
      </div>
    </div>
  )
}
