'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { getMemberDetail, type MemberDetail } from '@/lib/actions/members'
import { MemberActionsInline } from '@/components/admin/MemberActionsMenu'

interface Props {
  userId: string
  onClose: () => void
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

const ROLE_LABELS: Record<string, string> = { admin: 'Admin', equipe: 'Equipe', membro: 'Membro' }

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-gray-700 dark:text-gray-300">{value}</p>
    </div>
  )
}

export function MemberDrawer({ userId, onClose, onMutated }: Props) {
  const [detail, setDetail] = useState<MemberDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let cancelled = false
    getMemberDetail(userId).then(d => {
      if (cancelled) return
      setDetail(d)
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

  const activeCount = detail?.productAccess.filter(p => p.hasAccess).length ?? 0

  return createPortal(
    <div className="fixed inset-0 z-40">
      <div
        className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`absolute right-0 top-0 bottom-0 w-full sm:w-[380px] bg-card shadow-2xl overflow-y-auto transition-transform duration-300 ${visible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {loading || !detail ? (
          <div className="p-6 text-sm text-gray-400">Carregando...</div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6 flex items-start gap-4">
              {detail.profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={detail.profile.avatar_url} alt={detail.profile.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0" style={{ backgroundColor: 'var(--brand)' }}>
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

            {/* Dados */}
            <div className="px-6 pb-5 border-b border-gray-100 dark:border-[#1e2030] grid grid-cols-2 gap-4">
              <Field label="Telefone" value={detail.profile.phone || '—'} />
              <Field label="Cadastro" value={fmtDate(detail.profile.created_at)} />
              <div className="col-span-2">
                <Field label="Último acesso" value={fmtDate(detail.profile.last_login_at, true)} />
              </div>
            </div>

            {/* Produtos */}
            <div className="px-6 py-5 border-b border-gray-100 dark:border-[#1e2030] flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Produtos</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{activeCount} {activeCount === 1 ? 'ativo' : 'ativos'}</p>
              </div>
              <Link
                href={`/admin/usuarios/${detail.profile.id}`}
                className="text-sm font-medium hover:underline"
                style={{ color: 'var(--brand)' }}
              >
                Gerenciar →
              </Link>
            </div>

            {/* Ações */}
            <div className="px-2 py-2">
              <MemberActionsInline
                member={{ id: detail.profile.id, name: detail.profile.name, email: detail.profile.email, is_active: detail.profile.is_active, last_login_at: detail.profile.last_login_at }}
                onToggled={onMutated}
                onDeleted={() => { onMutated(); onClose() }}
              />
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
