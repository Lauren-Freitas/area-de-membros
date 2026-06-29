'use client'
import { useState, useTransition, use } from 'react'
import { registerWithInvite } from '@/lib/actions/invite'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default function ConvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('As senhas não coincidem.'); return }
    if (password.length < 6) { setError('A senha precisa ter pelo menos 6 caracteres.'); return }

    startTransition(async () => {
      const result = await registerWithInvite(code, name.trim(), email.trim(), password)
      if (result.error) { setError(result.error); return }

      const supabase = createClient()
      const { error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (loginError) { setError('Conta criada! Faça login para continuar.'); return }

      router.push('/dashboard')
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/iav_1024.png" alt="Thiago Cantalovo" width={56} height={56} className="mx-auto rounded-full mb-3" />
          <h1 className="text-xl font-bold text-gray-900">Criar sua conta</h1>
          <p className="text-sm text-gray-500 mt-1">Você recebeu um convite de acesso.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Seu nome</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Nome completo"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': '#c9a84c' } as React.CSSProperties}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': '#c9a84c' } as React.CSSProperties}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Mínimo 6 caracteres"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': '#c9a84c' } as React.CSSProperties}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Confirmar senha</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              placeholder="Repita a senha"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': '#c9a84c' } as React.CSSProperties}
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 text-white text-sm font-semibold rounded-lg transition hover:opacity-90 disabled:opacity-50 mt-2"
            style={{ backgroundColor: '#c9a84c' }}
          >
            {isPending ? 'Criando conta...' : 'Criar conta e acessar'}
          </button>

          <p className="text-center text-xs text-gray-400">
            Já tem conta?{' '}
            <Link href="/login" className="font-medium" style={{ color: '#c9a84c' }}>
              Fazer login
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
