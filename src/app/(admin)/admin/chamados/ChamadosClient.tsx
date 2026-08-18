'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/components/Modal'
import { Badge, type BadgeTone } from '@/components/Badge'
import { EmptyState } from '@/components/EmptyState'
import { respondTicket, updateTicketStatus } from '@/lib/actions/admin'

export interface Ticket {
  id: string
  subject: string | null
  message: string
  status: string
  created_at: string
  admin_response: string | null
  responded_at: string | null
  profiles: { name: string; email: string } | null
  products: { title: string } | null
}

const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  open: { label: 'Aberto', tone: 'info' },
  resolved: { label: 'Resolvido', tone: 'success' },
  closed: { label: 'Fechado', tone: 'neutral' },
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** Anexos vêm como linhas "📎 Anexo N: url" dentro da mensagem — linkifica pra ficarem clicáveis. */
function MessageBody({ text }: { text: string }) {
  return (
    <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
      {text.split('\n').map((line, i) => {
        const match = line.match(/^(📎.*?: )(https?:\/\/\S+)$/)
        if (match) {
          return (
            <div key={i}>
              {match[1]}
              <a href={match[2]} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--brand)' }}>
                {match[2]}
              </a>
            </div>
          )
        }
        return <div key={i}>{line}</div>
      })}
    </div>
  )
}

export function ChamadosClient({ tickets }: { tickets: Ticket[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'open' | 'resolved' | 'closed' | 'all'>('open')
  const [selected, setSelected] = useState<Ticket | null>(null)

  const filtered = tickets.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      t.profiles?.name?.toLowerCase().includes(q) ||
      t.profiles?.email?.toLowerCase().includes(q) ||
      t.subject?.toLowerCase().includes(q) ||
      t.message.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Chamados</h1>
        <p className="text-sm text-gray-500 mt-0.5">Suporte aberto pelos membros ({tickets.length} no total).</p>
      </div>

      {/* Busca */}
      <div className="flex items-center gap-2 bg-card rounded-2xl border border-gray-100 px-4 py-2.5">
        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Buscar por nome, e-mail ou assunto…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 text-sm text-gray-700 placeholder-gray-400 bg-transparent outline-none"
        />
      </div>

      {/* Tabs de status */}
      <div className="flex items-center gap-1">
        {(['open', 'resolved', 'closed', 'all'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              statusFilter === s ? 'text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
            style={statusFilter === s ? { backgroundColor: 'var(--brand)' } : {}}
          >
            {s === 'all' ? 'Todos' : STATUS[s].label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="bg-card rounded-2xl border border-gray-100 p-5">
        {filtered.length === 0 ? (
          <EmptyState title="Nenhum chamado por aqui." description={statusFilter !== 'all' ? 'Tente outro filtro de status.' : undefined} />
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(t => (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className="w-full flex items-start gap-4 py-3.5 text-left hover:bg-gray-50 transition rounded-lg px-2 -mx-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {t.subject && <p className="text-sm font-medium text-gray-900 truncate">{t.subject}</p>}
                    <Badge tone={STATUS[t.status]?.tone ?? 'neutral'}>{STATUS[t.status]?.label ?? t.status}</Badge>
                    {t.admin_response && <span className="text-xs text-gray-400">· respondido</span>}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {t.profiles?.name ?? '-'} · {t.profiles?.email}
                    {t.products?.title && ` · ${t.products.title}`}
                  </p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-1">{t.message}</p>
                </div>
                <span className="shrink-0 text-xs text-gray-400 mt-0.5">{fmt(t.created_at)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && <TicketModal ticket={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function TicketModal({ ticket, onClose }: { ticket: Ticket; onClose: () => void }) {
  const [response, setResponse] = useState(ticket.admin_response ?? '')
  const [status, setStatus] = useState(ticket.status)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleRespond() {
    setError(null)
    startTransition(async () => {
      const result = await respondTicket(ticket.id, response, status as 'open' | 'resolved' | 'closed')
      if (result.error) setError(result.error)
      else onClose()
    })
  }

  function handleStatusOnly(next: 'open' | 'resolved' | 'closed') {
    setStatus(next)
    startTransition(async () => {
      const result = await updateTicketStatus(ticket.id, next)
      if (result.error) setError(result.error)
    })
  }

  return (
    <Modal isOpen onClose={onClose} maxWidth="max-w-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          {ticket.subject && <h2 className="font-semibold text-gray-900 dark:text-gray-100">{ticket.subject}</h2>}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {ticket.profiles?.name ?? '-'} · {ticket.profiles?.email}
            {ticket.products?.title && ` · ${ticket.products.title}`}
          </p>
        </div>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="max-h-64 overflow-y-auto bg-gray-50 dark:bg-[#0a0d1a] rounded-xl p-4">
        <MessageBody text={ticket.message} />
        <p className="text-xs text-gray-400 mt-2">{fmt(ticket.created_at)}</p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Status:</span>
        {(['open', 'resolved', 'closed'] as const).map(s => (
          <button
            key={s}
            type="button"
            onClick={() => handleStatusOnly(s)}
            disabled={isPending}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${status === s ? 'text-white' : 'text-gray-500 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            style={status === s ? { backgroundColor: 'var(--brand)' } : {}}
          >
            {STATUS[s].label}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
          {ticket.admin_response ? 'Resposta (edite se precisar)' : 'Responder ao membro'}
        </label>
        <textarea
          value={response}
          onChange={e => setResponse(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="O membro vai ver essa resposta em Atendimento..."
          className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:border-transparent transition"
          style={{ '--tw-ring-color': 'var(--brand)' } as React.CSSProperties}
        />
        {ticket.responded_at && (
          <p className="text-xs text-gray-400 mt-1">Última resposta em {fmt(ticket.responded_at)}</p>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2 justify-end pt-1">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#252a40] transition"
        >
          Fechar
        </button>
        <button
          onClick={handleRespond}
          disabled={isPending || !response.trim()}
          className="px-4 py-2 rounded-xl text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
          style={{ backgroundColor: 'var(--brand)' }}
        >
          {isPending ? 'Enviando...' : 'Enviar resposta'}
        </button>
      </div>
    </Modal>
  )
}
