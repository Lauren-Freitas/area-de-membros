'use client'

import { useActionState } from 'react'
import { login } from '@/lib/actions/auth'
import Image from 'next/image'

export default function LoginPage() {
  const [state, action, isPending] = useActionState(login, undefined)

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Image
            src="/iav_1024.png"
            alt="Thiago Cantalovo"
            width={80}
            height={80}
            className="rounded-full dark:hidden"
            priority
          />
          <Image
            src="/iav_grafite_1024.png"
            alt="Thiago Cantalovo"
            width={80}
            height={80}
            className="rounded-full hidden dark:block"
            priority
          />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Thiago Cantalovo</h1>
        <p className="text-gray-500 text-sm mt-1">Nutricionista</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Acessar minha área</h2>
        <p className="text-sm text-gray-500 mb-6">Bem-vindo(a) de volta. Entre com seu email e senha.</p>

        {state?.error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
            {state.error}
          </div>
        )}

        <form action={action} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            style={{ backgroundColor: isPending ? '#d4a940' : '#c9a84c' }}
            className="w-full py-2.5 px-4 hover:opacity-90 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            {isPending ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        Problemas para acessar? Entre em contato com o suporte.
      </p>
    </div>
  )
}
