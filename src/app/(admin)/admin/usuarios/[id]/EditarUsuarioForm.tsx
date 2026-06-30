'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { ProductPill } from '@/components/admin/ProductPill'
import type { AdminActionState } from '@/lib/actions/admin'

interface Profile {
  id: string
  name: string
  email: string
  role: string
  created_at: string
}

interface ProductItem {
  id: string
  title: string
  hasAccess: boolean
  action: () => Promise<void>
}

interface Props {
  profile: Profile
  action: (prevState: AdminActionState, formData: FormData) => Promise<AdminActionState>
  products: ProductItem[]
}

export function EditarUsuarioForm({ profile, action, products }: Props) {
  const [state, formAction, isPending] = useActionState(action, undefined)

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/usuarios" className="hover:text-gray-800 transition">← Usuários</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">{profile.name || profile.email}</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">Editar usuário</h1>

      {/* Informações */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <form action={formAction} className="space-y-5">
          {state?.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {state.error}
            </div>
          )}
          {state?.success && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
              Alterações salvas com sucesso.
            </div>
          )}

          {/* Nome + Função */}
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Função</label>
              <select
                name="role"
                defaultValue={profile.role}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-300"
              >
                <option value="membro">Membro</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Email (read-only) */}
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

          {/* Info */}
          <div className="text-xs text-gray-400 pt-1">
            Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#b48840' }}
            >
              {isPending ? 'Salvando...' : 'Salvar alterações'}
            </button>
            <Link
              href="/admin/usuarios"
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>

      {/* Acesso aos produtos */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Acesso aos produtos</h2>
        <p className="text-sm text-gray-500 mb-4">
          Clique em um produto para liberar ou revogar o acesso. A alteração é imediata.
        </p>

        {products.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum produto ativo cadastrado.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {products.map(p => (
              <ProductPill
                key={p.id}
                title={p.title}
                hasAccess={p.hasAccess}
                action={p.action}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
