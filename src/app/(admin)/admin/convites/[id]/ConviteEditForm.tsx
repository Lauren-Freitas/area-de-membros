'use client'
import { useActionState } from 'react'
import { updateInvite, AdminActionState } from '@/lib/actions/admin'
import Link from 'next/link'

interface Product { id: string; title: string }
interface Invite {
  note: string | null
  product_ids: string[]
  max_uses: number | null
  expires_at: string | null
  code: string
}

export function ConviteEditForm({ id, invite, products }: { id: string; invite: Invite; products: Product[] }) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(
    updateInvite.bind(null, id),
    undefined
  )

  return (
    <form action={action} className="space-y-5 bg-white rounded-2xl border border-gray-100 p-6">
      {state?.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{state.error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Observação (uso interno)</label>
        <input
          name="note"
          defaultValue={invite.note ?? ''}
          placeholder="Ex: Turma de julho, Parceiro X..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-300"
        />
      </div>

      {products.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Liberar acesso a</label>
          <div className="space-y-2">
            {products.map(p => (
              <label key={p.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  name="products"
                  value={p.id}
                  defaultChecked={invite.product_ids?.includes(p.id)}
                  className="rounded"
                />
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
            defaultValue={invite.max_uses ?? ''}
            placeholder="Sem limite"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expira em</label>
          <input
            name="expires_at"
            type="datetime-local"
            defaultValue={invite.expires_at ? invite.expires_at.slice(0, 16) : ''}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-300"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2 text-white text-sm font-semibold rounded-lg transition hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#b48840' }}
        >
          {pending ? 'Salvando...' : 'Salvar alterações'}
        </button>
        <Link href="/admin/convites" className="px-6 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
          Cancelar
        </Link>
      </div>
    </form>
  )
}
