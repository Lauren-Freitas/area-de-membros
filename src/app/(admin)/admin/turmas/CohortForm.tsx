'use client'
import Link from 'next/link'
import { saveCohort } from '@/lib/actions/cohorts'
import { Input } from '@/components/Input'
import { Textarea } from '@/components/Textarea'
import { Select } from '@/components/Select'

interface Product { id: string; title: string }
interface Cohort {
  id: string; name: string; description: string | null
  product_id: string | null; starts_at: string | null; ends_at: string | null
}

export function CohortForm({ cohort, products }: { cohort?: Cohort; products: Product[] }) {
  const toDateInput = (iso: string | null) => iso ? iso.slice(0, 16) : ''

  return (
    <form action={saveCohort} className="space-y-5 bg-card rounded-2xl border border-gray-100 p-6 max-w-lg">
      {cohort && <input type="hidden" name="id" value={cohort.id} />}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome da turma *</label>
        <Input
          name="name"
          required
          defaultValue={cohort?.name}
          placeholder="Ex: Turma Janeiro 2026"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição</label>
        <Textarea
          name="description"
          rows={2}
          defaultValue={cohort?.description ?? ''}
          placeholder="Informações sobre esta turma..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Produto associado</label>
        <Select
          name="product_id"
          defaultValue={cohort?.product_id ?? ''}
        >
          <option value="">Nenhum</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Início</label>
          <Input
            type="datetime-local"
            name="starts_at"
            defaultValue={toDateInput(cohort?.starts_at ?? null)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Encerramento</label>
          <Input
            type="datetime-local"
            name="ends_at"
            defaultValue={toDateInput(cohort?.ends_at ?? null)}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className="px-5 py-2 text-white text-sm font-semibold rounded-lg transition hover:opacity-90"
          style={{ backgroundColor: 'var(--brand)' }}
        >
          {cohort ? 'Salvar alterações' : 'Criar turma'}
        </button>
        <Link href="/admin/turmas" className="px-5 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Cancelar</Link>
      </div>
    </form>
  )
}
