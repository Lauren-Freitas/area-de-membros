'use client'
import { saveCohort } from '@/lib/actions/cohorts'

interface Product { id: string; title: string }
interface Cohort {
  id: string; name: string; description: string | null
  product_id: string | null; starts_at: string | null; ends_at: string | null
}

export function CohortForm({ cohort, products }: { cohort?: Cohort; products: Product[] }) {
  const toDateInput = (iso: string | null) => iso ? iso.slice(0, 16) : ''

  return (
    <form action={saveCohort} className="space-y-5 bg-white rounded-2xl border border-gray-100 p-6 max-w-lg">
      {cohort && <input type="hidden" name="id" value={cohort.id} />}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome da turma *</label>
        <input
          name="name"
          required
          defaultValue={cohort?.name}
          placeholder="Ex: Turma Janeiro 2026"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição</label>
        <textarea
          name="description"
          rows={2}
          defaultValue={cohort?.description ?? ''}
          placeholder="Informações sobre esta turma..."
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Produto associado</label>
        <select
          name="product_id"
          defaultValue={cohort?.product_id ?? ''}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 bg-white"
        >
          <option value="">Nenhum</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Início</label>
          <input
            type="datetime-local"
            name="starts_at"
            defaultValue={toDateInput(cohort?.starts_at ?? null)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Encerramento</label>
          <input
            type="datetime-local"
            name="ends_at"
            defaultValue={toDateInput(cohort?.ends_at ?? null)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className="px-5 py-2 text-white text-sm font-semibold rounded-lg transition hover:opacity-90"
          style={{ backgroundColor: '#c9a84c' }}
        >
          {cohort ? 'Salvar alterações' : 'Criar turma'}
        </button>
        <a href="/admin/turmas" className="text-sm text-gray-500 hover:text-gray-700 transition">Cancelar</a>
      </div>
    </form>
  )
}
