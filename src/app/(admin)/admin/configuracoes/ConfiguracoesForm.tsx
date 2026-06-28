'use client'

import { useActionState } from 'react'
import { updateProfile } from '@/lib/actions/admin'

interface Props {
  name: string
  email: string
}

export function ConfiguracoesForm({ name, email }: Props) {
  const [state, action, isPending] = useActionState(updateProfile, undefined)

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">{state.error}</div>
      )}
      {state?.success && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-100 text-sm text-green-700">Perfil atualizado com sucesso!</div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
        <input
          name="name"
          type="text"
          defaultValue={name}
          required
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          name="email"
          type="email"
          defaultValue={email}
          required
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="px-6 py-2.5 text-white text-sm font-semibold rounded-lg transition hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: '#c9a84c' }}
      >
        {isPending ? 'Salvando...' : 'Salvar alterações'}
      </button>
    </form>
  )
}
