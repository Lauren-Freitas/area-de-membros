'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProductAccessPill } from '@/components/admin/ProductAccessPill'
import type { AdminActionState } from '@/lib/actions/admin'
import { resendAdminInvite } from '@/lib/actions/admin'

interface Profile {
  id: string
  name: string
  email: string
  role: string
  is_active: boolean
  created_at: string
}

interface ProductItem {
  id: string
  title: string
  hasAccess: boolean
}

interface Props {
  profile: Profile
  action: (prevState: AdminActionState, formData: FormData) => Promise<AdminActionState>
  products: ProductItem[]
  userId: string
}

export function EditarUsuarioForm({ profile, action, products, userId }: Props) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(action, undefined)
  const [isActive, setIsActive] = useState(profile.is_active)

  const isAdmin = profile.role === 'admin' || profile.role === 'equipe'
  const backHref = isAdmin ? '/admin/configuracoes' : '/admin/usuarios'
  const backLabel = isAdmin ? 'Conta & Equipe' : 'Membros'

  const [inviteState, setInviteState] = useState<{ success?: boolean; error?: string } | null>(null)
  const [invitePending, startInviteTransition] = useTransition()

  function handleSendInvite() {
    setInviteState(null)
    startInviteTransition(async () => {
      const result = await resendAdminInvite(userId, profile.email, profile.name)
      setInviteState(result)
    })
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

      {/* Formulário principal */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <form action={formAction} className="space-y-5">
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

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={profile.email}
              readOnly
              className="w-full px-3 py-2.5 border border-gray-100 rounded-lg text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">O email não pode ser alterado por este painel.</p>
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
                  className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
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
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#b48840' }}
            >
              {isPending ? 'Salvando...' : 'Salvar alterações'}
            </button>
            <Link
              href={backHref}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition"
            >
              Cancelar
            </Link>
            {isAdmin && (
              <button
                type="button"
                disabled={invitePending}
                onClick={handleSendInvite}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition disabled:opacity-60"
              >
                {invitePending ? 'Enviando...' : 'Enviar convite'}
              </button>
            )}
          </div>
          {inviteState?.success && <p className="text-xs text-green-600 mt-1">Convite enviado com sucesso!</p>}
          {inviteState?.error && <p className="text-xs text-red-600 mt-1">{inviteState.error}</p>}
        </form>
      </div>

      {/* Acesso aos produtos — só para membros */}
      {!isAdmin && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Acesso aos produtos</h2>
          <p className="text-sm text-gray-500 mb-4">
            Clique para liberar ou revogar o acesso. A alteração é imediata.
          </p>
          {products.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum produto ativo cadastrado.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {products.map(p => (
                <ProductAccessPill
                  key={p.id}
                  title={p.title}
                  hasAccess={p.hasAccess}
                  userId={userId}
                  productId={p.id}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
