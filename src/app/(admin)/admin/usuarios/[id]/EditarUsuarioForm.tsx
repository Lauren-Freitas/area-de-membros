'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/Button'
import { ConfirmModal } from '@/components/ConfirmModal'
import { ProductAccessList } from '@/components/admin/ProductAccessList'
import type { AdminActionState } from '@/lib/actions/admin'
import { resendAdminInvite } from '@/lib/actions/admin'
import { resetMemberPassword, type MemberProductAccess } from '@/lib/actions/members'

interface Profile {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  is_active: boolean
  last_login_at: string | null
  created_at: string
}

interface ActivityEntry {
  id: string
  description: string
  actor: string
  created_at: string
}

interface Props {
  profile: Profile
  action: (prevState: AdminActionState, formData: FormData) => Promise<AdminActionState>
  userId: string
  products: MemberProductAccess[]
  activity: ActivityEntry[]
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

export function EditarUsuarioForm({ profile, action, userId, products, activity }: Props) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(action, undefined)
  const [isActive, setIsActive] = useState(profile.is_active)
  const formRef = useRef<HTMLFormElement>(null)
  const bypassConfirmRef = useRef(false)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)

  const isAdmin = profile.role === 'admin' || profile.role === 'equipe'
  const backHref = isAdmin ? '/admin/configuracoes' : '/admin/usuarios'
  const backLabel = isAdmin ? 'Conta & Equipe' : 'Membros'
  const hasActivated = !!profile.last_login_at

  const [accessState, setAccessState] = useState<{ success?: boolean; error?: string } | null>(null)
  const [accessPending, startAccessTransition] = useTransition()

  function handleSendAccess() {
    setAccessState(null)
    startAccessTransition(async () => {
      const result = hasActivated
        ? await resetMemberPassword(userId)
        : await resendAdminInvite(userId, profile.email, profile.name)
      setAccessState(result)
    })
  }

  // Desativar é uma ação sensível (suspende o acesso) — nunca dispara direto no "Salvar",
  // sempre passa por confirmação antes do form realmente submeter.
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const isDeactivating = profile.is_active && !isActive
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

  useEffect(() => {
    if (state?.success) router.push(backHref)
  }, [state?.success, router, backHref])

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href={backHref} className="hover:text-gray-800 transition">{backLabel}</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium truncate">{profile.name || profile.email}</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">{isAdmin ? 'Editar colaborador' : 'Editar membro'}</h1>

      {/* Dados */}
      <div className="bg-card rounded-2xl border border-gray-100 p-6">
        <form ref={formRef} action={formAction} onSubmit={handleSubmit} className="space-y-5">
          {state?.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {state.error}
            </div>
          )}

          {/* Nome + Tipo de conta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                defaultValue={profile.name}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-300"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de conta</label>
              <select
                name="role"
                defaultValue={profile.role}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-300"
              >
                {isAdmin ? (
                  <>
                    <option value="admin">Admin</option>
                    <option value="equipe">Equipe</option>
                  </>
                ) : (
                  <option value="membro">Membro</option>
                )}
              </select>
            </div>
          </div>

          {/* Email + Telefone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={profile.email}
                readOnly
                className="w-full px-3 py-2.5 border border-gray-100 rounded-lg text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Não pode ser alterado por este painel.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone</label>
              <input
                name="phone"
                type="tel"
                defaultValue={profile.phone ?? ''}
                placeholder="5561999999999"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-300"
              />
            </div>
          </div>

          {/* Toggle usuário ativo */}
          <div className="flex items-start gap-3 pt-1">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                name="is_active"
                id="is_active"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="sr-only"
              />
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
              {/* hidden checkbox to send value */}
              {isActive && <input type="hidden" name="is_active" value="on" />}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{isAdmin ? 'Colaborador ativo' : 'Membro ativo'}</p>
              <p className="text-xs text-gray-400">{isActive ? 'Com acesso à plataforma' : 'Acesso suspenso'}</p>
            </div>
          </div>

          <p className="text-xs text-gray-400 border-t border-gray-100 pt-4">
            {isAdmin ? 'Colaborador' : 'Membro'} desde {new Date(profile.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          {/* Botões */}
          <div className="flex items-center gap-3 flex-wrap">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar alterações'}
            </Button>
            <Button variant="secondary" href={backHref}>
              Cancelar
            </Button>
            <Button variant="secondary" type="button" disabled={accessPending} onClick={handleSendAccess}>
              {accessPending ? 'Enviando...' : 'Enviar acesso'}
            </Button>
          </div>
          {accessState?.success && <p className="text-xs text-green-600 mt-1">Enviado com sucesso!</p>}
          {accessState?.error && <p className="text-xs text-red-600 mt-1">{accessState.error}</p>}
        </form>
      </div>

      {/* Produtos — só faz sentido para membros */}
      {!isAdmin && (
        <div className="bg-card rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Produtos liberados</h2>
          <p className="text-sm text-gray-500 mb-2">Conceda, revogue ou ajuste a validade de cada acesso.</p>
          <ProductAccessList userId={userId} products={products} />
        </div>
      )}

      {/* Histórico */}
      <div className="bg-card rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-3">Histórico recente</h2>
        {activity.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhuma atividade registrada ainda.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {activity.map(a => (
              <div key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-gray-400 w-12 shrink-0">{fmtDate(a.created_at)}</span>
                  <span className="text-gray-700 truncate">{a.description}</span>
                </div>
                <span className="text-xs text-gray-400 shrink-0">por {a.actor}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmDeactivate}
        onClose={() => setConfirmDeactivate(false)}
        onConfirm={handleConfirmDeactivate}
        title={isAdmin ? 'Desativar colaborador' : 'Desativar membro'}
        message={`${profile.name || profile.email} perde acesso à plataforma imediatamente. Você pode reativar a qualquer momento.`}
        confirmLabel="Desativar"
      />
    </div>
  )
}
