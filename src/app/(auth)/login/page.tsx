'use client'

import { useActionState, useState } from 'react'
import { login } from '@/lib/actions/auth'
import Image from 'next/image'
import Link from 'next/link'

export default function LoginPage() {
  const [state, action, isPending] = useActionState(login, undefined)
  const [showPassword, setShowPassword] = useState(false)

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
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Acessar minha área</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Bem-vindo(a) de volta. Entre com seu email e senha.</p>

        {state?.error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
            {state.error}
          </div>
        )}

        <form action={action} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              id="email" name="email" type="email" autoComplete="email" required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
              <Link href="/esqueceu-senha" className="text-xs hover:underline transition" style={{ color: '#b48840' }}>
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required
                className="w-full px-4 py-2.5 pr-11 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit" disabled={isPending}
            className="w-full py-2.5 px-4 hover:opacity-90 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition"
            style={{ backgroundColor: '#b48840' }}
          >
            {isPending ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
        Problemas para acessar?{' '}
        <a href="https://wa.me/5561991900589" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600 dark:hover:text-gray-300 transition">
          WhatsApp
        </a>
        {' '}ou{' '}
        <a href="mailto:nutri@thiagocantalovo.com" className="underline hover:text-gray-600 dark:hover:text-gray-300 transition">
          nutri@thiagocantalovo.com
        </a>
      </p>
    </div>
  )
}
