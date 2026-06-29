'use client'
import { useActionState } from 'react'
import { createInvite, AdminActionState } from '@/lib/actions/admin'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function NovoConvitePage() {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(createInvite, undefined)
  const [products, setProducts] = useState<{ id: string; title: string }[]>([])

  useEffect(() => {
    fetch('/api/admin/produtos').then(r => r.json()).then(d => setProducts(d ?? []))
  }, [])

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Novo convite</h1>

      <form action={action} className="space-y-5">
        {state?.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{state.error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Observação (uso interno)</label>
          <input
            name="note"
            placeholder="Ex: Turma de julho, Parceiro X..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
          />
        </div>

        {products.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Liberar acesso a</label>
            <div className="space-y-2">
              {products.map(p => (
                <label key={p.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" name="products" value={p.id} className="rounded" />
                  {p.title}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Limite de usos</label>
            <input
              name="max_uses"
              type="number"
              min="1"
              placeholder="Sem limite"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expira em</label>
            <input
              name="expires_at"
              type="datetime-local"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="px-6 py-2 text-white text-sm font-semibold rounded-lg transition hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#c9a84c' }}
          >
            {pending ? 'Criando...' : 'Gerar convite'}
          </button>
          <Link href="/admin/convites" className="px-6 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
