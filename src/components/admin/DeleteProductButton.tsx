'use client'

import { deleteProduct } from '@/lib/actions/admin'

export function DeleteProductButton({ id }: { id: string }) {
  async function handleDelete() {
    if (!confirm('Excluir este produto? Esta ação não pode ser desfeita.')) return
    await deleteProduct(id)
  }

  return (
    <button
      onClick={handleDelete}
      className="text-sm text-red-500 hover:text-red-700 font-medium transition"
    >
      Excluir
    </button>
  )
}
