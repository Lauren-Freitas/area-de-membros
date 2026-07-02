'use client'

import { useActionState } from 'react'
import { createUser } from '@/lib/actions/admin'
import Link from 'next/link'

interface Product { id: string; title: string }

const inputClass = 'w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition'

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
        <h2 className="font-semibold text-gray-900">Dados do membro</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
          <input
            name="name"
            type="text"
            required
            className={inputClass}
            style={{ '--tw-ring-color': '#b48840' } as React.CSSProperties}
            placeholder="Ex: João Silva"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            name="email"
            type="email"
            required
            className={inputClass}
            style={{ '--tw-ring-color': '#b48840' } as React.CSSProperties}
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
                  style={{ accentColor: '#b48840' }}
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
          style={{ backgroundColor: '#b48840' }}
        >
          {isPending ? 'Criando...' : 'Criar membro e enviar convite'}
        </button>
        <Link
          href="/admin/usuarios"
          className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition"
        >
          Cancelar
        </Link>
      </div>
    </form>
  )
}
