'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { getMemberDetail, getMemberActivity, type MemberDetail, type ActivityEntry } from '@/lib/actions/members'
import { updateUser, resendAdminInvite } from '@/lib/actions/admin'
import { MemberActionsInline } from '@/components/admin/MemberActionsMenu'
import { ProductAccessList } from '@/components/admin/ProductAccessList'
import { ConfirmModal } from '@/components/ConfirmModal'
import { Button } from '@/components/Button'
import { describeActivity } from '@/lib/activity-labels'

type View = 'resumo' | 'editar'

interface Props {
  userId: string
  initialView?: View
  onClose: () => void
  onMutated: () => void
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase() || '?'
}

function fmtDate(iso: string | null, withTime = false) {
  if (!iso) return '-'
  const date = new Date(iso)
  const base = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
  if (!withTime) return base
  return `${base} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-gray-700 dark:text-gray-300 break-words">{value}</p>
    </div>
  )
}

export function MemberDrawer({ userId, initialView = 'resumo', onClose, onMutated }: Props) {
  const [detail, setDetail] = useState<MemberDetail | null>(null)
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(false)
  const [view, setView] = useState<View>(initialView)

  useEffect(() => {
    let cancelled = false
    Promise.all([getMemberDetail(userId), getMemberActivity(userId)]).then(([d, a]) => {
      if (cancelled) return
      setDetail(d)
      setActivity(a)
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

  function refreshDetail() {
    getMemberDetail(userId).then(d => { if (d) setDetail(d) })
    getMemberActivity(userId).then(setActivity)
    onMutated()
  }

  const activeCount = detail?.productAccess.filter(p => p.hasAccess).length ?? 0

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
        ) : view === 'resumo' ? (
          <ResumoView
            detail={detail}
            activeCount={activeCount}
            onClose={onClose}
            onEdit={() => setView('editar')}
            onToggled={refreshDetail}
            onDeleted={() => { onMutated(); onClose() }}
          />
        ) : (
          <EditarView
            detail={detail}
            activity={activity}
            onBack={() => setView('resumo')}
            onSaved={refreshDetail}
          />
        )}
      </div>
    </div>,
    document.body
  )
}

const ROLE_LABELS: Record<string, string> = { admin: 'Admin', equipe: 'Equipe', membro: 'Membro' }

function ResumoView({
  detail, activeCount, onClose, onEdit, onToggled, onDeleted,
}: {
  detail: MemberDetail
  activeCount: number
  onClose: () => void
  onEdit: () => void
  onToggled: () => void
  onDeleted: () => void
}) {
  return (
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
        <Field label="Telefone" value={detail.profile.phone || '-'} />
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
        <button type="button" onClick={onEdit} className="text-sm font-medium hover:underline" style={{ color: 'var(--brand)' }}>
          Editar →
        </button>
      </div>

      {/* Ações */}
      <div className="px-2 py-2">
        <MemberActionsInline
          member={{ id: detail.profile.id, name: detail.profile.name, email: detail.profile.email, is_active: detail.profile.is_active, last_login_at: detail.profile.last_login_at }}
          onEdit={onEdit}
          onToggled={onToggled}
          onDeleted={onDeleted}
        />
      </div>
    </>
  )
}

function ActorTag({ actor, actorType }: { actor: string; actorType: string }) {
  if (actorType === 'admin') return <span className="text-xs text-gray-400 shrink-0">por {actor}</span>
  return (
    <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#1a2035] rounded px-1.5 py-0.5 shrink-0">
      {actor}
    </span>
  )
}

function EditarView({
  detail, activity, onBack, onSaved,
}: {
  detail: MemberDetail
  activity: ActivityEntry[]
  onBack: () => void
  onSaved: () => void
}) {
  const [state, formAction, isPending] = useActionState(updateUser.bind(null, detail.profile.id), undefined)
  const [isActive, setIsActive] = useState(detail.profile.is_active)
  const formRef = useRef<HTMLFormElement>(null)
  const bypassConfirmRef = useRef(false)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const [accessState, setAccessState] = useState<{ success?: boolean; error?: string } | null>(null)
  const [accessPending, setAccessPending] = useState(false)

  useEffect(() => {
    if (state?.success) onSaved()
  }, [state?.success, onSaved])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const isDeactivating = detail.profile.is_active && !isActive
    if (isDeactivating && !bypassConfirmRef.current) {
      e.preventDefault()
      setConfirmDeactivate(true)
      return
    }
    bypassConfirmRef.current = false
  }

  function handleConfirmDeactivate() {
    setConfirmDeactivate(false)
    bypassConfirmRef.current = true
    formRef.current?.requestSubmit()
  }

  async function handleSendAccess() {
    setAccessState(null)
    setAccessPending(true)
    const result = await resendAdminInvite(detail.profile.id)
    setAccessPending(false)
    setAccessState(result)
  }

  return (
    <>
      {/* Cabeçalho com voltar — nunca fecha o drawer, só troca de view */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition px-2 py-1 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a2035]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </button>
      </div>

      <form ref={formRef} action={formAction} onSubmit={handleSubmit}>
        {state?.error && (
          <div className="mx-6 mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-700">
            {state.error}
          </div>
        )}

        {/* Informações pessoais */}
        <div className="px-6 pb-5 border-b border-gray-100 dark:border-[#1e2030] space-y-3.5">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Informações pessoais</p>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nome</label>
            <input
              name="name"
              defaultValue={detail.profile.name}
              required
              className="w-full px-3 py-2 border border-gray-200 dark:border-[#2a2f45] rounded-lg text-sm bg-card text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': 'var(--brand)' } as React.CSSProperties}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Telefone</label>
            <input
              name="phone"
              type="tel"
              defaultValue={detail.profile.phone ?? ''}
              placeholder="5561999999999"
              className="w-full px-3 py-2 border border-gray-200 dark:border-[#2a2f45] rounded-lg text-sm bg-card text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': 'var(--brand)' } as React.CSSProperties}
            />
          </div>
          <Field label="Email" value={detail.profile.email} />
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className={`w-1.5 h-1.5 rounded-full ${detail.profile.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
            Tipo de conta: Membro
            <span className="text-gray-300 dark:text-gray-600">·</span>
            Status: {detail.profile.is_active ? 'Ativo' : 'Inativo'}
          </div>
        </div>

        {/* Configurações */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-[#1e2030] space-y-3.5">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Configurações</p>

          <div className="flex items-start gap-3">
            <div className="relative mt-0.5">
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                onClick={() => setIsActive(v => !v)}
                className="w-11 h-6 rounded-full transition-colors duration-200 relative focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-400"
                style={{ backgroundColor: isActive ? '#22c55e' : '#d1d5db' }}
              >
                <span
                  className="absolute top-0.5 left-0.5 w-5 h-5 bg-card rounded-full shadow transition-transform duration-200"
                  style={{ transform: isActive ? 'translateX(20px)' : 'translateX(0)' }}
                />
              </button>
              {isActive && <input type="hidden" name="is_active" value="on" />}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Membro ativo</p>
              <p className="text-xs text-gray-400">{isActive ? 'Com acesso à plataforma' : 'Acesso suspenso'}</p>
            </div>
          </div>

          <div>
            <Button variant="secondary" size="sm" type="button" disabled={accessPending} onClick={handleSendAccess}>
              {accessPending ? 'Enviando...' : 'Enviar acesso'}
            </Button>
            {accessState?.success && <p className="text-xs text-green-600 mt-1.5">Enviado com sucesso!</p>}
            {accessState?.error && <p className="text-xs text-red-600 mt-1.5">{accessState.error}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Data de cadastro" value={fmtDate(detail.profile.created_at)} />
            <Field label="Último acesso" value={fmtDate(detail.profile.last_login_at, true)} />
          </div>
        </div>

        <div className="px-6 py-4 border-b border-gray-100 dark:border-[#1e2030]">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      </form>

      {/* Produtos — único lugar que gerencia acesso, não existe em mais nenhuma tela */}
      <div className="px-6 py-5 border-b border-gray-100 dark:border-[#1e2030]">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Produtos</p>
        <ProductAccessList userId={detail.profile.id} products={detail.productAccess} />
      </div>

      {/* Histórico */}
      <div className="px-6 py-5">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Histórico</p>
        {activity.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhuma atividade registrada ainda.</p>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-[#161a2c]">
            {activity.map(a => (
              <div key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-gray-400 w-10 shrink-0">{fmtShort(a.createdAt)}</span>
                  <span className="text-gray-700 dark:text-gray-300 truncate">
                    {describeActivity({ action: a.action, entity: a.entity, entity_name: a.entityName })}
                  </span>
                </div>
                <ActorTag actor={a.actor} actorType={a.actorType} />
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmDeactivate}
        onClose={() => setConfirmDeactivate(false)}
        onConfirm={handleConfirmDeactivate}
        title="Desativar membro"
        message={`${detail.profile.name || detail.profile.email} perde acesso à plataforma imediatamente. Você pode reativar a qualquer momento.`}
        confirmLabel="Desativar"
      />
    </>
  )
}
