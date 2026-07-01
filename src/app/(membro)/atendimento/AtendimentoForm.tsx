'use client'

import { useActionState } from 'react'
import { submitTicket } from '@/lib/actions/member'
import { useRef } from 'react'

interface Ticket {
  id: string
  subject: string | null
  message: string
  status: string
  created_at: string
}

interface Props {
  products: { id: string; title: string }[]
  tickets: Ticket[]
}

function statusLabel(status: string) {
  if (status === 'open') return { label: 'Aberto', bg: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }
  if (status === 'resolved') return { label: 'Resolvido', bg: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' }
  if (status === 'closed') return { label: 'Fechado', bg: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' }
  return { label: status, bg: 'bg-gray-100 text-gray-600' }
}

export function AtendimentoForm({ products, tickets }: Props) {
  const [state, action, isPending] = useActionState(submitTicket, undefined)
  const formRef = useRef<HTMLFormElement>(null)

  if (state?.success) {
    formRef.current?.reset()
  }

  return (
    <>
      {/* Formulário de novo ticket */}
      <div className="bg-white dark:bg-[#0d1020] rounded-2xl border border-gray-100 dark:border-[#1e2030] p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Abrir chamado</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Descreva sua dúvida ou problema e entraremos em contato pelo email cadastrado.
        </p>

        <form ref={formRef} action={action} className="space-y-4">
          {state?.error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
              {state.error}
            </div>
          )}
          {state?.success && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 text-sm text-green-700 dark:text-green-400">
              Chamado enviado! Em breve entraremos em contato.
            </div>
          )}

          {/* Conteúdo/Assunto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Conteúdo relacionado
                </label>
                <select
                  name="product_id"
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:border-transparent transition"
                  style={{ '--tw-ring-color': '#b48840' } as React.CSSProperties}
                >
                  <option value="">Nenhum (geral)</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
            )}
            <div className={products.length > 0 ? '' : 'sm:col-span-2'}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Assunto</label>
              <input
                name="subject"
                type="text"
                maxLength={150}
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
                style={{ '--tw-ring-color': '#b48840' } as React.CSSProperties}
                placeholder="Resumo do seu chamado"
              />
            </div>
          </div>

          {/* Mensagem */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Mensagem <span className="text-red-500">*</span>
            </label>
            <textarea
              name="message"
              required
              rows={5}
              maxLength={2000}
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:border-transparent transition"
              style={{ '--tw-ring-color': '#b48840' } as React.CSSProperties}
              placeholder="Descreva sua dúvida ou problema com o máximo de detalhes possível..."
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#b48840' }}
            >
              {isPending ? 'Enviando...' : 'Enviar chamado'}
            </button>
            <button
              type="reset"
              className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>

      {/* Histórico de tickets */}
      {tickets.length > 0 && (
        <div className="bg-white dark:bg-[#0d1020] rounded-2xl border border-gray-100 dark:border-[#1e2030] p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Meus chamados</h2>
          <div className="space-y-3">
            {tickets.map(ticket => {
              const { label, bg } = statusLabel(ticket.status)
              return (
                <div
                  key={ticket.id}
                  className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 dark:border-[#1e2030] bg-gray-50 dark:bg-[#0a0d1a]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {ticket.subject && (
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{ticket.subject}</p>
                      )}
                      <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${bg}`}>
                        {label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{ticket.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(ticket.created_at).toLocaleDateString('pt-BR', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
