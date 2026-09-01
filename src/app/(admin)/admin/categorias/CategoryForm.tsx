'use client'
import { useActionState } from 'react'
import { saveCategory, AdminActionState } from '@/lib/actions/admin'
import { SkillTrack } from '@/types'
import Link from 'next/link'

export function CategoryForm({ category }: { category: SkillTrack | null }) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(saveCategory, undefined)

  return (
    <form action={action} className="space-y-5 bg-card rounded-2xl border border-gray-100 p-6">
      {category && <input type="hidden" name="id" value={category.id} />}

      {state?.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{state.error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome <span className="text-red-400">*</span></label>
        <input
          name="title"
          defaultValue={category?.title ?? ''}
          required
          placeholder="Ex: Alimentação"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent"
        />
        {category && (
          <p className="text-xs text-gray-400 mt-1">Identificador: <code>{category.slug}</code> (não muda depois de criada)</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição <span className="text-gray-400 font-normal">(opcional)</span></label>
        <textarea
          name="description"
          defaultValue={category?.description ?? ''}
          rows={2}
          placeholder="Texto curto explicando o assunto..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2 text-white text-sm font-semibold rounded-lg transition hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: 'var(--brand)' }}
        >
          {pending ? 'Salvando...' : category ? 'Salvar alterações' : 'Criar categoria'}
        </button>
        <Link href="/admin/categorias" className="px-6 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
          Cancelar
        </Link>
      </div>
    </form>
  )
}
