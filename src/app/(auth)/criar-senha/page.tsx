'use client'

import { useActionState } from 'react'
import { setPassword } from '@/lib/actions/auth'
import Image from 'next/image'

export default function CriarSenhaPage() {
  const [state, action, isPending] = useActionState(setPassword, undefined)

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Image src="/iav_1024.png" alt="Thiago Cantalovo" width={80} height={80} className="rounded-full dark:hidden" priority />
          <Image src="/iav_grafite_1024.png" alt="Thiago Cantalovo" width={80} height={80} className="rounded-full hidden dark:block" priority />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Thiago Cantalovo</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Nutricionista</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Crie sua senha</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Defina uma senha para acessar seus conteúdos. Use pelo menos 8 caracteres.</p>

        {state?.error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
            {state.error}
          </div>
        )}

        <form action={action} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha</label>
            <input
              id="password" name="password" type="password" autoComplete="new-password" required minLength={8}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition"
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmar senha</label>
            <input
              id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition"
              placeholder="Repita a senha"
            />
          </div>
          <button
            type="submit" disabled={isPending}
            className="w-full py-2.5 px-4 hover:opacity-90 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition"
            style={{ backgroundColor: '#c9a84c' }}
          >
            {isPending ? 'Salvando...' : 'Criar senha e acessar'}
          </button>
        </form>
      </div>
    </div>
  )
}
