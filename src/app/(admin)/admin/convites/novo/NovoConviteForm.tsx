'use client'
import { useActionState } from 'react'
import { createInvite, AdminActionState } from '@/lib/actions/admin'
import Link from 'next/link'

interface Product { id: string; title: string }

export function NovoConviteForm({ products }: { products: Product[] }) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(createInvite, undefined)

  const inputClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-300'

  return (
    <form action={action} className="space-y-5 bg-white rounded-2xl border border-gray-100 p-6">
      {state?.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{state.error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Observação (uso interno)</label>
        <input
          name="note"
          placeholder="Ex: Turma de julho, Parceiro X..."
          className={inputClass}
        />
      </div>

      {products.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Liberar acesso a</label>
          <div className="space-y-2">
            {products.map(p => (
              <label key={p.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:text-gray-900">
                <input type="checkbox" name="products" value={p.id} className="rounded accent-[#b48840]" />
                {p.title}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Limite de usos</label>
          <input
            name="max_uses"
            type="number"
            min="1"
            placeholder="Sem limite"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Expira em</label>
          <input
            name="expires_at"
            type="datetime-local"
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2.5 text-white text-sm font-semibold rounded-lg transition hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#b48840' }}
        >
          {pending ? 'Criando...' : 'Gerar convite'}
        </button>
        <Link
          href="/admin/convites"
          className="px-6 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
        >
          Cancelar
        </Link>
      </div>
    </form>
  )
}
