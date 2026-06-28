'use client'

import { useActionState } from 'react'
import { createUser } from '@/lib/actions/admin'
import Link from 'next/link'

interface Product { id: string; title: string }

export function NovoUsuarioForm({ products }: { products: Product[] }) {
  const [state, action, isPending] = useActionState(createUser, undefined)

  return (
    <form action={action} className="space-y-6">
      {state?.error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Dados do usuário</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
          <input
            name="name"
            type="text"
            required
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
            placeholder="Ex: João Silva"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            name="email"
            type="email"
            required
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
            placeholder="Ex: joao@email.com"
          />
        </div>
      </div>

      {products.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Liberar acesso aos produtos</h2>
          <p className="text-sm text-gray-500 mb-4">Opcional — pode liberar depois também.</p>
          <div className="space-y-2">
            {products.map((p) => (
              <label key={p.id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="products"
                  value={p.id}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: '#c9a84c' }}
                />
                <span className="text-sm text-gray-700">{p.title}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 text-white text-sm font-semibold rounded-lg transition hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: '#c9a84c' }}
        >
          {isPending ? 'Criando...' : 'Criar usuário e enviar convite'}
        </button>
        <Link href="/admin/usuarios" className="text-sm text-gray-500 hover:text-gray-800">
          Cancelar
        </Link>
      </div>
    </form>
  )
}
