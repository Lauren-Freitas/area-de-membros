'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { submitTicket } from '@/lib/actions/member'

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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const [formKey, setFormKey] = useState(0)

  function resetForm() {
    setFormKey(k => k + 1)
    setSelectedFiles([])
    setFileError(null)
  }

  useEffect(() => {
    if (state?.success) resetForm()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null)
    const files = Array.from(e.target.files ?? [])
    const oversized = files.find(f => f.size > 10 * 1024 * 1024)
    if (oversized) {
      setFileError(`"${oversized.name}" é muito grande. Máximo 10MB por arquivo.`)
      e.target.value = ''
      return
    }
    setSelectedFiles(prev => {
      const existingNames = new Set(prev.map(f => f.name))
      const newOnes = files.filter(f => !existingNames.has(f.name))
      return [...prev, ...newOnes]
    })
    e.target.value = ''
  }

  function removeFile(i: number) {
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))
  }

  return (
    <>
      <div className="bg-white dark:bg-[#0d1020] rounded-2xl border border-gray-100 dark:border-[#1e2030] p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Abrir chamado</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Descreva sua dúvida ou problema e entraremos em contato pelo email cadastrado.
        </p>

        <form key={formKey} action={action} className="space-y-4">
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

          {/* Anexos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Anexos <span className="text-xs font-normal text-gray-400">(imagens ou PDF, máx. 10MB cada)</span>
            </label>
            <input
              ref={fileInputRef}
              name="attachment"
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            {selectedFiles.length > 0 && (
              <div className="space-y-2 mb-2">
                {selectedFiles.map((file, i) => {
                  const isImg = file.type.startsWith('image/')
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#1a1f35]">
                      {isImg ? (
                        <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                        <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button type="button" onClick={() => removeFile(i)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded transition">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-500 dark:text-gray-400 hover:border-[#b48840] hover:text-[#7a5c10] dark:hover:text-[#b48840] transition w-full justify-center"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
              </svg>
              {selectedFiles.length > 0 ? 'Adicionar mais arquivos' : 'Adicionar imagem ou PDF'}
            </button>

            {fileError && (
              <p className="text-xs text-red-500 mt-1.5">{fileError}</p>
            )}
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
              type="button"
              onClick={resetForm}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition focus:outline-none"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>

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
