'use client'

import { useEffect, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { getMemberDetail, updateMemberNotes, type MemberDetail } from '@/lib/actions/members'
import { MemberActionsInline } from '@/components/admin/MemberActionsMenu'

interface Props {
  userId: string
  onClose: () => void
  onManageAccess: (userId: string, name: string, products: MemberDetail['productAccess']) => void
  onMutated: () => void
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase() || '?'
}

function fmtDate(iso: string | null, withTime = false) {
  if (!iso) return '—'
  const date = new Date(iso)
  const base = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
  if (!withTime) return base
  return `${base} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

function expiryLabel(expiresAt: string | null) {
  if (!expiresAt) return 'Permanente'
  const diffDays = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000)
  if (diffDays < 0) return `Expirou há ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'dia' : 'dias'}`
  if (diffDays === 0) return 'Expira hoje'
  return `Expira em ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`
}

const ROLE_LABELS: Record<string, string> = { admin: 'Admin', equipe: 'Equipe', membro: 'Membro' }

const ACTIVITY_LABELS: Record<string, string> = {
  criar: 'Criado',
  editar: 'Editado',
  excluir: 'Excluído',
  ativar: 'Ativado',
  desativar: 'Desativado',
  conceder_acesso: 'Acesso concedido',
  revogar_acesso: 'Acesso revogado',
  ver_como: 'Visto como membro',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">{title}</p>
      {children}
    </div>
  )
}

export function MemberDrawer({ userId, onClose, onManageAccess, onMutated }: Props) {
  const [detail, setDetail] = useState<MemberDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [visible, setVisible] = useState(false)
  const [, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    getMemberDetail(userId).then(d => {
      if (cancelled) return
      setDetail(d)
      setNotes(d?.profile.notes ?? '')
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [userId])

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function saveNotes() {
    if (!detail || notes === (detail.profile.notes ?? '')) return
    startTransition(() => { updateMemberNotes(userId, notes) })
  }

  return createPortal(
    <div className="fixed inset-0 z-40">
      <div
        className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`absolute right-0 top-0 bottom-0 w-full sm:w-[420px] bg-card shadow-2xl overflow-y-auto transition-transform duration-300 ${visible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {loading || !detail ? (
          <div className="p-6 text-sm text-gray-400">Carregando...</div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-[#1e2030] flex items-start gap-4">
              {detail.profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={detail.profile.avatar_url} alt={detail.profile.name} className="w-14 h-14 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0" style={{ backgroundColor: 'var(--brand)' }}>
                  {getInitials(detail.profile.name || detail.profile.email)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-gray-900 dark:text-white truncate">{detail.profile.name || '(sem nome)'}</p>
                <p className="text-sm text-gray-400 truncate">{detail.profile.email}</p>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${detail.profile.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                  {detail.profile.is_active ? 'Ativo' : 'Inativo'}
                  <span className="text-gray-300 dark:text-gray-600">·</span>
                  {ROLE_LABELS[detail.profile.role] ?? 'Membro'}
                </div>
              </div>
              <button onClick={onClose} className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition p-1" aria-label="Fechar">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Ações */}
            <div className="px-2 py-2 border-b border-gray-100 dark:border-[#1e2030]">
              <MemberActionsInline
                member={{ id: detail.profile.id, name: detail.profile.name, email: detail.profile.email, is_active: detail.profile.is_active, last_login_at: detail.profile.last_login_at }}
                onManageAccess={() => onManageAccess(detail.profile.id, detail.profile.name || detail.profile.email, detail.productAccess)}
                onToggled={onMutated}
                onDeleted={() => { onMutated(); onClose() }}
              />
            </div>

            {/* Dados */}
            <div className="p-6 space-y-6 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Telefone</p>
                  <p className="text-gray-700 dark:text-gray-300">{detail.profile.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Cadastro</p>
                  <p className="text-gray-700 dark:text-gray-300">{fmtDate(detail.profile.created_at)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Último acesso</p>
                  <p className="text-gray-700 dark:text-gray-300">{fmtDate(detail.profile.last_login_at, true)}</p>
                </div>
              </div>

              <Section title="Produtos liberados">
                {detail.productAccess.filter(p => p.hasAccess).length === 0 ? (
                  <p className="text-gray-400 text-xs">Nenhum conteúdo liberado.</p>
                ) : (
                  <div className="space-y-1.5">
                    {detail.productAccess.filter(p => p.hasAccess).map(p => (
                      <div key={p.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#12162a]">
                        <span className="text-gray-700 dark:text-gray-300 truncate">{p.title}</span>
                        <span className="text-xs text-gray-400 shrink-0">{expiryLabel(p.expiresAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              <Section title="Histórico recente">
                {detail.recentActivity.length === 0 ? (
                  <p className="text-gray-400 text-xs">Nenhuma atividade registrada.</p>
                ) : (
                  <div className="space-y-2">
                    {detail.recentActivity.map(a => (
                      <div key={a.id} className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-gray-600 dark:text-gray-300">{ACTIVITY_LABELS[a.action] ?? a.action}</span>
                        <span className="text-gray-400 shrink-0">{fmtDate(a.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              <Section title="Webhooks recentes">
                {detail.recentWebhookDeliveries.length === 0 ? (
                  <p className="text-gray-400 text-xs">Nenhum evento disparado ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {detail.recentWebhookDeliveries.map(w => (
                      <div key={w.id} className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-mono text-gray-600 dark:text-gray-300">{w.event}</span>
                        <span className={w.success ? 'text-green-600' : 'text-red-500'}>{w.success ? 'Sucesso' : 'Falhou'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              <Section title="Observações internas">
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  onBlur={saveNotes}
                  placeholder="Nenhuma observação ainda — visível só pra equipe."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2a2f45] bg-gray-50 dark:bg-[#12162a] text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none focus:ring-2 resize-none"
                  style={{ '--tw-ring-color': 'var(--brand)' } as React.CSSProperties}
                />
              </Section>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
