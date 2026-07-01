'use client'

import { useActionState } from 'react'
import { resetPassword } from '@/lib/actions/auth'
import Image from 'next/image'
import Link from 'next/link'

export default function EsqueceuSenhaPage() {
  const [state, action, isPending] = useActionState(resetPassword, undefined)

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

      <div className="bg-white dark:bg-[#0d1020] rounded-2xl shadow-sm border border-gray-100 dark:border-[#1e2030] p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Recuperar senha</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Informe seu email e enviaremos um link para você criar uma nova senha.
        </p>

        {state?.error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
            {state.error}
          </div>
        )}

        {state?.success ? (
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 text-sm text-green-700 dark:text-green-400">
            <p className="font-medium mb-1">Email enviado!</p>
            <p>{state.success}</p>
          </div>
        ) : (
          <form action={action} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                id="email" name="email" type="email" autoComplete="email" required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition"
                style={{ '--tw-ring-color': '#b48840' } as React.CSSProperties}
                placeholder="seu@email.com"
              />
            </div>
            <button
              type="submit" disabled={isPending}
              className="w-full py-2.5 px-4 hover:opacity-90 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition"
              style={{ backgroundColor: '#b48840' }}
            >
              {isPending ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
          </form>
        )}
      </div>

      <p className="text-center text-sm mt-6">
        <Link href="/login" className="text-gray-500 dark:text-gray-400 hover:underline transition">
          ← Voltar ao login
        </Link>
      </p>
    </div>
  )
}
