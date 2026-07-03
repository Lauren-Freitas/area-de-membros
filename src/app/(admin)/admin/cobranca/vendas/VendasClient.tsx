'use client'

import { useState, useMemo } from 'react'

interface Venda {
  id: string
  granted_at: string
  product_id: string | null
  profiles: { name: string; email: string } | null
  products: { title: string } | null
}

const PAGE_SIZE = 20

export function VendasClient({ vendas }: { vendas: Venda[] }) {
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'aprovadas' | 'reprovadas' | 'todas'>('aprovadas')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return vendas.filter(v => {
      const name = v.profiles?.name?.toLowerCase() ?? ''
      const email = v.profiles?.email?.toLowerCase() ?? ''
      const title = v.products?.title?.toLowerCase() ?? ''
      return !q || name.includes(q) || email.includes(q) || title.includes(q)
    })
  }, [vendas, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function handleSearch(val: string) {
    setSearch(val)
    setPage(1)
  }

  function exportCSV() {
    const header = 'Data,Produto,Cliente,Email,Status,Valor Líquido'
    const rows = filtered.map(v => {
      const date = new Date(v.granted_at).toLocaleDateString('pt-BR')
      const product = v.products?.title ?? '—'
      const name = v.profiles?.name ?? '—'
      const email = v.profiles?.email ?? '—'
      return `${date},"${product}","${name}",${email},Aprovada,—`
    })
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'vendas.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function fmt(date: string) {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-900">Vendas</h1>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: '#b48840' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Exportar
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white rounded-2xl border border-gray-100 px-4 py-2.5">
        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Buscar por nome, e-mail ou produto…"
          value={search}
          onChange={e => handleSearch(e.target.value)}
          className="flex-1 text-sm text-gray-700 placeholder-gray-400 bg-transparent outline-none"
        />
        {search && (
          <button onClick={() => handleSearch('')} className="text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500 mb-1">Vendas encontradas</p>
          <p className="text-3xl font-bold text-gray-900">{filtered.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500 mb-1">Valor líquido</p>
          <p className="text-3xl font-bold text-gray-900">R$ 0,00</p>
          <p className="text-xs text-gray-400 mt-1">Integre com Asaas para ver valores</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1">
        {(['aprovadas', 'reprovadas', 'todas'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1) }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition capitalize ${
              tab === t ? 'text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
            style={tab === t ? { backgroundColor: t === 'reprovadas' ? '#dc2626' : '#b48840' } : {}}
          >
            {t === 'aprovadas' ? 'Aprovadas' : t === 'reprovadas' ? 'Reprovadas' : 'Todas'}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        {/* Header */}
        <div className="flex items-center pb-3 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <span className="w-24 shrink-0">Data</span>
          <span className="flex-1">Produto</span>
          <span className="flex-1">Cliente</span>
          <span className="w-28 shrink-0">Status</span>
          <span className="w-24 shrink-0">Valor líquido</span>
        </div>
        {/* Rows */}
        <div className="divide-y divide-gray-100">
          {tab === 'reprovadas' ? (
            <div className="py-16 text-center space-y-2">
              <p className="text-gray-400 text-sm">Nenhuma venda reprovada.</p>
              <p className="text-xs text-gray-300">Esta aba exibirá pagamentos recusados quando integrado com o Asaas.</p>
            </div>
          ) : pageItems.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              Nenhuma venda encontrada.
            </div>
          ) : (
            pageItems.map(v => (
              <div key={v.id} className="flex items-center py-3.5 hover:bg-gray-50 transition">
                <div className="w-24 shrink-0 text-sm text-gray-500 whitespace-nowrap">{fmt(v.granted_at)}</div>
                <div className="flex-1 min-w-0 pr-4 text-gray-800 font-medium truncate">{v.products?.title ?? '—'}</div>
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-gray-900 font-medium truncate">{v.profiles?.name ?? '—'}</p>
                  <p className="text-xs text-gray-400 truncate">{v.profiles?.email}</p>
                </div>
                <div className="w-28 shrink-0">
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-green-50 text-green-700">
                    ✓ Aprovada
                  </span>
                </div>
                <div className="w-24 shrink-0 text-gray-400">—</div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Exibindo {safePage} de {totalPages} página{totalPages !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="w-8 h-8 rounded-lg border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="w-8 h-8 rounded-lg border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
        <svg className="w-4 h-4 text-blue-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
        </svg>
        <span>
          Vendas são liberadas automaticamente via webhook do Asaas ou manualmente em{' '}
          <a href="/admin/usuarios" className="underline hover:text-gray-700 transition" style={{ color: '#b48840' }}>
            Gerenciar usuários
          </a>
          .
        </span>
      </div>
    </div>
  )
}
