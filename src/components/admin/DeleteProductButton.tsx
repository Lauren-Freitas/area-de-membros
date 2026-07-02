'use client'

import { useState } from 'react'
import { deleteProduct } from '@/lib/actions/admin'
import { ConfirmModal } from '@/components/ConfirmModal'

export function DeleteProductButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false)

  async function handleConfirm() {
    await deleteProduct(id)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-red-400 hover:text-red-600 px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-50 transition"
      >
        Excluir
      </button>
      <ConfirmModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title="Excluir produto"
        message="Este produto e todo o seu conteúdo serão excluídos permanentemente."
        confirmLabel="Excluir produto"
        dangerWord="EXCLUIR"
      />
    </>
  )
}
