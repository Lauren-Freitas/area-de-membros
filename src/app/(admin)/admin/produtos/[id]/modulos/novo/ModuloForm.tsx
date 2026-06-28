'use client'

import { useActionState } from 'react'
import { saveModule } from '@/lib/actions/admin'
import Link from 'next/link'
import { Module } from '@/types'

interface Props { productId: string; module?: Module }

export function ModuloForm({ productId, module }: Props) {
  const [state, action, isPending] = useActionState(saveModule, undefined)

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="product_id" value={productId} />
      {module && <input type="hidden" name="id" value={module.id} />}

      {state?.error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">{state.error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Título <span className="text-red-500">*</span></label>
        <input
          name="title"
          defaultValue={module?.title}
          required
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
          placeholder="Ex: Módulo 1 — Fundamentos"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição <span className="text-gray-400 font-normal text-xs">(opcional)</span></label>
        <textarea
          name="description"
          defaultValue={module?.description ?? ''}
          rows={2}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent resize-none"
          placeholder="Descreva brevemente o que o aluno vai aprender..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
        <input
          name="sort_order"
          type="number"
          min="0"
          defaultValue={module?.sort_order ?? 0}
          className="w-32 px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
        />
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 text-white text-sm font-semibold rounded-lg transition hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: '#c9a84c' }}
        >
          {isPending ? 'Salvando...' : module ? 'Salvar alterações' : 'Criar módulo'}
        </button>
        <Link href={`/admin/produtos/${productId}`} className="text-sm text-gray-500 hover:text-gray-800">
          Cancelar
        </Link>
      </div>
    </form>
  )
}
