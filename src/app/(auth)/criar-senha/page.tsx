'use client'

import { useActionState } from 'react'
import { setPassword } from '@/lib/actions/auth'

export default function CriarSenhaPage() {
  const [state, action, isPending] = useActionState(setPassword, undefined)

  return (
    <div className="w-full max-w-md">
      {/* Logo / Marca */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-600 text-white text-2xl font-bold mb-4">
          TC
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Thiago Cantalolvo</h1>
        <p className="text-gray-500 text-sm mt-1">Nutricionista</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Crie sua senha</h2>
        <p className="text-sm text-gray-500 mb-6">
          Defina uma senha para acessar seus conteúdos. Use pelo menos 8 caracteres.
        </p>

        {state?.error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
            {state.error}
          </div>
        )}

        <form action={action} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar senha
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              placeholder="Repita a senha"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            {isPending ? 'Salvando...' : 'Criar senha e acessar'}
          </button>
        </form>
      </div>
    </div>
  )
}
